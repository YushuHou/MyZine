// 明信片元素：邮票框、邮戳圆环（沿圆弧写字）、航空信封红蓝斜条页边
// 由风格数据驱动（frameDecorations: stamp / postmark，decorations: airmailBorder）
const { drawGlyphText, measureGlyphText, transformText } = require('./glyphText')
const { drawDoodle } = require('./doodles')
const { hashRandom } = require('./frames')
const { formatDate } = require('../bookInfo')
const { packImage } = require('./stickers')

function colorOf(style, value, fallback) {
  return (value && style.colors[value]) || value || fallback
}

/**
 * 沿圆弧写一行字：top 在圆的上半部从左到右，bottom 在下半部从左到右（都保持正向可读）
 * @param r 基线所在半径（画布 px）
 */
function drawArcText(ctx, spec, text, cx, cy, r, position, color) {
  const chars = Array.from(transformText(text, spec))
  const spacing = spec.letterSpacing || 0
  const widths = chars.map(ch => measureGlyphText(ctx, Object.assign({}, spec, { uppercase: false, letterSpacing: 0 }), ch) + spacing)
  const total = widths.reduce((a, b) => a + b, 0) - spacing
  const charSpec = Object.assign({}, spec, { uppercase: false, letterSpacing: 0 })
  if (position === 'top') {
    let a = -Math.PI / 2 - total / (2 * r)
    chars.forEach((ch, i) => {
      const mid = a + (widths[i] - spacing) / (2 * r)
      ctx.save()
      ctx.translate(cx + r * Math.cos(mid), cy + r * Math.sin(mid))
      ctx.rotate(mid + Math.PI / 2)
      drawGlyphText(ctx, charSpec, ch, 0, 0, 'center', color)
      ctx.restore()
      a += widths[i] / r
    })
  } else {
    let a = Math.PI / 2 + total / (2 * r)
    chars.forEach((ch, i) => {
      const mid = a - (widths[i] - spacing) / (2 * r)
      ctx.save()
      ctx.translate(cx + r * Math.cos(mid), cy + r * Math.sin(mid))
      ctx.rotate(mid - Math.PI / 2)
      drawGlyphText(ctx, charSpec, ch, 0, 0, 'center', color)
      ctx.restore()
      a -= widths[i] / r
    })
  }
}

/**
 * 邮票框：白色锯齿边 + 内框底色 + 一个小线稿（或素材分包里的贴纸），压在照片右上角
 * stamp: { w, h（基准 px）, inset（离照片右上角）, fill（内框色）, doodles: [...], doodleColor, stickers: [...]（素材贴纸名，优先于线稿）}
 * @param images 图片表（邮票里画贴纸时用）
 * @param rect 照片框外形区域（画布 px），坐标系已按照片框旋转
 * @returns 邮票区域（画布 px），供邮戳定位
 */
function drawStamp(ctx, style, d, rect, unit, seed, images) {
  const w = (d.w || 116) * unit
  const h = (d.h || 140) * unit
  const inset = (d.inset || 22) * unit
  const x = rect.x + rect.w - inset - w
  const y = rect.y + inset
  const bump = 5 * unit
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.18)'
  ctx.shadowBlur = 6 * unit
  ctx.shadowOffsetY = 2 * unit
  // 锯齿边：四条边上连续的小圆弧凸起
  ctx.beginPath()
  const edge = (x0, y0, x1, y1, nx, ny) => {
    const len = Math.hypot(x1 - x0, y1 - y0)
    const n = Math.max(2, Math.round(len / (bump * 2.4)))
    for (let i = 0; i < n; i++) {
      const t0 = i / n
      const t1 = (i + 1) / n
      const mx = x0 + (x1 - x0) * (t0 + t1) / 2 + nx * bump
      const my = y0 + (y1 - y0) * (t0 + t1) / 2 + ny * bump
      ctx.quadraticCurveTo(mx, my, x0 + (x1 - x0) * t1, y0 + (y1 - y0) * t1)
    }
  }
  ctx.moveTo(x, y)
  edge(x, y, x + w, y, 0, -1)
  edge(x + w, y, x + w, y + h, 1, 0)
  edge(x + w, y + h, x, y + h, 0, 1)
  edge(x, y + h, x, y, -1, 0)
  ctx.closePath()
  ctx.fillStyle = '#FFFFFF'
  ctx.fill()
  ctx.restore()
  // 内框
  const pad = 10 * unit
  ctx.fillStyle = colorOf(style, d.fill, '#D6E8F0')
  ctx.fillRect(x + pad, y + pad, w - pad * 2, h - pad * 2)
  // 贴纸：等比缩进内框（留一圈底色）
  const sticker = d.stickers && packImage(images, d.stickers[Math.floor(hashRandom(`${seed}:stamp`) * d.stickers.length)])
  if (sticker) {
    const bw = w - pad * 3
    const bh = h - pad * 3
    const k = Math.min(bw / sticker.width, bh / sticker.height)
    ctx.drawImage(sticker, x + (w - sticker.width * k) / 2, y + (h - sticker.height * k) / 2, sticker.width * k, sticker.height * k)
    return { x, y, w, h }
  }
  const names = d.doodles || ['sun']
  const name = names[Math.floor(hashRandom(`${seed}:stamp`) * names.length)]
  drawDoodle(ctx, name, x + w / 2, y + h / 2, Math.min(w, h) * 0.55, {
    color: colorOf(style, d.doodleColor, style.colors.accent),
    lineWidth: 2.5 * unit
  })
  return { x, y, w, h }
}

/**
 * 邮戳圆环：双圆环，环内上方写地点、下方写日期（为空则只画圆环），中心一颗小星
 * postmark: { r（外环半径，基准 px）, color, font（字形字体样式）, rotate }
 * @param anchor 邮票区域，邮戳压在邮票左下角
 */
function drawPostmark(ctx, style, d, anchor, info, unit, seed) {
  const R = (d.r || 74) * unit
  const r2 = R * 0.64
  const cx = anchor.x + 6 * unit
  const cy = anchor.y + anchor.h - 8 * unit
  const color = colorOf(style, d.color, 'rgba(30, 60, 100, 0.75)')
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(((d.rotate == null ? -14 : d.rotate) + (hashRandom(`${seed}:pm`) * 2 - 1) * 6) * Math.PI / 180)
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1, 2.4 * unit)
  ctx.beginPath()
  ctx.arc(0, 0, R, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = Math.max(1, 1.6 * unit)
  ctx.beginPath()
  ctx.arc(0, 0, r2, 0, Math.PI * 2)
  ctx.stroke()
  // 环内文字：基线放在两环之间
  const location = ((info && info.location) || '').trim()
  const date = info ? formatDate(info.dateStart, info.dateEnd) : ''
  const font = d.font || {}
  const band = R - r2
  const spec = { glyph: font.glyph, family: font.family || 'serif', weight: font.weight, size: band * 0.5, letterSpacing: (font.letterSpacing || 1) * unit, uppercase: !!font.uppercase }
  if (location) drawArcText(ctx, spec, location, 0, 0, r2 + band * 0.26, 'top', color)
  if (date) drawArcText(ctx, spec, date, 0, 0, R - band * 0.26, 'bottom', color)
  drawDoodle(ctx, 'star', 0, 0, r2 * 0.7, { color, lineWidth: 1.6 * unit })
  ctx.restore()
}

/**
 * 航空信封红蓝斜条页边：沿页面外边（不含靠中缝一侧）画一圈斜条
 * airmailBorder: { colors: [红, 蓝], width（条带宽，基准 px）, stripe（斜条宽）}
 */
function drawAirmailBorder(ctx, style, d, page, W, H, unit) {
  const b = (d.width || 22) * unit
  const s = (d.stripe || 28) * unit
  const colors = (d.colors || ['#C8423B', '#2B5C8A']).map(c => colorOf(style, c, c))
  const seq = [colors[0], '#FFFFFF', colors[1], '#FFFFFF']
  // 条带区域：上、下必有；左右页只画外侧，单页 / 跨页大图四周都画
  ctx.save()
  ctx.beginPath()
  ctx.rect(0, 0, W, b)
  ctx.rect(0, H - b, W, b)
  if (page.side !== 'right') ctx.rect(0, b, b, H - 2 * b)
  if (page.side !== 'left') ctx.rect(W - b, b, b, H - 2 * b)
  ctx.clip()
  let i = 0
  for (let k = -H; k < W + H; k += s) {
    ctx.fillStyle = seq[i % seq.length]
    ctx.beginPath()
    ctx.moveTo(k, 0)
    ctx.lineTo(k + s, 0)
    ctx.lineTo(k + s - H, H)
    ctx.lineTo(k - H, H)
    ctx.closePath()
    ctx.fill()
    i++
  }
  ctx.restore()
}

module.exports = { drawArcText, drawStamp, drawPostmark, drawAirmailBorder }
