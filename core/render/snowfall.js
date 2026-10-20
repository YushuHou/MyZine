// 飘雪（阶段 8c）：大小不一的雪点和少量六角雪花，画在照片之下
// 大装饰配置：{ type: 'snowfall', density（每百万基准 px² 的雪点数）, flakes（六角雪花占比）, size: [最小, 最大]（雪点直径，基准 px）, weight }
// 纸面偏白，雪点用跨页主色调的淡色并带一圈浅描边，落在色带、晕染上时更明显
const { hashRandom } = require('./frames')
const { mix } = require('./color')

// 六角雪花：六根主枝，每根带一对小分叉
function drawFlake(ctx, x, y, r, angle) {
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(angle)
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    ctx.moveTo(0, 0)
    ctx.lineTo(cos * r, sin * r)
    // 主枝 60% 处的分叉
    const bx = cos * r * 0.6
    const by = sin * r * 0.6
    ;[-1, 1].forEach(s => {
      const b = a + s * Math.PI / 4
      ctx.moveTo(bx, by)
      ctx.lineTo(bx + Math.cos(b) * r * 0.32, by + Math.sin(b) * r * 0.32)
    })
  }
  ctx.stroke()
  ctx.restore()
}

/**
 * @param tone 跨页主色调（风格颜色键或色值）
 * @returns 小装饰要避开的区域：雪点上可以放贴纸，返回空
 */
function drawSnowfall(ctx, style, cfg, page, W, H, unit, tone) {
  let i = 0
  const r = () => hashRandom(`${page.spreadId || ''}:${page.side}:snow:${i++}`)
  const base = style.colors[tone] || tone || style.colors.accent
  const fill = mix(base, '#FFFFFF', 0.55)
  const rim = mix(base, '#FFFFFF', 0.25)
  const [smin, smax] = cfg.size || [5, 14]
  const count = Math.round((cfg.density || 70) * (W / unit) * (H / unit) / 1e6)
  const flakes = cfg.flakes == null ? 0.08 : cfg.flakes
  ctx.save()
  ctx.lineCap = 'round'
  for (let k = 0; k < count; k++) {
    const x = r() * W
    const y = r() * H
    // 小点多、大点少
    const t = r()
    const d = (smin + t * t * (smax - smin)) * unit
    ctx.globalAlpha = 0.45 + r() * 0.4
    if (r() < flakes) {
      ctx.strokeStyle = rim
      ctx.lineWidth = Math.max(1, 1.8 * unit)
      drawFlake(ctx, x, y, d * 1.6, r() * Math.PI)
      continue
    }
    ctx.beginPath()
    ctx.arc(x, y, d / 2, 0, Math.PI * 2)
    ctx.fillStyle = fill
    ctx.fill()
    ctx.strokeStyle = rim
    ctx.lineWidth = Math.max(0.6, 1 * unit)
    ctx.stroke()
  }
  ctx.restore()
  return []
}

module.exports = { drawSnowfall }
