// 单页导出为图片并保存到相册。使用离屏 canvas，阶段4 的打印版大尺寸导出沿用同一流程
const C = require('../constants')
const { call, isCancel, isAuthDenied, privacyErrorText } = require('../wxp')
const { getLayout } = require('../registry')
const { getSpread, getSpreadPhotos, getSpreadStyle } = require('../album')
const { renderPage } = require('../render/renderPage')
const { createImageLoader } = require('../render/imageLoader')

/**
 * 把一页渲染成 JPG 文件
 * @param options.width   单页宽度，默认 1080（打印版传 2480）
 * @param options.variant 'display' 压缩图 | 'original' 原图
 * @param options.quality JPG 质量
 * @returns 文件路径；用完后调用 removeExportFile 清理
 */
async function renderPageToFile(album, page, options = {}) {
  const pageWidth = options.width || C.PAGE_WIDTH
  const width = page.side === 'full' ? pageWidth * 2 : pageWidth
  const height = Math.round(pageWidth * C.PAGE_HEIGHT / C.PAGE_WIDTH)
  const spread = getSpread(album, page.spreadId)

  const canvas = wx.createOffscreenCanvas({ type: '2d', width, height })
  const ctx = canvas.getContext('2d')
  const loader = createImageLoader(canvas)
  try {
    const images = await loader.loadPhotos(getSpreadPhotos(album, spread), options.variant || 'display')
    renderPage(ctx, page, getLayout(spread.layoutId), getSpreadStyle(album, spread), { width, height }, images)
    return await exportCanvas(canvas, width, height, options.quality || C.EXPORT_JPG_QUALITY)
  } finally {
    // 生成完立即释放图片，避免大尺寸时内存不足
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

module.exports = { renderPageToFile, exportCanvas, saveToPhotosAlbum, removeExportFile }
