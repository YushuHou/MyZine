// 立体翻书预览：左右两页并排，翻页时书页沿书脊 3D 翻转
// 封面单独在右、正文两两成对、封底单独在左（跨页图里空白的半边用背景色）
// 拖动跟手由 flip.wxs 处理；松手后由这里决定翻过去还是弹回
const app = getApp()
const { getSpreadLabels } = require('../../core/album')
const { createSpreadImageRenderer } = require('../../core/render/spreadImages')

// 页面背景色，同时用于封面左侧、封底右侧的空白半边
const BG_COLOR = require('../../core/uiColors').stage
// 预览图最大宽度（px），避免高像素比设备上生成过大的图片
const MAX_IMAGE_WIDTH = 1800
// 翻过多少度松手就算翻过去
const FLIP_THRESHOLD = 90
// 动画时长（与 flip.wxs 中的过渡时长一致，留一点余量）
const AUTO_MS = 520
const FINISH_MS = 320
const CANCEL_MS = 270

// 半页：src 跨页图，pos 显示左半（left）还是右半（right）
function half(src, pos) {
  return { src: src || '', pos }
}

Page({
  data: {
    imgW: 0,
    imgH: 0,
    bookLeft: 0,
    current: 0,
    total: 0,
    label: '',
    // 底层左右两页
    baseLeft: half('', 'left'),
    baseRight: half('', 'right'),
    // 翻动的书页：正面、背面
    leaf: { show: false, dir: 'next', front: half('', 'right'), back: half('', 'left') },
    canNext: 0,
    canPrev: 0,
    flipCmd: null
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
    this.labels = getSpreadLabels(this.album)
    this.srcs = this.album.spreads.map(() => '')
    this.flipping = false
    this.cmdId = 0
    const current = Math.max(0, this.album.spreads.findIndex(s => s.id === query.spreadId))
    this.setData({ imgW, imgH, bookLeft: 16, current, total: this.album.spreads.length }, () => this.showIdle())
    this.ensure(current)
  },

  onReady() {
    // 书的实际位置（触摸换算用）
    wx.createSelectorQuery().select('#book').boundingClientRect(rect => {
      if (rect) this.setData({ bookLeft: rect.left })
    }).exec()
  },

  onUnload() {
    if (this.renderer) this.renderer.clear()
  },

  // ---------- 图片 ----------

  // 渲染当前、前一个、后两个跨页（当前优先）
  ensure(center) {
    ;[center, center + 1, center - 1, center + 2].forEach(i => {
      if (i >= 0 && i < this.srcs.length && !this.srcs[i]) this.renderAt(i)
    })
  },

  async renderAt(index) {
    this.pending = this.pending || {}
    if (this.pending[index]) return
    this.pending[index] = true
    try {
      this.srcs[index] = await this.renderer.render(this.album, this.album.spreads[index])
      if (!this.flipping) this.showIdle()
    } catch (err) {
      console.error('生成预览失败', err)
    } finally {
      this.pending[index] = false
    }
  },

  // 静止状态：底层是当前跨页的左右两页，书页隐藏
  showIdle() {
    const i = this.data.current
    const src = this.srcs[i]
    this.setData({
      baseLeft: half(src, 'left'),
      baseRight: half(src, 'right'),
      'leaf.show': false,
      label: this.labels[this.album.spreads[i].id] || '',
      // 目标跨页的图生成好了才能翻
      canNext: i + 1 < this.srcs.length && this.srcs[i + 1] ? 1 : 0,
      canPrev: i - 1 >= 0 && this.srcs[i - 1] ? 1 : 0
    })
  },

  // ---------- 翻页 ----------

  sendCmd(action, dir) {
    this.setData({ flipCmd: { action, dir, id: ++this.cmdId } })
  },

  /**
   * 准备翻页：向后翻时书页在右半边（正面 = 当前右页，背面 = 下一跨页左页），露出下一跨页的右页；
   * 向前翻时书页在左半边（正面 = 当前左页，背面 = 上一跨页右页），露出上一跨页的左页
   */
  prepare(dir) {
    const i = this.data.current
    const cur = this.srcs[i]
    if (dir === 'next') {
      const next = this.srcs[i + 1]
      this.setData({
        baseLeft: half(cur, 'left'),
        baseRight: half(next, 'right'),
        leaf: { show: true, dir, front: half(cur, 'right'), back: half(next, 'left') }
      })
    } else {
      const prev = this.srcs[i - 1]
      this.setData({
        baseLeft: half(prev, 'left'),
        baseRight: half(cur, 'right'),
        leaf: { show: true, dir, front: half(cur, 'left'), back: half(prev, 'right') }
      })
    }
  },

  canFlip(dir) {
    return dir === 'next' ? this.data.canNext === 1 : this.data.canPrev === 1
  },

  // 拖动开始（flip.wxs 调用）
  onFlipStart({ dir }) {
    if (this.flipping || !this.canFlip(dir)) return
    this.flipping = true
    this.prepare(dir)
  },

  // 松手：翻过一半完成翻页，不到一半弹回
  onFlipEnd({ dir, angle }) {
    if (!this.flipping) return
    if (angle >= FLIP_THRESHOLD) {
      this.sendCmd('finish', dir)
      setTimeout(() => this.commit(dir), FINISH_MS)
    } else {
      this.sendCmd('cancel', dir)
      setTimeout(() => this.finishFlip(), CANCEL_MS)
    }
  },

  // 轻点两侧：自动翻一页
  onFlipTap({ side }) {
    if (this.flipping || !this.canFlip(side)) return
    this.flipping = true
    this.prepare(side)
    this.sendCmd('auto', side)
    setTimeout(() => this.commit(side), AUTO_MS)
  },

  // 翻完：切换到新的跨页
  commit(dir) {
    const current = this.data.current + (dir === 'next' ? 1 : -1)
    this.setData({ current }, () => this.finishFlip())
    this.ensure(current)
  },

  finishFlip() {
    this.flipping = false
    this.showIdle()
    this.sendCmd('reset', this.data.leaf.dir)
  }
})
