// 相册数据：创建、增删照片、查询，以及展开为逐页列表
const { getLayout, getStyle, DEFAULT_STYLE_ID } = require('./registry')

let idSeed = 0

function newId(prefix) {
  return `${prefix}_${Date.now()}_${idSeed++}`
}

function createAlbum() {
  return {
    version: 1,
    // 书籍信息（阶段2 填写）
    info: { title: '', author: '', companions: '', location: '', date: '', message: '' },
    // 主模板（风格）；跨页的 styleId 为 null 时使用它
    defaultStyleId: DEFAULT_STYLE_ID,
    // 照片，顺序 = 用户选择顺序
    photos: [],
    // 跨页：换版式、换风格、增删排序的最小单位
    spreads: []
  }
}

// 照片框的显示参数；换照片时整体重置为默认（填满、居中、不缩放）
function createSlot(photoId) {
  return { photoId, fit: 'fill', offsetX: 0, offsetY: 0, scale: 1 }
}

function addPhotos(album, photos) {
  album.photos = album.photos.concat(photos)
}

// 删除照片，同时清空引用它的照片框
function removePhoto(album, photoId) {
  album.photos = album.photos.filter(p => p.id !== photoId)
  album.spreads.forEach(spread => {
    Object.keys(spread.slots).forEach(key => {
      if (spread.slots[key].photoId === photoId) delete spread.slots[key]
    })
  })
}

function getPhoto(album, photoId) {
  return album.photos.find(p => p.id === photoId) || null
}

function getSpread(album, spreadId) {
  return album.spreads.find(s => s.id === spreadId) || null
}

function getSpreadStyle(album, spread) {
  return getStyle(spread.styleId || album.defaultStyleId)
}

// 跨页中用到的照片（去重），用于渲染前预加载
function getSpreadPhotos(album, spread) {
  const ids = {}
  Object.keys(spread.slots).forEach(key => { ids[spread.slots[key].photoId] = true })
  return album.photos.filter(p => ids[p.id])
}

/**
 * 把相册展开为逐页列表（编辑页一屏一页、导出逐页渲染都基于它，不存储）
 * side：left / right 为左右页；full 为跨页大图（一张 2160×1440）；single 为封面、封底等单页
 */
function getPageList(album) {
  const pages = []
  album.spreads.forEach(spread => {
    const layout = getLayout(spread.layoutId)
    const sides = layout.span === 'pair' ? ['left', 'right'] : layout.span === 'spread' ? ['full'] : ['single']
    sides.forEach(side => {
      pages.push({ spreadId: spread.id, side, pageIndex: pages.length + 1, slots: spread.slots })
    })
  })
  return pages
}

module.exports = {
  newId,
  createAlbum,
  createSlot,
  addPhotos,
  removePhoto,
  getPhoto,
  getSpread,
  getSpreadStyle,
  getSpreadPhotos,
  getPageList
}
