// 颜色工具：解析 #RGB / #RRGGBB / rgb() / rgba()，混色、降饱和（剪影配色、纹样预混色用）

// → { r, g, b, a }（0–255，a 为 0–1）；无法解析时返回 null
function parseColor(str) {
  if (!str || typeof str !== 'string') return null
  const s = str.trim()
  if (s[0] === '#') {
    let hex = s.slice(1)
    if (hex.length === 3) hex = hex.split('').map(c => c + c).join('')
    if (hex.length !== 6) return null
    const n = parseInt(hex, 16)
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 }
  }
  const m = s.match(/^rgba?\(([^)]+)\)$/i)
  if (!m) return null
  const parts = m[1].split(',').map(x => parseFloat(x))
  return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 }
}

function toCss(c) {
  const r = Math.round(c.r)
  const g = Math.round(c.g)
  const b = Math.round(c.b)
  return c.a == null || c.a >= 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${c.a})`
}

/**
 * 把 a 向 b 混合：t = 0 为 a，t = 1 为 b。半透明颜色先按透明度叠到 b 上
 * 解析失败时返回 a 原样
 */
function mix(a, b, t) {
  const ca = parseColor(a)
  const cb = parseColor(b)
  if (!ca || !cb) return a
  // 半透明前景先「铺」在底色上，得到实色
  const fa = ca.a < 1 ? { r: ca.r * ca.a + cb.r * (1 - ca.a), g: ca.g * ca.a + cb.g * (1 - ca.a), b: ca.b * ca.a + cb.b * (1 - ca.a) } : ca
  return toCss({ r: fa.r + (cb.r - fa.r) * t, g: fa.g + (cb.g - fa.g) * t, b: fa.b + (cb.b - fa.b) * t, a: 1 })
}

// 降饱和：向同亮度的灰色靠拢 amount（0–1）
function desaturate(color, amount) {
  const c = parseColor(color)
  if (!c || !amount) return color
  const l = c.r * 0.299 + c.g * 0.587 + c.b * 0.114
  return toCss({ r: c.r + (l - c.r) * amount, g: c.g + (l - c.g) * amount, b: c.b + (l - c.b) * amount, a: c.a })
}

module.exports = { parseColor, toCss, mix, desaturate }
