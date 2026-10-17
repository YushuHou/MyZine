// 跨页增删、排序、换版式。只操作正文跨页；封面、扉页在最前，封底在最后，位置固定
const { getLayout, getLayoutFrames } = require('./registry')
const { createSpread, createSlot } = require('./album')

const HEAD_TYPES = ['cover', 'title']

function splitSpreads(album) {
  return {
    head: album.spreads.filter(s => HEAD_TYPES.indexOf(s.pageType) >= 0),
    body: album.spreads.filter(s => s.pageType === 'body'),
    tail: album.spreads.filter(s => s.pageType === 'back')
  }
}

function isFixedSpread(spread) {
  return spread.pageType !== 'body'
}

// 新建空的正文跨页，插入到 afterId 之后；不传 afterId 则追加到正文末尾（封底之前）
function insertBodySpread(album, layoutId, afterId) {
  const spread = createSpread('body', layoutId, {})
  const parts = splitSpreads(album)
  const index = afterId ? parts.body.findIndex(s => s.id === afterId) + 1 : parts.body.length
  parts.body.splice(index, 0, spread)
  album.spreads = parts.head.concat(parts.body, parts.tail)
  return spread
}

// 删除正文跨页；其中的照片仍保留在照片库中
function removeBodySpread(album, spreadId) {
  album.spreads = album.spreads.filter(s => s.id !== spreadId || isFixedSpread(s))
}

// 按新顺序（正文跨页 id 数组）重排正文
function setBodyOrder(album, ids) {
  const parts = splitSpreads(album)
  const map = {}
  parts.body.forEach(s => { map[s.id] = s })
  album.spreads = parts.head.concat(ids.map(id => map[id]).filter(Boolean), parts.tail)
}

/**
 * 换版式：原有照片按先后顺序依次放进新版式的照片框，位置和缩放重置
 * @returns 被移出本跨页的照片数（新版式照片框更少时）
 */
function changeSpreadLayout(album, spreadId, layoutId) {
  const spread = album.spreads.find(s => s.id === spreadId)
  if (!spread || spread.layoutId === layoutId) return 0
  const photoIds = getLayoutFrames(getLayout(spread.layoutId))
    .map(f => spread.slots[f.id])
    .filter(Boolean)
    .map(slot => slot.photoId)
  const frames = getLayoutFrames(getLayout(layoutId))
  const slots = {}
  frames.forEach((frame, i) => {
    if (photoIds[i]) slots[frame.id] = createSlot(photoIds[i])
  })
  spread.layoutId = layoutId
  spread.slots = slots
  return Math.max(0, photoIds.length - frames.length)
}

module.exports = {
  splitSpreads,
  isFixedSpread,
  insertBodySpread,
  removeBodySpread,
  setBodyOrder,
  changeSpreadLayout
}
