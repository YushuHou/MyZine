// 主题风格：亲子时光
// 奶油黄、湖水蓝与活力橙，像孩子的旅行剪贴簿，明快可爱但不遮挡照片
module.exports = {
  id: 'family',
  name: '亲子时光',
  group: 'theme',
  description: '明亮的家庭旅行剪贴簿，装下每个人的笑脸和小发现',
  tags: ['family', 'zoo-farm', 'amusement', 'nature', 'beach'],
  assetsPackage: null,
  colors: {
    background: '#FFF7E8', text: '#39434A', textMuted: '#829097', accent: '#E78B53',
    blue: '#67A7B5', butter: '#E7C85A', green: '#7B9A6B', endpaper: '#F3E8CA', placeholder: '#EEE6D6', fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'sans-serif', weight: 'bold', size: 86, lineHeight: 1.2, color: 'text' },
    subtitle: { family: 'sans-serif', weight: 'normal', size: 30, lineHeight: 1.4, color: 'accent' },
    body: { family: 'sans-serif', weight: 'normal', size: 30, lineHeight: 1.65, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 22, lineHeight: 1.5, color: 'textMuted', letterSpacing: 1 }
  },
  wordPool: ['Our Happy Place', 'Little Big Adventure', 'All Together', 'The Best Kind of Busy', 'Family Field Notes', 'Small Wonders', 'Big Day Out', 'Here We Go', 'A Day to Remember', 'The Whole Crew', 'Joy in the Journey', 'Pocketful of Days', 'Our Favorite People', 'Together Is Best', 'Little Explorers', 'Sunny Side Up', 'The Fun We Found', 'Everybody In', 'Happy Little Things', 'One Good Day', 'Made of Memories'],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'caveat', family: 'serif', size: 112, color: 'accent' }, minScale: 0.48 },
    kicker: { text: '{location} · {year}', font: { glyph: 'oswald', family: 'sans-serif', size: 22, letterSpacing: 2, color: 'blue' } }
  },
  pageNumber: { show: true, glyph: 'oswald', family: 'sans-serif', size: 23, color: 'blue', bottom: 64, format: 'pad2' },
  background: { type: 'texture', texture: 'paper', pattern: { name: 'dots', color: 'butter', alpha: 0.12, cell: 78 } },
  photoFrame: { borderWidth: 18, borderColor: '#FFFFFF', radius: 12, shadow: { color: 'rgba(57, 67, 74, 0.16)', blur: 14, offsetX: 0, offsetY: 4 }, rotateJitter: 1.5 },
  doodles: { names: ['house', 'sun', 'cloud', 'star', 'flower', 'heart'], perSpread: [1, 3], size: [75, 112], colors: ['accent', 'blue', 'green', 'butter'], lineWidth: 3, rotate: 10, pageTypes: ['body'] },
  frameDecorations: [{ type: 'tape', colors: ['rgba(231, 200, 90, 0.72)', 'rgba(103, 167, 181, 0.62)'], placement: 'corners', width: 108, height: 34, angleJitter: 6 }],
  ornaments: {
    big: [
      { type: 'scenery', kinds: ['hills', 'forest'], layers: [2, 3], color: 'green', mix: [0.9, 0.82, 0.72], desaturate: 0.3, height: [0.1, 0.18], weight: 1.5 },
      { type: 'patternBlock', name: 'dots', x: 0, y: 0.81, w: 0.2, h: 0.19, fill: 'endpaper', color: 'butter', alpha: 0.4, cell: 32, mirror: true, weight: 1 }
    ],
    small: [{ type: 'doodle', weight: 4 }, { type: 'luggageTag', size: [230, 280], paper: 'white', band: 'blue', weight: 1 }],
    smallPerSpread: [2, 3], pageTypes: ['body']
  },
  layoutWeights: { 'b-ST-P1': 3, 'b-ST-L1T': 2.5, 'b-CI-L1': 2.5, 'b-H1L-L1': 2, 'b-P1S-P2': 2, 'b-L1T-L1B': 1.5 }
}
