// 跨页图片渲染器：用一个离屏 canvas 逐个把跨页渲染成 JPG 文件，按内容缓存
// 跨页管理的缩略图、双页预览共用
const { getLayout } = require('../registry')
const { getSpreadPhotos } = require('../album')
const { renderSpread } = require('./renderSpread')
const { createImageLoader } = require('./imageLoader')
const { exportCanvas, removeExportFile } = require('../export/saveImage')

// 跨页内容的缓存 key：版式、风格、照片框；有文字的版式还要算上书籍信息
function contentKey(album, spread) {
  const layout = getLayout(spread.layoutId)
  const hasText = layout.pages.some(p => p.texts && p.texts.length)
  return JSON.stringify([
    spread.layoutId,
    spread.styleId || album.defaultStyleId,
    spread.pageType,
    spread.slots,
    hasText ? album.info : null
  ])
}

/**
 * @param options { width: 图片宽度（高 = 宽 × 2/3）, variant: 照片变体, blankColor, spine, quality }
 */
function createSpreadImageRenderer(options) {
  const width = Math.round(options.width)
  const height = Math.round(width * 2 / 3)
  // spreadId → { key, path }
  const cache = {}
  let canvas = null
  let ctx = null
  let loader = null
  // 串行队列：同一时间只渲染一个跨页
  let queue = Promise.resolve()

  async function renderOne(album, spread) {
    const key = contentKey(album, spread)
    const hit = cache[spread.id]
    if (hit && hit.key === key) return hit.path
    if (!canvas) {
      canvas = wx.createOffscreenCanvas({ type: '2d', width, height })
      ctx = canvas.getContext('2d')
      loader = createImageLoader(canvas)
    }
    const images = await loader.loadPhotos(getSpreadPhotos(album, spread), options.variant || 'display', { evictOthers: true })
    renderSpread(ctx, album, spread, { width, height }, images, { blankColor: options.blankColor, spine: options.spine })
    const path = await exportCanvas(canvas, width, height, options.quality || 0.85)
    if (hit) removeExportFile(hit.path)
    cache[spread.id] = { key, path }
    return path
  }

  return {
    // 渲染一个跨页，返回图片路径；内容未变时直接返回缓存
    render(album, spread) {
      const task = queue.then(() => renderOne(album, spread))
      queue = task.catch(() => {})
      return task
    },

    // 缓存是否仍有效（内容没变）
    cached(album, spread) {
      const hit = cache[spread.id]
      return hit && hit.key === contentKey(album, spread) ? hit.path : ''
    },

    // 释放图片和缓存文件
    clear() {
      if (loader) loader.clear()
      Object.keys(cache).forEach(id => {
        removeExportFile(cache[id].path)
        delete cache[id]
      })
    }
  }
}

// 跨页管理的缩略图渲染器：整个小程序共用一个，返回跨页管理页时不必重新生成
let thumbRenderer = null
function getThumbRenderer() {
  if (!thumbRenderer) {
    thumbRenderer = createSpreadImageRenderer({ width: 360, variant: 'thumb', blankColor: '#FFFFFF', spine: true, quality: 0.8 })
  }
  return thumbRenderer
}

module.exports = { createSpreadImageRenderer, getThumbRenderer }
