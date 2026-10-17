// 模板（风格）选择：分「纯色 / 风格 / 主题」三组，可按主题筛选，示例用用户自己的照片渲染
// 纯色组用色块小圆点快速切换（只渲染当前选中颜色的一张示例），其余每个风格一张示例跨页
// mode：first 第一次开始制作（选定后生成整本书进入编辑）
//       change 更换主模板（首页的「模板」卡片）
// 编辑中给整本书或单独两页换风格用编辑页的模板面板（components/style-sheet）
const app = getApp()
const { listStyles, getLayout, getLayoutFrames } = require('../../core/registry')
const { createSpread, createSlot } = require('../../core/album')
const { buildBook } = require('../../core/book')
const { createSpreadImageRenderer } = require('../../core/render/spreadImages')
const THEMES = require('../../templates/themes')
const UI_COLORS = require('../../core/uiColors')

// 示例跨页的版式：左页标题 + 小图、右页大横图，能看到大标题、页眉、线稿、边框等风格特征
const SAMPLE_LAYOUT = 'b-H1L-L1'

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
    visibleThemeCards: []
  },

  onLoad(query) {
    this.album = app.globalData.album
    if (!this.album) {
      wx.navigateBack()
      return
    }
    this.mode = query.mode || 'change'

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
    const currentId = this.album.defaultStyleId
    const focus = solids.find(s => s.id === currentId) || solids[0]

    this.setData({
      mode: this.mode,
      currentId,
      solids,
      focusSolid: focus,
      styleCards: styles.filter(s => s.group === 'style').map(toCard),
      themeCards: styles.filter(s => s.group === 'theme').map(toCard)
    }, () => this.applyFilter())
    this.renderAll()
  },

  onUnload() {
    if (this.renderer) this.renderer.clear()
  },

  // 示例跨页：用前几张照片填一个示例版式
  sampleSpread() {
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
      styleId,
      inverted: false
    })
    return this.renderer.render(this.album, spread)
  },

  // 先渲染当前纯色，再逐个渲染风格组、主题组
  async renderAll() {
    await this.renderSolidPreview()
    const lists = [['styleCards', this.data.styleCards], ['themeCards', this.data.themeCards]]
    for (const [key, cards] of lists) {
      for (let i = 0; i < cards.length; i++) {
        try {
          const path = await this.renderPreview(cards[i].id)
          this.setData({ [`${key}[${i}].preview`]: path }, () => this.applyFilter())
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
