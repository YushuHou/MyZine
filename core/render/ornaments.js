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
//   ],
//   small: [{ type: 'doodle', weight }, { type: 'seal', size: [110, 150], color, weight }, { type: 'passport', size: [140, 180], count: [1, 3], colors, weight },
//           { type: 'tornStrip', size: [240, 340], paper, height, font, text, weight }（撕纸条）, { type: 'luggageTag', size: [260, 320], paper, band, string, weight }（行李吊牌）, { type: 'miniCard', size: [145, 205], weight }（旅行便签）],
//   smallPerSpread: [2, 3],
//   pageTypes: ['body']
// }
// 没写 ornaments 的风格：没有大装饰，小装饰只有线稿（数量取 doodles.perSpread），但同样不重复
const { hashRandom } = require('./frames')
const { getLayoutPage } = require('../registry')
const { drawDoodle } = require('./doodles')
const { drawScenery } = require('./scenery')
const { drawPattern, fillPattern, drawPatternBand, drawPatternBlock } = require('./patterns')
const { sealChars, drawSeal, sealRadius, drawPassportStamps, passportRadius } = require('./seals')
const { drawDecoration } = require('./decorations')
const { drawTornStrip, drawLuggageTag, pickStripText } = require('./paperBits')

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

// 以照片框占用面积估算跨页密度；只作为装饰数量参考，不影响版式或照片裁切
function pageCoverage(layout, side) {
  const frames = getLayoutPage(layout, side).frames || []
  return Math.min(1, frames.reduce((sum, frame) => sum + frame.w * frame.h, 0))
}

function photoCoverage(layout, sides) {
  const values = sides.map(side => pageCoverage(layout, side))
  return values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1)
}

function adaptiveRange(range, coverage, enabled) {
  if (!enabled) return range
  const adjustment = coverage < 0.28 ? 2 : coverage < 0.46 ? 1 : coverage > 0.6 ? -1 : 0
  return [Math.max(1, range[0] + adjustment), Math.max(1, range[1] + adjustment)]
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
 * @returns { big: { cfg, … } | null, small: { side: [item] }, names: { stamp: { side }, corner: { side } }, stripSide }
 *   stripSide：照片角撕纸条画在哪一页（每跨页最多 1 条），没有时为 null
 *   item：{ type: 'doodle', name } | { type: 'seal', cfg, size } | { type: 'passport', cfg, size, count }（size 为基准 px）
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
  const plan = { big: null, small: {}, names: { stamp: {}, corner: {} }, stripSide: null }
  sides.forEach(s => { plan.small[s] = [] })

  // 本跨页的线稿名：洗牌后不放回地取
  const used = {}
  const take = (names, k) => {
    const name = shuffled(names || [], rnd, k).find(n => !used[n])
    if (name) used[name] = true
    return name || null
  }
  // 照片上的邮票、照片角线稿先占名字
  ;(style.frameDecorations || []).forEach(fd => {
    if (fd.type === 'stamp' && fd.doodles) sides.forEach(s => { plan.names.stamp[s] = take(fd.doodles, `stamp:${s}`) })
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
    // 大装饰：按权重依次尝试，直到有一个放得下
    if (cfg && cfg.big && cfg.big.length) {
      const left = cfg.big.slice()
      for (let i = 0; left.length && !plan.big; i++) {
        const idx = pickWeighted(left, rnd, `big:${i}`)
        plan.big = buildBig(left[idx], layout, sides, rnd)
        left.splice(idx, 1)
      }
    }
    // 小装饰
    const types = cfg ? (cfg.small || []) : (doodleCfg.names ? [{ type: 'doodle' }] : [])
    const range = cfg ? (cfg.smallPerSpread || [2, 3]) : (doodleCfg.perSpread || [2, 3])
    const coverage = photoCoverage(layout, sides)
    const quota = intBetween(adaptiveRange(range, coverage, !cfg || cfg.adaptive !== false), rnd('small:n'))
    const items = []
    let sealDone = !sealChars(location)
    let passportDone = false
    // 撕纸条、行李吊牌每跨页最多 1 个；风格已有照片角撕纸条时不再放留白处的纸条
    let stripDone = frameStrip
    let tagDone = false
    let cardDone = false
    for (let i = 0; i < quota; i++) {
      const avail = types.filter(t =>
        (t.type === 'doodle' && (doodleCfg.names || []).some(n => !used[n])) ||
        (t.type === 'seal' && !sealDone) ||
        (t.type === 'passport' && !passportDone) ||
        (t.type === 'tornStrip' && !stripDone) ||
        (t.type === 'luggageTag' && !tagDone) ||
        (t.type === 'miniCard' && !cardDone))
      if (!avail.length) break
      const t = avail[pickWeighted(avail, rnd, `small:type:${i}`)]
      if (t.type === 'doodle') items.push({ type: 'doodle', name: take(doodleCfg.names, `doodle:${i}`) })
      else if (t.type === 'seal') {
        sealDone = true
        items.push({ type: 'seal', cfg: t, size: between(t.size || [110, 150], rnd(`seal:size:${i}`)) })
      } else if (t.type === 'tornStrip') {
        stripDone = true
        items.push({ type: 'tornStrip', cfg: t, size: between(t.size || [240, 340], rnd(`strip:size:${i}`)) })
      } else if (t.type === 'luggageTag') {
        tagDone = true
        items.push({ type: 'luggageTag', cfg: t, size: between(t.size || [260, 320], rnd(`tag:size:${i}`)) })
      } else if (t.type === 'miniCard') {
        cardDone = true
        items.push({ type: 'miniCard', cfg: t, size: between(t.size || [145, 205], rnd(`card:size:${i}`)) })
      } else {
        passportDone = true
        items.push({ type: 'passport', cfg: t, size: between(t.size || [140, 180], rnd(`pp:size:${i}`)), count: intBetween(t.count || [1, 3], rnd(`pp:count:${i}`)) })
      }
    }
    // 分到左右页
    const order = shuffled(items.map((it, i) => i), rnd, 'small:order')
    if (sides.length === 2) {
      order.forEach((idx, k) => {
        const leftScore = pageCoverage(layout, 'left') + plan.small.left.length * 0.055
        const rightScore = pageCoverage(layout, 'right') + plan.small.right.length * 0.055
        const side = Math.abs(leftScore - rightScore) < 0.015
          ? (rnd(`small:side:${k}`) < 0.5 ? 'left' : 'right')
          : leftScore < rightScore ? 'left' : 'right'
        plan.small[side].push(items[idx])
      })
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
  const big = plan.big
  if (!big) return []
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
function drawSmallOrnaments(ctx, style, page, plan, frames, W, H, unit, avoid, bg) {
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
  const blocked = frames.map(f => ({ x: f.x * W, y: f.y * H, w: f.w * W, h: f.h * H }))
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
      : it.type === 'miniCard' ? size * 0.8
      : size / 2
    return { it, size, radius: radius + 12 * unit }
  }).sort((a, b) => b.radius - a.radius)
  const taken = {}
  // 找一个放得下的装饰位；印章放不下时依次缩小再试（线稿只试原尺寸）
  const findSpot = (radius, marginScale) => {
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i]
      if (taken[c.key]) continue
      // 大的章往页内收一点，不出页边
      const margin = radius * (marginScale || 0.8)
      const x = Math.max(c.ox + margin, Math.min(c.ox + pageW - margin, c.x))
      const y = Math.max(margin, Math.min(H - margin, c.y))
      if (blocked.every(b => x + radius < b.x || x - radius > b.x + b.w || y + radius < b.y || y - radius > b.y + b.h)) return { x, y, key: c.key }
    }
    return null
  }
  sized.forEach(({ it, size, radius }) => {
    let spot = null
    let scale = 1
    const scales = it.type === 'doodle' ? [1] : [1, 0.8, 0.65]
    for (let i = 0; i < scales.length && !spot; i++) {
      scale = scales[i]
      spot = findSpot(radius * scale, it.type === 'miniCard' ? 1 : 0.8)
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
    } else if (it.type === 'tornStrip') {
      const text = pickStripText(it.cfg, page, style)
      drawTornStrip(ctx, style, it.cfg, spot.x, spot.y, size * scale, (rnd(`strip:${k}`) * 2 - 1) * 8, text, unit, `${seed}:${page.side}`)
    } else if (it.type === 'luggageTag') {
      // 绳子伸向页面外侧
      const outward = page.side === 'left' ? -1 : page.side === 'right' ? 1 : (spot.x < W / 2 ? -1 : 1)
      drawLuggageTag(ctx, style, it.cfg, spot.x, spot.y, size * scale, page, unit, `${seed}:${page.side}`, outward, bg)
    } else if (it.type === 'seal') {
      drawSeal(ctx, style, it.cfg, spot.x, spot.y, size * scale, page.info, `${seed}:${page.side}`, bg)
    } else if (it.type === 'miniCard') {
      drawMiniCard(ctx, style, it.cfg, spot.x, spot.y, size * scale, page, unit, `${seed}:${page.side}:${k}`)
    } else {
      drawPassportStamps(ctx, style, it.cfg, spot.x, spot.y, size * scale, it.count, page.info, `${seed}:${page.side}`, bg)
    }
  })
}

// 小型旅行便签：原生 Canvas 系统字体可绘制中英文，内容为空时使用简短的通用标题
function drawMiniCard(ctx, style, cfg, cx, cy, size, page, unit, seed) {
  const w = size * 1.55
  const h = size * 0.9
  const angle = (hashRandom(`${seed}:angle`) * 2 - 1) * (cfg.rotate || 4) * Math.PI / 180
  const colors = style.colors || {}
  const paper = colors.fitFill || '#FFFFFF'
  const accent = colorOf(style, cfg.color || 'accent')
  const location = ((page.info && page.info.location) || '').trim()
  const date = (page.info && (page.info.date || page.info.dateStart)) || ''
  const headline = location || ((page.info && page.info.title) || '') || 'TRAVEL NOTES'
  const labels = {
    magazine: 'TRAVEL EDITION', journal: 'LITTLE DIARY', film: 'FRAME NO.', zine: 'SIDE NOTE',
    ticket: 'ADMIT ONE', collage: 'CUT & KEEP', hkretro: 'AFTER HOURS', japanese: 'DAILY NOTE',
    mono: 'CONTACT SHEET', postcard: 'POSTCARD', nature: 'FIELD NOTE', food: 'TASTING NOTE',
    farm: 'HELLO FRIEND', roadtrip: 'MILE MARKER', heritage: 'COLLECTED', renaissance: 'ART OF TRAVEL',
    city: 'CITY NOTE', cat: 'CAT DIARY', dog: 'WALK NOTE', couple: 'JUST US', family: 'OUR DAY'
  }
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.shadowColor = 'rgba(50, 40, 35, 0.2)'
  ctx.shadowBlur = 10 * unit
  ctx.shadowOffsetY = 4 * unit
  ctx.fillStyle = paper
  ctx.fillRect(-w / 2, -h / 2, w, h)
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = accent
  ctx.lineWidth = Math.max(1, 2 * unit)
  ctx.strokeRect(-w / 2 + 5 * unit, -h / 2 + 5 * unit, w - 10 * unit, h - 10 * unit)
  ctx.fillStyle = accent
  ctx.fillRect(-w / 2 + 6 * unit, -h / 2 + 6 * unit, w - 12 * unit, 18 * unit)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `bold ${Math.max(9, 11 * unit)}px sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(labels[style.id] || 'TRAVEL NOTE', -w / 2 + 12 * unit, -h / 2 + 15 * unit, w - 24 * unit)
  ctx.fillStyle = colors.text || '#333333'
  ctx.font = `bold ${Math.max(10, 20 * unit)}px sans-serif`
  let textSize = Math.max(10, 20 * unit)
  while (ctx.measureText(headline).width > w - 24 * unit && textSize > 9 * unit) {
    textSize -= unit
    ctx.font = `bold ${Math.max(9, textSize)}px sans-serif`
  }
  ctx.fillText(headline, -w / 2 + 12 * unit, -h / 2 + h * 0.58, w - 24 * unit)
  ctx.strokeStyle = accent
  ctx.globalAlpha = 0.7
  ctx.lineWidth = Math.max(1, 1.5 * unit)
  ctx.beginPath()
  ctx.moveTo(-w / 2 + 12 * unit, h / 2 - 25 * unit)
  ctx.lineTo(w / 2 - 12 * unit, h / 2 - 25 * unit)
  ctx.stroke()
  if (date) {
    ctx.fillStyle = colors.textMuted || accent
    ctx.font = `${Math.max(9, 13 * unit)}px sans-serif`
    ctx.fillText(date, -w / 2 + 12 * unit, h / 2 - 12 * unit, w - 24 * unit)
  }
  ctx.restore()
}

module.exports = { SPOTS, planOrnaments, drawBigOrnament, drawSmallOrnaments, drawPattern }
