// 猫爪印小路（阶段 8d）：一串爪印从左页走到右页，像小猫踩过书页，把左右两页连起来
// 大装饰配置：{ type: 'pawTrail', size（单个爪印，基准 px）, stride（步距，基准 px）, color（不写时用跨页主色调）, alpha, mix（与白色混合的比例）, y: [最小, 最大], weight }
// 路线按整个跨页的坐标生成（起点、终点高度随机，中间轻微起伏），左右页各画自己的一半；画在照片之下，被照片盖住的部分自然藏起来
const { hashRandom } = require('./frames')
const { drawDoodle } = require('./doodles')
const { mix } = require('./color')

/**
 * @param big  装饰计划中的 { cfg, y0, y1, wave }（占页高比例）
 * @param tone 跨页主色调（风格颜色键或色值）
 * @returns 小装饰要避开的区域：爪印上可以放贴纸，返回空
 */
function drawPawTrail(ctx, style, cfg, big, page, W, H, unit, tone) {
  if (page.side === 'single') return []
  const spreadW = page.side === 'full' ? W : W * 2
  const ox = page.side === 'right' ? -W : 0
  // 指定了颜色就用指定的（底色和主色调相近时，爪印会看不清）
  const key = cfg.color || tone
  const base = style.colors[key] || key || style.colors.accent
  const color = mix(base, '#FFFFFF', cfg.mix == null ? 0.25 : cfg.mix)
  const size = (cfg.size || 46) * unit
  const stride = (cfg.stride || 96) * unit
  const r = k => hashRandom(`${page.spreadId || ''}:paw:${k}`)
  // 路线：x 从跨页左外侧走到右外侧，y 在起点终点之间线性过渡 + 正弦起伏
  const pointAt = t => ({
    x: -size + t * (spreadW + size * 2),
    y: (big.y0 + (big.y1 - big.y0) * t) * H + Math.sin(t * Math.PI * 2 * big.wave.f + big.wave.p) * big.wave.a * H
  })
  const steps = Math.ceil((spreadW + size * 2) / stride)
  ctx.save()
  ctx.globalAlpha = cfg.alpha == null ? 0.38 : cfg.alpha
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const p = pointAt(t)
    const q = pointAt(Math.min(1, t + 0.01))
    const dir = Math.atan2(q.y - p.y, q.x - p.x)
    // 左右脚交替：垂直于前进方向错开
    const side = i % 2 ? 1 : -1
    const off = size * 0.42 * side
    const x = p.x - Math.sin(dir) * off + ox
    const y = p.y + Math.cos(dir) * off
    if (x < -size || x > W + size) continue
    // 爪印线稿的脚趾朝上（-90°），转到前进方向
    drawDoodle(ctx, 'paw', x, y, size * (0.92 + r(`s${i}`) * 0.16), { color, rotate: dir * 180 / Math.PI + 90 + (r(`a${i}`) - 0.5) * 16 })
  }
  ctx.restore()
  return []
}

module.exports = { drawPawTrail }
