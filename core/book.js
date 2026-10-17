// 生成整本书：封面 → 扉页（环衬 + 扉页）→ 正文 → 封底
const { listLayouts, getLayoutFrames } = require('./registry')
const { createSpread, createSlot } = require('./album')
const { autoLayout } = require('./autoLayout')

// 取某种页面类型的第一个版式，照片按顺序填入它的照片框
function makeSpread(pageType, photos) {
  const layout = listLayouts(pageType)[0]
  const slots = {}
  getLayoutFrames(layout).forEach((frame, i) => {
    if (photos[i]) slots[frame.id] = createSlot(photos[i].id)
  })
  return createSpread(pageType, layout.id, slots)
}

/**
 * 根据 album.photos 生成全部跨页（不修改 album，返回 spreads 数组）
 * 封面默认使用第 1 张照片（正文中照常出现）
 */
function buildBook(album) {
  return [makeSpread('cover', album.photos.slice(0, 1)), makeSpread('title', [])]
    .concat(autoLayout(album))
    .concat([makeSpread('back', [])])
}

module.exports = { buildBook }
