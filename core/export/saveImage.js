// 页面 / 跨页渲染为 JPG 文件，保存到相册。全部使用离屏 canvas，PDF 打印版的大尺寸也走这里
const C = require('../constants')
const { call, isCancel, isAuthDenied, privacyErrorText } = require('../wxp')
const { getLayout, getLayoutPage } = require('../registry')
const { getSpread, getSpreadPhotos, getSpreadStyle, getPhoto } = require('../album')
const { renderPage } = require('../render/renderPage')
const { renderSpread } = require('../render/renderSpread')
const { createImageLoader } = require('../render/imageLoader')

// 单页高度
function pageHeightOf(pageWidth) {
  return Math.round(pageWidth * C.PAGE_HEIGHT / C.PAGE_WIDTH)
}

// 某一页用到的照片（只加载这一页的，打印版内存更可控）
function getPagePhotos(album, spread, side) {
  const frames = getLayoutPage(getLayout(spread.layoutId), side).frames
  const ids = {}
  frames.forEach(f => { if (spread.slots[f.id]) ids[spread.slots[f.id].photoId] = true })
  return Object.keys(ids).map(id => getPhoto(album, id)).filter(Boolean)
}

/**
 * 把一页渲染成 JPG 文件
 * @param options.width   单页宽度，默认 1080（打印版传 2480）
 * @param options.variant 'display' 压缩图 | 'original' 原图
 * @param options.quality JPG 质量
 * @param options.half    跨页大图（side = full）只输出一半：'left' | 'right'，用于 PDF 拆页
 * @returns 文件路径；用完后调用 removeExportFile 清理
 */
async function renderPageToFile(album, page, options = {}) {
  const pageWidth = options.width || C.PAGE_WIDTH
  const height = pageHeightOf(pageWidth)
  const isFull = page.side === 'full'
  const half = isFull ? options.half : null
  const width = isFull && !half ? pageWidth * 2 : pageWidth
  const spread = getSpread(album, page.spreadId)

  const canvas = wx.createOffscreenCanvas({ type: '2d', width, height })
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  const loader = createImageLoader(canvas)
  try {
    const images = await loader.loadPhotos(getPagePhotos(album, spread, page.side), options.variant || 'display')
    // 拆半：按整张跨页尺寸绘制，平移后只留需要的一半
    if (half === 'right') ctx.translate(-pageWidth, 0)
    const size = isFull ? { width: pageWidth * 2, height } : { width, height }
    renderPage(ctx, page, getLayout(spread.layoutId), getSpreadStyle(album, spread), size, images)
    return await exportCanvas(canvas, width, height, options.quality || C.EXPORT_JPG_QUALITY)
  } finally {
    // 生成完立即释放图片，避免大尺寸时内存不足
    loader.clear()
  }
}

/**
 * 把一个跨页渲染成一张 3:2 横图（2160×1440），不画中缝阴影
 */
async function renderSpreadToFile(album, spread, options = {}) {
  const pageWidth = options.width || C.PAGE_WIDTH
  const width = pageWidth * 2
  const height = pageHeightOf(pageWidth)
  const canvas = wx.createOffscreenCanvas({ type: '2d', width, height })
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas unavailable')
  const loader = createImageLoader(canvas)
  try {
    const images = await loader.loadPhotos(getSpreadPhotos(album, spread), options.variant || 'display')
    const style = getSpreadStyle(album, spread)
    renderSpread(ctx, album, spread, { width, height }, images, { blankColor: style.colors.background })
    return await exportCanvas(canvas, width, height, options.quality || C.EXPORT_JPG_QUALITY)
  } finally {
    loader.clear()
  }
}

// 离屏 canvas 导出为 JPG：优先 canvasToTempFilePath，不支持时改用 toDataURL 写文件
async function exportCanvas(canvas, width, height, quality) {
  try {
    const res = await call(wx.canvasToTempFilePath, {
      canvas,
      x: 0,
      y: 0,
      width,
      height,
      // 明确指定输出尺寸，否则默认会乘以设备像素比
      destWidth: width,
      destHeight: height,
      fileType: 'jpg',
      quality
    })
    return res.tempFilePath
  } catch (err) {
    console.warn('canvasToTempFilePath 导出离屏 canvas 失败，改用 toDataURL', err)
  }
  const dataUrl = canvas.toDataURL('image/jpeg', quality)
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const path = `${wx.env.USER_DATA_PATH}/myzine_export_${Date.now()}.jpg`
  wx.getFileSystemManager().writeFileSync(path, base64, 'base64')
  return path
}

// 删除导出过程中生成的临时 JPG（明确是我们自己生成的文件才调用；系统临时文件删不掉时忽略）
function removeTempFile(path) {
  if (!path) return
  try {
    wx.getFileSystemManager().unlinkSync(path)
  } catch (err) {
    // 系统临时文件可能不允许删除，由微信自动回收
  }
}

// 清理我们写入用户目录的导出文件（系统临时文件由微信自动管理）
function removeExportFile(path) {
  if (!path || path.indexOf(wx.env.USER_DATA_PATH) !== 0) return
  try {
    wx.getFileSystemManager().unlinkSync(path)
  } catch (err) {
    console.warn('清理导出文件失败', path, err)
  }
}

// 用户拒绝过相册权限时，引导到设置页开启；返回是否已开启
// openSetting 需由用户点击触发，因此直接在弹窗的 success 回调里调用，不经过 Promise 中转
function guideToSetting() {
  return new Promise(resolve => {
    wx.showModal({
      title: '需要相册权限',
      content: '点击「去设置」开启「添加到相册」，即可保存图片',
      confirmText: '去设置',
      success(modal) {
        if (!modal.confirm) return resolve(false)
        wx.openSetting({
          success: res => resolve(!!(res.authSetting && res.authSetting['scope.writePhotosAlbum'])),
          fail: () => resolve(false)
        })
      },
      fail: () => resolve(false)
    })
  })
}

/**
 * 保存图片到相册，处理隐私和权限拒绝
 * @returns 'saved' | 'denied' | 'privacy' | 'cancelled'
 */
async function saveToPhotosAlbum(filePath) {
  try {
    await call(wx.saveImageToPhotosAlbum, { filePath })
    return 'saved'
  } catch (err) {
    // 103：在「隐私 + 相册权限」合并弹窗中拒绝。真机上微信会记住这次拒绝，之后不再弹窗，
    // 需要和普通的相册权限拒绝一样，引导到设置页重新开启
    if (isAuthDenied(err) || (err && err.errno === 103)) {
      if (!(await guideToSetting())) return 'denied'
      await call(wx.saveImageToPhotosAlbum, { filePath })
      return 'saved'
    }
    // 104：未同意隐私保护指引；112：后台隐私保护指引未声明相册权限
    const privacyText = privacyErrorText(err)
    if (privacyText) {
      wx.showToast({ title: privacyText, icon: 'none' })
      return 'privacy'
    }
    if (isCancel(err)) return 'cancelled'
    throw err
  }
}

module.exports = {
  renderPageToFile,
  renderSpreadToFile,
  exportCanvas,
  saveToPhotosAlbum,
  removeExportFile,
  removeTempFile
}
