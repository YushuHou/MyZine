// 跨页装饰计划：每个跨页 1 个大装饰（场景剪影、整页底纹、纹样页边条、纹样色块……）+ 若干小装饰（线稿、方印、护照章）
// 同一跨页内线稿不重复（照片角线稿、邮票里的线稿也算在内）。计划按跨页 id 稳定生成，左右页渲染时读同一份
//
// 风格配置：
// ornaments: {
//   big: [
//     { type: 'scenery', kinds: ['mountains', 'forest'], layers: [2, 3], color: 'accent', mix, desaturate, height: [0.14, 0.26], weight },
//     { type: 'pagePattern', names: ['grid', 'dotgrid'], color, alpha, cell, weight },        // 整页底纹
//     { type: 'patternBand', name, edges, width, offset, fill, color, alpha, cell, weight },   // 纹样页边条
//     { type: 'patternBlock', name, x, y, w, h, fill, color, alpha, cell, weight },           // 纹样色块（左右页随机一侧，右页镜像）
//     { type: 'deco', deco: { …页面装饰… }, weight }                                          // 任意页面装饰（如格纹桌布页边）
//     { type: 'wash', colors, alpha, size: [0.4, 0.6], weight }                                // 水彩晕染（衬在最大照片的一角下面）
//   ],
//   small: [{ type: 'doodle', weight }, { type: 'seal', size: [110, 150], color, weight }, { type: 'passport', size: [140, 180], count: [1, 3], colors, weight },
//           { type: 'tornStrip', size: [240, 340], paper, height, font, text, weight }（撕纸条）, { type: 'luggageTag', size: [260, 320], paper, band, string, weight }（行李吊牌）,
//           { type: 'sticker', names, size: [180, 300], rotate, weight }（素材贴纸，同一跨页不重复）,
//           { type: 'note', images, size, clip, clipChance, font, text, weight }（素材便签纸，每跨页最多 1 张）],
//   bigPerSpread: [1, 2],             // 可选：每跨页大装饰数量（默认 1）；同一种不会重复
//   smallPerSpread: [2, 3],
//   smallByCoverage: [[0.35, [5, 6]], [0.55, [3, 4]], [1, [2, 3]]],  // 可选：按照片覆盖率决定小装饰数量（覆盖率 < 阈值时用对应区间），优先于 smallPerSpread
//   tones: ['accent', 'teal'],        // 可选：跨页主色调，晕染、撕纸色带都用它，左右页一致
//   stickerGroups: [[…], […]],        // 可选：贴纸分主题，每个跨页优先从一组里挑
//   anchorChance: 0.6,                // 可选：贴纸优先贴在照片角上的比例
//   pageTypes: ['body']
// }
// 风格 frameAccents: { postal: 1, sticker: 2 }：本页最大照片上的点睛装饰每跨页只出现一种（带 accent 键的照片框装饰），只在一页上
// 没写 ornaments 的风格：没有大装饰，小装饰只有线稿（数量取 doodles.perSpread），但同样不重复
const { hashRandom } = require('./frames')
const { getLayoutPage } = require('../registry')
const { drawDoodle } = require('./doodles')
const { drawScenery } = require('./scenery')
const { drawPattern, fillPattern, drawPatternBand, drawPatternBlock } = require('./patterns')
const { sealChars, drawSeal, sealRadius, drawPassportStamps, passportRadius } = require('./seals')
const { drawDecoration } = require('./decorations')
const { drawTornStrip, drawLuggageTag, pickStripText } = require('./paperBits')
const { drawSticker, drawNote } = require('./stickers')
const { drawPageWash } = require('./wash')
const { drawPaperBand } = require('./paperBand')

const cache = {}
let cacheSize = 0

// 单页候选装饰位（基准 px，按左页书写：外侧在左）。右页左右镜像
const SPOTS = [
  [150, 170], // 外侧上角（避开页眉）
  [930, 170], // 内侧上角
  [150, 1290], // 外侧下角
  [930, 1290], // 内侧下角
  [540, 100], // 上边居中
  [540, 1340], // 下边居中
  [90, 720], // 外侧页边中部
  [540, 720], // 页面中部（留白版式）
  [300, 1040], // 下半页留白处
  [780, 1040],
  [300, 420], // 上半页留白处
  [780, 420]
]

function colorOf(style, value) {
  return (value && style.colors[value]) || value || style.colors.accent
}

function sidesOf(layout) {
  return layout.span === 'pair' ? ['left', 'right'] : layout.span === 'spread' ? ['full'] : ['single']
}

// 按 key 稳定洗牌
function shuffled(list, rnd, key) {
  return list.slice().sort((a, b) => rnd(`${key}:${a}`) - rnd(`${key}:${b}`))
}

// 按权重抽一个（返回下标）
function pickWeighted(items, rnd, key) {
  const total = items.reduce((s, it) => s + (it.weight == null ? 1 : it.weight), 0)
  let t = rnd(key) * total
  for (let i = 0; i < items.length; i++) {
    t -= items[i].weight == null ? 1 : items[i].weight
    if (t < 0) return i
  }
  return items.length - 1
}

function between(range, t) {
  return range[0] + t * (range[1] - range[0])
}

function intBetween(range, t) {
  return range[0] + Math.min(range[1] - range[0], Math.floor(t * (range[1] - range[0] + 1)))
}

/**
 * 场景剪影放不放得下：每一侧页面底部被照片覆盖的宽度比例超过 55% 就跳过这一侧
 * 高度按照片下方的空余自适应（取各侧的最小值，保证跨中缝连续），在 [min, max] 之间
 */
function sceneryFit(cfg, layout, sides) {
  const [hmin, hmax] = cfg.height || [0.14, 0.26]
  const skip = {}
  let height = hmax
  sides.forEach(side => {
    const frames = getLayoutPage(layout, side).frames
    // 伸进底部 7% 的照片框在 x 方向的覆盖长度（合并重叠区间）
    const spans = frames.filter(f => f.y + f.h > 1 - hmin * 0.5).map(f => [f.x, f.x + f.w]).sort((a, b) => a[0] - b[0])
    let covered = 0
    let end = 0
    spans.forEach(([a, b]) => {
      if (b <= end) return
      covered += b - Math.max(a, end)
      end = b
    })
    if (covered > 0.55) {
      skip[side] = true
      return
    }
    const lowest = frames.filter(f => f.y + f.h > 0.5).reduce((m, f) => Math.max(m, f.y + f.h), 0.5)
    height = Math.min(height, Math.max(hmin, 1 - lowest + 0.06))
  })
  return sides.every(s => skip[s]) ? null : { skip, height }
}

// 矩形（0–1）与照片框重叠的面积占矩形的比例
function overlapRatio(rect, frames) {
  const area = rect.w * rect.h || 1
  return frames.reduce((s, f) => {
    const w = Math.min(rect.x + rect.w, f.x + f.w) - Math.max(rect.x, f.x)
    const h = Math.min(rect.y + rect.h, f.y + f.h) - Math.max(rect.y, f.y)
    return s + (w > 0 && h > 0 ? w * h : 0)
  }, 0) / area
}

// 每一侧页面的照片覆盖率（照片框面积之和 ÷ 页面面积，重叠不扣除，最多 1）
function coverageOf(layout, sides) {
  const out = {}
  sides.forEach(side => {
    const frames = getLayoutPage(layout, side).frames
    // 跨页大图的坐标按整个跨页算，面积占比不受影响
    out[side] = Math.min(1, frames.reduce((s, f) => s + f.w * f.h, 0))
  })
  return out
}

// 试着把一个大装饰候选落到这个跨页上；放不下返回 null
function buildBig(cand, layout, sides, rnd) {
  if (cand.type === 'scenery') {
    const fit = sceneryFit(cand, layout, sides)
    if (!fit) return null
    const kinds = cand.kinds || ['hills']
    return {
      cfg: cand,
      kind: kinds[Math.floor(rnd('big:kind') * kinds.length)],
      layers: intBetween(cand.layers || [2, 3], rnd('big:layers')),
      height: fit.height,
      skip: fit.skip
    }
  }
  if (cand.type === 'paperBand') {
    // 色带在 y 范围内找一个「半压在照片下」的高度：被照片挡住的比例最接近 cover（默认 35%）
    const [ymin, ymax] = cand.y || [0.2, 0.8]
    const [hmin, hmax] = cand.height || [0.16, 0.26]
    const height = hmin + rnd('band:h') * (hmax - hmin)
    const frames = []
    sides.forEach(side => getLayoutPage(layout, side).frames.forEach(f => {
      // 换算到整个跨页的坐标（宽为 1）
      if (side === 'full') frames.push(f)
      else frames.push({ x: (side === 'right' ? 0.5 : 0) + f.x / 2, y: f.y, w: f.w / 2, h: f.h })
    }))
    const target = cand.cover == null ? 0.35 : cand.cover
    let best = null
    for (let i = 0; i <= 8; i++) {
      const y = ymin + (ymax - ymin) * i / 8
      const score = Math.abs(overlapRatio({ x: 0, y: y - height / 2, w: 1, h: height }, frames) - target) + rnd(`band:y:${i}`) * 0.08
      if (!best || score < best.score) best = { y, score }
    }
    return { cfg: cand, y: best.y, height }
  }
  if (cand.type === 'pagePattern') {
    const names = cand.names || [cand.name]
    return { cfg: cand, name: names[Math.floor(rnd('big:pattern') * names.length)] }
  }
  if (cand.type === 'patternBlock') {
    // 左右页随机先试一侧，压照片太多就换另一侧
    const order = sides.length === 2 ? (rnd('big:block') < 0.5 ? ['left', 'right'] : ['right', 'left']) : sides
    for (let i = 0; i < order.length; i++) {
      const side = order[i]
      const x = cand.mirror && side === 'right' ? 1 - cand.x - cand.w : cand.x
      if (overlapRatio({ x, y: cand.y, w: cand.w, h: cand.h }, getLayoutPage(layout, side).frames) < 0.5) {
        return { cfg: cand, only: side }
      }
    }
    return null
  }
  return { cfg: cand }
}

/**
 * 某个跨页的装饰计划（缓存）
 * @returns { big: { cfg, … } | null（第一个大装饰）, bigs: [所有大装饰], small: { side: [item] }, names: { stamp: { side }, corner: { side } }, stripSide }
 *   stripSide：照片角撕纸条画在哪一页（每跨页最多 1 条），没有时为 null
 *   frameSticker：压在照片角上的贴纸 { side, name, corner, size, angle, cfg }，没有时为 null
 *   item：{ type: 'doodle', name } | { type: 'seal', cfg, size } | { type: 'passport', cfg, size, count }
 *         | { type: 'sticker', cfg, name, size } | { type: 'note', cfg, image, clip, size }（size 为基准 px）
 */
function planOrnaments(style, page, layout) {
  const spreadId = page.spreadId || ''
  const location = ((page.info && page.info.location) || '').trim()
  const key = `${style.id}|${spreadId}|${layout.id}|${page.pageType}|${location}`
  if (cache[key]) return cache[key]
  const rnd = k => hashRandom(`${spreadId}:orn:${k}`)
  const sides = sidesOf(layout)
  const cfg = style.ornaments
  const doodleCfg = style.doodles || {}
  const plan = { big: null, bigs: [], small: {}, names: { stamp: {}, corner: {} }, stripSide: null, frameSticker: null, tone: null, accent: null, accentSide: null }
  sides.forEach(s => { plan.small[s] = [] })
  // 跨页主色调：左右页的晕染、色带同色
  const tones = cfg && cfg.tones
  if (tones && tones.length) plan.tone = tones[Math.floor(rnd('tone') * tones.length)]
  // 点睛装饰：本跨页用哪一种、放在哪一页
  const accents = style.frameAccents
  if (accents) {
    const keys = Object.keys(accents)
    plan.accent = keys[pickWeighted(keys.map(k => ({ weight: accents[k] })), rnd, 'accent')]
    plan.accentSide = sides[Math.floor(rnd('accent:side') * sides.length)]
  }
  // 贴纸名：照片角贴纸、邮票里的贴纸和留白处的贴纸共用，同一跨页不重复；有分组时先从本跨页的主题组里挑
  const groups = (cfg && cfg.stickerGroups) || []
  const group = groups.length ? groups[Math.floor(rnd('sgroup') * groups.length)] : []
  const usedSticker = {}
  const takeSticker = (names, k) => {
    const list = shuffled(names || [], rnd, k)
    const name = list.filter(n => group.indexOf(n) >= 0).concat(list).find(n => !usedSticker[n])
    if (name) usedSticker[name] = true
    return name || null
  }

  // 本跨页的线稿名：洗牌后不放回地取
  const used = {}
  const take = (names, k) => {
    const name = shuffled(names || [], rnd, k).find(n => !used[n])
    if (name) used[name] = true
    return name || null
  }
  // 照片上的邮票、照片角线稿先占名字
  ;(style.frameDecorations || []).forEach(fd => {
    // 邮票里画贴纸（stickers）或线稿（doodles）
    if (fd.type === 'stamp' && fd.stickers) sides.forEach(s => { plan.names.stamp[s] = takeSticker(fd.stickers, `stamp:${s}`) })
    else if (fd.type === 'stamp' && fd.doodles) sides.forEach(s => { plan.names.stamp[s] = take(fd.doodles, `stamp:${s}`) })
    if (fd.type === 'cornerDoodle') sides.forEach(s => { plan.names.corner[s] = take(fd.names || ['branch'], `corner:${s}`) })
    // 照片角撕纸条：按 chance 出现，随机选一页
    if (fd.type === 'tornStrip' && rnd('strip:on') < (fd.chance == null ? 1 : fd.chance)) {
      plan.stripSide = sides[Math.floor(rnd('strip:side') * sides.length)]
    }
  })
  const frameStrip = (style.frameDecorations || []).some(fd => fd.type === 'tornStrip')

  const pageTypes = (cfg && cfg.pageTypes) || doodleCfg.pageTypes
  const active = !pageTypes || pageTypes.indexOf(page.pageType) >= 0
  if (active) {
    // 照片角贴纸：按 chance 出现，随机选一页、一个角
    const fs = (style.frameDecorations || []).find(fd => fd.type === 'frameSticker')
    const fsOn = fs && (fs.accent ? plan.accent === fs.accent : rnd('fsticker:on') < (fs.chance == null ? 1 : fs.chance))
    if (fsOn) {
      const corners = fs.corners || ['top-right', 'bottom-left', 'bottom-right']
      const name = takeSticker(fs.names, 'fsticker')
      if (name) {
        plan.frameSticker = {
          cfg: fs,
          side: fs.accent ? plan.accentSide : sides[Math.floor(rnd('fsticker:side') * sides.length)],
          name,
          corner: corners[Math.floor(rnd('fsticker:corner') * corners.length)],
          size: between(fs.size || [150, 210], rnd('fsticker:size')),
          angle: (rnd('fsticker:angle') * 2 - 1) * (fs.rotate == null ? 12 : fs.rotate)
        }
      }
    }
    // 大装饰：按权重依次尝试，直到放下 bigPerSpread 个（默认 1 个）
    if (cfg && cfg.big && cfg.big.length) {
      const want = intBetween(cfg.bigPerSpread || [1, 1], rnd('big:n'))
      const left = cfg.big.slice()
      for (let i = 0; left.length && plan.bigs.length < want; i++) {
        const idx = pickWeighted(left, rnd, `big:${i}`)
        const big = buildBig(left[idx], layout, sides, rnd)
        if (big) plan.bigs.push(big)
        left.splice(idx, 1)
      }
      plan.big = plan.bigs[0] || null
    }
    // 小装饰
    const types = cfg ? (cfg.small || []) : (doodleCfg.names ? [{ type: 'doodle' }] : [])
    const coverage = coverageOf(layout, sides)
    const avgCoverage = sides.reduce((s, side) => s + coverage[side], 0) / sides.length
    const byCoverage = cfg && cfg.smallByCoverage && cfg.smallByCoverage.find(([limit]) => avgCoverage < limit)
    const range = byCoverage ? byCoverage[1] : cfg ? (cfg.smallPerSpread || [2, 3]) : (doodleCfg.perSpread || [2, 3])
    const quota = intBetween(range, rnd('small:n'))
    const items = []
    let sealDone = !sealChars(location)
    let passportDone = false
    // 撕纸条、行李吊牌每跨页最多 1 个；风格已有照片角撕纸条时不再放留白处的纸条
    let stripDone = frameStrip
    let tagDone = false
    let noteDone = false
    for (let i = 0; i < quota; i++) {
      const avail = types.filter(t =>
        (t.type === 'doodle' && (doodleCfg.names || []).some(n => !used[n])) ||
        (t.type === 'sticker' && (t.names || []).some(n => !usedSticker[n])) ||
        (t.type === 'note' && !noteDone) ||
        (t.type === 'seal' && !sealDone) ||
        (t.type === 'passport' && !passportDone) ||
        (t.type === 'tornStrip' && !stripDone) ||
        (t.type === 'luggageTag' && !tagDone))
      if (!avail.length) break
      const t = avail[pickWeighted(avail, rnd, `small:type:${i}`)]
      if (t.type === 'doodle') items.push({ type: 'doodle', name: take(doodleCfg.names, `doodle:${i}`) })
      else if (t.type === 'sticker') {
        items.push({ type: 'sticker', cfg: t, name: takeSticker(t.names, `sticker:${i}`), size: between(t.size || [180, 300], rnd(`sticker:size:${i}`)) })
      } else if (t.type === 'note') {
        noteDone = true
        const imgs = t.images || []
        items.push({
          type: 'note',
          cfg: t,
          image: imgs[Math.floor(rnd(`note:img:${i}`) * imgs.length)],
          clip: t.clip && rnd(`note:clip:${i}`) < (t.clipChance == null ? 0.5 : t.clipChance) ? t.clip : null,
          size: between(t.size || [240, 300], rnd(`note:size:${i}`))
        })
      } else if (t.type === 'seal') {
        sealDone = true
        items.push({ type: 'seal', cfg: t, size: between(t.size || [110, 150], rnd(`seal:size:${i}`)) })
      } else if (t.type === 'tornStrip') {
        stripDone = true
        items.push({ type: 'tornStrip', cfg: t, size: between(t.size || [240, 340], rnd(`strip:size:${i}`)) })
      } else if (t.type === 'luggageTag') {
        tagDone = true
        items.push({ type: 'luggageTag', cfg: t, size: between(t.size || [260, 320], rnd(`tag:size:${i}`)) })
      } else {
        passportDone = true
        items.push({ type: 'passport', cfg: t, size: between(t.size || [140, 180], rnd(`pp:size:${i}`)), count: intBetween(t.count || [1, 3], rnd(`pp:count:${i}`)) })
      }
    }
    // 分到左右页：按覆盖率时留白多的那页多放，否则平分
    const order = shuffled(items.map((it, i) => i), rnd, 'small:order')
    if (sides.length === 2) {
      const freeL = 1 - coverage.left
      const freeR = 1 - coverage.right
      const share = byCoverage && freeL + freeR > 0 ? freeL / (freeL + freeR) : 0.5
      const leftCount = Math.max(0, Math.min(items.length, Math.round(items.length * share + (rnd('small:split') - 0.5) * 0.98)))
      order.forEach((idx, k) => plan.small[k < leftCount ? 'left' : 'right'].push(items[idx]))
    } else {
      order.forEach(idx => plan.small[sides[0]].push(items[idx]))
    }
  }

  if (cacheSize > 400) {
    Object.keys(cache).forEach(k => { delete cache[k] })
    cacheSize = 0
  }
  cache[key] = plan
  cacheSize++
  return plan
}

/**
 * 画大装饰（在照片之下）
 * @returns 大装饰占的区域（画布 px），小装饰避开
 */
function drawBigOrnament(ctx, style, page, layout, plan, W, H, unit, images, bg) {
  return (plan.bigs || []).reduce((areas, big) => areas.concat(drawOneBig(ctx, style, page, layout, plan, big, W, H, unit, images, bg)), [])
}

function drawOneBig(ctx, style, page, layout, plan, big, W, H, unit, images, bg) {
  const c = big.cfg
  if (c.type === 'scenery') {
    if (big.skip[page.side]) return []
    drawScenery(ctx, style, c, big, page, W, H, unit, bg, layout.span === 'single' ? 1080 : 2160)
    return [{ x: 0, y: H * (1 - big.height), w: W, h: H * big.height }]
  }
  if (c.type === 'pagePattern') {
    fillPattern(ctx, style, Object.assign({}, c, { name: big.name }), 0, 0, W, H, bg, unit)
    return []
  }
  if (c.type === 'patternBand') return drawPatternBand(ctx, style, c, page, W, H, unit, bg)
  if (c.type === 'patternBlock') {
    if (big.only !== page.side) return []
    return drawPatternBlock(ctx, style, c, page, W, H, unit, bg)
  }
  if (c.type === 'wash') return drawPageWash(ctx, style, c, page, getLayoutPage(layout, page.side).frames, W, H, unit, plan.tone)
  if (c.type === 'paperBand') return drawPaperBand(ctx, style, c, big, page, W, H, unit, images, plan.tone)
  if (c.type === 'deco') {
    drawDecoration(ctx, style, c.deco, page, W, H, unit, images, bg)
    return []
  }
  return []
}

/**
 * 画小装饰（在照片和文字之上）：摆在候选装饰位，避开照片、文字、大装饰
 * @param frames resolveFrames 之后的照片框（0–1）
 * @param avoid  要避开的区域（画布 px）
 */
function drawSmallOrnaments(ctx, style, page, plan, frames, W, H, unit, avoid, bg, images) {
  const items = plan.small[page.side] || []
  if (!items.length) return
  const cfg = style.doodles || {}
  const seed = page.spreadId || ''
  const rnd = key => hashRandom(`${seed}:doodle:${key}`)
  const pageW = page.side === 'full' ? W / 2 : W
  const halves = page.side === 'full' ? [{ ox: 0, mirror: false }, { ox: pageW, mirror: true }] : [{ ox: 0, mirror: page.side === 'right' }]
  const candidates = []
  halves.forEach(h => SPOTS.forEach(([sx, sy], i) => {
    candidates.push({ x: h.ox + (h.mirror ? 1080 - sx : sx) * unit, y: sy * unit, key: `${h.ox}:${i}`, ox: h.ox })
  }))
  candidates.sort((a, b) => rnd(`pick:${a.key}`) - rnd(`pick:${b.key}`))
  // 照片框带编号：贴在照片角上的贴纸可以压住「自己的」照片一角
  const blocked = frames.map((f, i) => ({ x: f.x * W, y: f.y * H, w: f.w * W, h: f.h * H, frame: i }))
    .concat(avoid)
    .concat((cfg.avoid || []).map(a => ({ x: a.x * W, y: a.y * H, w: a.w * W, h: a.h * H })))
  const [minS, maxS] = cfg.size || [70, 110]
  const colors = cfg.colors || ['accent']
  // 半径大的先放
  const sized = items.map(it => {
    const size = it.type === 'doodle' ? maxS * unit : it.size * unit
    const radius = it.type === 'seal' ? sealRadius(size, page.info)
      : it.type === 'passport' ? passportRadius(size, it.count)
      : it.type === 'tornStrip' ? size * 0.46
      : it.type === 'luggageTag' ? size * 0.46
      : it.type === 'note' ? size * 0.62
      : size / 2
    return { it, size, radius: radius + 12 * unit }
  }).sort((a, b) => b.radius - a.radius)
  const taken = {}
  // 找一个放得下的装饰位；印章放不下时依次缩小再试（线稿只试原尺寸）
  // inside：贴纸、便签纸是图片，旋转后四角会伸出去，要完整收在页内并留出边距
  const clear = (x, y, radius, own) => blocked.every(b => b.frame === own || x + radius < b.x || x - radius > b.x + b.w || y + radius < b.y || y - radius > b.y + b.h)
  // 照片角装饰位：贴纸中心在照片角外侧，压住照片一小角，和照片组成一组（整页满版的照片不贴）
  const anchorSpot = (radius, k) => {
    const margin = radius + 24 * unit
    const corners = []
    frames.forEach((f, i) => {
      if (f.w * f.h > 0.7) return
      ;[[0, 0], [1, 0], [0, 1], [1, 1]].forEach(([cx, cy]) => {
        const x = (f.x + f.w * cx) * W + (cx ? 1 : -1) * radius * 0.42
        const y = (f.y + f.h * cy) * H + (cy ? 1 : -1) * radius * 0.42
        corners.push({ x, y, i, key: `a:${i}:${cx}${cy}` })
      })
    })
    corners.sort((a, b) => rnd(`anchor:${k}:${a.key}`) - rnd(`anchor:${k}:${b.key}`))
    for (let j = 0; j < corners.length; j++) {
      const c = corners[j]
      if (taken[c.key]) continue
      // 半页以外（跨页大图的另一半）也要整个收在页内
      const ox = page.side === 'full' && c.x > pageW ? pageW : 0
      if (c.x - margin < ox || c.x + margin > ox + pageW || c.y - margin < 0 || c.y + margin > H) continue
      if (clear(c.x, c.y, radius, c.i)) return { x: c.x, y: c.y, key: c.key }
    }
    return null
  }
  const findSpot = (radius, inside) => {
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i]
      if (taken[c.key]) continue
      // 大的章往页内收一点，不出页边
      const margin = inside ? radius + 24 * unit : radius * 0.8
      const x = Math.max(c.ox + margin, Math.min(c.ox + pageW - margin, c.x))
      const y = Math.max(margin, Math.min(H - margin, c.y))
      if (clear(x, y, radius, -1)) return { x, y, key: c.key }
    }
    return null
  }
  const anchorChance = (style.ornaments && style.ornaments.anchorChance) || 0
  sized.forEach(({ it, size, radius }, n) => {
    let spot = null
    let scale = 1
    const scales = it.type === 'doodle' ? [1] : it.type === 'sticker' ? [1, 0.8, 0.65, 0.5] : [1, 0.8, 0.65]
    // 贴纸按比例优先贴在照片角上
    const anchored = it.type === 'sticker' && rnd(`anchored:${page.side}:${n}`) < anchorChance
    for (let i = 0; i < scales.length && !spot; i++) {
      scale = scales[i]
      if (anchored) spot = anchorSpot(radius * scale, n)
      if (!spot) spot = findSpot(radius * scale, it.type === 'sticker' || it.type === 'note')
    }
    if (!spot) return
    const r = radius * scale
    taken[spot.key] = true
    blocked.push({ x: spot.x - r, y: spot.y - r, w: r * 2, h: r * 2 })
    const k = spot.key
    if (it.type === 'doodle') {
      if (!it.name) return
      drawDoodle(ctx, it.name, spot.x, spot.y, (minS + rnd(`size:${k}`) * (maxS - minS)) * unit, {
        color: colorOf(style, colors[Math.floor(rnd(`color:${k}`) * colors.length)]),
        lineWidth: (cfg.lineWidth || 3) * unit,
        rotate: (rnd(`rot:${k}`) * 2 - 1) * (cfg.rotate || 0)
      })
    } else if (it.type === 'sticker') {
      drawSticker(ctx, images, it.name, spot.x, spot.y, size * scale, (rnd(`rot:${k}`) * 2 - 1) * (it.cfg.rotate == null ? 12 : it.cfg.rotate), unit, it.cfg.shadow)
    } else if (it.type === 'note') {
      drawNote(ctx, style, images, it.cfg, it, spot.x, spot.y, size * scale, pickStripText(it.cfg, page, style), unit, `${seed}:${page.side}`)
    } else if (it.type === 'tornStrip') {
      const text = pickStripText(it.cfg, page, style)
      drawTornStrip(ctx, style, it.cfg, spot.x, spot.y, size * scale, (rnd(`strip:${k}`) * 2 - 1) * 8, text, unit, `${seed}:${page.side}`)
    } else if (it.type === 'luggageTag') {
      // 绳子伸向页面外侧
      const outward = page.side === 'left' ? -1 : page.side === 'right' ? 1 : (spot.x < W / 2 ? -1 : 1)
      drawLuggageTag(ctx, style, it.cfg, spot.x, spot.y, size * scale, page, unit, `${seed}:${page.side}`, outward, bg)
    } else if (it.type === 'seal') {
      drawSeal(ctx, style, it.cfg, spot.x, spot.y, size * scale, page.info, `${seed}:${page.side}`, bg)
    } else {
      drawPassportStamps(ctx, style, it.cfg, spot.x, spot.y, size * scale, it.count, page.info, `${seed}:${page.side}`, bg)
    }
  })
}

// 装饰计划用到的素材分包图片名（渲染前按需加载，避免一次解码整个分包）
function planImageNames(plan) {
  const names = []
  if (plan.frameSticker) names.push(plan.frameSticker.name)
  // 邮票里的贴纸（线稿名不在素材分包里，加载时会自动跳过）
  Object.keys(plan.names.stamp).forEach(side => names.push(plan.names.stamp[side]))
  Object.keys(plan.small).forEach(side => plan.small[side].forEach(it => {
    if (it.type === 'sticker' && it.name) names.push(it.name)
    if (it.type === 'note') names.push(it.image, it.clip)
  }))
  return names.filter(Boolean)
}

module.exports = { SPOTS, planOrnaments, planImageNames, drawBigOrnament, drawSmallOrnaments, drawPattern }
