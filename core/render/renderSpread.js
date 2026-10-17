// 把一个跨页画成一张 3:2 的图：缩略图、双页预览、阶段 4 的跨页图片导出共用
const { getLayout } = require('../registry')
const { getSpreadStyle } = require('../album')
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
  const base = { slots: spread.slots, info: album.info }

  ctx.save()
  ctx.clearRect(0, 0, W, H)
  if (options.blankColor) {
    ctx.fillStyle = options.blankColor
    ctx.fillRect(0, 0, W, H)
  }

  if (layout.span === 'spread') {
    renderPage(ctx, Object.assign({ side: 'full' }, base), layout, style, { width: W, height: H }, images)
  } else {
    // 单页：封底在左，封面（及其他单页）在右
    const parts = layout.span === 'pair'
      ? [{ side: 'left', x: 0 }, { side: 'right', x: pageW }]
      : [{ side: 'single', x: spread.pageType === 'back' ? 0 : pageW }]
    parts.forEach(part => {
      ctx.save()
      ctx.translate(part.x, 0)
      renderPage(ctx, Object.assign({ side: part.side }, base), layout, style, { width: pageW, height: H }, images)
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
