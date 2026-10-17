// 风格：极简纯色（全部由代码绘制，不需要图片素材）
module.exports = {
  id: 'minimal',
  name: '极简纯色',
  // 适合的主题，首页筛选使用
  tags: ['nature', 'architecture', 'city-night'],
  // 图片素材所在分包；纯代码绘制的风格为 null
  assetsPackage: null,
  colors: {
    background: '#F7F5F0',
    text: '#2B2B2B',
    accent: '#B5835A',
    placeholder: '#E6E1D8', // 空照片框
    fitFill: '#FFFFFF'      // 「完整」模式的留白色
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 72 },
    body: { family: 'sans-serif', weight: 'normal', size: 32 }
  },
  // 背景：{ type: 'color', color } 或 { type: 'image', src, repeat: 'tile' | 'cover' }
  background: { type: 'color', color: '#F7F5F0' },
  // 照片边框（尺寸以 1080 宽为基准 px）
  photoFrame: {
    borderWidth: 0,
    borderColor: '#FFFFFF',
    radius: null, // null 表示使用版式中的 radius
    shadow: null  // { color, blur, offsetX, offsetY }
  },
  // 装饰元素：[{ type: 'line' | 'rect' | 'image', pages: 'left' | 'right' | 'all', x, y, w, h, color }]
  decorations: []
}
