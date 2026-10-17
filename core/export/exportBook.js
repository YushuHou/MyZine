// 整本书导出：PDF、批量保存图片、导出前的空照片框统计
const C = require('../constants')
const { getPageList, getSpread, getPhoto } = require('../album')
const { getLayout, getLayoutPage } = require('../registry')
const { createPdfWriter } = require('./pdf')
const { renderPageToFile, renderSpreadToFile, saveToPhotosAlbum, removeTempFile } = require('./saveImage')

// 用户取消时抛出，调用方据此区分「取消」和「失败」
function cancelError() {
  const err = new Error('cancelled')
  err.cancelled = true
  return err
}

// 文件名：书名去掉非法字符；书名为空时「MyZine相册_20261017」
function pdfFileName(album) {
  const title = (album.info.title || '').replace(/[\\/:*?"<>|\r\n\t]/g, '').trim().slice(0, 40)
  if (title) return title
  const d = new Date()
  const p = n => (n < 10 ? '0' : '') + n
  return `MyZine相册_${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}

/**
 * 统计若干页中的空照片框（没有照片，或照片已被删除）
 * @returns { count, firstPage }：firstPage 为第一个有空框的页，便于返回编辑页填充
 */
function countEmptyFrames(album, pages) {
  let count = 0
  let firstPage = null
  pages.forEach(page => {
    const spread = getSpread(album, page.spreadId)
    const frames = getLayoutPage(getLayout(spread.layoutId), page.side).frames
    const empty = frames.filter(f => {
      const slot = spread.slots[f.id]
      return !slot || !getPhoto(album, slot.photoId)
    }).length
    if (empty && !firstPage) firstPage = page
    count += empty
  })
  return { count, firstPage }
}

// PDF 的页序列：跨页大图拆成左右两页
function pdfPages(album) {
  const list = []
  getPageList(album).forEach(page => {
    if (page.side === 'full') {
      list.push({ page, half: 'left' }, { page, half: 'right' })
    } else {
      list.push({ page, half: null })
    }
  })
  return list
}

/**
 * 生成 PDF，逐页渲染 → JPG → 追加写入，写完一页立即删除 JPG、释放图片
 * @param presetName 'share' | 'print'
 * @param hooks { onProgress(done, total), isCancelled() }
 * @returns { path, fileName, pages, size }
 */
async function exportPdf(album, presetName, hooks = {}) {
  const preset = C.PDF_PRESETS[presetName]
  const fs = wx.getFileSystemManager()
  const name = pdfFileName(album)
  const path = `${wx.env.USER_DATA_PATH}/${name}.pdf`
  const list = pdfPages(album)
  const pxHeight = Math.round(preset.width * C.PAGE_HEIGHT / C.PAGE_WIDTH)
  const writer = createPdfWriter(path, { pageWidth: C.PDF_PAGE_WIDTH_PT, pageHeight: C.PDF_PAGE_HEIGHT_PT })

  try {
    writer.begin()
    for (let i = 0; i < list.length; i++) {
      if (hooks.isCancelled && hooks.isCancelled()) throw cancelError()
      if (hooks.onProgress) hooks.onProgress(i, list.length)
      const jpgPath = await renderPageToFile(album, list[i].page, {
        width: preset.width,
        variant: preset.variant,
        quality: preset.quality,
        half: list[i].half
      })
      try {
        writer.addJpegPage(fs.readFileSync(jpgPath), preset.width, pxHeight)
      } finally {
        removeTempFile(jpgPath)
      }
    }
    writer.finish({ title: album.info.title })
  } catch (err) {
    removeTempFile(path)
    throw err
  }
  if (hooks.onProgress) hooks.onProgress(list.length, list.length)
  return { path, fileName: `${name}.pdf`, pages: list.length, size: fs.statSync(path).size }
}

/**
 * 批量保存图片到相册
 * @param targets [{ page }]（单页 1080×1440）或 [{ spread }]（跨页 2160×1440）
 * @param hooks   { onProgress(done, total), isCancelled() }
 * @returns { saved, stopped }：stopped 为中途停止的原因（'denied' | 'privacy' | 'cancelled'），全部完成为 null
 */
async function exportImages(album, targets, hooks = {}) {
  let saved = 0
  for (let i = 0; i < targets.length; i++) {
    if (hooks.isCancelled && hooks.isCancelled()) return { saved, stopped: 'cancelled' }
    if (hooks.onProgress) hooks.onProgress(i, targets.length)
    const t = targets[i]
    const path = t.spread ? await renderSpreadToFile(album, t.spread) : await renderPageToFile(album, t.page)
    let result
    try {
      result = await saveToPhotosAlbum(path)
    } finally {
      removeTempFile(path)
    }
    // 权限被拒绝等情况：停止后面的保存
    if (result !== 'saved') return { saved, stopped: result }
    saved++
  }
  return { saved, stopped: null }
}

module.exports = { pdfFileName, countEmptyFrames, exportPdf, exportImages }
