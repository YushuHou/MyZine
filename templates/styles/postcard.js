// 主题风格：海边明信片
// 海蓝 + 沙色；波浪线、贝壳、太阳、海鸥线稿；明信片照片框（白边 + 右上角邮票 + 邮戳圆环）；
// 航空信封红蓝斜条页边（封面和部分跨页）；封面问候语「Greetings from {location}」（分两行，无地点时只写 Greetings）
module.exports = {
  id: 'postcard',
  name: '海边明信片',
  group: 'theme',
  description: '明信片白边、邮票邮戳和航空信封斜条，海风味道',
  tags: ['beach', 'nature', 'couple'],
  assetsPackage: null,
  colors: {
    background: '#F1E6D2',
    text: '#1F3B57',
    textMuted: '#6E8597',
    accent: '#2E6E9E',
    red: '#C8423B',
    blue: '#2B5C8A',
    sand: '#D9C29A',
    stampFill: '#D6E8F0',
    postmark: 'rgba(31, 59, 87, 0.72)',
    endpaper: '#D8E6EE',
    placeholder: '#E3D6C0',
    fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 86, lineHeight: 1.25, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.4, color: 'accent' },
    body: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.7, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 26, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  wordPool: ['Sea Breeze', 'Salt & Sun', 'Low Tide', 'Wish You Were Here', 'Blue Hours', 'Seaside Days'],
  decoText: {
    // 封面问候语：第一行 MZ Playfair 字形，第二行地点用较大的系统衬线字；无地点时只写 Greetings
    greeting: {
      lines: [
        { text: 'Greetings from', ifMissing: { var: 'location', text: 'Greetings' }, font: { glyph: 'playfair', family: 'serif', size: 64, color: '#FFFFFF' } },
        { text: '{location}', font: { family: 'serif', weight: 'bold', size: 84, color: '#FFFFFF' } }
      ],
      lineGap: 112,
      shadow: true
    },
    headline: { text: '{word}', font: { glyph: 'playfair', family: 'serif', size: 96, color: 'accent' }, minScale: 0.5 },
    kicker: { text: '{location} · {date}', font: { glyph: 'playfair', family: 'serif', size: 22, letterSpacing: 4, uppercase: true, color: 'textMuted' } }
  },
  pageNumber: { show: true, glyph: 'playfair', family: 'serif', size: 26, color: 'accent', bottom: 60, format: 'pad2' },
  background: { type: 'color', color: '#F1E6D2' },
  photoFrame: {
    borderWidth: 18,
    borderColor: '#FFFFFF',
    bottomExtra: 0,
    radius: 0,
    shadow: { color: 'rgba(31, 59, 87, 0.2)', blur: 16, offsetX: 0, offsetY: 5 },
    rotateJitter: 1.5
  },
  frameDecorations: [
    // 明信片：本页最大的照片框右上角贴邮票、压邮戳（太小的框不画）
    { type: 'stamp', largestOnly: true, minWidth: 380, w: 132, h: 160, inset: 26, fill: 'stampFill', doodles: ['sun', 'shell', 'gull', 'wave'], doodleColor: 'accent' },
    { type: 'postmark', largestOnly: true, minWidth: 380, r: 92, color: 'postmark', font: { glyph: 'oswald', family: 'sans-serif', letterSpacing: 1.5, uppercase: true } }
  ],
  doodles: {
    names: ['wave', 'shell', 'sun', 'gull'],
    perSpread: [2, 3],
    size: [95, 135],
    colors: ['accent', 'accent', 'red'],
    lineWidth: 4,
    rotate: 15,
    pageTypes: ['body']
  },
  decorations: [
    // 航空信封红蓝斜条：封面始终有，正文约三分之一的页出现
    { type: 'airmailBorder', colors: ['red', 'blue'], width: 22, stripe: 28, pageTypes: ['cover'] },
    { type: 'airmailBorder', colors: ['red', 'blue'], width: 22, stripe: 28, pageTypes: ['body'], chance: 0.3 }
  ],
  layoutWeights: {
    'b-CI-L1': 4,
    'b-FB-P1S': 2.5,
    'b-FB-H1L': 2,
    'b-SB': 2,
    'b-H1L-L1': 1.5
  }
}
