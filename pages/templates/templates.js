// 模板（风格）选择：分「纯色 / 风格 / 主题」三组，可按主题筛选，示例用用户自己的照片渲染
// 纯色组用色块小圆点快速切换（只渲染当前选中颜色的一张示例），其余每个风格一张示例跨页
// mode：first 第一次开始制作（选定后生成整本书进入编辑）
//       change 更换主模板
//       spread 给某个跨页单独换风格（多一个「跟随主模板」选项）
const app = getApp()
const { listStyles, getStyle, getLayout, getLayoutFrames } = require('../../core/registry')
const { createSpread, createSlot } = require('../../core/album')
const { buildBook } = require('../../core/book')
const { createSpreadImageRenderer } = require('../../core/render/spreadImages')
const THEMES = require('../../templates/themes')
const UI_COLORS = require('../../core/uiColors')

// 示例跨页的版式：左页标题 + 小图、右页大横图，能看到大标题、页眉、线稿、边框等风格特征
const SAMPLE_LAYOUT = 'b-H1L-L1'
// 「跟随主模板」选项的 id
const FOLLOW = 'follow'

const themeName = {}
THEMES.forEach(t => { themeName[t.key] = t.name })

function themesText(style) {
  return (style.tags || []).map(k => themeName[k]).filter(Boolean).join(' · ')
}

Page({
  data: {
    mode: 'change',
    filter: 'all',
    themes: THEMES,
    theme: '',
    currentId: '',
    // 纯色组
    solids: [],
    visibleSolids: [],
    focusSolid: null,
    solidPreview: '',
    // 风格组、主题组、跟随主模板
    styleCards: [],
    themeCards: [],
    visibleStyleCards: [],
    visibleThemeCards: [],
    followCard: null
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
      blankColor: UI_COLORS.desk,
      spine: true
    })
    this.sample = this.sampleSpread()

    const styles = listStyles()
    const toCard = s => ({ id: s.id, name: s.name, description: s.description || '', themesText: themesText(s), tags: s.tags || [], preview: '' })
    const solids = styles.filter(s => s.group === 'solid').map(s => ({ id: s.id, name: s.name, swatch: s.swatch || s.colors.background, description: s.description || '', tags: s.tags || [] }))
    const currentId = this.mode === 'spread' ? (this.spread.styleId || FOLLOW) : this.album.defaultStyleId
    const current = getStyle(currentId === FOLLOW ? this.album.defaultStyleId : currentId)
    const focus = solids.find(s => s.id === current.id) || solids[0]
    const main = getStyle(this.album.defaultStyleId)

    this.setData({
      mode: this.mode,
      currentId,
      solids,
      focusSolid: focus,
      styleCards: styles.filter(s => s.group === 'style').map(toCard),
      themeCards: styles.filter(s => s.group === 'theme').map(toCard),
      followCard: this.mode === 'spread'
        ? { id: FOLLOW, name: `跟随主模板（${main.name}）`, description: '主模板更换时，这个跨页跟着变', preview: '' }
        : null
    }, () => this.applyFilter())
    this.renderAll()
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

  // 某个风格的示例图（每个风格一个独立的示例跨页 id，缓存互不覆盖）
  renderPreview(styleId) {
    const spread = Object.assign({}, this.sample, {
      id: `tpl_${styleId}`,
      styleId: styleId === FOLLOW ? null : styleId,
      inverted: false
    })
    return this.renderer.render(this.album, spread)
  },

  // 先渲染当前纯色，再逐个渲染风格组、主题组
  async renderAll() {
    await this.renderSolidPreview()
    const lists = [['followCard', this.data.followCard ? [this.data.followCard] : []], ['styleCards', this.data.styleCards], ['themeCards', this.data.themeCards]]
    for (const [key, cards] of lists) {
      for (let i = 0; i < cards.length; i++) {
        try {
          const path = await this.renderPreview(cards[i].id)
          this.setData({ [key === 'followCard' ? 'followCard.preview' : `${key}[${i}].preview`]: path }, () => this.applyFilter())
        } catch (err) {
          console.warn('生成模板示例失败', err)
        }
      }
    }
  },

  async renderSolidPreview() {
    const id = this.data.focusSolid && this.data.focusSolid.id
    if (!id) return
    try {
      const path = await this.renderPreview(id)
      // 期间可能已切到别的颜色
      if (this.data.focusSolid.id === id) this.setData({ solidPreview: path })
    } catch (err) {
      console.warn('生成纯色示例失败', err)
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
    const { filter, theme } = this.data
    const pass = item => filter !== 'theme' || (item.tags || []).indexOf(theme) >= 0
    this.setData({
      visibleSolids: this.data.solids.filter(pass),
      visibleStyleCards: this.data.styleCards.filter(pass),
      visibleThemeCards: this.data.themeCards.filter(pass)
    })
  },

  // ---------- 纯色：小圆点切换预览，点按钮使用 ----------

  onSwatch(e) {
    const solid = this.data.solids.find(s => s.id === e.currentTarget.dataset.id)
    if (!solid || solid.id === this.data.focusSolid.id) return
    this.setData({ focusSolid: solid, solidPreview: '' })
    this.renderSolidPreview()
  },

  onUseSolid() {
    this.select(this.data.focusSolid.id)
  },

  // ---------- 选择 ----------

  onSelect(e) {
    this.select(e.currentTarget.dataset.id)
  },

  select(id) {
    if (this.mode === 'spread') {
      this.spread.styleId = id === FOLLOW ? null : id
      wx.navigateBack()
      return
    }
    this.album.defaultStyleId = id
    if (this.mode === 'first') this.startBook()
    else wx.navigateBack()
  },

  startBook() {
    this.album.spreads = buildBook(this.album)
    // 替换当前页，编辑页返回时直接回到首页
    wx.redirectTo({ url: '/pages/editor/editor' })
  }
})
