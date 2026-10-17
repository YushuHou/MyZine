// 主题风格：人文建筑
// 石灰白底 + 黛青字 + 朱红点缀；中式红色方印为主角（地名竖排）；回纹页边、麻叶 / 七宝纹样色块、城市天际线剪影；
// 偏好拱形框和留白版式
module.exports = {
  id: 'heritage',
  name: '人文建筑',
  group: 'theme',
  description: '朱红方印、回纹和老城天际线，看建筑也看人',
  tags: ['architecture', 'city-night', 'family'],
  assetsPackage: null,
  colors: {
    background: '#F2EEE6',
    text: '#2E3A3F',
    textMuted: '#7D8589',
    accent: '#A33A2C',
    ink: '#3E5560',
    endpaper: '#E3DCCF',
    placeholder: '#E2DDD3',
    fitFill: '#FAF8F3'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 86, lineHeight: 1.25, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.4, color: 'accent' },
    body: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.75, color: 'text' },
    caption: { family: 'serif', weight: 'normal', size: 24, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  // 装饰词池：整本书不重复（有标题槽的跨页才用掉一个），用完后重新开始
  wordPool: [
    'Old Streets', 'Stone & Time', 'Heritage Walk', 'Ancient Roads', 'Quiet Temples', 'Through the Gate',
    'Courtyards', 'Time Travelers', 'Under the Eaves', 'Old Town', 'City Walls', 'Footprints', 'Echoes',
    'Grand Halls', 'Living History', 'Rooftops', 'Lanterns', 'Timeless', 'Small Alleys', 'Morning Bells',
    'Red Walls', 'Carved in Stone'
  ],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'playfair', family: 'serif', size: 108, color: 'text' }, minScale: 0.5 },
    kicker: { text: '{location} · {year}', font: { glyph: 'playfair', family: 'serif', size: 24, letterSpacing: 6, uppercase: true, color: 'accent' } },
    runningHeader: {
      text: '{location} · {date}',
      font: { glyph: 'playfair', family: 'serif', size: 22, letterSpacing: 2, uppercase: true, color: 'textMuted' },
      line: { color: 'accent', width: 1 },
      y: 58,
      pageTypes: ['body']
    }
  },
  // 页码抬高一些，给底边的回纹条留位置
  pageNumber: { show: true, glyph: 'playfair', family: 'serif', size: 24, color: 'ink', bottom: 104, format: 'pad2' },
  background: { type: 'color', color: '#F2EEE6' },
  photoFrame: {
    borderWidth: 10,
    borderColor: '#FAF8F3',
    radius: 0,
    shadow: { color: 'rgba(46, 58, 63, 0.16)', blur: 12, offsetX: 0, offsetY: 4 },
    rotateJitter: 0
  },
  doodles: {
    names: ['compass', 'pin', 'star', 'sparkle', 'cloud'],
    perSpread: [1, 2],
    size: [80, 110],
    colors: ['ink'],
    lineWidth: 3,
    rotate: 10,
    pageTypes: ['body']
  },
  decorations: [],
  // 装饰计划：大装饰为天际线剪影、底边回纹条，或外侧下角的麻叶 / 七宝色块；小装饰以方印为主
  ornaments: {
    big: [
      { type: 'scenery', kinds: ['skyline'], layers: [2, 3], color: 'ink', mix: [0.84, 0.74, 0.64], desaturate: 0.3, height: [0.12, 0.22], weight: 2 },
      { type: 'patternBand', name: 'meander', edges: ['bottom'], width: 36, offset: 26, color: 'accent', alpha: 0.7, cell: 36, weight: 2 },
      { type: 'patternBlock', name: 'asanoha', x: 0, y: 0.8, w: 0.24, h: 0.2, mirror: true, fill: 'endpaper', color: 'ink', alpha: 0.4, cell: 40, weight: 1 },
      { type: 'patternBlock', name: 'shippo', x: 0, y: 0.8, w: 0.24, h: 0.2, mirror: true, fill: 'endpaper', color: 'accent', alpha: 0.35, cell: 40, weight: 1 }
    ],
    small: [
      { type: 'seal', size: [140, 180], weight: 3 },
      { type: 'passport', size: [160, 190], count: [1, 2], colors: ['ink', 'accent'], weight: 1 },
      { type: 'doodle', weight: 1.5 }
    ],
    smallPerSpread: [2, 3],
    pageTypes: ['body']
  },
  // 偏好拱形框和留白版式
  layoutWeights: {
    'b-AR-L1B': 3,
    'b-L1T-AR': 3,
    'b-L1S-L1': 2,
    'b-P1S-P2': 2,
    'b-H1L-L1': 2,
    'b-P1-H1P': 2
  }
}
