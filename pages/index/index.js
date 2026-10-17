// 首页：书籍信息、导入照片、拖动排序，开始制作 / 继续编辑
const app = getApp()
const { createAlbum, addPhotos, removePhoto, reorderPhotos } = require('../../core/album')
const { choosePhotos } = require('../../core/photos')
const { buildBook } = require('../../core/book')
const { getFieldText } = require('../../core/bookInfo')
const { privacyErrorText } = require('../../core/wxp')
const { createGrid, moveItem } = require('../../core/ui/sortable')

const ORIENTATION_LABELS = { landscape: '横', portrait: '竖', square: '方' }
// 网格：3 列，左右边距 32rpx，间距 12rpx
const COLUMNS = 3
const PAGE_PADDING_RPX = 32
const GAP_RPX = 12

Page({
  data: {
    photos: [],
    cellSize: 0,
    gridHeight: 0,
    addX: 0,
    addY: 0,
    dragIndex: -1,
    hasBook: false,
    infoTitle: '',
    infoSub: ''
  },

  onLoad() {
    if (!app.globalData.album) app.globalData.album = createAlbum()
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const rpx = info.windowWidth / 750
    this.grid = createGrid(info.windowWidth - PAGE_PADDING_RPX * 2 * rpx, COLUMNS, GAP_RPX * rpx, 1)
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const album = app.globalData.album
    const info = album.info
    const grid = this.grid
    const count = album.photos.length
    const add = grid.position(count)
    this.setData({
      photos: album.photos.map((p, i) => {
        const pos = grid.position(i)
        return { id: p.id, src: p.thumbPath || p.displayPath, label: ORIENTATION_LABELS[p.orientation], x: pos.x, y: pos.y }
      }),
      cellSize: grid.cellW,
      // 最后一格是「继续添加」
      gridHeight: grid.height(count + 1),
      addX: add.x,
      addY: add.y,
      dragIndex: -1,
      hasBook: album.spreads.length > 0,
      infoTitle: getFieldText(info, 'title'),
      infoSub: getFieldText(info, 'locationDate') || getFieldText(info, 'author')
    })
  },

  async onAddPhotos() {
    if (this.busy) return
    this.busy = true
    try {
      const res = await choosePhotos((done, total) => {
        wx.showLoading({ title: `读取照片 ${done + 1}/${total}`, mask: true })
      })
      if (res.cancelled) return
      wx.hideLoading()
      addPhotos(app.globalData.album, res.photos)
      this.refresh()
      if (res.failed) wx.showToast({ title: `${res.failed} 张照片读取失败`, icon: 'none' })
    } catch (err) {
      console.error('选择照片失败', err)
      wx.hideLoading()
      wx.showToast({ title: privacyErrorText(err) || '选择照片失败', icon: 'none' })
    } finally {
      this.busy = false
    }
  },

  onEditInfo() {
    wx.navigateTo({ url: '/pages/info/info' })
  },

  // 删除照片；正在照片框中使用的，对应框变为空框
  onRemove(e) {
    removePhoto(app.globalData.album, e.currentTarget.dataset.id)
    this.refresh()
  },

  // ---------- 拖动排序（由 sortable.wxs 调用） ----------

  onSortStart({ index }) {
    this.sort = { from: index, to: index, rect: null }
    this.setData({ dragIndex: index })
    wx.vibrateShort({ type: 'light' })
    wx.createSelectorQuery().select('.grid').boundingClientRect(rect => {
      if (this.sort) this.sort.rect = rect
    }).exec()
  },

  onSortMove({ x, y }) {
    const sort = this.sort
    if (!sort || !sort.rect) return
    const count = this.data.photos.length
    const to = this.grid.indexAt(x - sort.rect.left, y - sort.rect.top, count)
    if (to === sort.to) return
    sort.to = to
    // 其余照片移到新位置让出空位；被拖的照片由 wxs 跟随手指，位置不在这里更新
    const order = moveItem(this.data.photos.map((p, i) => i), sort.from, to)
    const changes = {}
    order.forEach((photoIndex, slotIndex) => {
      if (photoIndex === sort.from) return
      const pos = this.grid.position(slotIndex)
      const item = this.data.photos[photoIndex]
      if (item.x !== pos.x || item.y !== pos.y) {
        changes[`photos[${photoIndex}].x`] = pos.x
        changes[`photos[${photoIndex}].y`] = pos.y
      }
    })
    this.setData(changes)
  },

  onSortEnd() {
    const sort = this.sort
    this.sort = null
    if (sort && sort.to !== sort.from) {
      const ids = moveItem(this.data.photos.map(p => p.id), sort.from, sort.to)
      reorderPhotos(app.globalData.album, ids)
    }
    this.refresh()
  },

  // ---------- 制作 ----------

  onStart() {
    const album = app.globalData.album
    if (!album.photos.length) return
    album.spreads = buildBook(album)
    wx.navigateTo({ url: '/pages/editor/editor' })
  },

  // 保留已做的编辑，新加的照片在照片面板中显示为未使用
  onContinue() {
    wx.navigateTo({ url: '/pages/editor/editor' })
  },

  onRelayout() {
    const album = app.globalData.album
    if (!album.photos.length) return
    wx.showModal({
      title: '重新排版',
      content: '将按当前照片顺序重新生成整本书，已做的修改会丢失',
      confirmText: '重新排版',
      success: res => {
        if (!res.confirm) return
        album.spreads = buildBook(album)
        wx.navigateTo({ url: '/pages/editor/editor' })
      }
    })
  }
})
