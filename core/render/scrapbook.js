// 生成式手账纸片：只用 Canvas 路径绘制，纸片位于照片下方，露出部分自然成为拼贴边
const { hashRandom } = require('./frames')

function paperColor(style, value) {
  return (value && style.colors[value]) || value || style.colors.endpaper || style.colors.fitFill || '#FFFFFF'
}

function fragmentPath(ctx, x, y, w, h, seed, roughness) {
  const rand = key => hashRandom(`${seed}:${key}`)
  const edge = Math.max(roughness || 8, 2)
  const steps = 9
  const points = []
  for (let i = 0; i <= steps; i++) points.push([x + w * i / steps, y + (i === 0 || i === steps ? 0 : (rand(`t${i}`) - 0.5) * edge)])
  for (let i = 1; i <= steps; i++) points.push([x + w + (i === steps ? 0 : (rand(`r${i}`) - 0.5) * edge), y + h * i / steps])
  for (let i = steps - 1; i >= 0; i--) points.push([x + w * i / steps, y + h + (i === 0 || i === steps ? 0 : (rand(`b${i}`) - 0.5) * edge)])
  for (let i = steps - 1; i > 0; i--) points.push([x + (rand(`l${i}`) - 0.5) * edge, y + h * i / steps])
  ctx.beginPath()
  ctx.moveTo(points[0][0], points[0][1])
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1])
  ctx.closePath()
}

function drawScrapbook(ctx, style, d, page, W, H, unit) {
  const regions = d.regions || []
  const colors = d.colors || ['endpaper', 'accent']
  const base = `${page.spreadId || ''}:${page.side}:scrapbook`
  regions.forEach((region, index) => {
    const mirror = region.mirror !== false && page.side === 'right'
    const rx = mirror ? 1 - region.x - region.w : region.x
    const x = rx * W
    const y = region.y * H
    const w = region.w * W
    const h = region.h * H
    const seed = `${base}:${index}`
    const pick = hashRandom(`${seed}:color`)
    const color = paperColor(style, region.color || colors[Math.floor(pick * colors.length)])
    const alpha = region.alpha == null ? (d.alpha == null ? 0.76 : d.alpha) : region.alpha
    const angle = (hashRandom(`${seed}:angle`) * 2 - 1) * (region.rotate || 0)
    ctx.save()
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate(angle * Math.PI / 180)
    ctx.globalAlpha = alpha
    // 纸片阴影在真机 Canvas 2D 可用时增加层次，阴影失败不影响纸片主体
    ctx.shadowColor = d.shadow || 'rgba(55, 43, 35, 0.16)'
    ctx.shadowBlur = (d.shadowBlur || 10) * unit
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 4 * unit
    fragmentPath(ctx, -w / 2, -h / 2, w, h, seed, (region.roughness || 10) * unit)
    ctx.fillStyle = color
    ctx.fill()
    ctx.restore()

    // 纸张纤维边和几道淡淡的压痕，避免装饰只像一块纯色矩形
    ctx.save()
    ctx.translate(x + w / 2, y + h / 2)
    ctx.rotate(angle * Math.PI / 180)
    ctx.globalAlpha = alpha * 0.52
    fragmentPath(ctx, -w / 2 + 3 * unit, -h / 2 + 3 * unit, w - 6 * unit, h - 6 * unit, `${seed}:fiber`, (region.roughness || 10) * unit * 0.55)
    ctx.strokeStyle = d.fiberColor || '#FFFFFF'
    ctx.lineWidth = Math.max(1, 2 * unit)
    ctx.stroke()
    ctx.restore()
  })
}

module.exports = { drawScrapbook }
