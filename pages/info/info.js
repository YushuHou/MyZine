// 书籍信息：全部选填，输入时直接写入 album.info，封面和扉页返回后立即更新
const app = getApp()
const { createAlbum } = require('../../core/album')
const { formatDate } = require('../../core/bookInfo')

// 'YYYY-MM-DD' → 'YYYY.MM.DD'，用于选择器上的显示
function dotted(date) {
  return date ? date.replace(/-/g, '.') : ''
}

Page({
  data: {
    info: {},
    startText: '',
    endText: '',
    dateText: ''
  },

  onLoad() {
    if (!app.globalData.album) app.globalData.album = createAlbum()
    // 直接修改这个对象，不替换，编辑页的页列表引用的是同一个对象
    this.info = app.globalData.album.info
    this.refresh()
  },

  refresh() {
    const info = this.info
    this.setData({
      info: Object.assign({}, info),
      startText: dotted(info.dateStart),
      endText: dotted(info.dateEnd),
      dateText: formatDate(info.dateStart, info.dateEnd)
    })
  },

  onInput(e) {
    // 输入框自己维护显示的值，这里只写数据，不 setData，避免输入时光标跳动
    this.info[e.currentTarget.dataset.field] = e.detail.value
  },

  onDateChange(e) {
    const field = e.currentTarget.dataset.field
    this.info[field] = e.detail.value
    // 结束日期早于开始日期时清除结束日期
    if (this.info.dateEnd && this.info.dateStart && this.info.dateEnd < this.info.dateStart) {
      this.info.dateEnd = ''
    }
    this.refresh()
  },

  onClearDate() {
    this.info.dateStart = ''
    this.info.dateEnd = ''
    this.refresh()
  },

  onClearEnd() {
    this.info.dateEnd = ''
    this.refresh()
  },

  onDone() {
    wx.navigateBack()
  }
})
