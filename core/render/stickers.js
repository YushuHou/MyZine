// 图片素材装饰（阶段 8a）：贴纸、压在照片角上的贴纸、图片纸胶带、便签纸
// 图片来自素材分包（见 assetPacks.js），找不到图片时不画
const { hashRandom } = require('./frames')
const { packKey } = require('./assetPacks')
const { drawGlyphText, measureGlyphText } = require('./glyphText')

function colorOf(style, value, fallback) {
  return (value && style.colors[value]) || value || fallback
}

// 贴纸、便签纸的默认投影：贴在纸上的轻微浮起感
const DEFAULT_SHADOW = { color: 'rgba(60, 45, 30, 0.2)', blur: 10, offsetX: 0, offsetY: 4 }

// 图片表中的素材；没有时返回 null
function packImage(images, name) {
  const entry = name && images && images[packKey(name)]
  return entry && entry.image ? entry.image : null
}

// 按长边 size 等比缩放后的宽高
function fitLong(img, size) {
  const k = size / Math.max(img.width, img.height)
  return { w: img.width * k, h: img.height * k }
}

function applyShadow(ctx, shadow, unit) {
  if (!shadow) return
  ctx.shadowColor = shadow.color
  ctx.shadowBlur = shadow.blur * unit
  ctx.shadowOffsetX = (shadow.offsetX || 0) * unit
  ctx.shadowOffsetY = (shadow.offsetY || 0) * unit
}

/**
 * 贴纸：以 (cx, cy) 为中心、长边 size（画布 px），旋转 angle 度
 * @returns 是否画了（图片缺失时为 false）
 */
function drawSticker(ctx, images, name, cx, cy, size, angle, unit, shadow) {
  const img = packImage(images, name)
  if (!img) return false
  const { w, h } = fitLong(img, size)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle * Math.PI / 180)
  applyShadow(ctx, shadow === undefined ? DEFAULT_SHADOW : shadow, unit)
  ctx.drawImage(img, -w / 2, -h / 2, w, h)
  ctx.restore()
  return true
}

/**
 * 压在照片角上的贴纸（照片框装饰，坐标系已按照片框旋转），大约四分之三露在照片外
 * cfg: { type: 'frameSticker', names, size: [最小, 最大]（基准 px）, corners, chance, maxRatio（不超过照片短边的比例）}
 * @param item 装饰计划分好的 { name, corner, size（基准 px）, angle }
 */
function drawFrameSticker(ctx, images, cfg, item, rect, unit) {
  const size = Math.min(item.size * unit, Math.min(rect.w, rect.h) * (cfg.maxRatio || 0.6))
  const inset = size * 0.16
  const cx = item.corner.indexOf('left') >= 0 ? rect.x + inset : rect.x + rect.w - inset
  const cy = item.corner.indexOf('top') >= 0 ? rect.y + inset : rect.y + rect.h - inset
  drawSticker(ctx, images, item.name, cx, cy, size, item.angle, unit, cfg.shadow)
}

/**
 * 图片纸胶带：以当前原点为中心，宽 w（画布 px），高按图片比例；调用方已平移、旋转
 * @returns 是否画了
 */
function drawImageTape(ctx, images, name, w, alpha) {
  const img = packImage(images, name)
  if (!img) return false
  const h = w * img.height / img.width
  ctx.save()
  ctx.globalAlpha = alpha == null ? 0.94 : alpha
  ctx.drawImage(img, -w / 2, -h / 2, w, h)
  ctx.restore()
  return true
}

/**
 * 便签纸：撕边便签纸图片 + 手写短句，可在顶边夹一个燕尾夹
 * cfg: { type: 'note', images, size: [最小, 最大]（长边，基准 px）, clip（燕尾夹素材名）, clipChance, font, text: ['pool', 'place'], color }
 * @param item 装饰计划分好的 { image, clip }
 * @param size 长边（画布 px）
 * @param text 便签上的字（为空时只画纸）
 */
function drawNote(ctx, style, images, cfg, item, cx, cy, size, text, unit, seed) {
  const img = packImage(images, item.image)
  if (!img) return
  const r = k => hashRandom(`${seed}:note:${k}`)
  const { w, h } = fitLong(img, size)
  const angle = (r('a') * 2 - 1) * 6
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle * Math.PI / 180)
  ctx.save()
  applyShadow(ctx, DEFAULT_SHADOW, unit)
  ctx.drawImage(img, -w / 2, -h / 2, w, h)
  ctx.restore()
  if (text) {
    const font = cfg.font || { glyph: 'caveat', family: 'serif', size: 46 }
    const spec = { glyph: font.glyph, family: font.family || 'serif', weight: font.weight, size: (font.size || 46) * unit, letterSpacing: (font.letterSpacing || 0) * unit }
    const maxW = w * 0.74
    const tw = measureGlyphText(ctx, spec, text)
    if (tw > maxW) {
      spec.size *= maxW / tw
      spec.letterSpacing *= maxW / tw
    }
    drawGlyphText(ctx, spec, text, 0, h * 0.06, 'center', colorOf(style, cfg.color || font.color, style.colors.text))
  }
  // 燕尾夹：夹在顶边，略偏一侧
  const clip = item.clip && packImage(images, item.clip)
  if (clip) {
    const cw = w * 0.34
    const ch = cw * clip.height / clip.width
    ctx.save()
    ctx.translate((r('cx') - 0.5) * w * 0.3, -h / 2)
    // 燕尾夹图片是横放的（夹身在左、把手在右）：转成把手朝上，夹身一部分压在纸上
    ctx.rotate(-Math.PI / 2)
    applyShadow(ctx, { color: 'rgba(40, 40, 40, 0.25)', blur: 6, offsetX: 0, offsetY: 2 }, unit)
    ctx.drawImage(clip, -cw * 0.25, -ch / 2, cw, ch)
    ctx.restore()
  }
  ctx.restore()
}

module.exports = { packImage, drawSticker, drawFrameSticker, drawImageTape, drawNote }
