// 水彩晕染（阶段 8a）：衬在照片后面的一大片淡彩，边缘略深、内部有颜料颗粒，像水彩在纸上晕开
// 大装饰配置：{ type: 'wash', colors, alpha, size: [最小, 最大]（占页宽比例）, weight }
// 每页一片，以本页最大照片框的某个角为中心向外晕开（被照片盖住一部分）；全部由代码绘制
const { hashRandom } = require('./frames')

function seq(key) {
  let i = 0
  return () => hashRandom(`${key}:${i++}`)
}

// 不规则团块的轮廓点：半径由几段低频正弦叠加而成
function blobPoints(cx, cy, rx, ry, r, wobble) {
  const waves = [1, 2, 3, 5].map(f => ({ f, a: (r() * 0.5 + 0.5) * wobble / f, p: r() * Math.PI * 2 }))
  const pts = []
  const n = 72
  for (let i = 0; i < n; i++) {
    const t = i / n * Math.PI * 2
    const k = 1 + waves.reduce((s, w) => s + w.a * Math.sin(w.f * t + w.p), 0)
    pts.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k])
  }
  return pts
}

function tracePoints(ctx, pts) {
  ctx.beginPath()
  pts.forEach((p, i) => {
    // 相邻点取中点画二次曲线，轮廓更圆润
    const q = pts[(i + 1) % pts.length]
    const mx = (p[0] + q[0]) / 2
    const my = (p[1] + q[1]) / 2
    if (i === 0) ctx.moveTo(mx, my)
    else ctx.quadraticCurveTo(p[0], p[1], mx, my)
  })
  const p = pts[0]
  const q = pts[1]
  ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2)
  ctx.closePath()
}

/**
 * 画一片水彩晕染
 * @param cx, cy 中心（画布 px）；rx, ry 半径
 * @param color  颜色（#RRGGBB）；alpha 整体浓度
 */
function drawWashBlob(ctx, cx, cy, rx, ry, color, alpha, unit, seed) {
  const r = seq(`${seed}:wash`)
  const rgb = [1, 3, 5].map(i => parseInt(color.slice(i, i + 2), 16))
  const fill = a => `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`
  ctx.save()
  // 多层略有变形的团块叠在一起：中间浓、边缘淡，形成晕开的层次
  const layers = 7
  for (let i = 0; i < layers; i++) {
    const s = 1 - i * 0.07
    const pts = blobPoints(cx + (r() - 0.5) * rx * 0.16, cy + (r() - 0.5) * ry * 0.16, rx * s, ry * s, r, 0.32)
    tracePoints(ctx, pts)
    ctx.fillStyle = fill(alpha * (0.22 + r() * 0.12))
    ctx.fill()
    // 水彩边缘积色：沿轮廓描一道淡而宽的边
    if (i === 0 || i === 3) {
      ctx.strokeStyle = fill(alpha * 0.28)
      ctx.lineWidth = (2 + r() * 2.5) * unit
      ctx.stroke()
    }
  }
  // 颜料颗粒：团块内随机的小点
  const outer = blobPoints(cx, cy, rx * 0.95, ry * 0.95, seq(`${seed}:grain`), 0.18)
  tracePoints(ctx, outer)
  ctx.clip()
  const dots = Math.round(rx * ry / (unit * unit) / 260)
  for (let i = 0; i < dots; i++) {
    const a = r() * Math.PI * 2
    const d = Math.sqrt(r())
    ctx.fillStyle = fill(alpha * (0.18 + r() * 0.3))
    const size = (0.8 + r() * 1.8) * unit
    ctx.fillRect(cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, size, size)
  }
  ctx.restore()
}

/**
 * 页面上的水彩晕染（大装饰，画在照片之下）
 * @param frames 本页版式照片框（0–1）
 * @param tone   跨页主色调（风格颜色键或色值），没有时从 cfg.colors 中随机
 * @returns 小装饰要避开的区域：晕染上可以放贴纸，返回空
 */
function drawPageWash(ctx, style, cfg, page, frames, W, H, unit, tone) {
  const r = seq(`${page.spreadId || ''}:${page.side}:pagewash`)
  const colors = cfg.colors || ['accent']
  const picked = colors[Math.floor(r() * colors.length)]
  // 有跨页主色调时左右页同色
  const color = tone || picked
  const hex = style.colors[color] || color
  const pageW = page.side === 'full' ? W / 2 : W
  const [smin, smax] = cfg.size || [0.4, 0.6]
  const rx = pageW * (smin + r() * (smax - smin)) / 2
  const ry = rx * (0.7 + r() * 0.35)
  // 以最大照片框的某个角为中心（没有照片时在页面一角）
  const largest = frames.reduce((b, f) => (!b || f.w * f.h > b.w * b.h ? f : b), null)
  let cx
  let cy
  if (largest && largest.w * largest.h < 0.85) {
    cx = (largest.x + (r() < 0.5 ? 0 : largest.w)) * W
    cy = (largest.y + (r() < 0.5 ? 0 : largest.h)) * H
  } else {
    cx = r() < 0.5 ? pageW * 0.2 : pageW * 0.8
    cy = r() < 0.5 ? H * 0.2 : H * 0.8
  }
  drawWashBlob(ctx, cx, cy, rx, ry, hex, cfg.alpha == null ? 0.5 : cfg.alpha, unit, `${page.spreadId || ''}:${page.side}`)
  // 贴纸、便签纸可以压在晕染上，不算占位
  return []
}

module.exports = { drawWashBlob, drawPageWash }
