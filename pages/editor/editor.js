// 编辑页：一屏显示一页；点照片框选中后可换照片、调整位置和缩放、切换填满/完整
// 布局：顶部栏（参考线 + 导出）→ 画布 → 翻页行 → 底部标签栏（书籍信息 / 页面 / 模板 / 预览）
const app = getApp()
const { getPageList, getSpread, getSpreadPhotos, getSpreadStyle, getPhoto, setSlotPhoto, getSpreadLabels } = require('../../core/album')
const { createSpreadImageRenderer } = require('../../core/render/spreadImages')
const UI_COLORS = require('../../core/uiColors')
const { getLayout, getLayoutPage } = require('../../core/registry')
const { renderPage } = require('../../core/render/renderPage')
const { createImageLoader } = require('../../core/render/imageLoader')
const { frameAtPoint } = require('../../core/render/hitTest')
const { fillOverflow } = require('../../core/render/photoGeometry')
const { resolveFrames, photoRect } = require('../../core/render/frames')
const { loadRenderImages } = require('../../core/styleAssets')
const C = require('../../core/constants')
const { getPhotoUsage, formatUsage } = require('../../core/usage')

// 画布区以外（顶部栏 + 翻页行 + 底部标签栏）的估计高度（px），量到画布区实际高度之前先用它
const CHROME_ESTIMATE = 136
// 画布四周留白（px）
const STAGE_PAD_X = 16
const STAGE_PAD_Y = 8
// 左右滑动翻页的最小距离（px）
const SWIPE_DISTANCE = 50
// 手指移动不超过这个距离算点击（px）
const TAP_DISTANCE = 10
// 双指缩放的最大倍数（1 = 刚好填满）
const MAX_SCALE = 4

function getWindowInfo() {
  return wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
}

// 画布区的估计尺寸：窗口减去上下栏和底部安全区
function estimateStage(info) {
  const safeBottom = info.safeArea ? Math.max(0, info.screenHeight - info.safeArea.bottom) : 0
  return { w: info.windowWidth, h: info.windowHeight - CHROME_ESTIMATE - safeBottom }
}

// 画布显示尺寸：单页 3:4，跨页大图 3:2，在画布区内尽量大
function computeCanvasSize(stage, side) {
  const ratio = side === 'full' ? 2 / 3 : 4 / 3
  const maxW = stage.w - STAGE_PAD_X * 2
  const maxH = stage.h - STAGE_PAD_Y * 2
  let w = maxW
  let h = w * ratio
  if (h > maxH) {
    h = maxH
    w = h / ratio
  }
  return { w: Math.floor(w), h: Math.floor(h) }
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v))
}

function distance(a, b) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}

Page({
  data: {
    canvasW: 0,
    canvasH: 0,
    current: 0,
    total: 0,
    label: '',
    guides: false,
    // normal 普通 | selected 选中照片框 | adjust 调整照片位置和缩放
    mode: 'normal',
    hasPhoto: false,
    slotFit: 'fill',
    pickerShow: false,
    // 「相册不会保存」提示条
    saveNotice: false,
    pickerPhotos: [],
    pickerCurrentId: ''
  },

  onLoad() {
    this.album = app.globalData.album
    if (!this.album || !this.album.spreads.length) {
      wx.navigateBack()
      return
    }
    this.pages = getPageList(this.album)
    this.windowInfo = getWindowInfo()
    this.stageSize = estimateStage(this.windowInfo)
    const size = computeCanvasSize(this.stageSize, this.pages[0].side)
    this.setData({ canvasW: size.w, canvasH: size.h, total: this.pages.length, label: this.pages[0].label })
  },

  onReady() {
    if (!this.pages) return
    // 退出提示：每次打开小程序后，第一次进入编辑页时在顶部显示提示条（toast 最多两行，长句会被截断）
    // 返回首页不会丢失相册，关闭小程序才会；5 秒后自动收起，点一下立即关闭
    if (!app.globalData.saveNoticeShown) {
      app.globalData.saveNoticeShown = true
      this.setData({ saveNotice: true })
      this.noticeTimer = setTimeout(() => this.setData({ saveNotice: false }), 5000)
    }
    // 量出画布区的实际尺寸，按它重新计算画布大小后再绘制
    wx.createSelectorQuery()
      .select('#stage').boundingClientRect()
      .select('#pageCanvas').fields({ node: true, size: true, rect: true })
      .exec(res => {
        const stage = res[0]
        const info = res[1]
        if (!info || !info.node) return
        if (stage && stage.height > 0) this.stageSize = { w: stage.width, h: stage.height }
        this.canvas = info.node
        this.ctx = this.canvas.getContext('2d')
        this.loader = createImageLoader(this.canvas)
        this.applyCanvasPixels(info)
        this.updateCanvasSize(() => this.draw())
      })
  },

  // 按设备像素比设置画布实际像素，并记录画布在屏幕上的位置（触摸换算用）
  applyCanvasPixels(rect) {
    const dpr = this.windowInfo.pixelRatio || 2
    this.canvas.width = Math.round(this.data.canvasW * dpr)
    this.canvas.height = Math.round(this.data.canvasH * dpr)
    this.canvasRect = { left: rect.left, top: rect.top }
  },

  // 单页（3:4）和跨页大图（3:2）之间切换时调整画布尺寸，调整完再绘制
  updateCanvasSize(callback) {
    const size = computeCanvasSize(this.stageSize, this.pages[this.data.current].side)
    if (!this.canvas || (size.w === this.data.canvasW && size.h === this.data.canvasH)) {
      callback()
      return
    }
    this.setData({ canvasW: size.w, canvasH: size.h }, () => {
      wx.createSelectorQuery().select('#pageCanvas').boundingClientRect(rect => {
        if (rect) this.applyCanvasPixels(rect)
        callback()
      }).exec()
    })
  },

  // 从其他页面返回时：重新生成页列表（跨页可能已增删、排序），尽量停留在原来的页；
  // 跨页管理、导出页要求跳转时（pendingJump = { spreadId, side? }）跳到指定的页；
  // 然后重绘，书籍信息的修改也会立即显示
  onShow() {
    if (!this.pages) return
    const prev = this.pages[this.data.current]
    this.pages = getPageList(this.album)
    let index = -1
    const jump = this.pendingJump
    if (jump) {
      index = this.pages.findIndex(p => p.spreadId === jump.spreadId && (!jump.side || p.side === jump.side))
    } else if (prev) {
      index = this.pages.findIndex(p => p.spreadId === prev.spreadId && p.side === prev.side)
    }
    if (index < 0) index = Math.min(this.data.current, this.pages.length - 1)
    this.pendingJump = null
    this.selectedFrameId = null
    this.setData({ current: index, total: this.pages.length, label: this.pages[index].label, mode: 'normal' })
    this.updateCanvasSize(() => this.draw())
  },

  onCloseNotice() {
    clearTimeout(this.noticeTimer)
    this.setData({ saveNotice: false })
  },

  onUnload() {
    clearTimeout(this.noticeTimer)
    if (this.loader) this.loader.clear()
    if (this.styleRenderer) this.styleRenderer.clear()
  },

  // ---------- 当前页 ----------

  // 当前页；frames 为应用风格（倾斜、边框）后的照片框，点击检测和拖动换算都用它
  getCurrent() {
    const page = this.pages[this.data.current]
    const spread = getSpread(this.album, page.spreadId)
    const layout = getLayout(spread.layoutId)
    const style = getSpreadStyle(this.album, spread)
    const layoutPage = getLayoutPage(layout, page.side)
    return { page, spread, layout, style, layoutPage, frames: resolveFrames(layoutPage.frames, style, spread.id) }
  },

  getSelected() {
    const cur = this.getCurrent()
    const frame = cur.frames.find(f => f.id === this.selectedFrameId)
    return { cur, frame, slot: frame ? cur.spread.slots[frame.id] : null }
  },

  // ---------- 绘制 ----------

  // 加载当前跨页的照片后绘制
  async draw() {
    if (!this.ctx) return
    const token = this.drawToken = (this.drawToken || 0) + 1
    const { spread } = this.getCurrent()
    const images = await loadRenderImages(this.loader, this.album, spread, getSpreadPhotos(this.album, spread), 'display', { evictOthers: true })
    // 加载期间已翻到别的页，放弃本次绘制
    if (token !== this.drawToken) return
    this.images = images
    this.drawNow()
  },

  // 用已加载的照片立即重绘（调整照片时使用）
  drawNow() {
    if (!this.ctx || !this.images) return
    const { page, layout, style } = this.getCurrent()
    renderPage(
      this.ctx,
      page,
      layout,
      style,
      { width: this.canvas.width, height: this.canvas.height },
      this.images,
      {
        guides: this.data.guides,
        spineGuide: true,
        selectedFrameId: this.data.mode === 'normal' ? null : this.selectedFrameId
      }
    )
  },

  // 拖动、缩放时每帧最多重绘一次
  requestDraw() {
    if (this.drawPending) return
    this.drawPending = true
    this.canvas.requestAnimationFrame(() => {
      this.drawPending = false
      this.drawNow()
    })
  },

  // ---------- 翻页 ----------

  goTo(index) {
    if (index < 0 || index >= this.pages.length || index === this.data.current) return
    this.selectedFrameId = null
    this.setData({ current: index, label: this.pages[index].label, mode: 'normal' })
    this.updateCanvasSize(() => this.draw())
  },

  onPrev() {
    this.goTo(this.data.current - 1)
  },

  onNext() {
    this.goTo(this.data.current + 1)
  },

  // ---------- 触摸：点击选框、滑动翻页、调整照片 ----------

  // 触点 → 画布像素坐标
  toCanvasPoint(touch) {
    const k = this.canvas.width / this.data.canvasW
    return { x: (touch.clientX - this.canvasRect.left) * k, y: (touch.clientY - this.canvasRect.top) * k }
  },

  onTouchStart(e) {
    if (!this.ctx) return
    if (e.touches.length === 1) this.touchStart = { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
    if (this.data.mode === 'adjust') this.beginAdjust(e.touches)
  },

  onTouchMove(e) {
    if (this.data.mode === 'adjust') this.moveAdjust(e.touches)
  },

  onTouchEnd(e) {
    if (!this.ctx) return
    if (this.data.mode === 'adjust') {
      // 双指变单指时，以剩下的手指重新开始拖动
      this.beginAdjust(e.touches)
      return
    }
    if (!this.touchStart || e.touches.length) return
    const t = e.changedTouches[0]
    const dx = t.clientX - this.touchStart.clientX
    const dy = t.clientY - this.touchStart.clientY
    this.touchStart = null
    if (Math.abs(dx) < TAP_DISTANCE && Math.abs(dy) < TAP_DISTANCE) this.onCanvasTap(t)
    else if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) this.onPrev()
      else this.onNext()
    }
  },

  onCanvasTap(touch) {
    const { spread, frames } = this.getCurrent()
    const p = this.toCanvasPoint(touch)
    const frame = frameAtPoint(frames, this.canvas.width, this.canvas.height, p.x, p.y)
    if (!frame) {
      this.onDeselect()
      return
    }
    this.selectFrame(frame.id)
    // 空照片框直接打开照片面板
    if (!spread.slots[frame.id]) this.openPicker()
  },

  selectFrame(frameId) {
    this.selectedFrameId = frameId
    const { slot } = this.getSelected()
    this.setData({ mode: 'selected', hasPhoto: !!slot, slotFit: slot ? slot.fit : 'fill' }, () => this.drawNow())
  },

  beginAdjust(touches) {
    const { slot } = this.getSelected()
    this.pinch = null
    this.drag = null
    if (!slot || slot.fit === 'fit' || !touches.length) return
    if (touches.length >= 2) {
      this.pinch = { dist: distance(touches[0], touches[1]), scale: slot.scale || 1 }
    } else {
      this.drag = { point: this.toCanvasPoint(touches[0]), offsetX: slot.offsetX || 0, offsetY: slot.offsetY || 0 }
    }
  },

  moveAdjust(touches) {
    const { cur, frame, slot } = this.getSelected()
    if (!frame || !slot) return
    if (this.pinch && touches.length >= 2) {
      slot.scale = clamp(this.pinch.scale * distance(touches[0], touches[1]) / this.pinch.dist, 1, MAX_SCALE)
    } else if (this.drag && touches.length === 1) {
      const photo = getPhoto(this.album, slot.photoId)
      if (!photo) return
      const W = this.canvas.width
      const H = this.canvas.height
      // 按照片实际显示区域（扣掉边框）换算
      const unit = (cur.page.side === 'full' ? W / 2 : W) / C.PAGE_WIDTH
      const rect = photoRect(frame, cur.style, W, H, unit)
      const overflow = fillOverflow(photo.width, photo.height, rect.w, rect.h, slot.scale)
      const p = this.toCanvasPoint(touches[0])
      // 手指向右移，照片跟着向右移，即显示更靠左的部分（offset 变小）
      slot.offsetX = overflow.x > 0 ? clamp(this.drag.offsetX - 2 * (p.x - this.drag.point.x) / overflow.x, -1, 1) : 0
      slot.offsetY = overflow.y > 0 ? clamp(this.drag.offsetY - 2 * (p.y - this.drag.point.y) / overflow.y, -1, 1) : 0
    } else {
      return
    }
    this.requestDraw()
  },

  // ---------- 照片框操作 ----------

  onChangePhoto() {
    this.openPicker()
  },

  onAdjust() {
    const { slot } = this.getSelected()
    if (!slot || slot.fit === 'fit') return
    this.setData({ mode: 'adjust' })
  },

  onToggleFit() {
    const { slot } = this.getSelected()
    if (!slot) return
    slot.fit = slot.fit === 'fit' ? 'fill' : 'fit'
    this.setData({ slotFit: slot.fit }, () => this.drawNow())
  },

  onDeselect() {
    if (this.data.mode === 'normal') return
    this.selectedFrameId = null
    this.setData({ mode: 'normal' }, () => this.drawNow())
  },

  onResetAdjust() {
    const { slot } = this.getSelected()
    if (!slot) return
    slot.offsetX = 0
    slot.offsetY = 0
    slot.scale = 1
    this.drawNow()
  },

  onAdjustDone() {
    this.setData({ mode: 'selected' })
  },

  // ---------- 照片面板 ----------

  openPicker() {
    try {
      const { slot } = this.getSelected()
      const usage = getPhotoUsage(this.album)
      this.setData({
        pickerShow: true,
        pickerCurrentId: slot ? slot.photoId : '',
        pickerPhotos: this.album.photos.map(p => ({
          id: p.id,
          thumb: p.thumbPath || p.displayPath,
          tags: formatUsage(usage[p.id])
        }))
      })
    } catch (err) {
      console.error('打开照片面板失败', err)
      wx.showToast({ title: '打开照片面板失败', icon: 'none' })
    }
  },

  onPickerSelect(e) {
    const { cur, frame } = this.getSelected()
    if (!frame) return
    setSlotPhoto(cur.spread, frame.id, e.detail.photoId)
    this.setData({ pickerShow: false, mode: 'selected', hasPhoto: true, slotFit: 'fill' })
    this.draw()
  },

  onPickerClose() {
    this.setData({ pickerShow: false })
  },

  // ---------- 其他 ----------

  onToggleGuides() {
    this.setData({ guides: !this.data.guides }, () => this.drawNow())
  },

  // 页面：调整顺序、增删、换版式（原「管理跨页」，不含风格）
  onManagePages() {
    wx.navigateTo({
      url: '/pages/spreads/spreads',
      events: {
        jump: target => { this.pendingJump = target }
      }
    })
  },

  onExport() {
    const page = this.pages[this.data.current]
    wx.navigateTo({
      url: `/pages/export/export?spreadId=${page.spreadId}&side=${page.side}`,
      events: {
        // 有空照片框时选「返回填充」，跳到第一个有空框的页
        jump: target => { this.pendingJump = target }
      }
    })
  },

  onPreview() {
    const page = this.pages[this.data.current]
    wx.navigateTo({ url: `/pages/preview/preview?spreadId=${page.spreadId}` })
  },

  onEditInfo() {
    wx.navigateTo({ url: '/pages/info/info' })
  },

  // ---------- 模板面板 ----------

  // 打开模板面板：缩略图渲染器由编辑页持有，关掉面板再打开时已渲染的缩略图还在
  onOpenStyles() {
    const { spread } = this.getCurrent()
    if (!this.styleRenderer) {
      this.styleRenderer = createSpreadImageRenderer({ width: 360, variant: 'thumb', blankColor: UI_COLORS.desk, spine: true, quality: 0.8 })
    }
    this.selectComponent('#styleSheet').open({
      album: this.album,
      spread,
      label: getSpreadLabels(this.album)[spread.id],
      renderer: this.styleRenderer
    })
  },

  /**
   * 应用风格：scope = spread（只换这一对页面；选中主模板或「恢复跟随」时改回跟随整本书）| book（换主模板）
   */
  onStyleApply(e) {
    const { scope, styleId, spreadId, label } = e.detail
    if (scope === 'book') {
      this.album.defaultStyleId = styleId
    } else {
      const spread = getSpread(this.album, spreadId)
      if (!spread) return
      spread.styleId = !styleId || styleId === this.album.defaultStyleId ? null : styleId
    }
    wx.showToast({ title: scope === 'book' ? '已应用到整本书' : `已应用到 ${label}`, icon: 'none' })
    // 风格变了，装饰词等也会变：重新生成页列表后重绘
    this.pages = getPageList(this.album)
    this.selectedFrameId = null
    this.setData({ mode: 'normal', label: this.pages[this.data.current].label })
    this.draw()
  }
})
