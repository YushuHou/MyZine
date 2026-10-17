// 导出：PDF 相册（分享版 / 打印版）与保存图片（单页 / 跨页）
const app = getApp()
const { getPageList, getSpreadLabels } = require('../../core/album')
const { getLayout } = require('../../core/registry')
const { countEmptyFrames, exportPdf, exportImages } = require('../../core/export/exportBook')
const { removeTempFile } = require('../../core/export/saveImage')
const { isCancel } = require('../../core/wxp')

function formatSize(bytes) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
}

// 把导出失败的原因转成用户能看懂的提示
function describeError(err, presetName) {
  const msg = (err && (err.errMsg || err.message)) || ''
  if (/exceed|storage|space/i.test(msg)) return '手机存储空间不足，请清理后重试，或改用分享版'
  if (presetName === 'print') return '生成失败，可能是手机内存不足，建议改用分享版'
  return '生成失败，请重试'
}

Page({
  data: {
    preset: 'share',
    busy: false,
    progressText: '',
    progressPercent: 0,
    // 生成好的 PDF：{ fileName, pages, sizeText }
    pdf: null,
    imageMode: 'page',
    chips: [],
    selectedCount: 0
  },

  onLoad(query) {
    this.album = app.globalData.album
    if (!this.album) {
      wx.navigateBack()
      return
    }
    this.from = { spreadId: query.spreadId, side: query.side }
    this.buildChips()
  },

  onUnload() {
    this.cancelled = true
    this.removePdf()
  },

  // ---------- 选择要保存的页 ----------

  // 单页模式按页选择；跨页模式按跨页选择。默认选中从编辑页进来时的那一页 / 那个跨页
  buildChips() {
    const { spreadId, side } = this.from
    let chips
    if (this.data.imageMode === 'page') {
      chips = getPageList(this.album).map((p, i) => ({
        key: i,
        label: p.label,
        selected: p.spreadId === spreadId && p.side === side
      }))
    } else {
      const labels = getSpreadLabels(this.album)
      chips = this.album.spreads.map(s => ({ key: s.id, label: labels[s.id], selected: s.id === spreadId }))
    }
    this.setData({ chips, selectedCount: chips.filter(c => c.selected).length })
  },

  onImageMode(e) {
    const mode = e.currentTarget.dataset.mode
    if (mode === this.data.imageMode) return
    this.setData({ imageMode: mode }, () => this.buildChips())
  },

  onToggleChip(e) {
    const i = e.currentTarget.dataset.index
    const selected = !this.data.chips[i].selected
    this.setData({
      [`chips[${i}].selected`]: selected,
      selectedCount: this.data.selectedCount + (selected ? 1 : -1)
    })
  },

  onSelectAll() {
    const all = this.data.selectedCount < this.data.chips.length
    this.setData({
      chips: this.data.chips.map(c => Object.assign({}, c, { selected: all })),
      selectedCount: all ? this.data.chips.length : 0
    })
  },

  // ---------- 空照片框检查 ----------

  // 有空框时让用户选「返回填充」或「直接导出」；返回 true 表示继续导出
  confirmEmptyFrames(pages) {
    const { count, firstPage } = countEmptyFrames(this.album, pages)
    if (!count) return Promise.resolve(true)
    return new Promise(resolve => {
      wx.showModal({
        title: `还有 ${count} 个空照片框`,
        content: '直接导出时，空框会显示为浅色占位',
        cancelText: '返回填充',
        confirmText: '直接导出',
        success: res => {
          if (res.confirm) return resolve(true)
          // 回到编辑页，跳到第一个有空框的页
          const channel = this.getOpenerEventChannel()
          if (channel && channel.emit) channel.emit('jump', { spreadId: firstPage.spreadId, side: firstPage.side })
          wx.navigateBack()
          resolve(false)
        },
        fail: () => resolve(false)
      })
    })
  },

  // ---------- 进度 ----------

  startProgress(text) {
    this.cancelled = false
    this.setData({ busy: true, progressText: text, progressPercent: 0 })
    wx.setKeepScreenOn({ keepScreenOn: true })
    if (wx.enableAlertBeforeUnload) wx.enableAlertBeforeUnload({ message: '正在导出，离开后导出会中断' })
  },

  updateProgress(text, done, total) {
    this.setData({ progressText: text, progressPercent: total ? Math.round(done / total * 100) : 0 })
  },

  endProgress() {
    this.setData({ busy: false })
    wx.setKeepScreenOn({ keepScreenOn: false })
    if (wx.disableAlertBeforeUnload) wx.disableAlertBeforeUnload()
  },

  // 进度遮罩：阻止滑动穿透
  noop() {},

  onCancel() {
    this.cancelled = true
    this.setData({ progressText: '正在取消…' })
  },

  // ---------- PDF ----------

  onPreset(e) {
    this.setData({ preset: e.currentTarget.dataset.preset })
  },

  removePdf() {
    if (this.pdfPath) removeTempFile(this.pdfPath)
    this.pdfPath = ''
  },

  async onGeneratePdf() {
    if (this.data.busy) return
    if (!(await this.confirmEmptyFrames(getPageList(this.album)))) return
    // 开始新的导出前删除上一次的 PDF
    this.removePdf()
    this.setData({ pdf: null })
    const preset = this.data.preset
    this.startProgress('准备中…')
    try {
      const result = await exportPdf(this.album, preset, {
        onProgress: (done, total) => {
          if (!this.cancelled) this.updateProgress(done < total ? `正在生成 第 ${done + 1} / ${total} 页` : '正在完成…', done, total)
        },
        isCancelled: () => this.cancelled
      })
      this.pdfPath = result.path
      this.setData({ pdf: { fileName: result.fileName, pages: result.pages, sizeText: formatSize(result.size), preset } })
    } catch (err) {
      if (err && err.cancelled) {
        wx.showToast({ title: '已取消', icon: 'none' })
      } else {
        console.error('生成 PDF 失败', err)
        wx.showModal({ title: '导出失败', content: describeError(err, preset), showCancel: false })
      }
    } finally {
      this.endProgress()
    }
  },

  // 发送到微信聊天（必须由点击直接触发，不能放在 await 之后）
  onSharePdf() {
    if (!this.pdfPath) return
    wx.shareFileMessage({
      filePath: this.pdfPath,
      fileName: this.data.pdf.fileName,
      fail: err => {
        if (isCancel(err)) return
        console.error('发送失败', err)
        // 官方未写明大小上限，失败时按文件过大处理，给出替代方案
        wx.showModal({
          title: '发送失败',
          content: `文件可能过大（当前 ${this.data.pdf.sizeText}）。可以改用分享版重新生成，或点「打开预览」后用右上角菜单转发。`,
          showCancel: false
        })
      }
    })
  },

  onOpenPdf() {
    if (!this.pdfPath) return
    wx.openDocument({
      filePath: this.pdfPath,
      fileType: 'pdf',
      showMenu: true,
      fail: err => {
        console.error('打开失败', err)
        wx.showToast({ title: '打开失败', icon: 'none' })
      }
    })
  },

  // ---------- 保存图片 ----------

  async onSaveImages() {
    if (this.data.busy || !this.data.selectedCount) return
    const pages = getPageList(this.album)
    const keys = {}
    this.data.chips.forEach(c => { if (c.selected) keys[c.key] = true })

    let targets
    let checkPages
    if (this.data.imageMode === 'page') {
      targets = pages.filter((p, i) => keys[i]).map(page => ({ page }))
      checkPages = targets.map(t => t.page)
    } else {
      // 跨页模式：封面、封底按单页保存，不留半边空白
      targets = []
      this.album.spreads.filter(s => keys[s.id]).forEach(spread => {
        if (getLayout(spread.layoutId).span === 'single') {
          targets.push({ page: pages.find(p => p.spreadId === spread.id) })
        } else {
          targets.push({ spread })
        }
      })
      checkPages = pages.filter(p => keys[p.spreadId])
    }

    if (!(await this.confirmEmptyFrames(checkPages))) return
    this.startProgress('准备中…')
    try {
      const result = await exportImages(this.album, targets, {
        onProgress: (done, total) => {
          if (!this.cancelled) this.updateProgress(`正在保存 第 ${done + 1} / ${total} 张`, done, total)
        },
        isCancelled: () => this.cancelled
      })
      this.endProgress()
      if (result.saved) {
        const rest = result.stopped ? `，其余 ${targets.length - result.saved} 张未保存` : ''
        wx.showToast({ title: `已保存 ${result.saved} 张到相册${rest}`, icon: 'none', duration: 2500 })
      } else if (result.stopped === 'cancelled') {
        wx.showToast({ title: '已取消', icon: 'none' })
      }
    } catch (err) {
      console.error('保存图片失败', err)
      this.endProgress()
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
})
