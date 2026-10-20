// 风格素材：背景纹理、颗粒等代码生成的纹理，以及（可选的）分包图片
// 渲染前统一调用 loadRenderImages，得到照片 + 素材的图片表，交给 renderPage
const { getSpreadStyle } = require('./album')
const { getLayout } = require('./registry')
const { getTexturePath } = require('./render/textures')
const { loadGlyphFont } = require('./render/glyphText')
const { loadAssetPack, packKey } = require('./render/assetPacks')
const { planOrnaments, planImageNames } = require('./render/ornaments')

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

// 'pack:素材名' 表示素材分包里的图片
const PACK_PREFIX = 'pack:'

// 风格用到的图片素材：{ 'asset:路径': 路径 }（素材分包图片不在这里，见 packNamesOf）
function imageAssetsOf(style) {
  const assets = {}
  const add = src => { if (src && src.indexOf(PACK_PREFIX) !== 0) assets[`asset:${src}`] = src }
  const bg = style.background
  if (bg && bg.type === 'image') add(bg.src)
  ;(style.decorations || []).forEach(d => { if (d.type === 'image') add(d.src) })
  return assets
}

/**
 * 渲染这个跨页要用的素材分包图片名：背景、图片装饰、纸胶带，以及装饰计划选中的贴纸、便签纸
 * 只加载用得到的，避免每个画布都解码整个分包
 */
function packNamesOf(style, album, spread) {
  const names = []
  const fromSrc = src => { if (src && src.indexOf(PACK_PREFIX) === 0) names.push(src.slice(PACK_PREFIX.length)) }
  const bg = style.background
  if (bg && bg.type === 'image') fromSrc(bg.src)
  ;(style.decorations || []).forEach(d => { if (d.type === 'image') fromSrc(d.src) })
  ;(style.frameDecorations || []).forEach(d => { if (d.type === 'tape' && d.images) names.push.apply(names, d.images) })
  // 装饰计划只和跨页 id、版式、页面类型、地点有关，左右页共用一份
  const page = { spreadId: spread.id, pageType: spread.pageType, info: album.info }
  names.push.apply(names, planImageNames(planOrnaments(style, page, getLayout(spread.layoutId))))
  return names
}

// 素材分包图片的路径表 { 'asset:pack:名': Data URL }；分包加载失败时为空（对应装饰不画或退回代码绘制）
async function packAssetsOf(style, album, spread) {
  if (!style.assetPack) return {}
  const pack = await loadAssetPack(style.assetPack)
  const assets = {}
  if (!pack) return assets
  packNamesOf(style, album, spread).forEach(name => {
    if (pack[name]) assets[packKey(name)] = pack[name].src
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
  // 撕纸条、便签纸上的字
  ;(style.frameDecorations || []).forEach(d => add(d.font))
  ;((style.ornaments && style.ornaments.small) || []).forEach(d => add(d.font))
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
  // 素材分包图片不常驻：换跨页时用不到的会随照片一起释放
  const packAssets = await packAssetsOf(style, album, spread)
  const keep = Object.keys(packAssets).map(k => packAssets[k])
  const [images, assetImages, packImages] = await Promise.all([
    loader.loadPhotos(photos, variant, Object.assign({}, options, { keep })),
    loader.loadAssets(assets),
    loader.loadAssets(packAssets, { pin: false }),
    // 字形字体加载完才能画装饰文字（失败时退回系统字体，不阻塞）
    Promise.all(glyphFontsOf(style).map(loadGlyphFont))
  ])
  return Object.assign(images, assetImages, packImages)
}

module.exports = { loadRenderImages, ensurePackage }
