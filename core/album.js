// 相册数据：创建、增删照片、查询，以及展开为逐页列表
const { getLayout, getLayoutPage, getStyle, readingOrder, DEFAULT_STYLE_ID } = require('./registry')
const { hashRandom } = require('./render/frames')

let idSeed = 0

function newId(prefix) {
  return `${prefix}_${Date.now()}_${idSeed++}`
}

function createAlbum() {
  return {
    version: 1,
    // 书籍信息，全部选填；日期为 'YYYY-MM-DD'，结束日期可空（一日游）
    info: { title: '', author: '', companions: '', location: '', dateStart: '', dateEnd: '', message: '' },
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

// 跨页；styleId 为 null 表示跟随主模板
function createSpread(pageType, layoutId, slots) {
  return { id: newId('s'), pageType, layoutId, styleId: null, slots: slots || {} }
}

// 照片框换照片：偏移、缩放、模式重置为默认
function setSlotPhoto(spread, frameId, photoId) {
  spread.slots[frameId] = createSlot(photoId)
}

function addPhotos(album, photos) {
  album.photos = album.photos.concat(photos)
}

// 按新顺序（照片 id 数组）重排照片
function reorderPhotos(album, ids) {
  const map = {}
  album.photos.forEach(p => { map[p.id] = p })
  album.photos = ids.map(id => map[id]).filter(Boolean)
}

// 删除照片，同时清空引用它的照片框（变为空框）
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

// 反色跨页：风格提供 darkVariant 时，标记为 inverted 的跨页使用深色版本
const darkCache = {}
function darkStyleOf(style) {
  if (!darkCache[style.id]) {
    const dv = style.darkVariant
    darkCache[style.id] = Object.assign({}, style, dv, {
      id: `${style.id}:dark`,
      colors: Object.assign({}, style.colors, dv.colors)
    })
  }
  return darkCache[style.id]
}

function getSpreadStyle(album, spread) {
  const style = getStyle(spread.styleId || album.defaultStyleId)
  return spread.inverted && style.darkVariant ? darkStyleOf(style) : style
}

// 跨页中用到的照片（去重），用于渲染前预加载
function getSpreadPhotos(album, spread) {
  const ids = {}
  Object.keys(spread.slots).forEach(key => { ids[spread.slots[key].photoId] = true })
  return album.photos.filter(p => ids[p.id])
}

// 非正文页的显示名称；扉页跨页的左页是环衬
function pageLabel(pageType, side) {
  if (pageType === 'cover') return '封面'
  if (pageType === 'back') return '封底'
  if (pageType === 'title') return side === 'left' ? '环衬' : '扉页'
  return ''
}

/**
 * 把相册展开为逐页列表（编辑页一屏一页、导出逐页渲染都基于它，不存储）
 * side：left / right 为左右页；full 为跨页大图（一张 2160×1440）；single 为封面、封底等单页
 * label：封面 / 环衬 / 扉页 / P1… / 封底，正文按正文页单独编号，跨页大图算两页
 * pageNumbers：正文页印在页面上的页码，单页 [3]，跨页大图 [3, 4]；非正文页为 []
 * frameNumbers：正文照片编号 { frameId: n }，整本书连续（有照片的框才编号）
 * word：跨页的装饰词（来自风格 wordPool，按跨页 id 稳定选取，相邻跨页不重复）
 */
function getPageList(album) {
  const pages = []
  let bodyNo = 0
  let photoNo = 0
  let lastWord = ''
  album.spreads.forEach(spread => {
    const layout = getLayout(spread.layoutId)
    // 装饰词：按 id 选，和上一个跨页相同就顺延一个
    const pool = getSpreadStyle(album, spread).wordPool || []
    let word = ''
    if (pool.length && spread.pageType === 'body') {
      let i = Math.floor(hashRandom(`word:${spread.id}`) * pool.length)
      if (pool[i] === lastWord && pool.length > 1) i = (i + 1) % pool.length
      word = pool[i]
      lastWord = word
    }
    const sides = layout.span === 'pair' ? ['left', 'right'] : layout.span === 'spread' ? ['full'] : ['single']
    sides.forEach(side => {
      let label = pageLabel(spread.pageType, side)
      let pageNumbers = []
      if (!label) {
        label = side === 'full' ? `P${bodyNo + 1}-${bodyNo + 2}` : `P${bodyNo + 1}`
        pageNumbers = side === 'full' ? [bodyNo + 1, bodyNo + 2] : [bodyNo + 1]
        bodyNo += pageNumbers.length
      }
      const frameNumbers = {}
      if (spread.pageType === 'body') {
        readingOrder(getLayoutPage(layout, side).frames).forEach(f => {
          const slot = spread.slots[f.id]
          if (slot && album.photos.some(p => p.id === slot.photoId)) frameNumbers[f.id] = ++photoNo
        })
      }
      pages.push({
        spreadId: spread.id,
        pageType: spread.pageType,
        side,
        label,
        pageNumbers,
        frameNumbers,
        word,
        pageIndex: pages.length + 1,
        slots: spread.slots,
        info: album.info
      })
    })
  })
  return pages
}

/**
 * 每个跨页的显示名称：封面 / 扉页 / P1–P2 / 封底（跨页管理、预览使用）
 * @returns { spreadId: label }
 */
function getSpreadLabels(album) {
  const groups = {}
  getPageList(album).forEach(page => {
    (groups[page.spreadId] = groups[page.spreadId] || []).push(page)
  })
  const labels = {}
  album.spreads.forEach(spread => {
    const pages = groups[spread.id] || []
    labels[spread.id] = spread.pageType === 'title' ? '扉页' : pages.map(p => p.label).join('–')
  })
  return labels
}

// 某个跨页展开后的页（带页名和页码），跨页图片渲染时使用
function getSpreadPages(album, spreadId) {
  return getPageList(album).filter(p => p.spreadId === spreadId)
}

module.exports = {
  newId,
  createAlbum,
  createSlot,
  createSpread,
  setSlotPhoto,
  addPhotos,
  reorderPhotos,
  removePhoto,
  getPhoto,
  getSpread,
  getSpreadStyle,
  getSpreadPhotos,
  getPageList,
  getSpreadPages,
  getSpreadLabels
}
