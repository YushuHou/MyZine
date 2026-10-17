// 照片在框内的位置计算。照片绝不拉伸：宽高始终同比例缩放

/**
 * 计算照片在框内的绘制矩形（相对框左上角，超出框的部分由调用方裁切）
 * @param imgW, imgH     照片显示方向下的宽高
 * @param frameW, frameH 照片框宽高
 * @param slot           { fit, scale, offsetX, offsetY }
 *   fit：'fill' 等比放大填满框并裁切（默认）；'fit' 等比缩小完整放进框
 *   scale：≥ 1，在基础缩放上再放大的倍数（双指缩放，最小即刚好填满）
 *   offsetX/offsetY：-1 ~ 1，在可移动范围内的位置；0 居中，-1 靠左/上边，1 靠右/下边
 * @returns { dx, dy, dw, dh }
 */
function computePlacement(imgW, imgH, frameW, frameH, slot) {
  const s = slot || {}
  const base = s.fit === 'fit'
    ? Math.min(frameW / imgW, frameH / imgH)
    : Math.max(frameW / imgW, frameH / imgH)
  const k = base * Math.max(1, s.scale || 1)
  const dw = imgW * k
  const dh = imgH * k
  return {
    dx: place(frameW, dw, s.offsetX),
    dy: place(frameH, dh, s.offsetY),
    dw,
    dh
  }
}

// 单个方向上的位置：照片比框小时居中，比框大时按 offset 在可移动范围内取位置
function place(frameSize, drawSize, offset) {
  const overflow = drawSize - frameSize
  if (overflow <= 0) return -overflow / 2
  const o = Math.max(-1, Math.min(1, offset || 0))
  return -overflow * (1 + o) / 2
}

module.exports = { computePlacement }
