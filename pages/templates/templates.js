// 模板（风格）选择：可按风格或按主题筛选，示例用用户自己的照片渲染
// mode：first 第一次开始制作（选完或跳过后生成整本书进入编辑）
//       change 更换主模板
//       spread 给某个跨页单独换风格（多一个「跟随主模板」选项）
const app = getApp()
const { listStyles, getStyle, getLayout, getLayoutFrames } = require('../../core/registry')
const { createSpread, createSlot } = require('../../core/album')
const { buildBook } = require('../../core/book')
const { createSpreadImageRenderer } = require('../../core/render/spreadImages')
const THEMES = require('../../templates/themes')

// 示例跨页使用的版式：一大一小横图 + 竖图，能同时看到边框、装饰、留白
const SAMPLE_LAYOUT = 'b-L2D-P1'
// 「跟随主模板」选项的 id
const FOLLOW = 'follow'

const themeName = {}
THEMES.forEach(t => { themeName[t.key] = t.name })

Page({
  data: {
    mode: 'change',
    filter: 'all',
    themes: THEMES,
    theme: '',
    cards: [],
    visibleCards: [],
    currentId: ''
  },

  onLoad(query) {
    this.album = app.globalData.album
    if (!this.album) {
      wx.navigateBack()
      return
    }
    this.mode = query.mode || 'change'
    this.spread = query.spreadId ? this.album.spreads.find(s => s.id === query.spreadId) : null
    wx.setNavigationBarTitle({ title: this.mode === 'spread' ? '本跨页的风格' : '选择模板' })

    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    this.renderer = createSpreadImageRenderer({
      width: Math.min((info.windowWidth - 32) * (info.pixelRatio || 2), 1200),
      variant: 'display',
      blankColor: '#FFFFFF',
      spine: true
    })

    const sample = this.sampleSpread()
    const cards = listStyles().map(style => ({
      id: style.id,
      name: style.name,
      description: style.description || '',
      themesText: (style.tags || []).map(k => themeName[k]).filter(Boolean).join(' · '),
      tags: style.tags || [],
      preview: '',
      // 每个风格一个独立的示例跨页（id 不同，缓存互不覆盖）
      spread: Object.assign({}, sample, { id: `tpl_${style.id}`, styleId: style.id })
    }))
    if (this.mode === 'spread') {
      const main = getStyle(this.album.defaultStyleId)
      cards.unshift({
        id: FOLLOW,
        name: `跟随主模板（${main.name}）`,
        description: '主模板更换时，这个跨页跟着变',
        themesText: '',
        tags: null,
        preview: '',
        spread: Object.assign({}, sample, { id: `tpl_${FOLLOW}`, styleId: null })
      })
    }
    this.cards = cards
    const currentId = this.mode === 'spread' ? (this.spread.styleId || FOLLOW) : this.album.defaultStyleId
    this.setData({ mode: this.mode, currentId, cards: cards.map(({ spread, ...card }) => card) }, () => this.applyFilter())
    this.renderPreviews()
  },

  onUnload() {
    if (this.renderer) this.renderer.clear()
  },

  // 示例跨页：换单个跨页的风格时用它自己；否则用前几张照片填一个示例版式
  sampleSpread() {
    if (this.mode === 'spread' && this.spread) return this.spread
    const slots = {}
    getLayoutFrames(getLayout(SAMPLE_LAYOUT)).forEach((frame, i) => {
      const photo = this.album.photos[i]
      if (photo) slots[frame.id] = createSlot(photo.id)
    })
    return createSpread('body', SAMPLE_LAYOUT, slots)
  },

  // 逐个生成示例图
  async renderPreviews() {
    for (let i = 0; i < this.cards.length; i++) {
      try {
        const path = await this.renderer.render(this.album, this.cards[i].spread)
        this.setData({ [`cards[${i}].preview`]: path }, () => this.applyFilter())
      } catch (err) {
        console.warn('生成模板示例失败', err)
      }
    }
  },

  // ---------- 筛选 ----------

  onFilter(e) {
    const filter = e.currentTarget.dataset.filter
    this.setData({ filter, theme: filter === 'theme' ? (this.data.theme || THEMES[0].key) : '' }, () => this.applyFilter())
  },

  onTheme(e) {
    this.setData({ theme: e.currentTarget.dataset.key }, () => this.applyFilter())
  },

  applyFilter() {
    const { filter, theme, cards } = this.data
    // 「跟随主模板」不属于任何主题，始终显示
    const visibleCards = filter === 'theme' ? cards.filter(c => !c.tags || c.tags.indexOf(theme) >= 0) : cards
    this.setData({ visibleCards })
  },

  // ---------- 选择 ----------

  onSelect(e) {
    const id = e.currentTarget.dataset.id
    if (this.mode === 'spread') {
      this.spread.styleId = id === FOLLOW ? null : id
      wx.navigateBack()
      return
    }
    this.album.defaultStyleId = id
    if (this.mode === 'first') this.startBook()
    else wx.navigateBack()
  },

  // 第一次开始制作：跳过时使用默认的极简
  onSkip() {
    this.startBook()
  },

  startBook() {
    this.album.spreads = buildBook(this.album)
    // 替换当前页，编辑页返回时直接回到首页
    wx.redirectTo({ url: '/pages/editor/editor' })
  }
})
