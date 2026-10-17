// 字形路径文字：西文用字形路径数据直接画（iPhone 画布不支持 loadFontFace 字体），其余字符用系统字体
// 同一行中西文混排时基线对齐（字形 y = 0 为基线，系统字体用 alphabetic 基线）
const { getPathOps, tracePath } = require('./svgPath')

// 字形字体数据在分包 pkg-fonts 中（require.async 路径必须是字面量）
const LOADERS = {
  playfair: () => require.async('../../pkg-fonts/playfair.js'),
  caveat: () => require.async('../../pkg-fonts/caveat.js'),
  oswald: () => require.async('../../pkg-fonts/oswald.js')
}

const fonts = {}
const loading = {}

// 加载字形字体；失败返回 null（文字退回系统字体绘制）
function loadGlyphFont(key) {
  if (!LOADERS[key]) return Promise.resolve(null)
  if (fonts[key]) return Promise.resolve(fonts[key])
  if (!loading[key]) {
    loading[key] = LOADERS[key]()
      .then(mod => {
        fonts[key] = mod && mod.glyphs ? mod : (mod && mod.default)
        return fonts[key]
      })
      .catch(err => {
        console.warn('加载字形字体失败', key, err)
        delete loading[key]
        return null
      })
  }
  return loading[key]
}

// 已加载的字形字体（同步，未加载时为 null）
function getGlyphFont(key) {
  return fonts[key] || null
}

// 离线测试用：直接注入字体数据
function registerGlyphFont(key, data) {
  fonts[key] = data
}

/**
 * 文字样式：
 * { glyph: 'playfair' | 'caveat' | 'oswald'（可选）, family: 系统字体（中文及字形缺失时用）,
 *   weight, size（画布 px）, letterSpacing（画布 px）, uppercase }
 */
function fallbackFont(spec) {
  return `${spec.weight || 'normal'} ${spec.size}px ${spec.family || 'serif'}`
}

// 只把西文字母转大写，中文原样
function transformText(text, spec) {
  return spec.uppercase ? text.replace(/[a-z]+/g, s => s.toUpperCase()) : text
}

// 拆成「字形字体能画」和「交给系统字体」的连续片段
function splitRuns(font, text) {
  const runs = []
  for (const ch of text) {
    const glyph = !!(font && font.glyphs[ch])
    const last = runs[runs.length - 1]
    if (last && last.glyph === glyph) last.text += ch
    else runs.push({ glyph, text: ch })
  }
  return runs
}

// 片段宽度，同时给出字形片段每个字符的位置
function layoutRuns(ctx, spec, text) {
  const font = spec.glyph ? getGlyphFont(spec.glyph) : null
  const spacing = spec.letterSpacing || 0
  const runs = splitRuns(font, transformText(text, spec))
  let total = 0
  runs.forEach(run => {
    if (run.glyph) {
      const k = spec.size / font.unitsPerEm
      const chars = Array.from(run.text)
      run.positions = []
      let x = 0
      chars.forEach((ch, i) => {
        run.positions.push(x)
        const kern = i + 1 < chars.length ? (font.kern[ch + chars[i + 1]] || 0) : 0
        x += (font.glyphs[ch][0] + kern) * k + spacing
      })
      run.chars = chars
      run.width = x
    } else {
      ctx.font = fallbackFont(spec)
      run.width = ctx.measureText(run.text).width + spacing * Array.from(run.text).length
    }
    total += run.width
  })
  // 末尾不留字距
  return { runs, width: Math.max(0, total - spacing), font }
}

function measureGlyphText(ctx, spec, text) {
  return layoutRuns(ctx, spec, text).width
}

/**
 * 画一行文字
 * @param x, y  y 为基线；align: left | center | right
 * @param color 填充色
 */
function drawGlyphText(ctx, spec, text, x, y, align, color) {
  const { runs, width, font } = layoutRuns(ctx, spec, text)
  let cx = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x
  ctx.save()
  ctx.fillStyle = color
  runs.forEach(run => {
    if (run.glyph) {
      const k = spec.size / font.unitsPerEm
      run.chars.forEach((ch, i) => {
        const d = font.glyphs[ch][1]
        if (!d) return
        ctx.save()
        ctx.translate(cx + run.positions[i], y)
        ctx.scale(k, k)
        ctx.beginPath()
        tracePath(ctx, getPathOps(d))
        ctx.fill()
        ctx.restore()
      })
    } else {
      ctx.font = fallbackFont(spec)
      ctx.textAlign = 'left'
      ctx.textBaseline = 'alphabetic'
      const spacing = spec.letterSpacing || 0
      if (!spacing) {
        ctx.fillText(run.text, cx, y)
      } else {
        let px = cx
        for (const ch of run.text) {
          ctx.fillText(ch, px, y)
          px += ctx.measureText(ch).width + spacing
        }
      }
    }
    cx += run.width
  })
  ctx.restore()
  return width
}

module.exports = { loadGlyphFont, getGlyphFont, registerGlyphFont, measureGlyphText, drawGlyphText, transformText }
