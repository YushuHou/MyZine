// 线稿：绘制单个线稿，以及按风格配置在页面装饰位上自动摆放（不压照片）
const DOODLES = require('../../templates/doodles/index')
const { getPathOps, tracePath } = require('./svgPath')
const { hashRandom } = require('./frames')

/**
 * 画一个线稿
 * @param x, y   中心点（画布 px）
 * @param size   边长（画布 px）
 * @param opts   { color, mode: 'stroke' | 'fill'（默认用线稿自己的）, lineWidth（画布 px）, rotate（度） }
 */
function drawDoodle(ctx, name, x, y, size, opts = {}) {
  const def = DOODLES[name]
  if (!def) return
  const [vx, vy, vw, vh] = def.viewBox
  const k = size / Math.max(vw, vh)
  ctx.save()
  ctx.translate(x, y)
  if (opts.rotate) ctx.rotate(opts.rotate * Math.PI / 180)
  ctx.scale(k, k)
  ctx.translate(-vx - vw / 2, -vy - vh / 2)
  ctx.beginPath()
  tracePath(ctx, getPathOps(def.d))
  if ((opts.mode || def.mode) === 'fill') {
    ctx.fillStyle = opts.color || '#000'
    ctx.fill()
  } else {
    ctx.strokeStyle = opts.color || '#000'
    // 线宽按画布 px 给出，换算回 viewBox 单位，保证缩放后线宽一致
    ctx.lineWidth = (opts.lineWidth || 3) / k
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }
  ctx.restore()
}

// 单页候选装饰位（基准 px，按左页书写：外侧在左）。右页左右镜像
const SPOTS = [
  [150, 150], // 外侧上角
  [930, 150], // 内侧上角
  [150, 1290], // 外侧下角
  [930, 1290], // 内侧下角
  [540, 100], // 上边居中
  [540, 1340], // 下边居中
  [90, 720], // 外侧页边中部
  [540, 720] // 页面中部（留白版式）
]

function colorOf(style, value) {
  return (value && style.colors[value]) || value || style.colors.accent
}

/**
 * 按风格 doodles 配置摆放线稿：
 * doodles: { names: [...], perSpread: [2, 4], size: [70, 110]（基准 px）, colors: ['accent', ...],
 *            lineWidth: 3（基准 px）, rotate: 20（±度）, pageTypes: ['body'],
 *            avoid: [{ x, y, w, h }]（0–1 坐标，风格固定元素所在区域，如底部栅栏）}
 * 每个跨页按 id 稳定选取数量、位置、线稿；与照片框、文字槽重叠的位置不放
 * @param frames resolveFrames 之后的照片框（0–1 坐标）
 * @param avoid  其他要避开的区域（画布 px）[{ x, y, w, h }]
 */
function drawPageDoodles(ctx, style, page, frames, W, H, unit, avoid = []) {
  const cfg = style.doodles
  if (!cfg || !cfg.names || !cfg.names.length) return
  if (cfg.pageTypes && cfg.pageTypes.indexOf(page.pageType) < 0) return
  const seed = page.spreadId || ''
  const rnd = key => hashRandom(`${seed}:doodle:${key}`)
  const [minN, maxN] = cfg.perSpread || [2, 3]
  const total = minN + Math.floor(rnd('n') * (maxN - minN + 1))
  // 跨页内分配到左右页
  let count = total
  if (page.side === 'left' || page.side === 'right') {
    const leftCount = Math.floor(total / 2) + (rnd('split') < 0.5 ? total % 2 : 0)
    count = page.side === 'left' ? leftCount : total - leftCount
  }
  if (count <= 0) return

  const pageW = page.side === 'full' ? W / 2 : W
  // 候选位置（画布 px）
  const halves = page.side === 'full' ? [{ ox: 0, mirror: false }, { ox: pageW, mirror: true }] : [{ ox: 0, mirror: page.side === 'right' }]
  const [minS, maxS] = cfg.size || [70, 110]
  const candidates = []
  halves.forEach(h => SPOTS.forEach(([sx, sy], i) => {
    const x = h.ox + (h.mirror ? 1080 - sx : sx) * unit
    candidates.push({ x, y: sy * unit, key: `${h.ox}:${i}` })
  }))
  const blocked = frames.map(f => ({ x: f.x * W, y: f.y * H, w: f.w * W, h: f.h * H }))
    .concat(avoid)
    .concat((cfg.avoid || []).map(a => ({ x: a.x * W, y: a.y * H, w: a.w * W, h: a.h * H })))
  const free = candidates.filter(c => {
    const r = (maxS / 2 + 12) * unit
    return blocked.every(b => c.x + r < b.x || c.x - r > b.x + b.w || c.y + r < b.y || c.y - r > b.y + b.h)
  })
  // 按稳定随机数排序后取前 count 个
  free.sort((a, b) => rnd(`pick:${a.key}`) - rnd(`pick:${b.key}`))
  const colors = cfg.colors || ['accent']
  free.slice(0, count).forEach(c => {
    const name = cfg.names[Math.floor(rnd(`name:${c.key}`) * cfg.names.length)]
    const size = (minS + rnd(`size:${c.key}`) * (maxS - minS)) * unit
    drawDoodle(ctx, name, c.x, c.y, size, {
      color: colorOf(style, colors[Math.floor(rnd(`color:${c.key}`) * colors.length)]),
      lineWidth: (cfg.lineWidth || 3) * unit,
      rotate: (rnd(`rot:${c.key}`) * 2 - 1) * (cfg.rotate || 0)
    })
  })
}

module.exports = { DOODLES, drawDoodle, drawPageDoodles }
