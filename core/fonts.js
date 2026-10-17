// 西文字体：base64 写在分包 pkg-fonts 的 JS 模块中，require.async 加载后用 wx.loadFontFace 注册
// 原因：loadFontFace 的 source 只能是 https 或 Data URL（基础库 3.7.9+），小程序不联网，只能用 Data URL；
//       画布和文件接口都读不到分包里的文件，但分包里的 JS 模块可以 require.async 加载
// 中文仍用系统字体
// 注册名不含空格（如 MZPlayfair）：真机验证中带引号 / 空格的字体名在画布中未生效，正在排查

// require.async 的路径必须是字面量，便于构建时分析依赖
const FONTS = {
  playfair: { family: 'MZPlayfair', name: 'Playfair Display', load: () => require.async('../pkg-fonts/playfair.js') },
  caveat: { family: 'MZCaveat', name: 'Caveat', load: () => require.async('../pkg-fonts/caveat.js') },
  oswald: { family: 'MZOswald', name: 'Oswald', load: () => require.async('../pkg-fonts/oswald.js') }
}

// key → Promise<{ ok, family, step, error, bytes }>
const loading = {}

function errText(err) {
  return (err && (err.errMsg || err.message)) || String(err)
}

/**
 * 加载一个字体；失败不抛出，返回结果（风格字体栈会退回系统字体）
 * step：失败发生在哪一步 require（加载分包模块）/ register（loadFontFace）
 */
function loadFont(key) {
  const def = FONTS[key]
  if (!def) return Promise.resolve({ ok: false, family: key, step: 'unknown', error: '未知字体' })
  if (!loading[key]) {
    loading[key] = (async () => {
      let base64
      try {
        const mod = await def.load()
        base64 = typeof mod === 'string' ? mod : mod && mod.default
      } catch (err) {
        delete loading[key]
        return { ok: false, family: def.family, step: 'require', error: errText(err) }
      }
      return new Promise(resolve => {
        wx.loadFontFace({
          global: true,
          family: def.family,
          source: `url("data:font/ttf;base64,${base64}")`,
          // native：Canvas 2D 可用；webview：页面文字可用
          scopes: ['native', 'webview'],
          success: () => resolve({ ok: true, family: def.family, bytes: base64.length }),
          fail: err => {
            delete loading[key]
            resolve({ ok: false, family: def.family, step: 'register', error: errText(err), bytes: base64.length })
          }
        })
      })
    })()
  }
  return loading[key]
}

// 加载全部字体（导出前调用，确保字体已就绪）
function loadAllFonts() {
  return Promise.all(Object.keys(FONTS).map(loadFont))
}

module.exports = { FONTS, loadFont, loadAllFonts }
