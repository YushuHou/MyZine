// 自动排版：照片按顺序填入正文跨页，按方向匹配版式并轮换，再按版式节奏微调
const { listLayouts, getLayoutFrames, getStyle } = require('./registry')
const { createSpread, createSlot } = require('./album')

// 反色跨页的间隔：约每 5 个正文跨页一个（风格提供 darkVariant 时才生效）
const INVERT_EVERY = 5

// 照片方向与框方向的匹配分：一致 2，任一方为方形 1，横竖相反 0
function matchScore(frameOrientation, photoOrientation) {
  if (frameOrientation === photoOrientation) return 2
  if (frameOrientation === 'square' || photoOrientation === 'square') return 1
  return 0
}

/**
 * 自动排版的出现权重：版式 autoWeight（未设置为 1）× 风格偏好（style.layoutWeights[版式 id]）
 */
function weightOf(layout, style) {
  const base = layout.autoWeight == null ? 1 : layout.autoWeight
  const prefer = style && style.layoutWeights ? style.layoutWeights[layout.id] : null
  return base * (prefer == null ? 1 : prefer)
}

// 轮换指标：(已使用次数 + 1) / 权重，越小越优先。加 1 让权重在都没用过时也起作用
function rotation(item, usage) {
  return (usage[item.layout.id] + 1) / item.weight
}

/**
 * 节奏罚分（越小越优先），按版式 density：
 * - 不连续出现两个 dense
 * - 连续两个 normal 之后，有方向匹配的 airy 就优先
 */
function rhythmPenalty(item, history) {
  const d = item.layout.density || 'normal'
  const last = history[history.length - 1]
  const prev = history[history.length - 2]
  if (last === 'dense' && d === 'dense') return 2
  if (last === 'normal' && prev === 'normal' && d !== 'airy') return 1
  return 0
}

// 比较两个候选：平均匹配分高者优先；同分时先看节奏，再按轮换指标；再同则避免与上一跨页相同
function isBetter(a, b, usage, lastId, history) {
  if (Math.abs(a.score - b.score) > 1e-6) return a.score > b.score
  const pa = rhythmPenalty(a, history)
  const pb = rhythmPenalty(b, history)
  if (pa !== pb) return pa < pb
  const ra = rotation(a, usage)
  const rb = rotation(b, usage)
  if (Math.abs(ra - rb) > 1e-6) return ra < rb
  return b.layout.id === lastId && a.layout.id !== lastId
}

/**
 * 根据 album.photos 生成正文跨页（不修改 album，返回 spreads 数组）
 * 约每 5 个正文跨页标记一个 inverted（反色跨页），风格没有深色版本时不影响显示
 */
function autoLayout(album) {
  const style = getStyle(album.defaultStyleId)
  // 权重为 0 的版式不参与自动排版（仍可在跨页管理中手动选择）
  const layouts = listLayouts('body').filter(l => weightOf(l, style) > 0)
  const photos = album.photos
  const usage = {}
  layouts.forEach(l => { usage[l.id] = 0 })

  const spreads = []
  const history = []
  let lastId = null
  let lastSpan = null
  let i = 0
  while (i < photos.length) {
    const remain = photos.length - i
    // 优先选能被剩余照片填满的版式；都填不满时用照片框最少的版式，空框显示占位色
    let candidates = layouts.filter(l => getLayoutFrames(l).length <= remain)
    if (!candidates.length) {
      const minCount = Math.min.apply(null, layouts.map(l => getLayoutFrames(l).length))
      candidates = layouts.filter(l => getLayoutFrames(l).length === minCount)
    }
    // 跨页大图不连续出现
    if (lastSpan === 'spread') {
      const others = candidates.filter(l => l.span !== 'spread')
      if (others.length) candidates = others
    }

    let best = null
    candidates.forEach(layout => {
      const frames = getLayoutFrames(layout)
      let score = 0
      frames.forEach((frame, k) => {
        const photo = photos[i + k]
        if (photo) score += matchScore(frame.orientation, photo.orientation)
      })
      score /= frames.length
      // 选它会让最后只剩 1 张照片时降低优先级：剩下的 1 张只能进跨页大图（横框），竖图会被裁得很难看
      if (remain - frames.length === 1) score -= 0.5
      const item = { layout, frames, score, weight: weightOf(layout, style) }
      if (!best || isBetter(item, best, usage, lastId, history)) best = item
    })

    const slots = {}
    best.frames.forEach((frame, k) => {
      const photo = photos[i + k]
      if (photo) slots[frame.id] = createSlot(photo.id)
    })
    const spread = createSpread('body', best.layout.id, slots)
    // 反色跨页：第 5、10、15… 个正文跨页（位置固定，不会连续）
    if ((spreads.length + 1) % INVERT_EVERY === 0) spread.inverted = true
    spreads.push(spread)

    usage[best.layout.id]++
    lastId = best.layout.id
    lastSpan = best.layout.span
    history.push(best.layout.density || 'normal')
    i += best.frames.length
  }
  return spreads
}

module.exports = { autoLayout }
