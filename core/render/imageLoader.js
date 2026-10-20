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

// 各变体使用的文件：display 压缩图 | original 原图（打印版导出）| thumb 小缩略图（跨页缩略图）
function pathOf(photo, variant) {
  if (variant === 'original') return photo.originalPath
  if (variant === 'thumb') return photo.thumbPath || photo.displayPath
  return photo.displayPath
}

function createImageLoader(canvas) {
  // path → { promise, image }
  const cache = {}
  // 风格素材的路径：常驻，不随翻页释放
  const pinned = {}

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

  async function loadPhoto(photo, variant) {
    const path = pathOf(photo, variant)
    // 缩略图由压缩图生成，沿用压缩图的 EXIF 方向；90° 类方向仍会按宽高比自动检测
    const exif = (variant === 'original' ? photo.exif : photo.displayExif) || 'up'
    const image = await loadImage(path)
    if (!image) {
      // 原图读取失败（临时文件可能已被系统回收）时退回压缩图
      return variant === 'original' ? loadPhoto(photo, 'display') : null
    }
    return { image, exif, transform: needsTransform(image, exif, photo.ratio) }
  }

  return {
    /**
     * 加载一组照片，返回 { photoId: { image, exif, transform } }，加载失败的照片不在结果中
     * options.evictOthers：释放不在本组中的已缓存图片，控制内存（编辑页翻页时使用）
     * options.keep：释放时额外保留的路径（本次同时加载的素材分包图片）
     */
    async loadPhotos(photos, variant = 'display', options = {}) {
      const map = {}
      await Promise.all(photos.map(async photo => {
        const entry = await loadPhoto(photo, variant)
        if (entry) map[photo.id] = entry
      }))
      if (options.evictOthers) {
        const keep = {}
        photos.forEach(p => { keep[pathOf(p, variant)] = true })
        ;(options.keep || []).forEach(path => { keep[path] = true })
        Object.keys(cache).forEach(path => { if (!keep[path] && !pinned[path]) release(path) })
      }
      return map
    },

    /**
     * 加载风格素材（背景纹理、装饰图、颗粒），默认常驻缓存
     * @param assets { key: 路径 }
     * @param options.pin 是否常驻（默认 true）；素材分包图片传 false，换跨页时可随照片释放
     * @returns { key: { image } }，加载失败的不在结果中
     */
    async loadAssets(assets, options = {}) {
      const map = {}
      await Promise.all(Object.keys(assets).map(async key => {
        const path = assets[key]
        if (options.pin !== false) pinned[path] = true
        const image = await loadImage(path)
        if (image) map[key] = { image, exif: 'up', transform: false }
      }))
      return map
    },

    // 释放全部图片
    clear() {
      Object.keys(pinned).forEach(path => { delete pinned[path] })
      Object.keys(cache).forEach(release)
    }
  }
}

module.exports = { createImageLoader }
