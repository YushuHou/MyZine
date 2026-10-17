// 主题风格：自然风光
// 森林绿 + 天空蓝 + 米白；拱形框 + 压花标本角（枝叶线稿压在照片左上角）；山、松树、枝叶、太阳、云朵线稿
module.exports = {
  id: 'nature',
  name: '自然风光',
  group: 'theme',
  description: '森林绿、拱形照片和压花标本，山野的空气',
  tags: ['nature', 'road-trip', 'family'],
  assetsPackage: null,
  colors: {
    background: '#F3F1EA',
    text: '#2F4A3A',
    textMuted: '#7D8C80',
    accent: '#4E7A5E',
    sky: '#7FA7C9',
    leaf: '#6E9A6B',
    endpaper: '#DDE6DA',
    placeholder: '#E1E3D8',
    fitFill: '#FBFAF5'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 86, lineHeight: 1.25, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.4, color: 'accent' },
    body: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.7, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 24, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  // 装饰词池：整本书不重复（有标题槽的跨页才用掉一个），用完后重新开始
  wordPool: [
    'Into the Wild', 'Fresh Air', 'Mountains Calling', 'Trail Notes', 'Wild & Free', 'Green Days',
    'Under the Sky', 'Wild Places', 'Take a Hike', 'Forest Bathing', 'Summit Day', 'River Song',
    'Pine & Stone', 'Open Sky', 'Valley Light', 'Into the Woods', 'Morning Mist', 'Wildflowers',
    'High Country', 'Earth & Sky', 'Leave No Trace'
  ],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'playfair', family: 'serif', size: 108, color: 'text' }, minScale: 0.5 },
    kicker: { text: '{location} · {month} {year}', font: { glyph: 'playfair', family: 'serif', size: 24, letterSpacing: 4, uppercase: true, color: 'accent' } },
    runningHeader: {
      text: '{location} · {date}',
      font: { glyph: 'playfair', family: 'serif', size: 22, letterSpacing: 2, color: 'textMuted' },
      line: { color: 'leaf', width: 1 },
      y: 58,
      pageTypes: ['body']
    }
  },
  pageNumber: { show: true, glyph: 'playfair', family: 'serif', size: 24, color: 'accent', bottom: 60, format: 'pad2' },
  background: { type: 'color', color: '#F3F1EA' },
  photoFrame: {
    borderWidth: 14,
    borderColor: '#FBFAF5',
    radius: 0,
    shadow: { color: 'rgba(47, 74, 58, 0.18)', blur: 14, offsetX: 0, offsetY: 4 },
    rotateJitter: 0
  },
  frameDecorations: [
    // 压花标本角：每页最大的照片左上角压一枝枝叶
    { type: 'cornerDoodle', largestOnly: true, minWidth: 320, names: ['branch', 'flower'], corner: 'top-left', size: 150, color: 'leaf', lineWidth: 4 }
  ],
  doodles: {
    names: ['mountain', 'pine', 'branch', 'sun', 'cloud'],
    perSpread: [1, 3],
    size: [90, 130],
    colors: ['accent', 'sky'],
    lineWidth: 3.5,
    rotate: 8,
    pageTypes: ['body']
  },
  decorations: [],
  // 装饰计划（阶段 7c）：大装饰为山脉、树林、丘陵剪影（2–3 层）；小装饰为线稿、护照章（像国家公园章）、方印
  ornaments: {
    big: [
      { type: 'scenery', kinds: ['mountains', 'forest', 'hills'], layers: [2, 3], color: 'accent', mix: [0.8, 0.66, 0.52], desaturate: 0.35, height: [0.14, 0.26] }
    ],
    small: [
      { type: 'doodle', weight: 3 },
      { type: 'passport', size: [170, 200], count: [1, 1], colors: ['accent', '#7A6A4F'], weight: 1 },
      { type: 'seal', size: [120, 150], weight: 1 }
    ],
    smallPerSpread: [2, 3],
    pageTypes: ['body']
  },
  // 偏好拱形、满版、留白
  layoutWeights: {
    'b-AR-L1B': 4,
    'b-L1T-AR': 4,
    'b-FB-P1S': 2,
    'b-SB': 2,
    'b-H1L-L1': 2,
    'b-L1S-L1': 1.5
  }
}
