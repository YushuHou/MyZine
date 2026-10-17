// 模板面板：编辑页底部弹出，换风格（只按跨页换，不做单页）
// 两种模式：spread 只换当前这一对页面（「P3–P4」）| book 换整本书的主模板（单独换过风格的页面不变）
// 每个风格一张用真实照片渲染的缩略图（book 模式为封面 + 第一个正文跨页两张），按纯色 / 风格 / 主题分组
// 缩略图按需渲染：只渲染滚到可视区附近的卡片，渲染器由编辑页持有（带缓存）
// 用法：selectComponent('#styleSheet').open({ album, spread, label, renderer })；点选后触发 apply 事件
const { listStyles, getStyle } = require('../../core/registry')

const GROUPS = [['solid', '纯色'], ['style', '风格'], ['theme', '主题']]
// 可视区上下各多渲染这么远（px），滚动时缩略图提前准备好
const PRELOAD_MARGIN = 360

Component({
  data: {
    show: false,
    tab: 'spread',
    spreadLabel: '',
    groups: [],
    // 当前这一对页面单独换过风格时：{ name: 主模板名 }，显示「恢复跟随整本书」
    follow: null,
    scrollTo: ''
  },

  detached() {
    this.stop()
  },

  methods: {
    open({ album, spread, label, renderer }) {
      this.album = album
      this.spread = spread
      this.renderer = renderer
      this.setData({ show: true, tab: 'spread', spreadLabel: label }, () => this.build())
    },

    close() {
      this.stop()
      this.setData({ show: false, groups: [] })
    },

    // 停止观察和排队中的渲染
    stop() {
      this.token = (this.token || 0) + 1
      this.pending = []
      if (this.observer) {
        this.observer.disconnect()
        this.observer = null
      }
    },

    onTab(e) {
      const tab = e.currentTarget.dataset.tab
      if (tab === this.data.tab) return
      this.setData({ tab }, () => this.build())
    },

    // 某个风格在当前模式下要渲染的跨页（虚拟跨页：独立 id，缓存互不覆盖）
    targets(styleId) {
      const album = this.album
      if (this.data.tab === 'spread') return [this.virtual(this.spread, styleId)]
      const cover = album.spreads.find(s => s.pageType === 'cover')
      const body = album.spreads.find(s => s.pageType === 'body')
      // 单独换过风格的跨页换主模板时不变
      return [cover, body].filter(Boolean).map(s => this.virtual(s, s.styleId || styleId))
    },

    virtual(spread, styleId) {
      return Object.assign({}, spread, { id: `sty_${styleId}_${spread.id}`, styleId })
    },

    build() {
      this.stop()
      const album = this.album
      const spreadMode = this.data.tab === 'spread'
      const mainId = album.defaultStyleId
      const currentId = spreadMode ? (this.spread.styleId || mainId) : mainId
      const styles = listStyles()
      const groups = GROUPS.map(([key, title]) => ({
        key,
        title,
        cards: styles.filter(s => s.group === key).map(s => ({
          id: s.id,
          name: s.name,
          current: s.id === currentId,
          // 「P3–P4」模式下标出主模板：选它就是恢复跟随整本书
          main: spreadMode && s.id === mainId,
          thumbs: this.targets(s.id).map(v => this.renderer.cached(album, v))
        }))
      }))
      this.setData({
        groups,
        follow: spreadMode && this.spread.styleId ? { name: getStyle(mainId).name } : null,
        scrollTo: ''
      }, () => {
        // 滚到当前风格，再开始观察（先渲染当前风格附近的卡片）
        this.setData({ scrollTo: `card-${currentId}` }, () => this.observe())
      })
    },

    observe() {
      const token = this.token
      this.observer = this.createIntersectionObserver({ observeAll: true })
      this.observer.relativeTo('.body', { top: PRELOAD_MARGIN, bottom: PRELOAD_MARGIN }).observe('.card', res => {
        if (token === this.token && res.intersectionRatio > 0) this.requestRender(res.dataset.id)
      })
    },

    // 排队渲染某个风格缺少的缩略图（同一时间只渲染一张）
    requestRender(styleId) {
      this.pending.push(styleId)
      if (!this.running) this.runQueue()
    },

    async runQueue() {
      this.running = true
      while (this.pending.length) {
        const styleId = this.pending.shift()
        const token = this.token
        const pos = this.findCard(styleId)
        if (!pos) continue
        const targets = this.targets(styleId)
        for (let k = 0; k < targets.length; k++) {
          if (token !== this.token) break
          if (this.data.groups[pos.g].cards[pos.c].thumbs[k]) continue
          try {
            const path = await this.renderer.render(this.album, targets[k])
            if (token === this.token) this.setData({ [`groups[${pos.g}].cards[${pos.c}].thumbs[${k}]`]: path })
          } catch (err) {
            console.warn('生成模板缩略图失败', err)
          }
        }
      }
      this.running = false
    },

    findCard(styleId) {
      const groups = this.data.groups
      for (let g = 0; g < groups.length; g++) {
        const c = groups[g].cards.findIndex(card => card.id === styleId)
        if (c >= 0) return { g, c }
      }
      return null
    },

    onPick(e) {
      this.apply(e.currentTarget.dataset.id)
    },

    // 恢复跟随整本书（只在「P3–P4」模式下出现）
    onFollow() {
      this.apply(null)
    },

    apply(styleId) {
      this.triggerEvent('apply', {
        scope: this.data.tab === 'spread' ? 'spread' : 'book',
        styleId,
        spreadId: this.spread.id,
        label: this.data.spreadLabel
      })
      this.close()
    },

    noop() {}
  }
})
