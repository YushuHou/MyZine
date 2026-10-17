// 统一渲染函数：编辑、缩略图、预览、导出共用，保证所见即所得
const C = require('../constants')
const { computePlacement } = require('./photoGeometry')
const { isRotated90, applyExifTransform } = require('./exif')

/**
 * 把一页画到 canvas 上。所有尺寸按画布宽度等比换算，同一函数可输出 1080 宽和 2480 宽
 * @param ctx     canvas 2d 上下文
 * @param page    getPageList() 产出的页 { side, slots }
 * @param layout  版式
 * @param style   风格
 * @param size    画布尺寸 { width, height }：单页 3:4，跨页大图（side = full）3:2
 * @param images  imageLoader.loadPhotos() 的结果 { photoId: { image, exif, transform } }
 * @param options { guides: 是否画安全边距和中缝参考线（仅编辑时） }
 */
function renderPage(ctx, page, layout, style, size, images, options = {}) {
  const W = size.width
  const H = size.height
  // 基准 px → 画布 px 的换算系数（按单页宽度计算）
  const unit = (page.side === 'full' ? W / 2 : W) / C.PAGE_WIDTH
  const layoutPage = page.side === 'right' ? layout.pages[1] : layout.pages[0]

  ctx.save()
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, W, H)
  drawBackground(ctx, style, W, H)
  drawDecorations(ctx, style, page.side, W, H, unit)
  layoutPage.frames.forEach(frame => {
    drawFrame(ctx, frame, page.slots[frame.id], style, images, W, H, unit)
  })
  // 阶段2：在这里绘制 layoutPage.texts（书名、作者等）
  if (options.guides) drawGuides(ctx, page.side, W, H, unit)
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
