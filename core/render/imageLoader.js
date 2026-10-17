// 图片加载：Image 对象绑定在具体 canvas 上，每个 canvas 各用一个 loader
const { isRotated90 } = require('./exif')

// 平台是否会自动按 EXIF 旋转图片。只有 90° 类方向能通过宽高比检测出来，
// 180° 和镜像类无法检测，沿用最近一次检测到的结论
let platformAutoRotates = true

// 判断绘制时是否需要自己按 EXIF 旋转
function needsTransform(image, exif, ratio) {
  if (!exif || exif === 'up') return false
  const r = image.width / image.height
  if (isRotated90(exif) && Math.abs(Math.log(ratio)) > 0.05) {
    // 实际宽高比更接近「校正后宽高比的倒数」→ 平台没有自动旋转
    const raw = Math.abs(Math.log(r) + Math.log(ratio)) < Math.abs(Math.log(r) - Math.log(ratio))
    platformAutoRotates = !raw
    return raw
  }
  return !platformAutoRotates
}

function createImageLoader(canvas) {
  // path → { promise, image }
  const cache = {}

  function loadImage(path) {
    if (!cache[path]) {
      const item = { image: null, promise: null }
      item.promise = new Promise(resolve => {
        const img = canvas.createImage()
        img.onload = () => { item.image = img; resolve(img) }
        img.onerror = err => {
          console.warn('图片加载失败', path, err)
          delete cache[path]
          resolve(null)
        }
        img.src = path
      })
      cache[path] = item
    }
    return cache[path].promise
  }

  function release(path) {
    const item = cache[path]
    delete cache[path]
    if (item && item.image) {
      item.image.onload = null
      item.image.onerror = null
      item.image.src = ''
    }
  }

  // variant：'display' 用压缩图，'original' 用原图（打印版导出）
  async function loadPhoto(photo, variant) {
    const useOriginal = variant === 'original'
    const path = useOriginal ? photo.originalPath : photo.displayPath
    const exif = (useOriginal ? photo.exif : photo.displayExif) || 'up'
    const image = await loadImage(path)
    if (!image) return null
    return { image, exif, transform: needsTransform(image, exif, photo.ratio) }
  }

  return {
    /**
     * 加载一组照片，返回 { photoId: { image, exif, transform } }，加载失败的照片不在结果中
     * options.evictOthers：释放不在本组中的已缓存图片，控制内存（编辑页翻页时使用）
     */
    async loadPhotos(photos, variant = 'display', options = {}) {
      const map = {}
      await Promise.all(photos.map(async photo => {
        const entry = await loadPhoto(photo, variant)
        if (entry) map[photo.id] = entry
      }))
      if (options.evictOthers) {
        const keep = {}
        photos.forEach(p => { keep[variant === 'original' ? p.originalPath : p.displayPath] = true })
        Object.keys(cache).forEach(path => { if (!keep[path]) release(path) })
      }
      return map
    },

    // 释放全部图片
    clear() {
      Object.keys(cache).forEach(release)
    }
  }
}

module.exports = { createImageLoader }
