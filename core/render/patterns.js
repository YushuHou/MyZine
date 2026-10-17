// 几何纹样库：青海波、回纹、麻叶、七宝、波点、条纹、方格纸、点阵、横线信纸
// 全部用矢量路径直接画（不用图片），1080 宽和 2480 宽都清晰
// 用法：整页底纹（低对比度）、色块填充、页边装饰条，见 decorations.js / ornaments.js
const { mix } = require('./color')

const NAMES = ['seigaiha', 'meander', 'asanoha', 'shippo', 'dots', 'stripes', 'grid', 'dotgrid', 'lined']

/**
 * 在矩形区域内画一种纹样（先裁切到区域）
 * @param name  纹样 id（见 NAMES）
 * @param opts  { color（线 / 点的实色）, bg（底色，青海波用来遮住后排的鳞片）, cell（单元大小，画布 px）,
 *               lineWidth（画布 px）, angle（条纹角度，度）, marginColor / marginX（横线信纸左侧竖线，画布 px） }
 */
function drawPattern(ctx, name, x, y, w, h, opts) {
  const cell = Math.max(4, opts.cell || 40)
  const lw = Math.max(1, opts.lineWidth || cell * 0.04)
  ctx.save()
  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
  ctx.strokeStyle = opts.color
  ctx.fillStyle = opts.color
  ctx.lineWidth = lw
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const fn = PAINTERS[name]
  if (fn) fn(ctx, x, y, w, h, cell, lw, opts)
  ctx.restore()
}

const PAINTERS = {
  // 青海波：一排排同心圆鳞片错位叠放，后画的（下一排）盖住前一排的下半部分
  seigaiha(ctx, x, y, w, h, R, lw, opts) {
    const rings = 4
    const step = R / 2
    const rows = Math.ceil(h / step) + 3
    for (let j = 0; j < rows; j++) {
      const cy = y - R + j * step
      const off = j % 2 ? R : 0
      for (let cx = x - 2 * R + off; cx < x + w + 2 * R; cx += 2 * R) {
        ctx.beginPath()
        ctx.arc(cx, cy, R, 0, Math.PI * 2)
        ctx.fillStyle = opts.bg || '#FFFFFF'
        ctx.fill()
        ctx.beginPath()
        for (let k = 0; k < rings; k++) {
          const r = R * (1 - k / rings) - lw / 2
          if (r <= 0) continue
          ctx.moveTo(cx + r, cy)
          ctx.arc(cx, cy, r, 0, Math.PI * 2)
        }
        ctx.stroke()
      }
    }
  },

  // 回纹：方形回旋纹，相邻单元左右镜像；区域很扁（页边条）时上下各加一道边线
  meander(ctx, x, y, w, h, c, lw) {
    const pts = [[0.12, 0.88], [0.12, 0.12], [0.88, 0.12], [0.88, 0.88], [0.34, 0.88], [0.34, 0.34], [0.66, 0.34], [0.66, 0.66], [0.52, 0.66]]
    const band = h < c * 1.6
    const top = band ? y + (h - c) / 2 : y
    ctx.beginPath()
    for (let j = 0; top + j * c < y + h; j++) {
      for (let i = 0; x + i * c < x + w; i++) {
        const flip = (i + j) % 2 === 1
        pts.forEach((p, k) => {
          const px = x + (i + (flip ? 1 - p[0] : p[0])) * c
          const py = top + (j + p[1]) * c
          if (k === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        })
      }
      if (band) break
    }
    if (band) {
      ctx.moveTo(x, top + 0.02 * c)
      ctx.lineTo(x + w, top + 0.02 * c)
      ctx.moveTo(x, top + 0.98 * c)
      ctx.lineTo(x + w, top + 0.98 * c)
    }
    ctx.stroke()
  },

  // 麻叶：正三角形网格，每个三角形画三边和重心到三个顶点的连线
  asanoha(ctx, x, y, w, h, s) {
    const th = s * Math.sqrt(3) / 2
    ctx.beginPath()
    for (let j = -1; y + j * th < y + h + th; j++) {
      const y0 = y + j * th
      const off = j % 2 ? s / 2 : 0
      for (let x0 = x - s + off; x0 < x + w + s; x0 += s) {
        // 尖朝上、尖朝下两个三角形
        const tris = [
          [[x0, y0 + th], [x0 + s, y0 + th], [x0 + s / 2, y0]],
          [[x0 + s / 2, y0], [x0 + s * 1.5, y0], [x0 + s, y0 + th]]
        ]
        tris.forEach(t => {
          const gx = (t[0][0] + t[1][0] + t[2][0]) / 3
          const gy = (t[0][1] + t[1][1] + t[2][1]) / 3
          ctx.moveTo(t[0][0], t[0][1])
          ctx.lineTo(t[1][0], t[1][1])
          ctx.lineTo(t[2][0], t[2][1])
          ctx.closePath()
          t.forEach(v => {
            ctx.moveTo(gx, gy)
            ctx.lineTo(v[0], v[1])
          })
        })
      }
    }
    ctx.stroke()
  },

  // 七宝：正方形网格的格点上画圆（半径 = 格距 / √2），相邻圆交叠成花瓣
  shippo(ctx, x, y, w, h, a) {
    const r = a / Math.SQRT2
    ctx.beginPath()
    for (let cy = y; cy < y + h + a; cy += a) {
      for (let cx = x; cx < x + w + a; cx += a) {
        ctx.moveTo(cx + r, cy)
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
      }
    }
    ctx.stroke()
  },

  // 波点：交错排列的圆点
  dots(ctx, x, y, w, h, c) {
    const r = c * 0.16
    ctx.beginPath()
    for (let j = 0; y + j * c / 2 < y + h + c; j++) {
      const off = j % 2 ? c / 2 : 0
      for (let cx = x + off; cx < x + w + c; cx += c) {
        const cy = y + j * c / 2
        ctx.moveTo(cx + r, cy)
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
      }
    }
    ctx.fill()
  },

  // 条纹：等宽色条，angle 为角度（0 = 竖条，45 = 斜条）
  stripes(ctx, x, y, w, h, c, lw, opts) {
    const angle = (opts.angle == null ? 45 : opts.angle) * Math.PI / 180
    const cx = x + w / 2
    const cy = y + h / 2
    const R = Math.sqrt(w * w + h * h) / 2 + c
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    ctx.beginPath()
    for (let sx = -R; sx < R; sx += c) ctx.rect(sx, -R, c / 2, R * 2)
    ctx.fill()
  },

  // 方格纸：细方格，每 5 格一条粗线
  grid(ctx, x, y, w, h, c, lw) {
    ;[false, true].forEach(major => {
      ctx.lineWidth = major ? lw * 2 : lw
      ctx.beginPath()
      for (let i = 0; x + i * c <= x + w; i++) {
        if ((i % 5 === 0) !== major) continue
        ctx.moveTo(x + i * c, y)
        ctx.lineTo(x + i * c, y + h)
      }
      for (let j = 0; y + j * c <= y + h; j++) {
        if ((j % 5 === 0) !== major) continue
        ctx.moveTo(x, y + j * c)
        ctx.lineTo(x + w, y + j * c)
      }
      ctx.stroke()
    })
  },

  // 点阵手账纸
  dotgrid(ctx, x, y, w, h, c, lw) {
    const r = Math.max(1, lw * 1.1)
    ctx.beginPath()
    for (let cy = y + c / 2; cy < y + h; cy += c) {
      for (let cx = x + c / 2; cx < x + w; cx += c) {
        ctx.moveTo(cx + r, cy)
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
      }
    }
    ctx.fill()
  },

  // 横线信纸：横线 + 可选的左侧竖线（边距线）
  lined(ctx, x, y, w, h, c, lw, opts) {
    ctx.beginPath()
    for (let ly = y + c * 1.5; ly < y + h; ly += c) {
      ctx.moveTo(x, ly)
      ctx.lineTo(x + w, ly)
    }
    ctx.stroke()
    if (opts.marginColor) {
      ctx.strokeStyle = opts.marginColor
      ctx.beginPath()
      const mx = x + (opts.marginX || c * 2.5)
      ctx.moveTo(mx, y)
      ctx.lineTo(mx, y + h)
      ctx.stroke()
    }
  }
}

/**
 * 风格配置 → 纹样参数。纹样颜色按 alpha 预先混到底色里（实色），交叉处不会叠深
 * cfg: { name, color, alpha, cell（基准 px）, lineWidth（基准 px）, angle, margin（横线信纸边距线颜色） }
 * @param colorOf (value, fallback) → 颜色
 * @param bg      纹样所在区域的底色
 */
function patternOpts(cfg, colorOf, bg, unit) {
  const alpha = cfg.alpha == null ? 0.12 : cfg.alpha
  const color = mix(colorOf(cfg.color, '#000000'), bg, 1 - alpha)
  return {
    color,
    bg,
    cell: (cfg.cell || 40) * unit,
    lineWidth: cfg.lineWidth ? cfg.lineWidth * unit : null,
    angle: cfg.angle,
    marginColor: cfg.margin ? mix(colorOf(cfg.margin, cfg.margin), bg, 1 - Math.min(1, alpha * 2.5)) : null,
    marginX: cfg.marginX ? cfg.marginX * unit : null
  }
}

function styleColor(style) {
  return (value, fallback) => (value && style.colors[value]) || value || fallback
}

/**
 * 在矩形里铺一层风格纹样（整页底纹、色块填充共用）
 * cfg: 见 patternOpts；bg 为矩形的底色
 */
function fillPattern(ctx, style, cfg, x, y, w, h, bg, unit) {
  drawPattern(ctx, cfg.name, x, y, w, h, patternOpts(cfg, styleColor(style), bg, unit))
}

/**
 * 纹样页边条：{ name, edges: ['top', 'bottom', 'outer'], width（条宽，基准 px）, offset（离页边，基准 px）,
 *   fill（条带底色，默认页面底色）, color, alpha, cell }
 * outer 为外侧竖边：左页在左、右页在右，跨页大图 / 单页两侧都画
 */
function drawPatternBand(ctx, style, d, page, W, H, unit, bg) {
  const b = (d.width || 40) * unit
  const off = (d.offset || 0) * unit
  const fill = (d.fill && style.colors[d.fill]) || d.fill || bg
  const rects = []
  const edges = d.edges || ['top', 'bottom']
  if (edges.indexOf('top') >= 0) rects.push([0, off, W, b])
  if (edges.indexOf('bottom') >= 0) rects.push([0, H - off - b, W, b])
  if (edges.indexOf('outer') >= 0) {
    if (page.side !== 'right') rects.push([off, 0, b, H])
    if (page.side !== 'left') rects.push([W - off - b, 0, b, H])
  }
  rects.forEach(([x, y, w, h]) => {
    ctx.fillStyle = fill
    ctx.fillRect(x, y, w, h)
    fillPattern(ctx, style, d, x, y, w, h, fill, unit)
  })
  return rects.map(([x, y, w, h]) => ({ x, y, w, h }))
}

/**
 * 纹样色块：{ name, x, y, w, h（0–1）, fill（色块底色）, color, alpha, cell, mirror（右页镜像）}
 */
function drawPatternBlock(ctx, style, d, page, W, H, unit, bg) {
  const bx = d.mirror && page.side === 'right' ? 1 - d.x - d.w : d.x
  const rect = { x: bx * W, y: d.y * H, w: d.w * W, h: d.h * H }
  const fill = (d.fill && style.colors[d.fill]) || d.fill || bg
  ctx.fillStyle = fill
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h)
  fillPattern(ctx, style, d, rect.x, rect.y, rect.w, rect.h, fill, unit)
  return [rect]
}

module.exports = { NAMES, drawPattern, patternOpts, fillPattern, drawPatternBand, drawPatternBlock }
