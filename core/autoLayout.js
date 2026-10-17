// 自动排版：照片按顺序填入正文跨页，按方向匹配版式并轮换
const { listLayouts, getLayoutFrames } = require('./registry')
const { createSpread, createSlot } = require('./album')

// 照片方向与框方向的匹配分：一致 2，任一方为方形 1，横竖相反 0
function matchScore(frameOrientation, photoOrientation) {
  if (frameOrientation === photoOrientation) return 2
  if (frameOrientation === 'square' || photoOrientation === 'square') return 1
  return 0
}

// 自动排版的出现权重：未设置为 1，越小越少出现
function weightOf(layout) {
  return layout.autoWeight == null ? 1 : layout.autoWeight
}

// 轮换指标：(已使用次数 + 1) / 权重，越小越优先。加 1 让权重在都没用过时也起作用
function rotation(layout, usage) {
  return (usage[layout.id] + 1) / weightOf(layout)
}

// 照片多（4 张及以上）的跨页算「密」
const DENSE_COUNT = 4

// 节奏：上一个跨页是密的，这个也密就记 1（排在后面），让密与疏交替
function densityPenalty(item, lastCount) {
  return lastCount >= DENSE_COUNT && item.frames.length >= DENSE_COUNT ? 1 : 0
}

// 比较两个候选：平均匹配分高者优先；同分时先看节奏（密的之后优先疏的），再按轮换指标；再同则避免与上一跨页相同
function isBetter(a, b, usage, lastId, lastCount) {
  if (Math.abs(a.score - b.score) > 1e-6) return a.score > b.score
  const da = densityPenalty(a, lastCount)
  const db = densityPenalty(b, lastCount)
  if (da !== db) return da < db
  const ra = rotation(a.layout, usage)
  const rb = rotation(b.layout, usage)
  if (Math.abs(ra - rb) > 1e-6) return ra < rb
  return b.layout.id === lastId && a.layout.id !== lastId
}

/**
 * 根据 album.photos 生成正文跨页（不修改 album，返回 spreads 数组）
 */
function autoLayout(album) {
  // 权重为 0 的版式不参与自动排版（仍可在跨页管理中手动选择）
  const layouts = listLayouts('body').filter(l => weightOf(l) > 0)
  const photos = album.photos
  const usage = {}
  layouts.forEach(l => { usage[l.id] = 0 })

  const spreads = []
  let lastId = null
  let lastSpan = null
  let lastCount = 0
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
      const item = { layout, frames, score }
      if (!best || isBetter(item, best, usage, lastId, lastCount)) best = item
    })

    const slots = {}
    best.frames.forEach((frame, k) => {
      const photo = photos[i + k]
      if (photo) slots[frame.id] = createSlot(photo.id)
    })
    spreads.push(createSpread('body', best.layout.id, slots))

    usage[best.layout.id]++
    lastId = best.layout.id
    lastSpan = best.layout.span
    lastCount = best.frames.length
    i += best.frames.length
  }
  return spreads
}

module.exports = { autoLayout }
