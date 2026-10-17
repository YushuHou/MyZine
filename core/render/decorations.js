// 风格的视觉元素：背景、颗粒、页面装饰、照片框装饰（胶带、日期戳）
// 全部由风格数据驱动，新增风格只需写数据，不改这里
const { hashRandom } = require('./frames')
const { textureSize } = require('./textures')
const { drawStamp, drawPostmark, drawAirmailBorder } = require('./postcard')
const { drawOutline, drawHalftone } = require('./paperCraft')
const { drawPlateRim, drawCornerDoodle, drawCheckerBorder, drawFenceBorder, drawRoute } = require('./themeDeco')
const { fillPattern, drawPatternBand, drawPatternBlock } = require('./patterns')

// 风格颜色：可写 colors 中的键名，也可直接写颜色值
function colorOf(style, value, fallback) {
  return (value && style.colors[value]) || value || fallback
}

// 平铺一张图到 W×H，每块边长 tile（画布 px）
function drawTiled(ctx, image, W, H, tile) {
  const th = tile * image.height / image.width
  for (let y = 0; y < H; y += th) {
    for (let x = 0; x < W; x += tile) ctx.drawImage(image, x, y, tile, th)
  }
}

/**
 * 背景：纯色、代码生成的纹理，或图片（平铺 tile / 铺满 cover）。纹理加载失败时退回纯色
 * background:
 *   { type: 'color', color }
 *   { type: 'texture', texture: 'paper', tile（基准 px）, color（底色） }
 *   { type: 'image', src, repeat: 'tile' | 'cover', tile, color }
 *   以上都可加 pattern: { name, color, alpha, cell }：在底色 / 纹理之上铺一层低对比度的几何纹样
 * @param colorOverride 页面底色（版式指定或风格 pagePalette 选出）；有纹理时纹理以「正片叠底」叠在底色上
 */
function drawBackground(ctx, style, W, H, unit, images, colorOverride) {
  const bg = style.background || {}
  const base = colorOf(style, colorOverride, null) || bg.color || style.colors.background
  ctx.fillStyle = base
  ctx.fillRect(0, 0, W, H)
  drawBackgroundImage(ctx, style, bg, W, H, unit, images, colorOverride)
  if (bg.pattern) fillPattern(ctx, style, bg.pattern, 0, 0, W, H, base, unit)
}

function drawBackgroundImage(ctx, style, bg, W, H, unit, images, colorOverride) {
  if (bg.type !== 'image' && bg.type !== 'texture') return
  const entry = images[bg.type === 'texture' ? `asset:texture:${bg.texture}` : `asset:${bg.src}`]
  if (!entry) return
  const img = entry.image
  ctx.save()
  if (colorOverride) ctx.globalCompositeOperation = 'multiply'
  if (bg.repeat === 'cover') {
    const k = Math.max(W / img.width, H / img.height)
    ctx.drawImage(img, (W - img.width * k) / 2, (H - img.height * k) / 2, img.width * k, img.height * k)
  } else {
    drawTiled(ctx, img, W, H, (bg.tile || (bg.type === 'texture' ? textureSize(bg.texture) : 540)) * unit)
  }
  ctx.restore()
}

/**
 * 页面底色（不只是整页单色）：版式 background 优先，其次风格 pagePalette（跨页间变化，左右页可不同）
 * @returns 颜色（colors 键名或颜色值），没有时返回 null
 */
function pageColorOf(style, page, layoutPage) {
  if (layoutPage.background) return layoutPage.background
  const palette = style.pagePalette
  if (!palette || !palette.length) return null
  return palette[Math.floor(hashRandom(`palette:${page.spreadId || ''}:${page.side}`) * palette.length)]
}

// 本页底色（实色）：纹样混色、印章斑点用
function pageBaseColor(style, page, layoutPage) {
  return colorOf(style, pageColorOf(style, page, layoutPage), null) || (style.background || {}).color || style.colors.background
}

// 版式色块：layoutPage.blocks = [{ x, y, w, h, color, pattern }]（0–1 坐标），画在背景之上、照片之下
// 风格 blockPattern（{ name, color, alpha, cell }）给所有版式色块叠一层纹样
function drawBlocks(ctx, style, layoutPage, W, H, unit) {
  ;(layoutPage.blocks || []).forEach(b => {
    const color = colorOf(style, b.color, '#FFFFFF')
    ctx.fillStyle = color
    ctx.fillRect(b.x * W, b.y * H, b.w * W, b.h * H)
    const pattern = b.pattern || style.blockPattern
    if (pattern) fillPattern(ctx, style, pattern, b.x * W, b.y * H, b.w * W, b.h * H, color, unit || 1)
  })
}

/**
 * 颗粒感：平铺代码生成的噪点图
 * grain: { opacity, tile（基准 px，默认 256） }
 */
function drawGrain(ctx, style, W, H, unit, images) {
  const grain = style.grain
  const entry = images['asset:texture:grain']
  if (!grain || !entry) return
  ctx.save()
  ctx.globalAlpha = grain.opacity == null ? 0.15 : grain.opacity
  drawTiled(ctx, entry.image, W, H, (grain.tile || textureSize('grain')) * unit)
  ctx.restore()
}

// 装饰是否画在这一页：pages 'all' | 'left' | 'right'；pageTypes 如 ['body']；
// chance：按跨页 id + 左右页稳定地「偶尔出现」（0–1）
function appliesTo(d, page, index) {
  if (d.pages && d.pages !== 'all' && d.pages !== page.side) return false
  if (d.pageTypes && d.pageTypes.indexOf(page.pageType) < 0) return false
  if (d.chance != null && hashRandom(`deco:${page.spreadId || ''}:${page.side}:${index}`) >= d.chance) return false
  return true
}

// mirror: true 的矩形类装饰在右页左右镜像（如「外侧下角」的色块）
function mirroredX(d, page) {
  return d.mirror && page.side === 'right' ? 1 - d.x - (d.w || 0) : d.x
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/**
 * 页面装饰（画在照片下面）。坐标为 0–1 比例（相对画布宽高），尺寸为基准 px
 * - rect / line：{ x, y, w, h, color, lineWidth }
 * - image：{ src, x, y, w, h }
 * - text：{ text, x, y, size, family, weight, color, align, letterSpacing, mirror（右页左右镜像） }
 * - perforation 胶片齿孔：{ edge: 'top' | 'bottom' | 'both', holeW, holeH, gap, offset（离页边）, radius, color }
 * - gutterLine 中缝细线：{ color, width（基准 px） }，画在靠中缝的页边（跨页大图画在中线）
 * - airmailBorder 航空信封红蓝斜条页边：{ colors, width, stripe }
 * - halftone 半调网点色块：{ x, y, w, h, color, dot, gap, fade }
 * - checkerBorder 格纹桌布页边、fenceBorder 木栅栏页边、route 虚线路线（见 themeDeco.js）
 * - patternBand 纹样页边条、patternBlock 纹样色块（见 patterns.js）；rect 也可加 pattern 叠纹样
 * 通用：chance（偶尔出现）、mirror（右页镜像）、pages、pageTypes
 * @param bg 本页底色（纹样混色用）
 */
function drawDecorations(ctx, style, page, W, H, unit, images, bg) {
  ;(style.decorations || []).forEach((d, index) => {
    if (!appliesTo(d, page, index)) return
    drawDecoration(ctx, style, d, page, W, H, unit, images, bg)
  })
}

// 画一个页面装饰（装饰计划里的大装饰也用它）
function drawDecoration(ctx, style, d, page, W, H, unit, images, bg) {
  ctx.save()
  if (d.type === 'rect') {
    const color = colorOf(style, d.color, '#000')
    ctx.fillStyle = color
    ctx.fillRect(mirroredX(d, page) * W, d.y * H, d.w * W, d.h * H)
    if (d.pattern) fillPattern(ctx, style, d.pattern, mirroredX(d, page) * W, d.y * H, d.w * W, d.h * H, color, unit)
  } else if (d.type === 'patternBand') {
    drawPatternBand(ctx, style, d, page, W, H, unit, bg || style.colors.background)
  } else if (d.type === 'patternBlock') {
    drawPatternBlock(ctx, style, d, page, W, H, unit, bg || style.colors.background)
  } else if (d.type === 'airmailBorder') {
    drawAirmailBorder(ctx, style, d, page, W, H, unit)
  } else if (d.type === 'halftone') {
    drawHalftone(ctx, style, d, mirroredX(d, page) * W, d.y * H, d.w * W, d.h * H, unit)
  } else if (d.type === 'checkerBorder') {
    drawCheckerBorder(ctx, style, d, page, W, H, unit)
  } else if (d.type === 'fenceBorder') {
    drawFenceBorder(ctx, style, d, page, W, H, unit)
  } else if (d.type === 'route') {
    drawRoute(ctx, style, d, page, W, H, unit)
  } else if (d.type === 'line') {
    ctx.strokeStyle = colorOf(style, d.color, '#000')
    ctx.lineWidth = (d.lineWidth || 2) * unit
    ctx.beginPath()
    ctx.moveTo(d.x * W, d.y * H)
    ctx.lineTo((d.x + d.w) * W, (d.y + d.h) * H)
    ctx.stroke()
  } else if (d.type === 'image') {
    const entry = images[`asset:${d.src}`]
    if (entry) ctx.drawImage(entry.image, d.x * W, d.y * H, d.w * W, d.h * H)
  } else if (d.type === 'text') {
    drawDecorationText(ctx, style, d, page, W, H, unit)
  } else if (d.type === 'perforation') {
    drawPerforation(ctx, style, d, W, H, unit)
  } else if (d.type === 'gutterLine') {
    const x = page.side === 'left' ? W : page.side === 'right' ? 0 : page.side === 'full' ? W / 2 : -1
    if (x >= 0) {
      ctx.strokeStyle = colorOf(style, d.color, style.colors.accent)
      ctx.lineWidth = Math.max(1, (d.width || 2) * unit)
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, H)
      ctx.stroke()
    }
  }
  ctx.restore()
}

function drawDecorationText(ctx, style, d, page, W, H, unit) {
  let x = d.x
  let align = d.align || 'left'
  if (d.mirror && page.side === 'right') {
    x = 1 - x
    align = align === 'left' ? 'right' : align === 'right' ? 'left' : align
  }
  const size = (d.size || 20) * unit
  const spacing = (d.letterSpacing || 0) * unit
  ctx.font = `${d.weight || 'normal'} ${size}px ${d.family || 'sans-serif'}`
  ctx.fillStyle = colorOf(style, d.color, style.colors.text)
  ctx.textBaseline = 'middle'
  // 带字间距时逐字绘制
  const chars = Array.from(d.text)
  const width = chars.reduce((sum, ch) => sum + ctx.measureText(ch).width + spacing, 0) - spacing
  let cx = align === 'center' ? x * W - width / 2 : align === 'right' ? x * W - width : x * W
  ctx.textAlign = 'left'
  chars.forEach(ch => {
    ctx.fillText(ch, cx, d.y * H)
    cx += ctx.measureText(ch).width + spacing
  })
}

function drawPerforation(ctx, style, d, W, H, unit) {
  const hw = (d.holeW || 26) * unit
  const hh = (d.holeH || 36) * unit
  const gap = (d.gap || 30) * unit
  const step = hw + gap
  const count = Math.floor((W + gap) / step)
  const start = (W - (count * step - gap)) / 2
  const offset = (d.offset || 18) * unit
  const edges = d.edge === 'both' ? ['top', 'bottom'] : [d.edge || 'top']
  ctx.fillStyle = colorOf(style, d.color, '#444')
  edges.forEach(edge => {
    const y = edge === 'top' ? offset : H - offset - hh
    for (let i = 0; i < count; i++) {
      roundRect(ctx, start + i * step, y, hw, hh, (d.radius || 4) * unit)
      ctx.fill()
    }
  })
}

/**
 * 照片框装饰（画在照片上面，坐标系已按照片框旋转）
 * - tape 和纸胶带：{ colors, width, height, angleJitter, placement: 'top' | 'corners' }
 * - stamp 邮票框 / postmark 邮戳圆环（明信片）：largestOnly 时只画在本页最大的照片框上；minWidth 小于它的框不画
 * - outline 霓虹描边：{ color, width, offset, glow }
 * - plateRim 餐盘沿（圆形框）、cornerDoodle 照片角线稿（见 themeDeco.js）
 * 通用：layer: 'frame' 表示跟着这张照片一起画（会被后面叠上来的照片盖住）
 * - dateStamp 日期戳：画在照片区域内，见 drawDateStamp
 * @param frame  resolveFrames 之后的照片框
 * @param rect   照片框外形区域（画布 px）{ x, y, w, h }
 * @param seed   随机种子
 * @param ctxInfo { info: 书籍信息, isLargest: 是否为本页最大的照片框,
 *                  names: 装饰计划分好的线稿名 { stamp, corner }（null 表示本跨页没有可用的线稿，不画）}
 */
function drawFrameDecorations(ctx, style, frame, rect, unit, seed, ctxInfo = {}) {
  // 满版、不加边框的框（如四格条）不贴胶带等装饰
  if (!frame.framed) return
  let stampRect = null
  ;(style.frameDecorations || []).forEach(d => {
    // layer: 'frame' 的装饰在画这张照片时就画（renderPage 传 layer），其余在所有照片之后画
    if ((d.layer === 'frame') !== (ctxInfo.layer === 'frame')) return
    if (d.largestOnly && !ctxInfo.isLargest) return
    if (d.minWidth && rect.w < d.minWidth * unit) return
    // 邮票、邮戳只贴在矩形照片上（圆形、拱形的外接方框角上是空的）
    if ((d.type === 'stamp' || d.type === 'postmark') && frame.shape !== 'rect' && frame.shape !== 'rounded') return
    const names = ctxInfo.names || {}
    if (d.type === 'tape') drawTapes(ctx, d, rect, unit, seed)
    else if (d.type === 'stamp') stampRect = drawStamp(ctx, style, names.stamp ? Object.assign({}, d, { doodles: [names.stamp] }) : d, rect, unit, seed)
    else if (d.type === 'postmark') {
      // 没有邮票时，邮戳压在照片右上角（position: 'top-left' 时在左上角，如票根的副券在右侧）
      const R = (d.r || 74) * unit
      const ax = d.position === 'top-left' ? rect.x + R * 0.9 : rect.x + rect.w - R * 1.1
      const anchor = stampRect || { x: ax, y: rect.y - R * 0.25, w: 0, h: R }
      drawPostmark(ctx, style, d, anchor, ctxInfo.info, unit, seed)
    } else if (d.type === 'outline') drawOutline(ctx, style, d, rect, unit)
    else if (d.type === 'plateRim') drawPlateRim(ctx, style, d, frame, rect, unit)
    else if (d.type === 'cornerDoodle' && names.corner !== null) {
      drawCornerDoodle(ctx, style, names.corner ? Object.assign({}, d, { names: [names.corner] }) : d, rect, unit, seed)
    }
  })
}

function drawTapes(ctx, d, rect, unit, seed) {
  const r = k => hashRandom(`${seed}:tape:${k}`)
  const colors = d.colors || ['rgba(230, 200, 160, 0.75)']
  const color = colors[Math.floor(r('c') * colors.length)]
  const w = (d.width || 160) * unit
  const h = (d.height || 44) * unit
  const jitter = d.angleJitter == null ? 8 : d.angleJitter
  // 胶带位置：顶边居中一条，或左上、右上两角各一条（斜贴）
  const spots = d.placement === 'corners'
    ? [{ x: rect.x + w * 0.25, y: rect.y + h * 0.3, angle: -40 }, { x: rect.x + rect.w - w * 0.25, y: rect.y + h * 0.3, angle: 40 }]
    : [{ x: rect.x + rect.w * (0.4 + r('x') * 0.2), y: rect.y, angle: 0 }]
  spots.forEach((s, i) => {
    ctx.save()
    ctx.translate(s.x, s.y)
    ctx.rotate((s.angle + (r(`a${i}`) * 2 - 1) * jitter) * Math.PI / 180)
    drawTapeShape(ctx, w, h, color, unit)
    ctx.restore()
  })
}

// 胶带：两端锯齿的半透明长条，带几道细纹
function drawTapeShape(ctx, w, h, color, unit) {
  const teeth = 6
  const tooth = h / teeth
  const depth = 5 * unit
  ctx.beginPath()
  ctx.moveTo(-w / 2, -h / 2)
  ctx.lineTo(w / 2, -h / 2)
  for (let i = 0; i < teeth; i++) {
    ctx.lineTo(w / 2 - (i % 2 ? 0 : depth), -h / 2 + tooth * (i + 0.5))
  }
  ctx.lineTo(w / 2, h / 2)
  ctx.lineTo(-w / 2, h / 2)
  for (let i = teeth - 1; i >= 0; i--) {
    ctx.lineTo(-w / 2 + (i % 2 ? 0 : depth), -h / 2 + tooth * (i + 0.5))
  }
  ctx.closePath()
  ctx.fillStyle = color
  ctx.fill()
  // 细纹
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.lineWidth = Math.max(1, 1.5 * unit)
  for (let x = -w / 2 + 14 * unit; x < w / 2 - 8 * unit; x += 14 * unit) {
    ctx.beginPath()
    ctx.moveTo(x, -h / 2)
    ctx.lineTo(x - 6 * unit, h / 2)
    ctx.stroke()
  }
}

/**
 * 日期戳（胶片相机风格）：照片右下角的发光数字，取旅行开始日期，格式 '26 10 01
 * dateStamp: { color, size, family, margin, minWidth（照片区域宽度小于它时不画，基准 px） }
 * @param rect 照片区域（画布 px），调用时已裁切在照片区域内
 */
function drawDateStamp(ctx, style, rect, info, unit) {
  const d = (style.frameDecorations || []).find(x => x.type === 'dateStamp')
  const date = info && info.dateStart
  if (!d || !date || rect.w < (d.minWidth || 0) * unit) return
  const parts = date.split('-')
  const text = `'${parts[0].slice(2)} ${parts[1]} ${parts[2]}`
  const size = (d.size || 28) * unit
  const margin = (d.margin || 24) * unit
  ctx.save()
  ctx.font = `bold ${size}px ${d.family || 'monospace'}`
  ctx.textAlign = 'right'
  ctx.textBaseline = 'bottom'
  ctx.fillStyle = colorOf(style, d.color, '#FF8A2A')
  ctx.shadowColor = colorOf(style, d.color, '#FF8A2A')
  ctx.shadowBlur = 8 * unit
  ctx.fillText(text, rect.x + rect.w - margin, rect.y + rect.h - margin)
  ctx.restore()
}

module.exports = { colorOf, drawBackground, pageColorOf, pageBaseColor, drawBlocks, drawGrain, drawDecorations, drawDecoration, drawFrameDecorations, drawDateStamp }
