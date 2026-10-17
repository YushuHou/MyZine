// 照片框的最终形态：版式坐标 + 风格（随机倾斜、边框），渲染、点击检测、拖动换算共用

// 字符串 → [0, 1) 的稳定伪随机数：同一个照片框每次得到同样的值
function hashRandom(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) / 4294967296
}

// 照片框是否铺到页面边缘（满版）：满版不倾斜、不加边框和装饰，否则边缘会露出空隙
function isBleed(frame) {
  return frame.x <= 0.001 || frame.y <= 0.001 || frame.x + frame.w >= 0.999 || frame.y + frame.h >= 0.999
}

/**
 * 应用风格后的照片框（返回新对象，不修改版式数据）
 * - rotate：版式旋转 + 风格随机倾斜（photoFrame.rotateJitter，±N°）
 * - bleed：是否满版
 * - framed：是否画边框
 * @param seedKey 随机种子前缀（跨页 id），同一个照片框倾斜角度稳定
 */
function resolveFrames(frames, style, seedKey) {
  const pf = style.photoFrame || {}
  return frames.map(f => {
    const bleed = isBleed(f)
    const jitter = !bleed && pf.rotateJitter ? (hashRandom(`${seedKey}:${f.id}`) * 2 - 1) * pf.rotateJitter : 0
    return Object.assign({}, f, {
      rotate: (f.rotate || 0) + jitter,
      bleed,
      framed: !bleed && f.border !== false
    })
  })
}

/**
 * 照片在框内实际显示的区域（扣掉边框；拍立得风格底边更宽），坐标为画布 px
 * @param frame resolveFrames 之后的照片框
 */
function photoRect(frame, style, W, H, unit) {
  const pf = style.photoFrame || {}
  const x = frame.x * W
  const y = frame.y * H
  const w = frame.w * W
  const h = frame.h * H
  if (!frame.framed) return { x, y, w, h }
  const bw = (pf.borderWidth || 0) * unit
  const extra = (pf.bottomExtra || 0) * unit
  return { x: x + bw, y: y + bw, w: w - bw * 2, h: h - bw * 2 - extra }
}

module.exports = { hashRandom, isBleed, resolveFrames, photoRect }
