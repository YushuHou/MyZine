// 主题风格的视觉元素：餐盘沿、照片角线稿、格纹桌布页边、木栅栏页边、虚线路线
// 由风格数据驱动（frameDecorations: plateRim / cornerDoodle，decorations: checkerBorder / fenceBorder / route）
const { hashRandom, shapePath } = require('./frames')
const { drawDoodle } = require('./doodles')

function colorOf(style, value, fallback) {
  return (value && style.colors[value]) || value || fallback
}

/**
 * 餐盘沿：圆形照片框白边内侧一圈细线 + 外侧一圈浅色描边，像盘子的盘沿（只画在圆形框上）
 * plateRim: { color（内圈线）, outerColor, width（基准 px）}
 */
function drawPlateRim(ctx, style, d, frame, rect, unit) {
  if (frame.shape !== 'circle' && frame.shape !== 'ellipse') return
  const pf = style.photoFrame || {}
  const bw = (pf.borderWidth || 0) * unit
  const cx = rect.x + rect.w / 2
  const cy = rect.y + rect.h / 2
  const rx = rect.w / 2
  const ry = rect.h / 2
  ctx.save()
  ctx.lineWidth = Math.max(1, (d.width || 2) * unit)
  ctx.strokeStyle = colorOf(style, d.color, '#E2D6C2')
  // 用贝塞尔椭圆（与照片形状同一套路径），不依赖 ctx.ellipse
  const irx = Math.max(1, rx - bw * 0.55)
  const iry = Math.max(1, ry - bw * 0.55)
  shapePath(ctx, 'ellipse', cx - irx, cy - iry, irx * 2, iry * 2, 0)
  ctx.stroke()
  ctx.strokeStyle = colorOf(style, d.outerColor, 'rgba(0, 0, 0, 0.08)')
  shapePath(ctx, 'ellipse', rect.x, rect.y, rect.w, rect.h, 0)
  ctx.stroke()
  ctx.restore()
}

/**
 * 照片角线稿：在照片的某个角压一个线稿（压花标本的枝叶、爪印角标）
 * cornerDoodle: { names, corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right', size（基准 px）, color, lineWidth, rotate }
 */
function drawCornerDoodle(ctx, style, d, rect, unit, seed) {
  const names = d.names || ['branch']
  const name = names[Math.floor(hashRandom(`${seed}:corner`) * names.length)]
  const size = (d.size || 120) * unit
  const corner = d.corner || 'top-left'
  const x = corner.indexOf('left') >= 0 ? rect.x + size * 0.2 : rect.x + rect.w - size * 0.2
  const y = corner.indexOf('top') >= 0 ? rect.y + size * 0.15 : rect.y + rect.h - size * 0.15
  drawDoodle(ctx, name, x, y, size, {
    color: colorOf(style, d.color, style.colors.accent),
    lineWidth: (d.lineWidth || 4) * unit,
    rotate: (d.rotate || 0) + (hashRandom(`${seed}:corner:rot`) * 2 - 1) * 12
  })
}

// 页面外边的条带区域（不含靠中缝一侧）：上、下必有，左右页只画外侧
function clipBand(ctx, page, W, H, b, edges) {
  ctx.beginPath()
  if (edges.indexOf('top') >= 0) ctx.rect(0, 0, W, b)
  if (edges.indexOf('bottom') >= 0) ctx.rect(0, H - b, W, b)
  if (edges.indexOf('side') >= 0) {
    if (page.side !== 'right') ctx.rect(0, b, b, H - 2 * b)
    if (page.side !== 'left') ctx.rect(W - b, b, b, H - 2 * b)
  }
  ctx.clip()
}

/**
 * 格纹桌布页边（红白格）：横竖半透明条纹交叠
 * checkerBorder: { color, width（条带宽，基准 px）, check（格子大小）, edges: ['top', 'bottom', 'side'] }
 */
function drawCheckerBorder(ctx, style, d, page, W, H, unit) {
  const b = (d.width || 60) * unit
  const s = (d.check || 20) * unit
  ctx.save()
  clipBand(ctx, page, W, H, b, d.edges || ['top', 'bottom', 'side'])
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = colorOf(style, d.color, '#D2483C')
  ctx.globalAlpha = 0.5
  for (let x = 0; x < W; x += s * 2) ctx.fillRect(x, 0, s, H)
  for (let y = 0; y < H; y += s * 2) ctx.fillRect(0, y, W, s)
  ctx.restore()
}

/**
 * 木栅栏页边：页面底部一排尖顶木桩 + 两道横栏
 * fenceBorder: { color, height（基准 px）, post（木桩宽）, gap }
 */
function drawFenceBorder(ctx, style, d, page, W, H, unit) {
  const h = (d.height || 110) * unit
  const pw = (d.post || 34) * unit
  const gap = (d.gap || 18) * unit
  const top = H - h
  ctx.save()
  ctx.fillStyle = colorOf(style, d.color, '#C9945A')
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)'
  ctx.lineWidth = Math.max(1, 1.5 * unit)
  // 横栏
  ;[0.35, 0.72].forEach(t => {
    ctx.fillRect(0, top + h * t, W, 12 * unit)
    ctx.strokeRect(0, top + h * t, W, 12 * unit)
  })
  // 木桩：尖顶
  for (let x = gap / 2; x < W; x += pw + gap) {
    ctx.beginPath()
    ctx.moveTo(x, H)
    ctx.lineTo(x, top + pw * 0.5)
    ctx.lineTo(x + pw / 2, top)
    ctx.lineTo(x + pw, top + pw * 0.5)
    ctx.lineTo(x + pw, H)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
  ctx.restore()
}

/**
 * 虚线路线：从页面一角弯弯曲曲到另一角，终点插一个定位针（公路旅行）
 * route: { color, width（基准 px）, dash, pinColor }，路径形状按跨页稳定变化
 */
function drawRoute(ctx, style, d, page, W, H, unit) {
  const r = k => hashRandom(`${page.spreadId || ''}:${page.side}:route:${k}`)
  const x0 = W * (0.06 + r(1) * 0.1)
  const y0 = H * (0.9 + r(2) * 0.05)
  const x1 = W * (0.84 + r(3) * 0.1)
  const y1 = H * (0.06 + r(4) * 0.08)
  ctx.save()
  ctx.strokeStyle = colorOf(style, d.color, style.colors.accent)
  ctx.lineWidth = Math.max(1, (d.width || 4) * unit)
  ctx.lineCap = 'round'
  if (ctx.setLineDash) ctx.setLineDash([(d.dash || 14) * unit, (d.dash || 14) * unit])
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  ctx.bezierCurveTo(W * (0.2 + r(5) * 0.6), H * (0.3 + r(6) * 0.5), W * (0.1 + r(7) * 0.6), H * (0.1 + r(8) * 0.3), x1, y1)
  ctx.stroke()
  ctx.restore()
  drawDoodle(ctx, 'pin', x1, y1 - 30 * unit, 70 * unit, { color: colorOf(style, d.pinColor, style.colors.accent), lineWidth: 4 * unit })
}

module.exports = { drawPlateRim, drawCornerDoodle, drawCheckerBorder, drawFenceBorder, drawRoute }
