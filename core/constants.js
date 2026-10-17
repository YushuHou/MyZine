// 页面规格与全局常量（尺寸单位均为基准画布 px）
module.exports = {
  // 单页 3:4
  PAGE_WIDTH: 1080,
  PAGE_HEIGHT: 1440,
  // 跨页 3:2
  SPREAD_WIDTH: 2160,
  // 四周安全边距（约 5%）
  SAFE_MARGIN: 72,
  // 中缝：跨页中线左右各 40px 为书脊区域
  GUTTER: 40,
  // 正文版心外侧边距（页码与外侧照片边缘对齐）
  PAGE_MARGIN_OUTER: 96,

  // 照片方向判断：宽高比 > 1.1 为横图，< 0.9 为竖图，其余为方图
  LANDSCAPE_MIN_RATIO: 1.1,
  PORTRAIT_MAX_RATIO: 0.9,

  // 编辑/预览用压缩图的长边上限
  DISPLAY_MAX_SIDE: 2048,
  // 网格缩略图的长边
  THUMB_MAX_SIDE: 360,
  // 单次最多选择照片数
  CHOOSE_MAX_COUNT: 20,
  // 导出 JPG 质量（单张图片）
  EXPORT_JPG_QUALITY: 0.92,

  // PDF 两种清晰度：分享版用压缩图，打印版从原图读取（2480 宽约 300dpi，对应 21×28cm）
  PDF_PRESETS: {
    share: { width: 1080, variant: 'display', quality: 0.85 },
    print: { width: 2480, variant: 'original', quality: 0.93 }
  },
  // PDF 页面物理尺寸 21×28cm（单位 pt，1pt = 1/72 英寸），两种清晰度相同
  PDF_PAGE_WIDTH_PT: 595.28,
  PDF_PAGE_HEIGHT_PT: 793.7
}
