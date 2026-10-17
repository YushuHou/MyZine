// 风格：胶片（全部由代码绘制：深色底、齿孔、细白边、橙色日期戳、颗粒感）
module.exports = {
  id: 'film',
  name: '胶片',
  description: '深色底片、齿孔、橙色日期戳和颗粒感',
  tags: ['city-night', 'road-trip', 'architecture', 'couple', 'party'],
  assetsPackage: null,
  colors: {
    background: '#1C1B1A',
    text: '#EDE6D9',
    textMuted: '#8F887D',
    accent: '#FF8A2A',
    endpaper: '#2A2826',
    placeholder: '#34312E',
    fitFill: '#0E0D0C'
  },
  fonts: {
    title: { family: 'sans-serif', weight: 'bold', size: 84, lineHeight: 1.2, color: 'text', letterSpacing: 4 },
    subtitle: { family: 'monospace, sans-serif', weight: 'normal', size: 30, lineHeight: 1.4, color: 'accent', letterSpacing: 2 },
    body: { family: 'sans-serif', weight: 'normal', size: 32, lineHeight: 1.7, color: 'text' },
    caption: { family: 'monospace, sans-serif', weight: 'normal', size: 24, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  pageNumber: { show: true, family: 'monospace', size: 22, color: 'accent', bottom: 60 },
  background: { type: 'color', color: '#1C1B1A' },
  // 颗粒感：覆盖整页
  grain: { opacity: 0.16 },
  photoFrame: {
    borderWidth: 8,
    borderColor: '#F4EFE6',
    bottomExtra: 0,
    radius: 0,
    shadow: null,
    rotateJitter: 0
  },
  frameDecorations: [
    // 照片右下角的橙色日期戳（取旅行开始日期），太小的照片不画
    { type: 'dateStamp', color: 'accent', size: 30, family: 'monospace', margin: 26, minWidth: 320 }
  ],
  decorations: [
    // 页面上下边的胶片齿孔
    { type: 'perforation', edge: 'both', color: '#3D3a36', holeW: 26, holeH: 34, gap: 30, offset: 16, radius: 5 },
    // 正文页外侧顶部的片基文字，右页镜像到右侧
    { type: 'text', text: 'MYZINE 400', x: 0.0889, y: 0.0465, size: 17, family: 'monospace', color: 'accent', align: 'left', letterSpacing: 4, mirror: true, pageTypes: ['body'] }
  ]
}
