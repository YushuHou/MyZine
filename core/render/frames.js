// 照片框的最终形态：版式坐标 + 风格（随机倾斜、边框）+ 形状，渲染、点击检测、拖动换算共用

// 字符串 → [0, 1) 的稳定伪随机数：同一个照片框每次得到同样的值
function hashRandom(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // 末尾雪崩混合（murmur3 fmix32）：否则只差最后一个字符的 key（如 type:0 / type:1）得到的值几乎一样
  h ^= h >>> 16
  h = Math.imul(h, 0x85EBCA6B)
  h ^= h >>> 13
  h = Math.imul(h, 0xC2B2AE35)
  h ^= h >>> 16
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
 * - shape：rect（默认）/ rounded / circle / ellipse / arch
 * - mat：照片框自带的白边阴影（叠压版式用），覆盖风格的边框设置 { border, color, shadow }
 * @param seedKey 随机种子前缀（跨页 id），同一个照片框倾斜角度稳定
 */
function resolveFrames(frames, style, seedKey) {
  const pf = style.photoFrame || {}
  return frames.map(f => {
    const bleed = isBleed(f)
    // 满版、以及版式标了 border: false 的框（如四格条，由版式组合成一个整体）不随风格倾斜
    const jitter = !bleed && f.border !== false && pf.rotateJitter ? (hashRandom(`${seedKey}:${f.id}`) * 2 - 1) * pf.rotateJitter : 0
    return Object.assign({}, f, {
      shape: f.shape || 'rect',
      rotate: (f.rotate || 0) + jitter,
      bleed,
      framed: !bleed && f.border !== false
    })
  })
}

// 边框设置：照片框自带 mat 优先，其次风格 photoFrame
function borderOf(frame, style) {
  const pf = style.photoFrame || {}
  if (frame.mat) {
    return { width: frame.mat.border || 0, color: frame.mat.color || '#FFFFFF', bottomExtra: 0, shadow: frame.mat.shadow ? (pf.shadow || DEFAULT_SHADOW) : null }
  }
  if (!frame.framed) return { width: 0, color: null, bottomExtra: 0, shadow: frame.bleed ? null : pf.shadow }
  // 拍立得加宽底边、票根副券只用于矩形类
  const rectLike = frame.shape === 'rect' || frame.shape === 'rounded'
  return {
    width: pf.borderWidth || 0,
    color: pf.borderColor,
    bottomExtra: rectLike ? (pf.bottomExtra || 0) : 0,
    shadow: pf.shadow,
    stub: rectLike && pf.ticketStub ? pf.ticketStub : null
  }
}

// 票根副券在哪一侧：横的框在右侧，竖的框在下方
function stubSide(rect) {
  return rect.w >= rect.h ? 'right' : 'bottom'
}

// 叠压照片默认的阴影（风格没设阴影时）
const DEFAULT_SHADOW = { color: 'rgba(0, 0, 0, 0.22)', blur: 20, offsetX: 0, offsetY: 8 }

/**
 * 照片框的外形区域（画布 px）：圆形取内切正圆，其余为整个框
 */
function outerRect(frame, W, H) {
  const x = frame.x * W
  const y = frame.y * H
  const w = frame.w * W
  const h = frame.h * H
  if (frame.shape === 'circle') {
    const d = Math.min(w, h)
    return { x: x + (w - d) / 2, y: y + (h - d) / 2, w: d, h: d }
  }
  return { x, y, w, h }
}

/**
 * 照片实际显示的区域（扣掉边框；拍立得底边更宽），坐标为画布 px
 * @param frame resolveFrames 之后的照片框
 */
function photoRect(frame, style, W, H, unit) {
  const r = outerRect(frame, W, H)
  const b = borderOf(frame, style)
  const bw = b.width * unit
  const extra = b.bottomExtra * unit
  const inner = { x: r.x + bw, y: r.y + bw, w: r.w - bw * 2, h: r.h - bw * 2 - extra }
  // 票根副券：从照片区域里让出一条
  if (b.stub) {
    const ratio = b.stub.ratio || 0.22
    if (stubSide(r) === 'right') inner.w -= r.w * ratio
    else inner.h -= r.h * ratio
  }
  return inner
}

// 圆角大小（画布 px）：rounded 默认取短边的 8%
function cornerRadius(frame, style, w, h, unit) {
  const pf = style.photoFrame || {}
  const r = pf.radius != null ? pf.radius : (frame.radius || 0)
  if (frame.shape === 'rounded' && !r) return Math.min(w, h) * 0.08
  return r * unit
}

/**
 * 在画布上描出形状路径（调用方负责 fill / clip / stroke）
 * 形状：rect / rounded / circle / ellipse / arch（上半圆 + 下矩形）
 */
function shapePath(ctx, shape, x, y, w, h, radius) {
  ctx.beginPath()
  if (shape === 'circle' || shape === 'ellipse') {
    // 四段三次贝塞尔近似椭圆
    const k = 0.5522847498
    const rx = w / 2
    const ry = h / 2
    const cx = x + rx
    const cy = y + ry
    ctx.moveTo(cx + rx, cy)
    ctx.bezierCurveTo(cx + rx, cy + ry * k, cx + rx * k, cy + ry, cx, cy + ry)
    ctx.bezierCurveTo(cx - rx * k, cy + ry, cx - rx, cy + ry * k, cx - rx, cy)
    ctx.bezierCurveTo(cx - rx, cy - ry * k, cx - rx * k, cy - ry, cx, cy - ry)
    ctx.bezierCurveTo(cx + rx * k, cy - ry, cx + rx, cy - ry * k, cx + rx, cy)
    ctx.closePath()
    return
  }
  if (shape === 'arch') {
    const r = Math.min(w / 2, h)
    ctx.moveTo(x, y + h)
    ctx.lineTo(x, y + r)
    ctx.arc(x + w / 2, y + r, w / 2, Math.PI, 0)
    ctx.lineTo(x + w, y + h)
    ctx.closePath()
    return
  }
  const rr = Math.min(radius || 0, w / 2, h / 2)
  if (rr <= 0) {
    ctx.rect(x, y, w, h)
    return
  }
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

// 点 (px, py) 是否在形状内（已换算到未旋转的坐标系）
function pointInShape(shape, px, py, x, y, w, h) {
  if (px < x || px > x + w || py < y || py > y + h) return false
  if (shape === 'circle' || shape === 'ellipse') {
    const dx = (px - x - w / 2) / (w / 2)
    const dy = (py - y - h / 2) / (h / 2)
    return dx * dx + dy * dy <= 1
  }
  if (shape === 'arch') {
    const r = w / 2
    if (py >= y + r) return true
    const dx = px - x - r
    const dy = py - y - r
    return dx * dx + dy * dy <= r * r
  }
  return true
}

module.exports = { hashRandom, isBleed, resolveFrames, borderOf, stubSide, outerRect, photoRect, cornerRadius, shapePath, pointInShape }
