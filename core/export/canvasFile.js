// 画布导出为文件，以及导出文件的清理
const { call } = require('../wxp')

// 离屏 canvas 导出为图片文件：优先 canvasToTempFilePath，不支持时改用 toDataURL 写文件
// fileType：'jpg'（默认）| 'png'（需要透明时，如颗粒纹理）
async function exportCanvas(canvas, width, height, quality, fileType = 'jpg') {
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
      fileType,
      quality
    })
    return res.tempFilePath
  } catch (err) {
    console.warn('canvasToTempFilePath 导出离屏 canvas 失败，改用 toDataURL', err)
  }
  const dataUrl = canvas.toDataURL(fileType === 'png' ? 'image/png' : 'image/jpeg', quality)
  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1)
  const path = `${wx.env.USER_DATA_PATH}/myzine_export_${Date.now()}_${Math.floor(Math.random() * 1e6)}.${fileType}`
  wx.getFileSystemManager().writeFileSync(path, base64, 'base64')
  return path
}

// 删除导出过程中生成的临时文件（明确是我们自己生成的文件才调用；系统临时文件删不掉时忽略）
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

module.exports = { exportCanvas, removeTempFile, removeExportFile }
