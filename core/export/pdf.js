// 轻量 PDF 生成器：每页一张 JPG（/DCTDecode），边生成边追加写入文件，不在内存中拼整本书
// 不依赖浏览器环境，只用到 FileSystemManager
//
// 对象编号：1 目录（Catalog）、2 页树（Pages），之后每页依次占 3 个：图片、内容流、页
// 页树和目录要等所有页写完才知道内容，所以最后才写；xref 按编号记录各对象的字节偏移

// 数字转 PDF 文本：最多两位小数，去掉多余的 0
function num(n) {
  return String(Math.round(n * 100) / 100)
}

// 文本字符串用 UTF-16BE 十六进制表示，支持中文
function textString(str) {
  let hex = 'FEFF'
  for (let i = 0; i < str.length; i++) {
    hex += ('0000' + str.charCodeAt(i).toString(16).toUpperCase()).slice(-4)
  }
  return `<${hex}>`
}

// D:YYYYMMDDHHmmss
function pdfDate(date) {
  const p = n => (n < 10 ? '0' : '') + n
  return `D:${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}${p(date.getHours())}${p(date.getMinutes())}${p(date.getSeconds())}`
}

/**
 * @param filePath 输出文件路径（会被覆盖）
 * @param options  { pageWidth, pageHeight }：页面尺寸，单位 pt
 * @param fs       FileSystemManager，默认 wx.getFileSystemManager()（便于离线测试时替换）
 */
function createPdfWriter(filePath, options, fs) {
  fs = fs || wx.getFileSystemManager()
  const W = num(options.pageWidth)
  const H = num(options.pageHeight)
  const offsets = []
  const pageIds = []
  let offset = 0
  let nextId = 3

  // 写入的字符串只含 ASCII，字符数即字节数
  function writeText(str) {
    fs.appendFileSync(filePath, str, 'utf8')
    offset += str.length
  }

  function writeBytes(buffer) {
    fs.appendFileSync(filePath, buffer)
    offset += buffer.byteLength
  }

  function beginObject(id) {
    offsets[id] = offset
    writeText(`${id} 0 obj\n`)
  }

  return {
    begin() {
      const header = '%PDF-1.4\n'
      fs.writeFileSync(filePath, header, 'utf8')
      offset = header.length
      // 第二行放几个大于 127 的字节，告诉阅读器这是二进制文件
      writeBytes(new Uint8Array([0x25, 0xE2, 0xE3, 0xCF, 0xD3, 0x0A]).buffer)
    },

    /**
     * 追加一页：整页铺满一张 JPG
     * @param jpg     JPG 文件内容（ArrayBuffer）
     * @param pxWidth, pxHeight JPG 像素尺寸
     */
    addJpegPage(jpg, pxWidth, pxHeight) {
      const imageId = nextId++
      const contentId = nextId++
      const pageId = nextId++

      beginObject(imageId)
      writeText(`<< /Type /XObject /Subtype /Image /Width ${pxWidth} /Height ${pxHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpg.byteLength} >>\nstream\n`)
      writeBytes(jpg)
      writeText('\nendstream\nendobj\n')

      const content = `q ${W} 0 0 ${H} 0 0 cm /Im0 Do Q`
      beginObject(contentId)
      writeText(`<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`)

      beginObject(pageId)
      writeText(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`)
      pageIds.push(pageId)
    },

    // 写页树、目录、文档信息、xref 和 trailer，完成文件
    finish(meta = {}) {
      beginObject(2)
      writeText(`<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>\nendobj\n`)

      beginObject(1)
      writeText('<< /Type /Catalog /Pages 2 0 R >>\nendobj\n')

      const infoId = nextId++
      beginObject(infoId)
      const title = meta.title ? ` /Title ${textString(meta.title)}` : ''
      writeText(`<<${title} /Producer (MyZine) /CreationDate (${pdfDate(new Date())}) >>\nendobj\n`)

      const xrefOffset = offset
      let xref = `xref\n0 ${nextId}\n0000000000 65535 f \n`
      for (let id = 1; id < nextId; id++) {
        xref += `${('0000000000' + offsets[id]).slice(-10)} 00000 n \n`
      }
      writeText(xref)
      writeText(`trailer\n<< /Size ${nextId} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`)
      return pageIds.length
    }
  }
}

module.exports = { createPdfWriter }
