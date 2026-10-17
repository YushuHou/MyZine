// 把一个跨页画成一张 3:2 的图：缩略图、双页预览、阶段 4 的跨页图片导出共用
const { getLayout } = require('../registry')
const { getSpreadStyle, getSpreadPages } = require('../album')
const { renderPage } = require('./renderPage')

/**
 * @param ctx     canvas 2d 上下文
 * @param album   相册
 * @param spread  跨页
 * @param size    画布尺寸 { width, height }，3:2
 * @param images  imageLoader.loadPhotos() 的结果
 * @param options {
 *   blankColor: 空半边的颜色（封面左侧、封底右侧）；导出 JPG 时必须给，否则透明处会变黑
 *   spine:      是否在中缝画一道浅阴影，模拟书页翻开的效果（预览用，导出不画）
 * }
 */
function renderSpread(ctx, album, spread, size, images, options = {}) {
  const W = size.width
  const H = size.height
  const pageW = W / 2
  const layout = getLayout(spread.layoutId)
  const style = getSpreadStyle(album, spread)
  // 真实的页对象（带页码）；按 side 取用
  const pages = {}
  getSpreadPages(album, spread.id).forEach(p => { pages[p.side] = p })
  // 不在相册中的跨页（如模板页的示例）没有页码
  const pageOf = side => pages[side] || {
    spreadId: spread.id,
    pageType: spread.pageType,
    side,
    slots: spread.slots,
    info: album.info,
    pageNumbers: []
  }

  ctx.save()
  ctx.clearRect(0, 0, W, H)
  if (options.blankColor) {
    ctx.fillStyle = options.blankColor
    ctx.fillRect(0, 0, W, H)
  }

  if (layout.span === 'spread') {
    renderPage(ctx, pageOf('full'), layout, style, { width: W, height: H }, images)
  } else {
    // 单页：封底在左，封面（及其他单页）在右
    const parts = layout.span === 'pair'
      ? [{ side: 'left', x: 0 }, { side: 'right', x: pageW }]
      : [{ side: 'single', x: spread.pageType === 'back' ? 0 : pageW }]
    parts.forEach(part => {
      ctx.save()
      ctx.translate(part.x, 0)
      renderPage(ctx, pageOf(part.side), layout, style, { width: pageW, height: H }, images)
      ctx.restore()
    })
  }

  if (options.spine && layout.span !== 'single') drawSpine(ctx, pageW, H, W)
  ctx.restore()
}

// 中缝阴影：中线最深，向两侧淡出
function drawSpine(ctx, x, H, W) {
  const half = W * 0.03
  const g = ctx.createLinearGradient(x - half, 0, x + half, 0)
  g.addColorStop(0, 'rgba(0, 0, 0, 0)')
  g.addColorStop(0.5, 'rgba(0, 0, 0, 0.12)')
  g.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = g
  ctx.fillRect(x - half, 0, half * 2, H)
}

module.exports = { renderSpread }
