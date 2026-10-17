// 照片选择面板：底部弹出，显示所在页标签，可筛选「全部 / 未使用」，当前照片高亮
Component({
  properties: {
    show: { type: Boolean, value: false },
    // [{ id, thumb, tags: 'P3 P8' }]，tags 为空表示未使用
    photos: { type: Array, value: [] },
    // 当前照片框中的照片 id
    currentId: { type: String, value: '' }
  },

  data: {
    filter: 'all',
    list: [],
    unusedCount: 0
  },

  observers: {
    'photos, filter': function (photos, filter) {
      this.setData({
        list: filter === 'unused' ? photos.filter(p => !p.tags) : photos,
        unusedCount: photos.filter(p => !p.tags).length
      })
    }
  },

  methods: {
    onFilter(e) {
      this.setData({ filter: e.currentTarget.dataset.filter })
    },

    onSelect(e) {
      this.triggerEvent('select', { photoId: e.currentTarget.dataset.id })
    },

    onClose() {
      this.triggerEvent('close')
    },

    // 阻止面板内的滑动穿透到下层页面
    noop() {}
  }
})
