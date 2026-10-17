// 点击位置 → 照片框

/**
 * 找出画布上某点所在的照片框（后画的在上层，优先命中）
 * @param frames 当前页版式的照片框
 * @param W, H   画布尺寸
 * @param px, py 点的画布坐标
 * @returns 照片框或 null
 */
function frameAtPoint(frames, W, H, px, py) {
  for (let i = frames.length - 1; i >= 0; i--) {
    const f = frames[i]
    const w = f.w * W
    const h = f.h * H
    const cx = f.x * W + w / 2
    const cy = f.y * H + h / 2
    // 把点反向旋转到照片框未旋转时的坐标系
    const a = -(f.rotate || 0) * Math.PI / 180
    const dx = px - cx
    const dy = py - cy
    const rx = dx * Math.cos(a) - dy * Math.sin(a)
    const ry = dx * Math.sin(a) + dy * Math.cos(a)
    if (Math.abs(rx) <= w / 2 && Math.abs(ry) <= h / 2) return f
  }
  return null
}

module.exports = { frameAtPoint }
