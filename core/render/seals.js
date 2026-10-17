// 印章：中式红色方印（地名竖排、从右到左）、护照入境章（方形 / 椭圆 / 圆形，可多个叠压）
// 都用「正片叠底」盖在页面上；做旧斑驳用页面底色的小斑点（不用 destination-out，否则会挖穿页面背景）
const { hashRandom, shapePath } = require('./frames')
const { drawGlyphText, measureGlyphText } = require('./glyphText')
const { drawArcText } = require('./postcard')
const { drawDoodle } = require('./doodles')
const { MONTHS } = require('./decoText')
const { parseColor } = require('./color')

// 墨色的叠加方式：浅色页面用「正片叠底」（印泥渗进纸里）；深色页面（反色跨页）正片叠底会看不见，改为普通叠加
function inkMode(bg) {
  const c = parseColor(bg)
  if (!c) return 'multiply'
  return (c.r * 0.299 + c.g * 0.587 + c.b * 0.114) / 255 < 0.4 ? 'source-over' : 'multiply'
}

const HAN = /[㐀-鿿]/

/**
 * 方印上的字：只取地名里的汉字；含英文字母或没有汉字时返回 null（不画方印）
 * 地名分几段（如「新西兰 · 皇后镇」）时取最后一段（最具体的地方）
 */
function sealChars(location) {
  const loc = (location || '').trim()
  if (!loc || /[A-Za-z]/.test(loc)) return null
  const segments = loc.split(/[\s·・,，、\/|-]+/).map(s => Array.from(s).filter(ch => HAN.test(ch))).filter(s => s.length)
  if (!segments.length) return null
  let chars = segments[segments.length - 1]
  if (chars.length < 2 && segments.length > 1) chars = segments[segments.length - 2].concat(chars)
  // 太长时去掉行政区划后缀，仍太长就截断
  if (chars.length > 4 && '市省县区州镇'.indexOf(chars[chars.length - 1]) >= 0) chars = chars.slice(0, -1)
  return chars.slice(0, 6)
}

// 方印排法：返回列（从右到左），每列是从上到下的字
function sealColumns(chars) {
  const n = chars.length
  if (n === 1) return [chars]
  if (n === 2) return [chars]
  const cols = []
  for (let i = 0; i < n; i += 2) cols.push(chars.slice(i, i + 2))
  return cols
}

// 方印外形尺寸（宽 / 高，相对 size）
function sealBox(chars) {
  const cols = sealColumns(chars)
  if (chars.length === 2) return { w: 0.56, h: 1 }
  return { w: cols.length === 3 ? 1.36 : 1, h: 1 }
}

// 方印在页面上占的半径（画布 px），供装饰位避让：按外形的长边算（含轻微旋转）
function sealRadius(size, info) {
  const chars = sealChars(info && info.location) || ['']
  const box = sealBox(chars)
  return size * Math.max(box.w, box.h) * 0.56
}

// 带抖动的矩形路径（做旧的印边：不完全方正）
function roughRect(ctx, x, y, w, h, r, jitter) {
  const pts = []
  const seg = 10
  const edge = (x0, y0, x1, y1) => {
    for (let i = 0; i < seg; i++) {
      const t = i / seg
      pts.push([x0 + (x1 - x0) * t + (r() * 2 - 1) * jitter, y0 + (y1 - y0) * t + (r() * 2 - 1) * jitter])
    }
  }
  edge(x, y, x + w, y)
  edge(x + w, y, x + w, y + h)
  edge(x + w, y + h, x, y + h)
  edge(x, y + h, x, y)
  ctx.beginPath()
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])))
  ctx.closePath()
}

// 稳定随机序列
function seq(key) {
  let i = 0
  return () => hashRandom(`${key}:${i++}`)
}

// 斑驳：在区域内洒页面底色的小斑点和几道细划痕
function mottle(ctx, x, y, w, h, size, bg, r, amount) {
  ctx.save()
  ctx.globalCompositeOperation = 'source-over'
  ctx.globalAlpha = 0.85
  ctx.fillStyle = bg
  const n = Math.round((45 + r() * 35) * amount)
  ctx.beginPath()
  for (let i = 0; i < n; i++) {
    const px = x + r() * w
    const py = y + r() * h
    const pr = size * (0.006 + r() * r() * 0.03)
    ctx.moveTo(px + pr, py)
    ctx.arc(px, py, pr, 0, Math.PI * 2)
  }
  ctx.fill()
  ctx.strokeStyle = bg
  ctx.lineWidth = Math.max(1, size * 0.008)
  for (let i = 0; i < 2 + Math.round(r() * amount); i++) {
    const sx = x + r() * w
    const sy = y + r() * h
    ctx.beginPath()
    ctx.moveTo(sx, sy)
    ctx.lineTo(sx + (r() - 0.3) * w * 0.5, sy + (r() - 0.5) * h * 0.2)
    ctx.stroke()
  }
  ctx.restore()
}

/**
 * 中式红色方印
 * cfg: { color（印泥色）, font（系统字体族，默认 serif）}
 * @param cx, cy 中心（画布 px）；size 印面高（画布 px）
 * @param bg     页面底色（白文的字和斑点用）
 */
function drawSeal(ctx, style, cfg, cx, cy, size, info, seed, bg) {
  const chars = sealChars(info && info.location)
  if (!chars) return false
  const r = seq(`${seed}:seal`)
  const ink = (cfg.color && style.colors[cfg.color]) || cfg.color || '#B83A2E'
  const box = sealBox(chars)
  const w = size * box.w
  const h = size * box.h
  // 白文（红底白字）或朱文（红框红字）
  const carved = r() < 0.5
  const cols = sealColumns(chars)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate((r() * 2 - 1) * 4 * Math.PI / 180)
  ctx.globalAlpha = 0.86 + r() * 0.08
  const mode = inkMode(bg)
  ctx.globalCompositeOperation = mode
  const x = -w / 2
  const y = -h / 2
  const border = size * (carved ? 0.07 : 0.075)
  ctx.fillStyle = ink
  ctx.strokeStyle = ink
  if (carved) {
    roughRect(ctx, x, y, w, h, r, size * 0.012)
    ctx.fill()
  } else {
    ctx.lineWidth = border
    roughRect(ctx, x + border / 2, y + border / 2, w - border, h - border, r, size * 0.01)
    ctx.stroke()
  }
  // 字：从右到左逐列，每列从上到下；一列只有一个字时纵向拉长占满
  const pad = border * (carved ? 1.1 : 1.6)
  const innerW = w - pad * 2
  const innerH = h - pad * 2
  const colW = innerW / cols.length
  ctx.globalCompositeOperation = carved ? 'source-over' : mode
  ctx.fillStyle = carved ? bg : ink
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const fontSize = Math.min(colW, innerH / 2) * 0.92
  ctx.font = `bold ${fontSize}px ${cfg.font || 'serif'}`
  cols.forEach((col, ci) => {
    const colX = x + w - pad - colW * (ci + 0.5)
    const cellH = innerH / col.length
    col.forEach((ch, k) => {
      const tw = ctx.measureText(ch).width || fontSize
      ctx.save()
      ctx.translate(colX, y + pad + cellH * (k + 0.5))
      ctx.scale(colW * 0.94 / tw, cellH * 0.94 / fontSize)
      ctx.fillText(ch, 0, fontSize * 0.04)
      ctx.restore()
    })
  })
  mottle(ctx, x, y, w, h, size, bg, r, 1)
  ctx.restore()
  return true
}

// 护照章上的日期：12 OCT 2026
function stampDate(info) {
  const d = info && (info.dateStart || info.dateEnd)
  if (!d) return ''
  const p = d.split('-')
  const month = MONTHS[parseInt(p[1], 10) - 1] || ''
  return `${p[2]} ${month.slice(0, 3).toUpperCase()} ${p[0]}`
}

/**
 * 护照入境章：一组 1–3 个叠压，各自旋转、半透明，颜色轮换
 * cfg: { colors（墨色）, font（字形字体样式）, word（中间一行，默认 ARRIVED）}
 * @param count  一组几个（装饰计划给出）
 * @param size   单个章的基准尺寸（画布 px）
 */
function drawPassportStamps(ctx, style, cfg, cx, cy, size, count, info, seed, bg) {
  const r = seq(`${seed}:passport`)
  const colors = (cfg.colors || ['#3B5B8C', '#A8473E', '#4F7A5A', '#6B4E8A']).map(c => style.colors[c] || c)
  const start = Math.floor(r() * colors.length)
  for (let i = 0; i < count; i++) {
    const s = size * (0.82 + r() * 0.22)
    // 后面的章错开约一半叠压在前一个上
    const dir = r() * Math.PI * 2
    const dist = i ? size * (0.42 + r() * 0.18) : 0
    const ox = Math.cos(dir) * dist
    const oy = Math.sin(dir) * dist * 0.75
    const shape = ['rect', 'ellipse', 'circle'][Math.floor(r() * 3)]
    ctx.save()
    ctx.translate(cx + ox, cy + oy)
    ctx.rotate((r() * 2 - 1) * 18 * Math.PI / 180)
    ctx.globalAlpha = 0.58 + r() * 0.22
    ctx.globalCompositeOperation = inkMode(bg)
    drawOneStamp(ctx, cfg, shape, s, colors[(start + i) % colors.length], info, r, i)
    ctx.globalAlpha = 1
    mottle(ctx, -s * 0.55, -s * 0.5, s * 1.1, s, s, bg, r, 0.7)
    ctx.restore()
  }
}

// 一组护照章在页面上占的半径（画布 px）
function passportRadius(size, count) {
  return size * (count > 1 ? 0.95 : 0.62)
}

function drawOneStamp(ctx, cfg, shape, s, color, info, r, index) {
  const loc = ((info && info.location) || '').trim()
  const date = stampDate(info)
  // 偶尔写 ENTRY 而不是 ARRIVED
  const word = cfg.word || (index > 0 && r() < 0.35 ? 'ENTRY' : 'ARRIVED')
  const font = cfg.font || { glyph: 'oswald', family: 'sans-serif' }
  const spec = size => ({ glyph: font.glyph, family: font.family || 'sans-serif', weight: 'bold', size, letterSpacing: size * 0.12, uppercase: true })
  ctx.strokeStyle = color
  ctx.fillStyle = color
  // 文字太宽时缩小
  const fit = (text, size, maxW) => {
    const sp = spec(size)
    const w = measureGlyphText(ctx, sp, text)
    if (w > maxW) {
      sp.size *= maxW / w
      sp.letterSpacing *= maxW / w
    }
    return sp
  }
  if (shape === 'circle') {
    const R = s / 2
    ctx.lineWidth = Math.max(1, s * 0.025)
    ctx.beginPath()
    ctx.arc(0, 0, R, 0, Math.PI * 2)
    ctx.stroke()
    ctx.lineWidth = Math.max(1, s * 0.012)
    ctx.beginPath()
    ctx.arc(0, 0, R * 0.7, 0, Math.PI * 2)
    ctx.stroke()
    const band = R * 0.3
    const arcSpec = Object.assign(spec(band * 0.5), { weight: 'normal', letterSpacing: band * 0.08 })
    if (loc) drawArcText(ctx, arcSpec, loc, 0, 0, R * 0.7 + band * 0.26, 'top', color)
    if (date) drawArcText(ctx, arcSpec, date, 0, 0, R - band * 0.26, 'bottom', color)
    drawGlyphText(ctx, fit(word, s * 0.13, R * 1.2), word, 0, s * 0.045, 'center', color)
    drawDoodle(ctx, 'star', 0, -s * 0.15, s * 0.1, { color, lineWidth: Math.max(1, s * 0.01) })
    return
  }
  const w = shape === 'ellipse' ? s * 1.12 : s
  const h = shape === 'ellipse' ? s * 0.72 : s * 0.7
  const inset = s * 0.045
  ctx.lineWidth = Math.max(1, s * 0.024)
  shapePath(ctx, shape === 'ellipse' ? 'ellipse' : 'rounded', -w / 2, -h / 2, w, h, s * 0.06)
  ctx.stroke()
  ctx.lineWidth = Math.max(1, s * 0.011)
  shapePath(ctx, shape === 'ellipse' ? 'ellipse' : 'rounded', -w / 2 + inset, -h / 2 + inset, w - inset * 2, h - inset * 2, s * 0.04)
  ctx.stroke()
  // 三行：地名 / ARRIVED（中间两道横线） / 日期；空的行省略
  const maxW = w * (shape === 'ellipse' ? 0.62 : 0.78)
  const lines = []
  if (loc) lines.push({ text: loc, size: s * 0.1 })
  lines.push({ text: word, size: s * 0.15, rule: true })
  if (date) lines.push({ text: date, size: s * 0.085 })
  const gap = s * 0.05
  const total = lines.reduce((sum, l) => sum + l.size, 0) + gap * (lines.length - 1)
  let y = -total / 2
  lines.forEach(l => {
    const sp = fit(l.text, l.size, maxW)
    y += l.size
    drawGlyphText(ctx, sp, l.text, 0, y - l.size * 0.12, 'center', color)
    if (l.rule) {
      ctx.lineWidth = Math.max(1, s * 0.01)
      ctx.beginPath()
      ctx.moveTo(-maxW / 2, y - l.size * 1.12)
      ctx.lineTo(maxW / 2, y - l.size * 1.12)
      ctx.moveTo(-maxW / 2, y + gap * 0.45)
      ctx.lineTo(maxW / 2, y + gap * 0.45)
      ctx.stroke()
    }
    y += gap
  })
}

module.exports = { sealChars, drawSeal, sealRadius, drawPassportStamps, passportRadius }
