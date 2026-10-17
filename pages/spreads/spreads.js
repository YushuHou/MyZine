// 跨页管理：缩略图列表；正文跨页可拖动排序、插入、换版式、删除；封面、扉页、封底固定
const app = getApp()
const { getSpreadLabels } = require('../../core/album')
const { getLayout, getLayoutFrames, listLayouts, getStyle } = require('../../core/registry')
const { splitSpreads, insertBodySpread, removeBodySpread, setBodyOrder, changeSpreadLayout } = require('../../core/spreads')
const { getThumbRenderer } = require('../../core/render/spreadImages')
const { createGrid, moveItem } = require('../../core/ui/sortable')
const UI_COLORS = require('../../core/uiColors')

// 列表：左右边距 32rpx，行高 200rpx，行间距 16rpx
const PAGE_PADDING_RPX = 32
const ROW_RPX = 200
const GAP_RPX = 16

Page({
  data: {
    headItems: [],
    items: [],
    tailItems: [],
    rowH: 0,
    styleName: '',
    gridHeight: 0,
    dragIndex: -1,
    // 版式选择面板
    layoutPicker: { show: false, title: '', currentId: '' },
    bodyLayouts: []
  },

  onLoad() {
    this.album = app.globalData.album
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const rpx = info.windowWidth / 750
    const width = info.windowWidth - PAGE_PADDING_RPX * 2 * rpx
    this.grid = createGrid(width, 1, GAP_RPX * rpx, ROW_RPX * rpx / width)
    this.renderer = getThumbRenderer()
    this.setData({ bodyLayouts: listLayouts('body') })
  },

  // 每次显示都刷新：从模板页返回时风格可能已变
  onShow() {
    this.refresh()
  },

  // 打开版式选择面板，返回选中的版式 id；关闭面板返回 null
  chooseLayout(title, currentId = '') {
    return new Promise(resolve => {
      this.layoutResolve = resolve
      this.setData({ layoutPicker: { show: true, title, currentId } })
    })
  },

  onLayoutSelect(e) {
    this.closeLayoutPicker(e.detail.layoutId)
  },

  onLayoutClose() {
    this.closeLayoutPicker(null)
  },

  closeLayoutPicker(layoutId) {
    this.setData({ 'layoutPicker.show': false })
    const resolve = this.layoutResolve
    this.layoutResolve = null
    if (resolve) resolve(layoutId)
  },

  // 列表项：页名、版式名和照片数；缩略图有缓存就直接用
  toItem(spread, labels) {
    const layout = getLayout(spread.layoutId)
    const frameCount = getLayoutFrames(layout).length
    const filled = Object.keys(spread.slots).length
    let sub = layout.name
    if (frameCount) sub += filled < frameCount ? ` · ${frameCount - filled} 个空框` : ` · ${filled} 张`
    // 单独换过风格的跨页显示风格名
    if (spread.styleId) sub += ` · ${getStyle(spread.styleId).name}`
    return { id: spread.id, label: labels[spread.id], sub, thumb: this.renderer.cached(this.album, spread) }
  },

  refresh() {
    const labels = getSpreadLabels(this.album)
    const parts = splitSpreads(this.album)
    this.setData({
      headItems: parts.head.map(s => this.toItem(s, labels)),
      items: parts.body.map((s, i) => Object.assign(this.toItem(s, labels), { y: this.grid.position(i).y })),
      tailItems: parts.tail.map(s => this.toItem(s, labels)),
      rowH: this.grid.cellH,
      styleName: getStyle(this.album.defaultStyleId).name,
      gridHeight: this.grid.height(parts.body.length),
      dragIndex: -1
    })
    this.renderThumbs()
  },

  // 逐个生成缺少的缩略图，生成一个更新一个
  async renderThumbs() {
    const token = this.thumbToken = (this.thumbToken || 0) + 1
    for (const spread of this.album.spreads) {
      if (this.renderer.cached(this.album, spread)) continue
      let path
      try {
        path = await this.renderer.render(this.album, spread)
      } catch (err) {
        console.warn('生成缩略图失败', err)
        continue
      }
      // 期间列表已刷新，交给新一轮处理
      if (token !== this.thumbToken) return
      this.setThumb(spread.id, path)
    }
  },

  setThumb(spreadId, path) {
    const changes = {}
    ;['headItems', 'items', 'tailItems'].forEach(key => {
      const i = this.data[key].findIndex(item => item.id === spreadId)
      if (i >= 0) changes[`${key}[${i}].thumb`] = path
    })
    this.setData(changes)
  },

  // 回到编辑页并跳到这个跨页
  onOpen(e) {
    const channel = this.getOpenerEventChannel()
    if (channel && channel.emit) channel.emit('jump', { spreadId: e.currentTarget.dataset.id })
    wx.navigateBack()
  },

  async onAdd() {
    const layoutId = await this.chooseLayout('添加跨页：选择版式')
    if (!layoutId) return
    insertBodySpread(this.album, layoutId)
    this.refresh()
    wx.showToast({ title: '已在正文末尾添加', icon: 'none' })
  },

  onMore(e) {
    const id = e.currentTarget.dataset.id
    wx.showActionSheet({
      itemList: ['在后面插入跨页', '换版式', '换风格', '删除跨页'],
      success: res => {
        if (res.tapIndex === 0) this.insertAfter(id)
        else if (res.tapIndex === 1) this.changeLayout(id)
        else if (res.tapIndex === 2) this.changeStyle(id)
        else this.remove(id)
      }
    })
  },

  async insertAfter(id) {
    const layoutId = await this.chooseLayout('插入跨页：选择版式')
    if (!layoutId) return
    insertBodySpread(this.album, layoutId, id)
    this.refresh()
  },

  async changeLayout(id) {
    const spread = this.album.spreads.find(s => s.id === id)
    const layoutId = await this.chooseLayout('换版式', spread.layoutId)
    if (!layoutId || layoutId === spread.layoutId) return
    const removed = changeSpreadLayout(this.album, id, layoutId)
    this.refresh()
    if (removed) {
      wx.showToast({ title: `有 ${removed} 张照片移出本跨页，可在照片面板的“未使用”中找到`, icon: 'none', duration: 3000 })
    }
  },

  // 给单个跨页换风格（模板页的 spread 模式，含「跟随主模板」）
  changeStyle(id) {
    wx.navigateTo({ url: `/pages/templates/templates?mode=spread&spreadId=${id}` })
  },

  onChangeTemplate() {
    wx.navigateTo({ url: '/pages/templates/templates?mode=change' })
  },

  remove(id) {
    wx.showModal({
      title: '删除跨页',
      content: '删除后，其中的照片仍保留在照片库中',
      confirmText: '删除',
      confirmColor: UI_COLORS.danger,
      success: res => {
        if (!res.confirm) return
        removeBodySpread(this.album, id)
        this.refresh()
      }
    })
  },

  // ---------- 拖动排序（由 sortable.wxs 调用） ----------

  onSortStart({ index }) {
    this.sort = { from: index, to: index, rect: null }
    this.setData({ dragIndex: index })
    wx.vibrateShort({ type: 'light' })
    wx.createSelectorQuery().select('.list').boundingClientRect(rect => {
      if (this.sort) this.sort.rect = rect
    }).exec()
  },

  onSortMove({ x, y }) {
    const sort = this.sort
    if (!sort || !sort.rect) return
    const to = this.grid.indexAt(x - sort.rect.left, y - sort.rect.top, this.data.items.length)
    if (to === sort.to) return
    sort.to = to
    const order = moveItem(this.data.items.map((item, i) => i), sort.from, to)
    const changes = {}
    order.forEach((itemIndex, slotIndex) => {
      if (itemIndex === sort.from) return
      const y = this.grid.position(slotIndex).y
      if (this.data.items[itemIndex].y !== y) changes[`items[${itemIndex}].y`] = y
    })
    this.setData(changes)
  },

  onSortEnd() {
    const sort = this.sort
    this.sort = null
    if (sort && sort.to !== sort.from) {
      setBodyOrder(this.album, moveItem(this.data.items.map(item => item.id), sort.from, sort.to))
    }
    this.refresh()
  }
})
