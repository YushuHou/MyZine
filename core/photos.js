// 照片导入：选择 → 读取宽高（按 EXIF 校正）→ 生成压缩图 → 按方向分类
const C = require('./constants')
const { call, isCancel } = require('./wxp')
const { isRotated90 } = require('./render/exif')

let idSeed = 0

// 按宽高比分类：横 / 竖 / 方
function classify(ratio) {
  if (ratio > C.LANDSCAPE_MIN_RATIO) return 'landscape'
  if (ratio < C.PORTRAIT_MAX_RATIO) return 'portrait'
  return 'square'
}

// 读取图片信息。部分机型返回的宽高是未按 EXIF 旋转的原始值，
// orientation 为 left/right（含 mirrored）时交换宽高，得到实际显示方向的宽高
async function readImage(src) {
  const info = await call(wx.getImageInfo, { src })
  const exif = info.orientation || 'up'
  const swap = isRotated90(exif)
  return {
    exif,
    rawWidth: info.width,
    rawHeight: info.height,
    width: swap ? info.height : info.width,
    height: swap ? info.width : info.height
  }
}

// 生成编辑/预览用的压缩图（长边 ≤ 2048）；不需要压缩或压缩失败时直接用原图
async function makeDisplayImage(src, info) {
  const longSide = Math.max(info.width, info.height)
  if (longSide <= C.DISPLAY_MAX_SIDE) return { path: src, info }
  const k = C.DISPLAY_MAX_SIDE / longSide
  try {
    // compressedWidth 按文件原始像素宽度（未旋转）等比计算
    let res = await call(wx.compressImage, { src, quality: 85, compressedWidth: Math.round(info.rawWidth * k) })
    let out = await readImage(res.tempFilePath)
    // 个别机型按旋转后的宽度处理，长边仍超限时换另一边重新压缩
    if (Math.max(out.width, out.height) > C.DISPLAY_MAX_SIDE * 1.05) {
      res = await call(wx.compressImage, { src, quality: 85, compressedWidth: Math.round(info.rawHeight * k) })
      out = await readImage(res.tempFilePath)
    }
    return { path: res.tempFilePath, info: out }
  } catch (err) {
    console.warn('压缩失败，使用原图显示', src, err)
    return { path: src, info }
  }
}

async function importOne(src) {
  const info = await readImage(src)
  const display = await makeDisplayImage(src, info)
  const ratio = info.width / info.height
  return {
    id: `p_${Date.now()}_${idSeed++}`,
    displayPath: display.path,     // 编辑、预览、分享版导出使用
    originalPath: src,             // 打印版导出使用
    width: info.width,             // 已按 EXIF 校正的宽高
    height: info.height,
    ratio: Math.round(ratio * 1000) / 1000,
    orientation: classify(ratio),
    exif: info.exif,               // 原图的 EXIF 方向
    displayExif: display.info.exif // 压缩图的 EXIF 方向（压缩时可能已把旋转写入像素）
  }
}

/**
 * 选择照片并逐张读取信息，顺序与用户选择顺序一致
 * @param onProgress (done, total) 读取进度回调
 * @returns { photos, failed: 读取失败张数, cancelled: 是否取消 }
 */
async function choosePhotos(onProgress) {
  let res
  try {
    res = await call(wx.chooseMedia, {
      count: C.CHOOSE_MAX_COUNT,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['original']
    })
  } catch (err) {
    if (isCancel(err)) return { photos: [], failed: 0, cancelled: true }
    throw err
  }

  const files = res.tempFiles
  const photos = []
  let failed = 0
  // 逐张串行处理，避免同时解码多张大图导致内存过高
  for (let i = 0; i < files.length; i++) {
    if (onProgress) onProgress(i, files.length)
    try {
      photos.push(await importOne(files[i].tempFilePath))
    } catch (err) {
      console.warn('读取照片失败', files[i].tempFilePath, err)
      failed++
    }
  }
  return { photos, failed, cancelled: false }
}

module.exports = { choosePhotos, classify }
