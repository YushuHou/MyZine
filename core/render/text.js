// 文字排版：换行、缩小字号、截断，以及文字块的堆叠绘制
const { getFieldText } = require('../bookInfo')

const ELLIPSIS = '…'
// 不能出现在行首的标点，放不下时留在上一行末尾（允许略超出行宽）
const NO_LINE_START = '，。、！？；：）》」』”’,.!?;:)…'
// 缩小字号时每次缩小的比例
const SCALE_STEP = 0.05

function fontString(font, size) {
  return `${font.weight || 'normal'} ${size}px ${font.family || 'sans-serif'}`
}

// 带字间距的文字宽度
function measure(ctx, str, spacing) {
  return ctx.measureText(str).width + spacing * str.length
}

// 拆成可断行的单元：连续的英文/数字作为一个词，空白单独一段，其余（中文、标点）逐字
function tokenize(text) {
  return text.match(/[A-Za-z0-9'’@#&_\-.]+|\s+|[\s\S]/g) || []
}

// 按最大宽度换行，支持文字中的手动换行
function wrapLines(ctx, text, maxWidth, spacing) {
  const lines = []
  text.split('\n').forEach(paragraph => {
    let line = ''
    tokenize(paragraph).forEach(token => {
      if (!line && /^\s+$/.test(token)) return
      if (measure(ctx, line + token, spacing) <= maxWidth || (line && NO_LINE_START.indexOf(token) >= 0)) {
        line += token
        return
      }
      if (line) lines.push(line.replace(/\s+$/, ''))
      line = ''
      // 单个词比整行还宽：逐字拆开
      const chars = measure(ctx, token, spacing) > maxWidth ? Array.from(token) : [token]
      chars.forEach(ch => {
        if (line && measure(ctx, line + ch, spacing) > maxWidth) {
          lines.push(line)
          line = ''
        }
        if (line || !/^\s+$/.test(ch)) line += ch
      })
    })
    lines.push(line.replace(/\s+$/, ''))
  })
  return lines
}

// 截断到最大行数，最后一行加省略号
function truncate(ctx, lines, maxLines, maxWidth, spacing) {
  if (lines.length <= maxLines) return lines
  const kept = lines.slice(0, maxLines)
  let last = kept[maxLines - 1]
  while (last && measure(ctx, last + ELLIPSIS, spacing) > maxWidth) {
    last = Array.from(last).slice(0, -1).join('')
  }
  kept[maxLines - 1] = last + ELLIPSIS
  return kept
}

/**
 * 排版单个条目：放不下时先按 SCALE_STEP 缩小字号（不小于 minScale），仍放不下再截断
 * @returns { lines, size, lineHeight, height, font, spacing }
 */
function layoutItem(ctx, text, font, unit, maxWidth, item) {
  const maxLines = item.maxLines || 1
  const minScale = item.minScale || 1
  const spacing = (font.letterSpacing || 0) * unit
  let scale = 1
  let size
  let lines
  for (;;) {
    size = font.size * unit * scale
    ctx.font = fontString(font, size)
    lines = wrapLines(ctx, text, maxWidth, spacing)
    if (lines.length <= maxLines || scale - SCALE_STEP < minScale - 1e-6) break
    scale -= SCALE_STEP
  }
  lines = truncate(ctx, lines, maxLines, maxWidth, spacing)
  const lineHeight = size * (font.lineHeight || 1.4)
  return { lines, size, lineHeight, height: lines.length * lineHeight, font, spacing }
}

// 绘制一行；有字间距时逐字绘制
function drawLine(ctx, str, x, y, align, spacing) {
  if (!spacing) {
    ctx.textAlign = align
    ctx.fillText(str, x, y)
    return
  }
  const width = measure(ctx, str, spacing) - spacing
  let cx = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x
  ctx.textAlign = 'left'
  Array.from(str).forEach(ch => {
    ctx.fillText(ch, cx, y)
    cx += ctx.measureText(ch).width + spacing
  })
}

/**
 * 绘制一个文字块：条目从上往下堆叠，空字段跳过，间距一起收掉
 * 坐标与照片框相同：0–1 比例，相对画布宽高（W、H）
 */
function drawTextBlock(ctx, block, info, style, W, H, unit) {
  const x = block.x * W
  const w = block.w * W
  const align = block.align || 'left'

  const rows = []
  block.items.forEach(item => {
    const value = item.text != null ? item.text : getFieldText(info, item.field)
    if (!value) return
    const font = style.fonts[item.role] || style.fonts.body
    const row = layoutItem(ctx, (item.prefix || '') + value, font, unit, w, item)
    // 第一个显示的条目前面不留间距
    row.gapBefore = rows.length ? (item.gapBefore != null ? item.gapBefore : (block.gap || 0)) * unit : 0
    rows.push(row)
  })
  if (!rows.length) return

  const total = rows.reduce((sum, r) => sum + r.gapBefore + r.height, 0)
  const anchorY = block.y * H
  let top = block.anchor === 'bottom' ? anchorY - total : block.anchor === 'center' ? anchorY - total / 2 : anchorY
  const lineX = align === 'center' ? x + w / 2 : align === 'right' ? x + w : x

  ctx.save()
  ctx.textBaseline = 'middle'
  rows.forEach(row => {
    top += row.gapBefore
    ctx.font = fontString(row.font, row.size)
    ctx.fillStyle = style.colors[row.font.color] || row.font.color || style.colors.text
    row.lines.forEach((line, i) => {
      drawLine(ctx, line, lineX, top + row.lineHeight * (i + 0.5), align, row.spacing)
    })
    top += row.height
  })
  ctx.restore()
}

module.exports = { drawTextBlock, wrapLines }
