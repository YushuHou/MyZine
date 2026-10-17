// 统一渲染函数：编辑、缩略图、预览、导出共用，保证所见即所得
const C = require('../constants')
const { computePlacement } = require('./photoGeometry')
const { isRotated90, applyExifTransform } = require('./exif')
const { drawTextBlock } = require('./text')
const { getLayoutPage } = require('../registry')

// 编辑时选中照片框的高亮色（界面元素，不属于风格）
const SELECTION_COLOR = '#2F80ED'

/**
 * 把一页画到 canvas 上。所有尺寸按画布宽度等比换算，同一函数可输出 1080 宽和 2480 宽
 * @param ctx     canvas 2d 上下文
 * @param page    getPageList() 产出的页 { side, slots, info }
 * @param layout  版式
 * @param style   风格
 * @param size    画布尺寸 { width, height }：单页 3:4，跨页大图（side = full）3:2
 * @param images  imageLoader.loadPhotos() 的结果 { photoId: { image, exif, transform } }
 * @param options 只在编辑时使用：
 *   guides:          画安全边距和中缝参考线
 *   spineGuide:      跨页大图（side = full）始终画中缝线，不受 guides 开关影响
 *   selectedFrameId: 高亮的照片框
 */
function renderPage(ctx, page, layout, style, size, images, options = {}) {
  const W = size.width
  const H = size.height
  // 基准 px → 画布 px 的换算系数（按单页宽度计算）
  const unit = (page.side === 'full' ? W / 2 : W) / C.PAGE_WIDTH
  const layoutPage = getLayoutPage(layout, page.side)

  // 不重置画布变换：调用方可以先平移，把左右页画到同一张画布上（见 renderSpread）
  ctx.save()
  ctx.clearRect(0, 0, W, H)
  drawBackground(ctx, style, W, H)
  // 版式指定的整页底色（如环衬），取风格中的同名颜色
  if (layoutPage.fill) {
    ctx.fillStyle = style.colors[layoutPage.fill] || layoutPage.fill
    ctx.fillRect(0, 0, W, H)
  }
  drawDecorations(ctx, style, page.side, W, H, unit)
  layoutPage.frames.forEach(frame => {
    drawFrame(ctx, frame, page.slots[frame.id], style, images, W, H, unit)
  })
  ;(layoutPage.texts || []).forEach(block => {
    drawTextBlock(ctx, block, page.info, style, W, H, unit)
  })
  drawPageNumbers(ctx, page, layoutPage, style, W, H, unit)
  if (options.guides) drawGuides(ctx, page.side, W, H, unit)
  else if (options.spineGuide && page.side === 'full') drawSpineGuide(ctx, W, H, unit)
  if (options.selectedFrameId) {
    const frame = layoutPage.frames.find(f => f.id === options.selectedFrameId)
    if (frame) drawSelection(ctx, frame, W, H, unit)
  }
  ctx.restore()
}

function drawBackground(ctx, style, W, H) {
  const bg = style.background || {}
  // 目前只支持纯色；纹理图（type: 'image'）在加入风格分包素材时实现
  ctx.fillStyle = bg.color || style.colors.background
  ctx.fillRect(0, 0, W, H)
}

function drawDecorations(ctx, style, side, W, H, unit) {
  (style.decorations || []).forEach(d => {
    if (d.pages && d.pages !== 'all' && d.pages !== side) return
    const x = d.x * W
    const y = d.y * H
    const w = d.w * W
    const h = d.h * H
    if (d.type === 'rect') {
      ctx.fillStyle = d.color
      ctx.fillRect(x, y, w, h)
    } else if (d.type === 'line') {
      ctx.strokeStyle = d.color
      ctx.lineWidth = (d.lineWidth || 2) * unit
      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + w, y + h)
      ctx.stroke()
    }
    // type: 'image' 的装饰图在加入风格分包素材时实现
  })
}

function drawFrame(ctx, frame, slot, style, images, W, H, unit) {
  const pf = style.photoFrame || {}
  const x = frame.x * W
  const y = frame.y * H
  const w = frame.w * W
  const h = frame.h * H
  const radius = (pf.radius != null ? pf.radius : (frame.radius || 0)) * unit
  const entry = slot && images[slot.photoId]

  ctx.save()
  if (frame.rotate) {
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate(frame.rotate * Math.PI / 180)
    ctx.translate(-(x + w / 2), -(y + h / 2))
  }

  // 阴影：先画一块带阴影的底板
  if (pf.shadow) {
    ctx.save()
    ctx.shadowColor = pf.shadow.color
    ctx.shadowBlur = pf.shadow.blur * unit
    ctx.shadowOffsetX = (pf.shadow.offsetX || 0) * unit
    ctx.shadowOffsetY = (pf.shadow.offsetY || 0) * unit
    ctx.fillStyle = style.colors.fitFill
    roundRectPath(ctx, x, y, w, h, radius)
    ctx.fill()
    ctx.restore()
  }

  // 照片：裁切在框内
  ctx.save()
  roundRectPath(ctx, x, y, w, h, radius)
  ctx.clip()
  ctx.fillStyle = entry && slot.fit === 'fit' ? style.colors.fitFill : style.colors.placeholder
  ctx.fillRect(x, y, w, h)
  if (entry) drawPhoto(ctx, entry, slot, x, y, w, h)
  ctx.restore()

  // 边框：画在框内侧
  if (frame.border !== false && pf.borderWidth > 0) {
    const bw = pf.borderWidth * unit
    ctx.strokeStyle = pf.borderColor
    ctx.lineWidth = bw
    roundRectPath(ctx, x + bw / 2, y + bw / 2, w - bw, h - bw, Math.max(0, radius - bw / 2))
    ctx.stroke()
  }
  ctx.restore()
}

function drawPhoto(ctx, entry, slot, x, y, w, h) {
  const img = entry.image
  // 需要自己旋转 90° 时，图片的实际宽高与显示方向相反
  const swap = entry.transform && isRotated90(entry.exif)
  const iw = swap ? img.height : img.width
  const ih = swap ? img.width : img.height
  const p = computePlacement(iw, ih, w, h, slot)

  if (!entry.transform) {
    ctx.drawImage(img, x + p.dx, y + p.dy, p.dw, p.dh)
    return
  }
  // 平台未按 EXIF 自动旋转：以照片中心为原点做旋转/镜像
  ctx.save()
  ctx.translate(x + p.dx + p.dw / 2, y + p.dy + p.dh / 2)
  applyExifTransform(ctx, entry.exif)
  const rw = swap ? p.dh : p.dw
  const rh = swap ? p.dw : p.dh
  ctx.drawImage(img, -rw / 2, -rh / 2, rw, rh)
  ctx.restore()
}

/**
 * 页码：正文页外侧下角（左页在左下、右页在右下；跨页大图两个都画）
 * 由风格的 pageNumber 控制：{ show, size, color, bottom（页码中线离页面下边的距离）}，尺寸均为基准 px
 * 页码位置被照片盖住时（如满版照片）不画
 */
function drawPageNumbers(ctx, page, layoutPage, style, W, H, unit) {
  const cfg = style.pageNumber
  const numbers = page.pageNumbers || []
  if (!cfg || !cfg.show || !numbers.length) return
  const pageW = page.side === 'full' ? W / 2 : W
  const margin = C.PAGE_MARGIN_OUTER * unit
  const y = H - (cfg.bottom || 60) * unit
  const size = (cfg.size || 22) * unit
  // 每个页码：所在页的左边位置、对齐方式（外侧）
  const spots = page.side === 'full'
    ? [{ n: numbers[0], x: margin, align: 'left' }, { n: numbers[1], x: W - margin, align: 'right' }]
    : [{ n: numbers[0], x: page.side === 'left' ? margin : pageW - margin, align: page.side === 'left' ? 'left' : 'right' }]

  ctx.save()
  ctx.font = `${cfg.weight || 'normal'} ${size}px ${cfg.family || 'sans-serif'}`
  ctx.fillStyle = style.colors[cfg.color] || cfg.color || style.colors.textMuted || style.colors.text
  ctx.textBaseline = 'middle'
  spots.forEach(spot => {
    const text = String(spot.n)
    const tw = ctx.measureText(text).width
    const left = spot.align === 'left' ? spot.x : spot.x - tw
    // 被照片框盖住就跳过
    const covered = layoutPage.frames.some(f =>
      left < (f.x + f.w) * W && left + tw > f.x * W && y + size / 2 > f.y * H && y - size / 2 < (f.y + f.h) * H)
    if (covered) return
    ctx.textAlign = spot.align
    ctx.fillText(text, spot.x, y)
  })
  ctx.restore()
}

// 选中高亮：框外侧描边
function drawSelection(ctx, frame, W, H, unit) {
  const x = frame.x * W
  const y = frame.y * H
  const w = frame.w * W
  const h = frame.h * H
  const lw = Math.max(2, 6 * unit)
  ctx.save()
  if (frame.rotate) {
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate(frame.rotate * Math.PI / 180)
    ctx.translate(-(x + w / 2), -(y + h / 2))
  }
  ctx.strokeStyle = SELECTION_COLOR
  ctx.lineWidth = lw
  ctx.strokeRect(x - lw / 2, y - lw / 2, w + lw, h + lw)
  ctx.restore()
}

// 编辑参考线：蓝色虚线为安全边距，红色区域为中缝（书脊）
function drawGuides(ctx, side, W, H, unit) {
  const m = C.SAFE_MARGIN * unit
  const g = C.GUTTER * unit
  const pw = side === 'full' ? W / 2 : W

  ctx.save()
  ctx.lineWidth = Math.max(1, 2 * unit)
  ctx.strokeStyle = 'rgba(0, 140, 255, 0.85)'
  if (ctx.setLineDash) ctx.setLineDash([12 * unit, 8 * unit])
  const pageLefts = side === 'full' ? [0, pw] : [0]
  pageLefts.forEach(left => ctx.strokeRect(left + m, m, pw - 2 * m, H - 2 * m))

  ctx.fillStyle = 'rgba(255, 70, 70, 0.18)'
  if (side === 'left') ctx.fillRect(W - g, 0, g, H)
  else if (side === 'right') ctx.fillRect(0, 0, g, H)
  else if (side === 'full') ctx.fillRect(pw - g, 0, 2 * g, H)
  ctx.restore()
  if (side === 'full') drawSpineGuide(ctx, W, H, unit)
}

// 跨页大图的中缝线：中线虚线 + 两侧书脊区域
function drawSpineGuide(ctx, W, H, unit) {
  const g = C.GUTTER * unit
  ctx.save()
  ctx.fillStyle = 'rgba(255, 70, 70, 0.12)'
  ctx.fillRect(W / 2 - g, 0, 2 * g, H)
  ctx.strokeStyle = 'rgba(255, 70, 70, 0.9)'
  ctx.lineWidth = Math.max(1, 2 * unit)
  if (ctx.setLineDash) ctx.setLineDash([16 * unit, 10 * unit])
  ctx.beginPath()
  ctx.moveTo(W / 2, 0)
  ctx.lineTo(W / 2, H)
  ctx.stroke()
  ctx.restore()
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  if (rr <= 0) {
    ctx.rect(x, y, w, h)
    return
  }
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

module.exports = { renderPage }
