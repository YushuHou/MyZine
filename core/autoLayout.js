// 自动排版：照片按顺序填入正文跨页，按方向匹配版式并轮换
const { listLayouts, getLayoutFrames } = require('./registry')
const { createSpread, createSlot } = require('./album')

// 照片方向与框方向的匹配分：一致 2，任一方为方形 1，横竖相反 0
function matchScore(frameOrientation, photoOrientation) {
  if (frameOrientation === photoOrientation) return 2
  if (frameOrientation === 'square' || photoOrientation === 'square') return 1
  return 0
}

// 比较两个候选：平均匹配分高者优先；同分时用得少的优先（轮换）；再同则避免与上一跨页相同
function isBetter(a, b, usage, lastId) {
  if (Math.abs(a.score - b.score) > 1e-6) return a.score > b.score
  const ua = usage[a.layout.id]
  const ub = usage[b.layout.id]
  if (ua !== ub) return ua < ub
  return b.layout.id === lastId && a.layout.id !== lastId
}

/**
 * 根据 album.photos 生成正文跨页（不修改 album，返回 spreads 数组）
 */
function autoLayout(album) {
  const layouts = listLayouts('body')
  const photos = album.photos
  const usage = {}
  layouts.forEach(l => { usage[l.id] = 0 })

  const spreads = []
  let lastId = null
  let i = 0
  while (i < photos.length) {
    const remain = photos.length - i
    // 优先选能被剩余照片填满的版式；都填不满时用照片框最少的版式，空框显示占位色
    let candidates = layouts.filter(l => getLayoutFrames(l).length <= remain)
    if (!candidates.length) {
      const minCount = Math.min.apply(null, layouts.map(l => getLayoutFrames(l).length))
      candidates = layouts.filter(l => getLayoutFrames(l).length === minCount)
    }

    let best = null
    candidates.forEach(layout => {
      const frames = getLayoutFrames(layout)
      let score = 0
      frames.forEach((frame, k) => {
        const photo = photos[i + k]
        if (photo) score += matchScore(frame.orientation, photo.orientation)
      })
      const item = { layout, frames, score: score / frames.length }
      if (!best || isBetter(item, best, usage, lastId)) best = item
    })

    const slots = {}
    best.frames.forEach((frame, k) => {
      const photo = photos[i + k]
      if (photo) slots[frame.id] = createSlot(photo.id)
    })
    spreads.push(createSpread('body', best.layout.id, slots))

    usage[best.layout.id]++
    lastId = best.layout.id
    i += best.frames.length
  }
  return spreads
}

module.exports = { autoLayout }
