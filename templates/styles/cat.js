// 主题风格：猫猫日记
// 奶油粉、莓果色和柔紫色，猫耳照片卡、蝴蝶结与爪印点缀，保持照片为主角
module.exports = {
  id: 'cat',
  name: '猫猫日记',
  group: 'theme',
  description: '奶油粉手账、猫咪线稿和小蝴蝶结，记录毛茸茸的日常',
  tags: ['pets', 'family', 'couple'],
  assetsPackage: null,
  colors: {
    background: '#FFF6F2', text: '#563C45', textMuted: '#A1848C', accent: '#D77B91',
    lilac: '#B8A6C9', cocoa: '#98756A', endpaper: '#F4DFE4', placeholder: '#F0E4E3', fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'sans-serif', weight: 'bold', size: 84, lineHeight: 1.22, color: 'text' },
    subtitle: { family: 'sans-serif', weight: 'normal', size: 30, lineHeight: 1.4, color: 'accent' },
    body: { family: 'sans-serif', weight: 'normal', size: 30, lineHeight: 1.65, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 22, lineHeight: 1.5, color: 'textMuted', letterSpacing: 1 }
  },
  wordPool: ['Little Purrs', 'Cat Nap Club', 'Tiny Whiskers', 'Paws & Play', 'My Furry Muse', 'Soft Paws', 'Sunny Nap', 'Meow Moments', 'Velvet Paws', 'The Cozy Corner', 'Purrfect Days', 'Window Watcher', 'Little Mischief', 'Nap and Repeat', 'Curious Cat', 'Sweet Whiskers', 'Home Is Here', 'A Purrfect Day', 'Small Adventures', 'Cuddle Season', 'Daily Meow'],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'caveat', family: 'serif', size: 114, color: 'accent' }, minScale: 0.48 },
    kicker: { text: '{month} {year}', font: { glyph: 'oswald', family: 'sans-serif', size: 21, letterSpacing: 3, uppercase: true, color: 'lilac' } }
  },
  pageNumber: { show: true, glyph: 'caveat', family: 'serif', size: 32, color: 'accent', bottom: 62 },
  background: { type: 'texture', texture: 'paper', pattern: { name: 'dots', color: 'accent', alpha: 0.11, cell: 68 } },
  photoFrame: { borderWidth: 18, borderColor: '#FFFFFF', radius: 18, shadow: { color: 'rgba(86, 60, 69, 0.16)', blur: 14, offsetX: 0, offsetY: 4 }, rotateJitter: 1.5 },
  frameDecorations: [
    { type: 'cornerDoodle', largestOnly: true, minWidth: 300, names: ['cat', 'bow'], corner: 'top-right', size: 88, color: 'accent' },
    { type: 'tape', colors: ['rgba(184, 166, 201, 0.72)', 'rgba(215, 123, 145, 0.62)'], placement: 'corners', width: 115, height: 36, angleJitter: 6 }
  ],
  doodles: { names: ['cat', 'bow', 'paw', 'heart', 'sparkle'], perSpread: [2, 3], size: [72, 108], colors: ['accent', 'lilac', 'cocoa'], lineWidth: 3, rotate: 10, pageTypes: ['body'] },
  ornaments: {
    big: [
      { type: 'patternBlock', name: 'shippo', x: 0, y: 0.8, w: 0.2, h: 0.2, fill: 'endpaper', color: 'lilac', alpha: 0.34, cell: 46, mirror: true, weight: 1 },
      { type: 'patternBand', name: 'dots', edges: ['bottom'], width: 24, offset: 14, color: 'accent', alpha: 0.3, cell: 28, weight: 1 }
    ],
    small: [{ type: 'doodle', weight: 4 }, { type: 'tornStrip', paper: 'white', size: [240, 340], height: 64, weight: 1 }],
    smallPerSpread: [2, 3], pageTypes: ['body']
  },
  layoutWeights: { 'b-CI-L1': 3, 'b-ST-L1T': 2.5, 'b-ST-P1': 2.5, 'b-P1S-P2': 2, 'b-H1L-L1': 2, 'b-L1T-AR': 1.5 }
}
