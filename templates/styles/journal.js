// 风格：手账（全部由代码绘制：纸张纹理、拍立得白边、轻微倾斜、和纸胶带）
module.exports = {
  id: 'journal',
  name: '手账',
  description: '米色纸张、拍立得白边、和纸胶带，轻松随手',
  tags: ['food', 'family', 'pets', 'zoo-farm', 'amusement', 'party'],
  assetsPackage: null,
  colors: {
    background: '#F3EBDD',
    text: '#4A3F35',
    textMuted: '#9A8B7A',
    accent: '#D9825B',
    endpaper: '#E6D6BE',
    placeholder: '#E3D7C4',
    fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 84, lineHeight: 1.25, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.4, color: 'accent' },
    body: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.75, color: 'text' },
    caption: { family: 'serif', weight: 'normal', size: 26, lineHeight: 1.5, color: 'textMuted', letterSpacing: 1 }
  },
  // 手账风格不印页码
  pageNumber: { show: false },
  // 代码生成的纸张纹理平铺；生成失败时显示 color 纯色
  background: { type: 'texture', texture: 'paper', tile: 540, color: '#F2E9D9' },
  photoFrame: {
    borderWidth: 20,
    borderColor: '#FFFFFF',
    // 拍立得：底边加宽
    bottomExtra: 56,
    radius: 0,
    shadow: { color: 'rgba(80, 60, 40, 0.25)', blur: 18, offsetX: 0, offsetY: 6 },
    // 每张照片随机倾斜 ±2.5°（满版照片不倾斜）
    rotateJitter: 2.5
  },
  frameDecorations: [
    // 顶边一条和纸胶带，颜色随机
    {
      type: 'tape',
      colors: ['rgba(232, 176, 156, 0.78)', 'rgba(164, 198, 186, 0.78)', 'rgba(238, 210, 134, 0.78)', 'rgba(190, 176, 214, 0.78)'],
      width: 170,
      height: 46,
      placement: 'top',
      angleJitter: 10
    }
  ],
  decorations: []
}
