// 装饰文字层：版式定位置（文字槽），风格定内容和字体
// 类型：headline 大标题、kicker 加宽字距大写副标题、runningHeader 页眉 + 细线、index 照片编号
// （页码 pageNumber 见 renderPage.drawPageNumbers）
// 变量：{title} {location} {date} {year} {month} {word}，任一变量为空则整条隐藏
const C = require('../constants')
const { formatDate } = require('../bookInfo')
const { drawGlyphText, measureGlyphText } = require('./glyphText')
const { hashRandom, outerRect } = require('./frames')

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function colorOf(style, value) {
  return (value && style.colors[value]) || value || style.colors.text
}

// 跨页的装饰词：页对象带 word（整本书按顺序计算，相邻不重复）；不在相册中的示例跨页按 id 取
function wordOf(page, style) {
  if (page.word) return page.word
  const pool = style.wordPool || []
  return pool.length ? pool[Math.floor(hashRandom(`word:${page.spreadId || ''}`) * pool.length)] : ''
}

function variables(page, style) {
  const info = page.info || {}
  const start = info.dateStart || info.dateEnd || ''
  return {
    title: (info.title || '').trim(),
    location: (info.location || '').trim(),
    date: formatDate(info.dateStart, info.dateEnd),
    year: start ? start.slice(0, 4) : '',
    month: start ? MONTHS[parseInt(start.slice(5, 7), 10) - 1] || '' : '',
    word: wordOf(page, style)
  }
}

// 填充模板；用到的变量为空时返回 null（整条隐藏，不留空洞）
function fillTemplate(template, vars) {
  let empty = false
  const text = template.replace(/\{(\w+)\}/g, (m, key) => {
    const v = vars[key]
    if (!v) empty = true
    return v || ''
  })
  return empty || !text.trim() ? null : text
}

/**
 * 文字样式 → 画布用的规格。font：{ glyph, family, weight, size, letterSpacing, uppercase, color }，尺寸为基准 px
 */
function specOf(font, unit) {
  return {
    glyph: font.glyph,
    family: font.family || 'serif',
    weight: font.weight,
    size: (font.size || 24) * unit,
    letterSpacing: (font.letterSpacing || 0) * unit,
    uppercase: !!font.uppercase
  }
}

// 矩形是否与任何照片框重叠（画布 px）
function hitsFrames(rect, frames, W, H) {
  return frames.some(f => {
    const r = outerRect(f, W, H)
    return rect.x < r.x + r.w && rect.x + rect.w > r.x && rect.y < r.y + r.h && rect.y + rect.h > r.y
  })
}

/**
 * 版式文字槽：layoutPage.slots = [{ type, x, y（第一行基线）, w, align }]，坐标 0–1
 * 风格 decoText[type]：
 *   单行 { text, font, minScale, shadow }
 *   多行 { lines: [{ text, font, ifMissing: { var, text } }], lineGap（基准 px）, shadow }
 *     中西文混排的标题分行（如「Greetings from」+ 地点），某行变量为空则跳过；ifMissing 指定变量为空时改用的文字
 *   太宽时缩小字号（不小于 minScale，默认 0.5）；shadow：压在照片上时加柔和阴影
 * @returns 画出的文字区域（画布 px），供线稿避让
 */
function drawSlots(ctx, style, page, layoutPage, W, H, unit) {
  const defs = style.decoText || {}
  const drawn = []
  const vars = variables(page, style)
  ;(layoutPage.slots || []).forEach(slot => {
    const def = defs[slot.type]
    if (!def) return
    const lines = (def.lines || [{ text: def.text, font: def.font }]).map(line => {
      const template = line.ifMissing && !vars[line.ifMissing.var] ? line.ifMissing.text : line.text
      return { text: fillTemplate(template, vars), font: line.font || def.font || {} }
    }).filter(line => line.text)
    if (!lines.length) return
    const align = slot.align || 'left'
    const x = align === 'center' ? (slot.x + slot.w / 2) * W : align === 'right' ? (slot.x + slot.w) * W : slot.x * W
    const maxW = slot.w * W
    let y = slot.y * H
    ctx.save()
    if (def.shadow) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
      ctx.shadowBlur = 12 * unit
      ctx.shadowOffsetY = 2 * unit
    }
    lines.forEach((line, i) => {
      const spec = specOf(line.font, unit)
      const w = measureGlyphText(ctx, spec, line.text)
      if (w > maxW) spec.size *= Math.max(def.minScale || 0.5, maxW / w)
      if (i > 0) y += def.lineGap ? def.lineGap * unit : spec.size * 1.15
      const width = drawGlyphText(ctx, spec, line.text, x, y, align, colorOf(style, line.font.color))
      const left = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x
      drawn.push({ x: left, y: y - spec.size, w: width, h: spec.size * 1.3 })
    })
    ctx.restore()
  })
  return drawn
}

/**
 * 页眉：外侧上方一行文字 + 一条细线延伸到内侧
 * 风格 decoText.runningHeader = { text, font, line: { color, width }, y（基线，基准 px）, pageTypes }
 * 被照片盖住时不画
 */
function drawRunningHeader(ctx, style, page, frames, W, H, unit) {
  const def = (style.decoText || {}).runningHeader
  if (!def) return []
  if (def.pageTypes && def.pageTypes.indexOf(page.pageType) < 0) return []
  const text = fillTemplate(def.text, variables(page, style))
  if (!text) return []
  const spec = specOf(def.font || {}, unit)
  const pageW = page.side === 'full' ? W / 2 : W
  const y = (def.y || 58) * unit
  const outer = C.PAGE_MARGIN_OUTER * unit
  const inner = C.SAFE_MARGIN * unit
  const color = colorOf(style, def.font && def.font.color)
  // 跨页大图左右各一个；左页外侧在左，右页外侧在右
  const halves = page.side === 'full'
    ? [{ ox: 0, outerLeft: true }, { ox: pageW, outerLeft: false }]
    : [{ ox: 0, outerLeft: page.side !== 'right' }]
  const drawn = []
  halves.forEach(h => {
    const band = { x: h.ox, y: y - spec.size * 1.1, w: pageW, h: spec.size * 1.5 }
    if (hitsFrames(band, frames, W, H)) return
    const tx = h.outerLeft ? h.ox + outer : h.ox + pageW - outer
    const width = drawGlyphText(ctx, spec, text, tx, y, h.outerLeft ? 'left' : 'right', color)
    if (def.line) {
      const gap = 18 * unit
      const midY = y - spec.size * 0.32
      const from = h.outerLeft ? tx + width + gap : h.ox + inner
      const to = h.outerLeft ? h.ox + pageW - inner : tx - width - gap
      if (to - from > 20 * unit) {
        ctx.save()
        ctx.strokeStyle = colorOf(style, def.line.color)
        ctx.lineWidth = Math.max(1, (def.line.width || 1) * unit)
        ctx.beginPath()
        ctx.moveTo(from, midY)
        ctx.lineTo(to, midY)
        ctx.stroke()
        ctx.restore()
      }
    }
    drawn.push(band)
  })
  return drawn
}

/**
 * 照片编号（整本书连续，01、02…）：照片框左下方外侧
 * 风格 decoText.index = { font, gap（基准 px） }；放不下（超出页面下边距或压到其他照片）时不画
 */
function drawPhotoIndex(ctx, style, page, frames, W, H, unit) {
  const def = (style.decoText || {}).index
  const numbers = page.frameNumbers || {}
  if (!def) return
  const spec = specOf(def.font || {}, unit)
  const gap = (def.gap || 14) * unit
  const color = colorOf(style, def.font && def.font.color)
  frames.forEach(f => {
    const n = numbers[f.id]
    if (!n || f.bleed) return
    const r = outerRect(f, W, H)
    const text = n < 10 ? `0${n}` : String(n)
    const y = r.y + r.h + gap + spec.size * 0.8
    const width = measureGlyphText(ctx, spec, text)
    const box = { x: r.x, y: y - spec.size, w: width, h: spec.size * 1.2 }
    if (y > H - C.SAFE_MARGIN * unit) return
    if (hitsFrames(box, frames.filter(o => o !== f), W, H)) return
    drawGlyphText(ctx, spec, text, r.x, y, 'left', color)
  })
}

module.exports = { variables, fillTemplate, specOf, drawSlots, drawRunningHeader, drawPhotoIndex, MONTHS }
