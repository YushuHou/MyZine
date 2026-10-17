// 首页：导入照片，开始制作
const app = getApp()
const { createAlbum, addPhotos, removePhoto } = require('../../core/album')
const { choosePhotos } = require('../../core/photos')
const { buildBook } = require('../../core/book')
const { getFieldText } = require('../../core/bookInfo')
const { privacyErrorText } = require('../../core/wxp')

const ORIENTATION_LABELS = { landscape: '横', portrait: '竖', square: '方' }

Page({
  data: {
    photos: [],
    infoTitle: '',
    infoSub: ''
  },

  onLoad() {
    if (!app.globalData.album) app.globalData.album = createAlbum()
  },

  onShow() {
    this.refresh()
  },

  refresh() {
    const album = app.globalData.album
    const info = album.info
    this.setData({
      photos: album.photos.map(p => ({ id: p.id, src: p.displayPath, label: ORIENTATION_LABELS[p.orientation] })),
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

  onRemove(e) {
    removePhoto(app.globalData.album, e.currentTarget.dataset.id)
    this.refresh()
  },

  onStart() {
    const album = app.globalData.album
    if (!album.photos.length) return
    album.spreads = buildBook(album)
    wx.navigateTo({ url: '/pages/editor/editor' })
  }
})
