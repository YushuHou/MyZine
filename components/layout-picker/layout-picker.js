// 版式选择面板：按照片张数分组，显示每个版式的示意图
// （wx.showActionSheet 最多 6 项，版式多了放不下，所以单独做成面板）
const { getLayoutFrames } = require('../../core/registry')

function pct(v) {
  return Math.round(v * 10000) / 100
}

// 版式 → 示意图数据：单页版式两页并排，跨页大图一整张
function toPreview(layout) {
  // 形状：圆形 / 椭圆整圆角，拱形只圆上边
  const frames = page => page.frames.map(f => ({ id: f.id, left: pct(f.x), top: pct(f.y), width: pct(f.w), height: pct(f.h), shape: f.shape || 'rect' }))
  return {
    id: layout.id,
    name: layout.name,
    count: getLayoutFrames(layout).length,
    spread: layout.span === 'spread',
    pages: layout.pages.map(p => ({ frames: frames(p) }))
  }
}

Component({
  properties: {
    show: { type: Boolean, value: false },
    title: { type: String, value: '选择版式' },
    layouts: { type: Array, value: [] },
    currentId: { type: String, value: '' }
  },

  data: {
    groups: []
  },

  observers: {
    layouts(layouts) {
      const map = {}
      layouts.forEach(l => {
        const item = toPreview(l)
        const key = item.spread ? '跨页大图' : item.count >= 4 ? '4 张及以上' : `${item.count} 张`
        ;(map[key] = map[key] || []).push(item)
      })
      const order = ['1 张', '2 张', '3 张', '4 张及以上', '跨页大图']
      this.setData({ groups: order.filter(k => map[k]).map(k => ({ title: k, items: map[k] })) })
    }
  },

  methods: {
    onSelect(e) {
      this.triggerEvent('select', { layoutId: e.currentTarget.dataset.id })
    },

    onClose() {
      this.triggerEvent('close')
    },

    noop() {}
  }
})
