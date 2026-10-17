// 风格素材：背景纹理、颗粒等代码生成的纹理，以及（可选的）分包图片
// 渲染前统一调用 loadRenderImages，得到照片 + 素材的图片表，交给 renderPage
const { getSpreadStyle } = require('./album')
const { getTexturePath } = require('./render/textures')
const { loadGlyphFont } = require('./render/glyphText')

// 分包名 → 加载结果（Promise<boolean>）
const packages = {}

// 加载风格素材所在的分包；失败时返回 false（对应素材不画，退回纯色）
// 注意：真机验证中，画布暂时无法直接读取分包里的图片，阶段 6 使用图片素材前需另行解决
function ensurePackage(name) {
  if (!name) return Promise.resolve(true)
  if (!packages[name]) {
    packages[name] = new Promise(resolve => {
      if (!wx.loadSubpackage) return resolve(true)
      wx.loadSubpackage({
        name,
        success: () => resolve(true),
        fail: err => {
          console.warn('加载风格分包失败', name, err)
          delete packages[name]
          resolve(false)
        }
      })
    })
  }
  return packages[name]
}

// 风格用到的图片素材：{ 'asset:路径': 路径 }
function imageAssetsOf(style) {
  const assets = {}
  const bg = style.background
  if (bg && bg.type === 'image' && bg.src) assets[`asset:${bg.src}`] = bg.src
  ;(style.decorations || []).forEach(d => {
    if (d.type === 'image' && d.src) assets[`asset:${d.src}`] = d.src
  })
  return assets
}

// 风格用到的代码生成纹理：{ 'asset:texture:名称': 名称 }
function texturesOf(style) {
  const textures = {}
  const bg = style.background
  if (bg && bg.type === 'texture' && bg.texture) textures[`asset:texture:${bg.texture}`] = bg.texture
  if (style.grain) textures['asset:texture:grain'] = 'grain'
  return textures
}

// 风格用到的字形字体（装饰文字、页码）
function glyphFontsOf(style) {
  const keys = {}
  const add = font => { if (font && font.glyph) keys[font.glyph] = true }
  const dt = style.decoText || {}
  Object.keys(dt).forEach(k => add(dt[k].font))
  add(style.pageNumber)
  return Object.keys(keys)
}

/**
 * 加载渲染一个跨页（或其中一页）需要的全部图片
 * @param loader  imageLoader（绑定在目标 canvas 上）
 * @param photos  要加载的照片
 * @param variant 照片变体 display / original / thumb
 * @param options 传给 loader.loadPhotos 的选项（如 evictOthers）
 * @returns { photoId: entry, 'asset:…': entry }
 */
async function loadRenderImages(loader, album, spread, photos, variant, options) {
  const style = getSpreadStyle(album, spread)
  const assets = imageAssetsOf(style)
  if (Object.keys(assets).length) await ensurePackage(style.assetsPackage)
  const textures = texturesOf(style)
  await Promise.all(Object.keys(textures).map(async key => {
    const path = await getTexturePath(textures[key])
    if (path) assets[key] = path
  }))
  const [images, assetImages] = await Promise.all([
    loader.loadPhotos(photos, variant, options),
    loader.loadAssets(assets),
    // 字形字体加载完才能画装饰文字（失败时退回系统字体，不阻塞）
    Promise.all(glyphFontsOf(style).map(loadGlyphFont))
  ])
  return Object.assign(images, assetImages)
}

module.exports = { loadRenderImages, ensurePackage }
