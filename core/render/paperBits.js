// 纸片类装饰：撕纸条（毛边 + 白色纸芯，可写短句或地点日期）、行李吊牌（孔、加固垫圈、麻绳、栏位、条形码）
const { hashRandom } = require('./frames')
const { drawGlyphText, measureGlyphText } = require('./glyphText')
const { drawPattern } = require('./patterns')
const { variables } = require('./decoText')
const { mix } = require('./color')

function colorOf(style, value, fallback) {
  return (value && style.colors[value]) || value || fallback
}

function seq(key) {
  let i = 0
  return () => hashRandom(`${key}:${i++}`)
}

// 纸材 → 纸色
const PAPERS = { white: '#FBF9F4', lined: '#FBF9F4', kraft: '#C9A57A', news: '#E7E2D6' }

function paperColor(style, paper) {
  return PAPERS[paper] || colorOf(style, paper, PAPERS.white)
}

/**
 * 撕纸条上的字：页对象带 strip（getPageList 按整本书不重复分配）；不在相册中的示例跨页按 id 从词池取
 * 返回 null 时不写字
 */
function stripText(page, style) {
  if (page.strip) return page.strip
  const pool = style.stripPool || []
  return pool.length ? pool[Math.floor(hashRandom(`strip:${page.spreadId || ''}`) * pool.length)] : null
}

/**
 * 撕纸条上「地点 · 日期」的写法；地点或日期为空时返回 null
 */
function placeText(page, style) {
  const v = variables(page, style)
  return v.location && v.date ? `${v.location} · ${v.date}` : null
}

// 撕开的边：从 (x0, y) 到 (x1, y) 的起伏折线，返回点列
function tornLine(x0, x1, y, jag, step, r) {
  const pts = []
  const n = Math.max(2, Math.round(Math.abs(x1 - x0) / step))
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const edge = i === 0 || i === n
    pts.push([x0 + (x1 - x0) * t + (edge ? 0 : (r() - 0.5) * step * 0.5), y + (edge ? 0 : (r() - 0.5) * 2 * jag)])
  }
  return pts
}

// 纸条外形路径（中心在原点）：上下长边撕开，两端撕开或剪直
function stripPath(ctx, w, h, jag, step, tornEnds, r) {
  const top = tornLine(-w / 2, w / 2, -h / 2, jag, step, r)
  const bottom = tornLine(w / 2, -w / 2, h / 2, jag, step, r)
  ctx.beginPath()
  top.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])))
  if (tornEnds) tornLine(-h / 2, h / 2, w / 2, jag * 0.8, step * 0.7, r).forEach(p => ctx.lineTo(p[1], p[0]))
  bottom.forEach(p => ctx.lineTo(p[0], p[1]))
  if (tornEnds) tornLine(h / 2, -h / 2, -w / 2, jag * 0.8, step * 0.7, r).forEach(p => ctx.lineTo(p[1], p[0]))
  ctx.closePath()
}

/**
 * 撕纸条
 * cfg: { paper: 'white' | 'lined' | 'kraft' | 'news' | 颜色, height（基准 px）, font（字形字体样式）, tornEnds, color（字色）}
 * @param cx, cy 中心（画布 px）；w 纸条长（画布 px）；angle 旋转（度）
 * @param text   纸条上的字（为空时只画纸条）
 */
function drawTornStrip(ctx, style, cfg, cx, cy, w, angle, text, unit, seed) {
  const r = seq(`${seed}:strip`)
  const h = (cfg.height || 72) * unit
  const jag = 3.2 * unit
  const step = 9 * unit
  const paper = paperColor(style, cfg.paper || 'white')
  const tornEnds = cfg.tornEnds !== false
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle * Math.PI / 180)
  // 白色纸芯：比纸条大一圈的毛边层（撕开处露出的纤维）
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)'
  ctx.shadowBlur = 8 * unit
  ctx.shadowOffsetY = 2 * unit
  stripPath(ctx, w + 6 * unit, h + 6 * unit, jag * 1.2, step, tornEnds, r)
  ctx.fillStyle = mix(paper, '#FFFFFF', 0.75)
  ctx.fill()
  ctx.restore()
  // 纸面
  stripPath(ctx, w, h, jag, step, tornEnds, r)
  ctx.fillStyle = paper
  ctx.fill()
  if (cfg.paper === 'lined') {
    ctx.save()
    ctx.clip()
    drawPattern(ctx, 'lined', -w / 2, -h / 2 - h * 0.18, w, h * 1.4, {
      color: '#B9CBE0', cell: h * 0.42, lineWidth: Math.max(1, 1.5 * unit), marginColor: '#E3A3A3', marginX: w * 0.12
    })
    ctx.restore()
  }
  if (text) {
    const font = cfg.font || { glyph: 'caveat', size: 40 }
    const spec = { glyph: font.glyph, family: font.family || 'serif', weight: font.weight, size: (font.size || 40) * unit, letterSpacing: (font.letterSpacing || 0) * unit, uppercase: !!font.uppercase }
    const maxW = w * 0.82
    const tw = measureGlyphText(ctx, spec, text)
    if (tw > maxW) {
      spec.size *= maxW / tw
      spec.letterSpacing *= maxW / tw
    }
    drawGlyphText(ctx, spec, text, 0, spec.size * 0.34, 'center', colorOf(style, cfg.color || font.color, style.colors.text))
  }
  ctx.restore()
}

/**
 * 照片角上的撕纸条（照片框装饰，坐标系已按照片框旋转）：斜压在照片左下或右下角，约一半露在照片外
 * cfg: 同 drawTornStrip，另有 size: [最短, 最长]（基准 px，且不超过照片宽的 70%）、text: ['pool', 'place']（轮换的内容）
 */
function drawFrameStrip(ctx, style, cfg, rect, unit, seed, page) {
  const r = seq(`${seed}:fstrip`)
  const [minW, maxW] = cfg.size || [260, 380]
  const w = Math.min(rect.w * 0.7, (minW + r() * (maxW - minW)) * unit)
  const left = r() < 0.5
  const cx = left ? rect.x + w * 0.42 : rect.x + rect.w - w * 0.42
  const cy = rect.y + rect.h - (cfg.height || 72) * unit * 0.1
  const angle = (left ? -1 : 1) * (2 + r() * 5)
  drawTornStrip(ctx, style, cfg, cx, cy, w, angle, pickStripText(cfg, page, style), unit, seed)
}

// 纸条写什么：短句（stripPool）和「地点 · 日期」轮换；地点日期不全时只用短句
function pickStripText(cfg, page, style) {
  const kinds = cfg.text || ['pool', 'place']
  const place = kinds.indexOf('place') >= 0 ? placeText(page, style) : null
  const usePlace = place && (kinds.indexOf('pool') < 0 || hashRandom(`strip:kind:${page.spreadId || ''}`) < 0.35)
  return usePlace ? place : stripText(page, style)
}

/**
 * 行李吊牌（竖长卡片），麻绳从孔里伸向页面外侧
 * cfg: { paper（卡片纸色）, band（顶部色带颜色）, string（绳子颜色）, font（字形字体样式）}
 * @param cx, cy 卡片中心（画布 px）；h 卡片高（画布 px）
 * @param outward 绳子伸向的方向：-1 向左（左页外侧）、1 向右
 */
function drawLuggageTag(ctx, style, cfg, cx, cy, h, page, unit, seed, outward, bg) {
  const r = seq(`${seed}:tag`)
  const w = h * 0.56
  const angle = (r() * 2 - 1) * 15 * Math.PI / 180
  const paper = paperColor(style, cfg.paper || 'white')
  const band = colorOf(style, cfg.band, style.colors.accent)
  const ink = colorOf(style, cfg.ink, style.colors.text)
  const muted = mix(ink, paper, 0.45)
  const font = cfg.font || { glyph: 'oswald', family: 'sans-serif' }
  const spec = (size, extra) => Object.assign({ glyph: font.glyph, family: font.family || 'sans-serif', size, letterSpacing: size * 0.08, uppercase: true }, extra || {})
  const chamfer = w * 0.22
  const holeY = -h / 2 + w * 0.2
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  // 绳子：先画（压在卡片下面的一股）
  const hx = cx - holeY * sin
  const hy = cy + holeY * cos
  ctx.save()
  ctx.strokeStyle = colorOf(style, cfg.string, '#B89A6A')
  ctx.lineCap = 'round'
  ;[-1, 1].forEach((s, i) => {
    ctx.lineWidth = Math.max(1, 3.2 * unit)
    ctx.beginPath()
    ctx.moveTo(hx + s * 2 * unit, hy)
    ctx.bezierCurveTo(
      hx + outward * h * 0.35, hy - h * (0.35 + i * 0.06),
      hx + outward * h * 0.6, hy - h * (0.15 - i * 0.05),
      hx + outward * h * 1.4, hy - h * (0.55 + i * 0.08)
    )
    ctx.stroke()
  })
  // 绳结
  ctx.fillStyle = colorOf(style, cfg.string, '#B89A6A')
  ctx.beginPath()
  ctx.arc(hx + outward * h * 0.42, hy - h * 0.25, 5 * unit, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  // 卡片外形：上端两角切斜角
  const rr = w * 0.06
  const shape = () => {
    ctx.beginPath()
    ctx.moveTo(-w / 2 + chamfer, -h / 2)
    ctx.lineTo(w / 2 - chamfer, -h / 2)
    ctx.lineTo(w / 2, -h / 2 + chamfer)
    ctx.lineTo(w / 2, h / 2 - rr)
    ctx.arcTo(w / 2, h / 2, w / 2 - rr, h / 2, rr)
    ctx.lineTo(-w / 2 + rr, h / 2)
    ctx.arcTo(-w / 2, h / 2, -w / 2, h / 2 - rr, rr)
    ctx.lineTo(-w / 2, -h / 2 + chamfer)
    ctx.closePath()
  }
  ctx.save()
  ctx.shadowColor = 'rgba(0, 0, 0, 0.22)'
  ctx.shadowBlur = 10 * unit
  ctx.shadowOffsetY = 3 * unit
  shape()
  ctx.fillStyle = paper
  ctx.fill()
  ctx.restore()
  ctx.save()
  shape()
  ctx.clip()
  // 顶部色带
  const bandTop = holeY + w * 0.18
  const bandH = h * 0.13
  ctx.fillStyle = band
  ctx.fillRect(-w / 2, bandTop, w, bandH)
  drawGlyphText(ctx, spec(bandH * 0.5, { letterSpacing: bandH * 0.12 }), 'BAGGAGE', 0, bandTop + bandH * 0.68, 'center', paper)
  // 栏位：TO / DATE / FLIGHT
  const v = variables(page, {})
  const info = page.info || {}
  const md = (info.dateStart || '').slice(5).replace('-', '')
  const flight = `MZ ${md || String(1000 + Math.floor(r() * 9000))}`
  const fields = [['TO', v.location], ['DATE', v.date], ['FLIGHT', flight]]
  const x0 = -w / 2 + w * 0.12
  const x1 = w / 2 - w * 0.12
  let y = bandTop + bandH + h * 0.05
  const labelSize = w * 0.075
  const valueSize = w * 0.12
  fields.forEach(([label, value]) => {
    drawGlyphText(ctx, spec(labelSize), label, x0, y + labelSize, 'left', muted)
    y += labelSize + valueSize * 1.15
    if (value) {
      const vs = spec(valueSize, { letterSpacing: valueSize * 0.04 })
      const tw = measureGlyphText(ctx, vs, value)
      if (tw > x1 - x0) {
        vs.size *= (x1 - x0) / tw
        vs.letterSpacing *= (x1 - x0) / tw
      }
      drawGlyphText(ctx, vs, value, x0, y - valueSize * 0.15, 'left', ink)
    }
    ctx.strokeStyle = muted
    ctx.lineWidth = Math.max(1, 1.2 * unit)
    ctx.beginPath()
    ctx.moveTo(x0, y)
    ctx.lineTo(x1, y)
    ctx.stroke()
    y += h * 0.04
  })
  // 条形码
  const barTop = h / 2 - h * 0.15
  const barH = h * 0.09
  ctx.fillStyle = ink
  for (let bx = x0; bx < x1;) {
    const bw = (0.6 + r() * 2.4) * unit * (h / (300 * unit))
    if (bx + bw > x1) break
    ctx.fillRect(bx, barTop, bw, barH)
    bx += bw + (0.8 + r() * 2.2) * unit * (h / (300 * unit))
  }
  ctx.restore()
  // 孔：页面底色 + 加固垫圈
  ctx.fillStyle = bg
  ctx.beginPath()
  ctx.arc(0, holeY, w * 0.065, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = mix(band, '#000000', 0.15)
  ctx.lineWidth = w * 0.045
  ctx.beginPath()
  ctx.arc(0, holeY, w * 0.1, 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()

  // 绳子穿出孔的一小段压在卡片上
  ctx.save()
  ctx.strokeStyle = colorOf(style, cfg.string, '#B89A6A')
  ctx.lineWidth = Math.max(1, 3.2 * unit)
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(hx, hy)
  ctx.lineTo(hx + outward * h * 0.06, hy - h * 0.07)
  ctx.stroke()
  ctx.restore()
}

module.exports = { drawTornStrip, drawFrameStrip, drawLuggageTag, stripText, placeText, pickStripText }
