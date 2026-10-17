// 双页预览：封面单独在右，正文两两成对，封底单独在左，左右滑动翻页
const app = getApp()
const { getSpreadLabels } = require('../../core/album')
const { createSpreadImageRenderer } = require('../../core/render/spreadImages')

// 页面背景色，同时用于封面左侧、封底右侧的空白半边
const BG_COLOR = '#3A3835'
// 预览图最大宽度（px），避免高像素比设备上生成过大的图片
const MAX_IMAGE_WIDTH = 1800

Page({
  data: {
    items: [],
    current: 0,
    imgW: 0,
    imgH: 0
  },

  onLoad(query) {
    this.album = app.globalData.album
    if (!this.album || !this.album.spreads.length) {
      wx.navigateBack()
      return
    }
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const imgW = info.windowWidth - 32
    const imgH = Math.round(imgW * 2 / 3)
    this.renderer = createSpreadImageRenderer({
      width: Math.min(imgW * (info.pixelRatio || 2), MAX_IMAGE_WIDTH),
      variant: 'display',
      blankColor: BG_COLOR,
      spine: true
    })
    const labels = getSpreadLabels(this.album)
    const current = Math.max(0, this.album.spreads.findIndex(s => s.id === query.spreadId))
    this.setData({
      imgW,
      imgH,
      current,
      items: this.album.spreads.map(s => ({ id: s.id, label: labels[s.id], src: '' }))
    })
    this.ensure(current)
  },

  onUnload() {
    if (this.renderer) this.renderer.clear()
  },

  onChange(e) {
    const current = e.detail.current
    this.setData({ current })
    this.ensure(current)
  },

  // 只渲染当前和前后各 1 个跨页，当前页优先
  ensure(center) {
    ;[center, center + 1, center - 1].forEach(i => {
      if (i >= 0 && i < this.data.items.length && !this.data.items[i].src) this.renderAt(i)
    })
  },

  async renderAt(index) {
    this.pending = this.pending || {}
    if (this.pending[index]) return
    this.pending[index] = true
    try {
      const path = await this.renderer.render(this.album, this.album.spreads[index])
      this.setData({ [`items[${index}].src`]: path })
    } catch (err) {
      console.error('生成预览失败', err)
    } finally {
      this.pending[index] = false
    }
  }
})
