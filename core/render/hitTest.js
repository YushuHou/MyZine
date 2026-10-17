// 点击位置 → 照片框（考虑旋转和形状）
const { outerRect, pointInShape } = require('./frames')

/**
 * 找出画布上某点所在的照片框（后画的在上层，优先命中）
 * @param frames 当前页的照片框（resolveFrames 之后，含 rotate、shape）
 * @param W, H   画布尺寸
 * @param px, py 点的画布坐标
 * @returns 照片框或 null
 */
function frameAtPoint(frames, W, H, px, py) {
  for (let i = frames.length - 1; i >= 0; i--) {
    const f = frames[i]
    const r = outerRect(f, W, H)
    const cx = f.x * W + f.w * W / 2
    const cy = f.y * H + f.h * H / 2
    // 把点反向旋转到照片框未旋转时的坐标系（旋转中心是照片框中心）
    const a = -(f.rotate || 0) * Math.PI / 180
    const dx = px - cx
    const dy = py - cy
    const rx = cx + dx * Math.cos(a) - dy * Math.sin(a)
    const ry = cy + dx * Math.sin(a) + dy * Math.cos(a)
    if (pointInShape(f.shape || 'rect', rx, ry, r.x, r.y, r.w, r.h)) return f
  }
  return null
}

module.exports = { frameAtPoint }
