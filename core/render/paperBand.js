// 撕纸色带（阶段 8b）：一条横贯左右两页的撕边纸带，衬在照片下面，把两页连成一个整体
// 大装饰配置：{ type: 'paperBand', colors, mix（与白色混合的比例，越大越淡）, y: [中心最小, 最大], height: [最小, 最大]（占页高比例）, weight }
// 毛边按整个跨页的坐标生成，左右页各画自己的一半，过中缝时连续
const { hashRandom } = require('./frames')
const { mix } = require('./color')

// 一条撕边：沿跨页宽度的起伏（画布 px），点距 step
function tornEdge(key, spreadW, step, jag) {
  const n = Math.max(4, Math.round(spreadW / step))
  const r = i => hashRandom(`${key}:${i}`)
  const f1 = 1 + r('f1') * 1.5
  const f2 = 4 + r('f2') * 3
  const p1 = r('p1')
  const p2 = r('p2')
  const ys = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    ys.push(jag * 2.2 * Math.sin(2 * Math.PI * (f1 * t + p1)) + jag * 0.8 * Math.sin(2 * Math.PI * (f2 * t + p2)) + (r(i) - 0.5) * jag)
  }
  return { n, ys }
}

// 描出色带路径：上边从左到右，下边从右到左；inflate 让纸芯层比纸面宽一圈
function bandPath(ctx, top, bottom, y0, y1, spreadW, ox, inflate) {
  ctx.beginPath()
  top.ys.forEach((d, i) => {
    const x = ox + spreadW * i / top.n
    const y = y0 + d - inflate * (1 + 0.6 * Math.sin(i * 1.7))
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  for (let i = bottom.n; i >= 0; i--) {
    ctx.lineTo(ox + spreadW * i / bottom.n, y1 + bottom.ys[i] + inflate * (1 + 0.6 * Math.cos(i * 1.3)))
  }
  ctx.closePath()
}

/**
 * @param big   装饰计划中的 { cfg, y, height }（占页高比例）
 * @param tone  跨页主色调（风格颜色键或色值）
 * @returns 小装饰要避开的区域：色带上可以放贴纸，返回空
 */
function drawPaperBand(ctx, style, cfg, big, page, W, H, unit, images, tone) {
  if (page.side === 'single') return []
  // 整个跨页的宽度和本页在跨页中的偏移
  const spreadW = page.side === 'full' ? W : W * 2
  const ox = page.side === 'right' ? -W : 0
  const colors = cfg.colors || ['accent']
  const key = tone || colors[Math.floor(hashRandom(`${page.spreadId || ''}:band:c`) * colors.length)]
  const base = style.colors[key] || key
  const color = mix(base, '#FFFFFF', cfg.mix == null ? 0.55 : cfg.mix)
  const y0 = (big.y - big.height / 2) * H
  const y1 = (big.y + big.height / 2) * H
  const jag = 5 * unit
  const step = 10 * unit
  const seed = `${page.spreadId || ''}:band`
  const top = tornEdge(`${seed}:top`, spreadW, step, jag)
  const bottom = tornEdge(`${seed}:bottom`, spreadW, step, jag)
  ctx.save()
  // 白色纸芯 + 投影
  ctx.save()
  ctx.shadowColor = 'rgba(60, 45, 30, 0.18)'
  ctx.shadowBlur = 10 * unit
  ctx.shadowOffsetY = 3 * unit
  ctx.fillStyle = '#FBF8F1'
  bandPath(ctx, top, bottom, y0, y1, spreadW, ox, 6 * unit)
  ctx.fill()
  ctx.restore()
  // 纸面
  bandPath(ctx, top, bottom, y0, y1, spreadW, ox, 0)
  ctx.fillStyle = color
  ctx.fill()
  // 叠一层风格的纸纹（正片叠底），色带也有纸张质感
  const bg = style.background || {}
  const tex = bg.type === 'image' && images && images[`asset:${bg.src}`]
  if (tex) {
    ctx.clip()
    ctx.globalCompositeOperation = 'multiply'
    ctx.globalAlpha = 0.6
    const img = tex.image
    const tile = (bg.tile || 540) * unit
    const th = tile * img.height / img.width
    for (let y = Math.floor(y0 / th) * th - th; y < y1 + th; y += th) {
      for (let x = 0; x < W; x += tile) ctx.drawImage(img, x, y, tile, th)
    }
  }
  ctx.restore()
  return []
}

module.exports = { drawPaperBand }
