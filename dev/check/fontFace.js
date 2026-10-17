// 验证页专用：用 wx.loadFontFace（Data URL）注册 TTF 字体，检测画布是否支持
// 6a-0 结论：iPhone 上这种字体不能用于 canvas 2d，正式功能改用字形路径（core/render/glyphText.js）
// 保留此页作为对照：微信更新后可重新检测

const FONTS = {
  playfair: { family: 'MZPlayfair', name: 'Playfair Display', load: () => Promise.resolve(require('./ttf/playfair.js')) },
  caveat: { family: 'MZCaveat', name: 'Caveat', load: () => Promise.resolve(require('./ttf/caveat.js')) },
  oswald: { family: 'MZOswald', name: 'Oswald', load: () => Promise.resolve(require('./ttf/oswald.js')) }
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
