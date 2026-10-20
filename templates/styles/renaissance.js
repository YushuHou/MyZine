// 主题风格：文艺复兴
// 羊皮纸、赤陶红和古金色，借鉴画框、手稿边饰与古典花叶，不覆盖照片主体
module.exports = {
  id: 'renaissance',
  name: '文艺复兴',
  group: 'theme',
  description: '羊皮纸色、古典画框与花叶手稿边饰，像收藏一册旅行手记',
  tags: ['architecture', 'nature'],
  assetsPackage: null,
  colors: {
    background: '#F2E9D7', text: '#49352D', textMuted: '#89745E', accent: '#A54F3D',
    gold: '#B18A4B', olive: '#64704F', endpaper: '#E6D5B8', placeholder: '#E5D8C2', fitFill: '#FBF7EF'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 88, lineHeight: 1.25, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.4, color: 'accent' },
    body: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.7, color: 'text' },
    caption: { family: 'serif', weight: 'normal', size: 24, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  wordPool: ['A Painted Journey', 'Golden Hour', 'The Grand Tour', 'Quiet Splendor', 'A Study in Light', 'Old World', 'The Art of Wandering', 'In Good Company', 'Softly Remembered', 'A Beautiful Detour', 'Days in Color', 'Collected Moments', 'The Long Afternoon', 'From Here', 'A Place to Keep', 'Little Masterpieces', 'A Gentle Escape', 'Scenes of Summer', 'The Keepsake', 'Somewhere Lovely', 'By the Sunlit Window'],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'playfair', family: 'serif', size: 92, color: 'text' }, minScale: 0.48 },
    kicker: { text: '{location} · {year}', font: { glyph: 'playfair', family: 'serif', size: 23, letterSpacing: 4, color: 'accent' } },
    runningHeader: { text: '{location} · {date}', font: { glyph: 'playfair', family: 'serif', size: 21, color: 'textMuted' }, line: { color: 'gold', width: 1 }, y: 58, pageTypes: ['body'] }
  },
  pageNumber: { show: true, glyph: 'playfair', family: 'serif', size: 23, color: 'gold', bottom: 66, format: 'pad2' },
  background: { type: 'texture', texture: 'paper', pattern: { name: 'dots', color: 'gold', alpha: 0.08, cell: 52 } },
  photoFrame: { borderWidth: 18, borderColor: '#FBF7EF', radius: 0, shadow: { color: 'rgba(73, 53, 45, 0.18)', blur: 15, offsetX: 0, offsetY: 5 }, rotateJitter: 0 },
  frameDecorations: [{ type: 'cornerDoodle', largestOnly: true, minWidth: 360, names: ['branch', 'flower'], corner: 'top-left', size: 94, color: 'olive' }],
  doodles: { names: ['branch', 'flower', 'sun', 'sparkle'], perSpread: [1, 2], size: [80, 112], colors: ['gold', 'olive', 'accent'], lineWidth: 2.8, rotate: 8, pageTypes: ['body'] },
  ornaments: {
    big: [
      { type: 'patternBand', name: 'shippo', edges: ['bottom'], width: 44, offset: 24, color: 'gold', alpha: 0.42, cell: 46, weight: 1.5 },
      { type: 'patternBlock', name: 'asanoha', x: 0, y: 0.79, w: 0.22, h: 0.21, fill: 'endpaper', color: 'olive', alpha: 0.3, cell: 42, mirror: true, weight: 1 }
    ],
    small: [{ type: 'doodle', weight: 3 }, { type: 'seal', size: [112, 142], weight: 1 }],
    smallPerSpread: [2, 3], pageTypes: ['body']
  },
  layoutWeights: { 'b-AR-L1B': 3, 'b-L1T-AR': 3, 'b-H1L-L1': 2, 'b-P1S-P2': 2, 'b-XL': 1.5 }
}
