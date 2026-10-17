// 线稿：绘制单个线稿（在页面上的摆放见 ornaments.js 的装饰计划）
const DOODLES = require('../../templates/doodles/index')
const { getPathOps, tracePath } = require('./svgPath')

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

module.exports = { DOODLES, drawDoodle }
