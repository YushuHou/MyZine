// 纸艺类效果：照片滤镜、票根、撕边垫纸、霓虹描边、半调网点（阶段 7 风格用）
// 全部由风格数据驱动；真机验证：saturation / screen / multiply 可用，ctx.filter 不可用
const { hashRandom } = require('./frames')
const { drawGlyphText } = require('./glyphText')

function colorOf(style, value, fallback) {
  return (value && style.colors[value]) || value || fallback
}

/**
 * 照片滤镜：在照片区域内（调用方已裁切）依次执行
 * photoFilter: [
 *   { type: 'grayscale' }                                  黑白（saturation 叠灰）
 *   { type: 'tint', color, mode: 'multiply' | 'screen', alpha }   叠色（暖调 / 提亮）
 *   { type: 'lightLeak', color, alpha, size（相对照片短边）}      漏光：照片一角的径向渐变（screen）
 * ]
 */
function applyPhotoFilters(ctx, style, rect, unit, seed) {
  const filters = style.photoFilter
  if (!filters || !filters.length) return
  filters.forEach((f, i) => {
    ctx.save()
    if (f.type === 'grayscale') {
      ctx.globalCompositeOperation = 'saturation'
      ctx.fillStyle = '#808080'
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
    } else if (f.type === 'tint') {
      ctx.globalCompositeOperation = f.mode || 'multiply'
      ctx.globalAlpha = f.alpha == null ? 0.3 : f.alpha
      ctx.fillStyle = colorOf(style, f.color, '#FFB37A')
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
    } else if (f.type === 'lightLeak') {
      // 位置按照片稳定随机：四个角之一
      const corner = Math.floor(hashRandom(`${seed}:leak:${i}`) * 4)
      const cx = corner % 2 ? rect.x + rect.w : rect.x
      const cy = corner > 1 ? rect.y + rect.h : rect.y
      const r = Math.max(rect.w, rect.h) * (f.size || 0.7)
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      const color = colorOf(style, f.color, '#FF7A3D')
      g.addColorStop(0, color)
      g.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.globalCompositeOperation = 'screen'
      ctx.globalAlpha = f.alpha == null ? 0.45 : f.alpha
      ctx.fillStyle = g
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
    }
    ctx.restore()
  })
}

/**
 * 撕边垫纸：照片下面垫一张比照片大一圈、边缘不规则的纸（拼贴剪报）
 * backing: { color, margin（基准 px）, jag（锯齿深度）, shadow }
 */
function drawTornBacking(ctx, style, backing, rect, unit, seed) {
  const m = (backing.margin || 18) * unit
  const jag = (backing.jag || 6) * unit
  const step = 12 * unit
  const x0 = rect.x - m
  const y0 = rect.y - m
  const x1 = rect.x + rect.w + m
  const y1 = rect.y + rect.h + m
  let k = 0
  const off = () => hashRandom(`${seed}:torn:${k++}`) * jag
  ctx.save()
  if (backing.shadow !== false) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
    ctx.shadowBlur = 10 * unit
    ctx.shadowOffsetY = 3 * unit
  }
  ctx.beginPath()
  ctx.moveTo(x0, y0)
  for (let x = x0 + step; x < x1; x += step) ctx.lineTo(x, y0 + off())
  ctx.lineTo(x1, y0)
  for (let y = y0 + step; y < y1; y += step) ctx.lineTo(x1 - off(), y)
  ctx.lineTo(x1, y1)
  for (let x = x1 - step; x > x0; x -= step) ctx.lineTo(x, y1 - off())
  ctx.lineTo(x0, y1)
  for (let y = y1 - step; y > y0; y -= step) ctx.lineTo(x0 + off(), y)
  ctx.closePath()
  ctx.fillStyle = colorOf(style, backing.color, '#FFFFFF')
  ctx.fill()
  ctx.restore()
}

/**
 * 票根：照片框一侧的副券区——虚线撕线 + 两端半圆缺口 + 竖排「ADMIT ONE」和编号
 * ticketStub: { ratio（副券占照片框长边的比例）, color（副券纸色）, notchColor（缺口颜色，通常为页面底色）,
 *               text, font（字形字体样式）, textColor }
 * @param outer 照片框外形区域；inner 照片区域（已扣掉副券）
 * @param number 照片编号（整本书连续），没有时不写编号
 */
function drawTicketStub(ctx, style, stub, outer, inner, side, unit, number) {
  const dash = 8 * unit
  const notch = 10 * unit
  const color = colorOf(style, stub.textColor, style.colors.text)
  ctx.save()
  // 撕线位置：照片区域与副券的分界
  const lineX = inner.x + inner.w + (side === 'right' ? (outer.x + outer.w - inner.x - inner.w) * 0.08 : 0)
  const lineY = inner.y + inner.h + (side === 'bottom' ? (outer.y + outer.h - inner.y - inner.h) * 0.08 : 0)
  ctx.strokeStyle = color
  ctx.globalAlpha = 0.55
  ctx.lineWidth = Math.max(1, 2 * unit)
  if (ctx.setLineDash) ctx.setLineDash([dash, dash * 0.8])
  ctx.beginPath()
  if (side === 'right') {
    ctx.moveTo(lineX, outer.y + notch)
    ctx.lineTo(lineX, outer.y + outer.h - notch)
  } else {
    ctx.moveTo(outer.x + notch, lineY)
    ctx.lineTo(outer.x + outer.w - notch, lineY)
  }
  ctx.stroke()
  ctx.restore()
  // 两端半圆缺口（像被打孔撕开的票）
  ctx.save()
  ctx.fillStyle = colorOf(style, stub.notchColor, style.colors.background)
  ctx.beginPath()
  if (side === 'right') {
    ctx.arc(lineX, outer.y, notch, 0, Math.PI)
    ctx.moveTo(lineX + notch, outer.y + outer.h)
    ctx.arc(lineX, outer.y + outer.h, notch, 0, Math.PI, true)
  } else {
    ctx.arc(outer.x, lineY, notch, -Math.PI / 2, Math.PI / 2)
    ctx.moveTo(outer.x + outer.w, lineY - notch)
    ctx.arc(outer.x + outer.w, lineY, notch, -Math.PI / 2, Math.PI / 2, true)
  }
  ctx.fill()
  ctx.restore()
  // 副券文字
  const font = stub.font || {}
  const spec = { glyph: font.glyph || 'oswald', family: font.family || 'sans-serif', size: (font.size || 22) * unit, letterSpacing: (font.letterSpacing || 3) * unit, uppercase: true }
  const text = stub.text || 'ADMIT ONE'
  const no = number ? `No. ${number < 10 ? '0' + number : number}` : ''
  ctx.save()
  if (side === 'right') {
    const cx = (lineX + outer.x + outer.w) / 2
    const cy = outer.y + outer.h / 2
    ctx.translate(cx, cy)
    ctx.rotate(Math.PI / 2)
    drawGlyphText(ctx, spec, text, 0, -spec.size * 0.2, 'center', color)
    if (no) drawGlyphText(ctx, Object.assign({}, spec, { size: spec.size * 0.8 }), no, 0, spec.size * 1.1, 'center', color)
  } else {
    const cy = (lineY + outer.y + outer.h) / 2
    drawGlyphText(ctx, spec, text, outer.x + outer.w / 2, cy + spec.size * 0.1, 'center', color)
    if (no) drawGlyphText(ctx, Object.assign({}, spec, { size: spec.size * 0.8 }), no, outer.x + outer.w - 24 * unit, cy + spec.size * 0.1, 'right', color)
  }
  ctx.restore()
}

/**
 * 霓虹描边：照片框外一圈发光细线（复古港风）
 * outline: { color, width（基准 px）, offset（离照片框）, glow（发光半径） }
 */
function drawOutline(ctx, style, d, rect, unit) {
  const off = (d.offset == null ? 10 : d.offset) * unit
  const color = colorOf(style, d.color, style.colors.accent)
  ctx.save()
  ctx.strokeStyle = color
  ctx.lineWidth = Math.max(1, (d.width || 3) * unit)
  ctx.shadowColor = color
  ctx.shadowBlur = (d.glow == null ? 14 : d.glow) * unit
  ctx.strokeRect(rect.x - off, rect.y - off, rect.w + off * 2, rect.h + off * 2)
  ctx.restore()
}

/**
 * 半调网点色块（独立 Zine）：网格圆点，半径沿 x 方向渐小，形成网点渐变
 * halftone: { x, y, w, h（0–1）, color, dot（最大半径，基准 px）, gap（点距）, fade（0–1，渐小程度） }
 */
function drawHalftone(ctx, style, d, x, y, w, h, unit) {
  const r = (d.dot || 7) * unit
  const gap = (d.gap || 18) * unit
  ctx.save()
  ctx.fillStyle = colorOf(style, d.color, style.colors.accent)
  for (let py = y + gap / 2; py < y + h; py += gap) {
    for (let px = x + gap / 2; px < x + w; px += gap) {
      const t = (px - x) / w
      const rr = r * (1 - t * (d.fade == null ? 0.8 : d.fade))
      if (rr <= 0.3) continue
      ctx.beginPath()
      ctx.arc(px, py, rr, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  ctx.restore()
}

module.exports = { applyPhotoFilters, drawTornBacking, drawTicketStub, drawOutline, drawHalftone }
