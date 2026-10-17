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
  // 装饰词池：整本书不重复（有标题槽的跨页才用掉一个），用完后重新开始
  wordPool: [
    'Lost & Found', 'Out of Town', 'No Plans', 'Weekend Club', 'Night Shift', 'Cheap Thrills',
    'Side Streets', 'Off Grid', 'DIY', 'Zine Scene', 'Loud & Clear', 'Weird & Wonderful', 'Free Spirit',
    'Out Loud', 'Xerox Club', 'Back Pages', 'Paper Cuts', 'Side B', 'Fringe', 'Wild Card', 'Street Level'
  ],
  // 撕纸条短句：整本书不重复
  stripPool: [
    'No Filter', 'Stay Weird', 'Cut Here', 'Do It Yourself', 'Print & Fold', 'Loud', 'Free Pass',
    'Limited Run', 'Issue 01', 'Take One', 'Not for Sale', 'Handmade', 'Side A', 'Zero Budget', 'Photocopy',
    'Stapled', 'Back Alley', 'First Draft', 'Underground', 'All Ages'
  ],
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
  // 装饰计划（阶段 7d）：没有大装饰；小装饰为线稿 + 留白处的牛皮纸撕纸条
  ornaments: {
    small: [
      { type: 'doodle', weight: 3 },
      { type: 'tornStrip', size: [240, 330], paper: 'kraft', height: 68, text: ['pool', 'place'], font: { glyph: 'oswald', family: 'sans-serif', size: 32, letterSpacing: 3, uppercase: true, color: 'text' }, weight: 2 }
    ],
    smallPerSpread: [1, 3],
    pageTypes: ['body']
  },
  layoutWeights: {
    'b-ST-L1T': 2,
    'b-ST-P1': 2,
    'b-OV-L1B': 2,
    'b-G6-P1': 2,
    'b-FB-H1L': 2,
    'b-H1L-L1': 2
  }
}
