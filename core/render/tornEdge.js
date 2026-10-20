// 撕纸边照片（阶段 8a）：照片的一两条边像被撕开，边缘露出一圈白色纸芯和轻微投影
// 风格配置 photoFrame.torn：{ chance, minArea, depth, jag, fiber, color, shadow }
//   chance   符合条件的照片框撕边的比例；minArea 照片框面积（占页面比例）小于它的不撕
//   depth    撕口向照片内收的平均深度（基准 px）；jag 毛边起伏；fiber 白色纸芯宽度
// 只用于矩形照片；满版照片优先撕不贴页边的那侧，整页满版时撕上边或下边
const { hashRandom } = require('./frames')

const SIDES = ['top', 'right', 'bottom', 'left']
const OPPOSITE = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }

// 照片框哪些边贴着页面边缘
function edgesOnPage(f) {
  const on = {}
  if (f.y <= 0.001) on.top = true
  if (f.x <= 0.001) on.left = true
  if (f.y + f.h >= 0.999) on.bottom = true
  if (f.x + f.w >= 0.999) on.right = true
  return on
}

/**
 * 这个照片框撕不撕、撕哪几条边；不撕返回 null
 * @param f  已带 shape / bleed 的照片框（resolveFrames 内部调用）
 */
function tornSpecOf(f, style, seedKey) {
  const cfg = (style.photoFrame || {}).torn
  if (!cfg || f.border === false || f.mat) return null
  if (f.shape !== 'rect' && f.shape !== 'rounded') return null
  if (f.w * f.h < (cfg.minArea == null ? 0.12 : cfg.minArea)) return null
  const r = k => hashRandom(`${seedKey}:${f.id}:torn:${k}`)
  if (r('on') >= (cfg.chance == null ? 0.5 : cfg.chance)) return null
  const on = edgesOnPage(f)
  const inner = SIDES.filter(s => !on[s])
  // 整页满版：只撕上边或下边
  const pool = inner.length ? inner : ['top', 'bottom']
  const first = pool[Math.floor(r('edge') * pool.length)]
  const edges = [first]
  // 约四成再撕对边（对边可撕时）
  if (r('two') < 0.4 && pool.indexOf(OPPOSITE[first]) >= 0) edges.push(OPPOSITE[first])
  return {
    edges,
    depth: cfg.depth || 22,
    jag: cfg.jag || 7,
    fiber: cfg.fiber || 9,
    color: cfg.color || '#FBF8F1',
    shadow: cfg.shadow === undefined ? { color: 'rgba(60, 45, 30, 0.22)', blur: 10, offsetX: 0, offsetY: 3 } : cfg.shadow
  }
}

// 一条撕边的内收深度：两段低频起伏 + 高频毛刺，返回 n+1 个点（画布 px，均 ≥ 0）
function profile(n, spec, unit, r) {
  const jag = spec.jag * unit
  const base = spec.depth * unit
  const a1 = jag * 1.4
  const a2 = jag * 0.7
  const f1 = 0.6 + r() * 0.8
  const f2 = 2 + r() * 2
  const p1 = r()
  const p2 = r()
  const out = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const d = base + a1 * Math.sin(2 * Math.PI * (f1 * t + p1)) + a2 * Math.sin(2 * Math.PI * (f2 * t + p2)) + (r() - 0.5) * jag
    out.push(Math.max(0, d))
  }
  return out
}

// 每条撕边的深度表（纸芯层与照片层共用同一条起伏，纸芯再往外让出 fiber 宽）
function buildEdges(spec, rect, unit, seed) {
  let i = 0
  const r = () => hashRandom(`${seed}:tear:${i++}`)
  const step = 9 * unit
  const edges = {}
  spec.edges.forEach(side => {
    const len = side === 'top' || side === 'bottom' ? rect.w : rect.h
    const n = Math.max(4, Math.round(len / step))
    const photo = profile(n, spec, unit, r)
    const fiber = photo.map(d => d - spec.fiber * unit * (0.55 + r() * 0.6))
    edges[side] = { photo, fiber }
  })
  return edges
}

// 沿矩形顺时针描出撕边路径；layer：'photo' 照片层 | 'fiber' 纸芯层
function tracePath(ctx, rect, edges, layer) {
  const { x, y, w, h } = rect
  ctx.beginPath()
  ctx.moveTo(x, y)
  const run = (side, fn) => {
    const e = edges[side]
    if (!e) return
    const ds = e[layer]
    ds.forEach((d, i) => fn(i / (ds.length - 1), d))
  }
  // 上边：左 → 右
  if (edges.top) run('top', (t, d) => ctx.lineTo(x + t * w, y + d))
  else ctx.lineTo(x + w, y)
  // 右边：上 → 下
  if (edges.right) run('right', (t, d) => ctx.lineTo(x + w - d, y + t * h))
  else ctx.lineTo(x + w, y + h)
  // 下边：右 → 左
  if (edges.bottom) run('bottom', (t, d) => ctx.lineTo(x + w - t * w, y + h - d))
  else ctx.lineTo(x, y + h)
  // 左边：下 → 上
  if (edges.left) run('left', (t, d) => ctx.lineTo(x + d, y + h - t * h))
  else ctx.lineTo(x, y)
  ctx.closePath()
}

/**
 * 画撕边照片：纸芯层（白色 + 投影）→ 按撕边裁切后调用 paint 画照片
 * @param rect  照片框区域（画布 px，已在照片框坐标系中）
 * @param paint (rect) => void，在裁切区域内画照片
 */
function drawTornPhoto(ctx, spec, rect, unit, seed, paint) {
  const edges = buildEdges(spec, rect, unit, seed)
  ctx.save()
  if (spec.shadow) {
    ctx.shadowColor = spec.shadow.color
    ctx.shadowBlur = spec.shadow.blur * unit
    ctx.shadowOffsetX = (spec.shadow.offsetX || 0) * unit
    ctx.shadowOffsetY = (spec.shadow.offsetY || 0) * unit
  }
  ctx.fillStyle = spec.color
  tracePath(ctx, rect, edges, 'fiber')
  ctx.fill()
  ctx.restore()
  ctx.save()
  tracePath(ctx, rect, edges, 'photo')
  ctx.clip()
  paint(rect)
  ctx.restore()
}

module.exports = { tornSpecOf, drawTornPhoto }
