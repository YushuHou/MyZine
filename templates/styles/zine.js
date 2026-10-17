// 风格：独立 Zine（复印小册子）
// 米白纸 + 两色油墨（荧光粉、蓝）、半调网点色块、粗黑边、复印颗粒、MZ Oswald 大写粗标题、手绘箭头 / 星星
module.exports = {
  id: 'zine',
  name: '独立 Zine',
  group: 'style',
  description: '两色油墨、半调网点和粗黑边，像自己印的小册子',
  tags: ['city-night', 'party', 'road-trip', 'architecture'],
  assetsPackage: null,
  colors: {
    background: '#F4F1EA',
    text: '#141414',
    textMuted: '#5E5A55',
    accent: '#FF4F8B',
    blue: '#2E4BFF',
    endpaper: '#FFD6E5',
    placeholder: '#DCD8CF',
    fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'sans-serif', weight: 'bold', size: 88, lineHeight: 1.2, color: 'text' },
    subtitle: { family: 'sans-serif', weight: 'bold', size: 32, lineHeight: 1.4, color: 'accent' },
    body: { family: 'sans-serif', weight: 'normal', size: 32, lineHeight: 1.7, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 24, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  wordPool: ['Lost & Found', 'Out of Town', 'No Plans', 'Weekend Club', 'Night Shift', 'Cheap Thrills', 'Side Streets', 'Off Grid'],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'oswald', family: 'sans-serif', size: 130, uppercase: true, color: 'accent' }, minScale: 0.45 },
    kicker: { text: '{location} / {year}', font: { glyph: 'oswald', family: 'sans-serif', size: 26, letterSpacing: 4, uppercase: true, color: 'blue' } },
    index: { font: { glyph: 'oswald', family: 'sans-serif', size: 20, letterSpacing: 2, color: 'text' }, gap: 12 }
  },
  pageNumber: { show: true, glyph: 'oswald', family: 'sans-serif', size: 28, color: 'blue', bottom: 60, format: 'pad2' },
  background: { type: 'color', color: '#F4F1EA' },
  // 复印颗粒
  grain: { opacity: 0.12 },
  photoFrame: { borderWidth: 10, borderColor: '#141414', radius: 0, shadow: null, rotateJitter: 2 },
  doodles: {
    names: ['arrow', 'star', 'sparkle', 'wave'],
    perSpread: [1, 3],
    size: [90, 130],
    colors: ['text', 'accent', 'blue'],
    lineWidth: 5,
    rotate: 25,
    pageTypes: ['body']
  },
  decorations: [
    // 半调网点色块：外侧下角（粉）、内侧上角（蓝），各约一半的页出现
    { type: 'halftone', color: 'accent', x: 0, y: 0.6, w: 0.46, h: 0.3, dot: 9, gap: 20, fade: 0.85, mirror: true, chance: 0.5, pageTypes: ['body'] },
    { type: 'halftone', color: 'blue', x: 0.6, y: 0, w: 0.4, h: 0.22, dot: 7, gap: 18, fade: 0.9, mirror: true, chance: 0.35, pageTypes: ['body'] }
  ],
  layoutWeights: {
    'b-ST-L1T': 2,
    'b-ST-P1': 2,
    'b-OV-L1B': 2,
    'b-G6-P1': 2,
    'b-FB-H1L': 2,
    'b-H1L-L1': 2
  }
}
