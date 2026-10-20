// 素材分包（阶段 8a）：AI 生成后经 scripts/build-stickers.py 处理的贴纸、纸胶带、便签纸、纸纹
// 画布读不到分包里的图片文件，所以图片以 Data URL 写在分包 JS 模块里，用 require.async 加载（见阶段 6 验证结论）
// 风格用 assetPack: '分包名' 指定；风格配置里写素材名（如 'seagull'），背景和图片装饰写 'pack:素材名'

// require.async 路径必须是字面量：新增素材分包时在这里加一行，并在 app.json 的 subpackages 中注册
const LOADERS = {
  beach: () => require.async('../../pkg-beach/assets.js'),
  snow: () => require.async('../../pkg-snow/assets.js'),
  cat: () => require.async('../../pkg-cat/assets.js'),
  dog: () => require.async('../../pkg-dog/assets.js'),
  couple: () => require.async('../../pkg-couple/assets.js'),
  family: () => require.async('../../pkg-family/assets.js'),
  city: () => require.async('../../pkg-city/assets.js')
}

const packs = {}
const loading = {}

// 加载素材分包，返回 { 素材名: { w, h, src } }；失败返回 null（素材不画，退回代码绘制的效果）
function loadAssetPack(name) {
  if (!name || !LOADERS[name]) return Promise.resolve(null)
  if (packs[name]) return Promise.resolve(packs[name])
  if (!loading[name]) {
    loading[name] = LOADERS[name]()
      .then(mod => {
        packs[name] = mod && mod.default ? mod.default : mod
        return packs[name]
      })
      .catch(err => {
        console.warn('加载素材分包失败', name, err)
        delete loading[name]
        return null
      })
  }
  return loading[name]
}

// 已加载的素材分包（同步，未加载时为 null）
function getAssetPack(name) {
  return packs[name] || null
}

// 离线预览用：直接注入素材数据
function registerAssetPack(name, data) {
  packs[name] = data
}

/**
 * 后台预下载全部素材分包（逐个下载，不抢首屏的网络）
 * 分包要等用到时才下载，模板页按顺序生成示例时会卡在下载上；提前下好后微信会缓存，同一版本只下载一次
 */
function preloadAssetPacks() {
  return Object.keys(LOADERS).reduce((chain, name) => chain.then(() => loadAssetPack(name)), Promise.resolve())
}

// 素材在图片表中的键名
function packKey(name) {
  return `asset:pack:${name}`
}

module.exports = { loadAssetPack, preloadAssetPacks, getAssetPack, registerAssetPack, packKey }
