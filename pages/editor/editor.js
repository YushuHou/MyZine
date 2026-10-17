// 编辑页：一屏显示一页，翻页，保存本页到相册
const app = getApp()
const { getPageList, getSpread, getSpreadPhotos, getSpreadStyle } = require('../../core/album')
const { getLayout } = require('../../core/registry')
const { renderPage } = require('../../core/render/renderPage')
const { createImageLoader } = require('../../core/render/imageLoader')
const { renderPageToFile, saveToPhotosAlbum, removeExportFile } = require('../../core/export/saveImage')

// 底部工具栏预留高度（px）
const TOOLBAR_HEIGHT = 170
// 左右滑动翻页的最小距离（px）
const SWIPE_DISTANCE = 50

function getWindowInfo() {
  return wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
}

// 画布显示尺寸：单页 3:4，在可用区域内尽量大
function computeCanvasSize(info) {
  const maxW = info.windowWidth - 32
  const maxH = info.windowHeight - TOOLBAR_HEIGHT
  let w = maxW
  let h = w * 4 / 3
  if (h > maxH) {
    h = maxH
    w = h * 3 / 4
  }
  return { w: Math.floor(w), h: Math.floor(h) }
}

Page({
  data: {
    canvasW: 0,
    canvasH: 0,
    current: 0,
    total: 0,
    guides: false,
    saving: false
  },

  onLoad() {
    this.album = app.globalData.album
    if (!this.album || !this.album.spreads.length) {
      wx.navigateBack()
      return
    }
    this.pages = getPageList(this.album)
    this.windowInfo = getWindowInfo()
    const size = computeCanvasSize(this.windowInfo)
    this.setData({ canvasW: size.w, canvasH: size.h, total: this.pages.length })
  },

  onReady() {
    if (!this.pages) return
    wx.createSelectorQuery()
      .select('#pageCanvas')
      .fields({ node: true, size: true })
      .exec(res => {
        const canvas = res[0] && res[0].node
        if (!canvas) return
        // 按设备像素比设置画布实际像素，renderPage 按画布宽度自动换算
        const dpr = this.windowInfo.pixelRatio || 2
        canvas.width = Math.round(this.data.canvasW * dpr)
        canvas.height = Math.round(this.data.canvasH * dpr)
        this.canvas = canvas
        this.ctx = canvas.getContext('2d')
        this.loader = createImageLoader(canvas)
        this.draw()
      })
  },

  onUnload() {
    if (this.loader) this.loader.clear()
  },

  async draw() {
    if (!this.ctx) return
    const token = this.drawToken = (this.drawToken || 0) + 1
    const page = this.pages[this.data.current]
    const spread = getSpread(this.album, page.spreadId)
    const images = await this.loader.loadPhotos(getSpreadPhotos(this.album, spread), 'display', { evictOthers: true })
    // 加载期间已翻到别的页，放弃本次绘制
    if (token !== this.drawToken) return
    renderPage(
      this.ctx,
      page,
      getLayout(spread.layoutId),
      getSpreadStyle(this.album, spread),
      { width: this.canvas.width, height: this.canvas.height },
      images,
      { guides: this.data.guides }
    )
  },

  goTo(index) {
    if (index < 0 || index >= this.pages.length || index === this.data.current) return
    this.setData({ current: index })
    this.draw()
  },

  onPrev() {
    this.goTo(this.data.current - 1)
  },

  onNext() {
    this.goTo(this.data.current + 1)
  },

  onTouchStart(e) {
    this.touchX = e.touches[0].clientX
  },

  onTouchEnd(e) {
    if (this.touchX == null) return
    const dx = e.changedTouches[0].clientX - this.touchX
    this.touchX = null
    if (dx > SWIPE_DISTANCE) this.onPrev()
    else if (dx < -SWIPE_DISTANCE) this.onNext()
  },

  onToggleGuides(e) {
    this.setData({ guides: e.detail.value })
    this.draw()
  },

  async onSave() {
    if (this.data.saving) return
    this.setData({ saving: true })
    wx.showLoading({ title: '正在生成图片', mask: true })
    let filePath = ''
    try {
      filePath = await renderPageToFile(this.album, this.pages[this.data.current])
      wx.hideLoading()
      const result = await saveToPhotosAlbum(filePath)
      if (result === 'saved') wx.showToast({ title: '已保存到相册', icon: 'success' })
    } catch (err) {
      console.error('保存失败', err)
      wx.hideLoading()
      wx.showToast({ title: '保存失败', icon: 'none' })
    } finally {
      removeExportFile(filePath)
      this.setData({ saving: false })
    }
  }
})
