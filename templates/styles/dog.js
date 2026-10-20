// 主题风格：狗狗散步
// 奶油黄、草地绿和焦糖色，结合爪印、骨头与拍立得边框，适合萌宠旅行
module.exports = {
  id: 'dog',
  name: '狗狗散步',
  group: 'theme',
  description: '草地绿和奶油黄，装进口袋的散步日记',
  tags: ['pets', 'nature', 'family', 'road-trip'],
  assetsPackage: null,
  colors: {
    background: '#F8F4E9', text: '#493D31', textMuted: '#8D806E', accent: '#B9774A',
    grass: '#758B5B', sky: '#91B7C7', endpaper: '#E8E4D1', placeholder: '#E9E2D3', fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'sans-serif', weight: 'bold', size: 84, lineHeight: 1.22, color: 'text' },
    subtitle: { family: 'sans-serif', weight: 'normal', size: 30, lineHeight: 1.4, color: 'accent' },
    body: { family: 'sans-serif', weight: 'normal', size: 30, lineHeight: 1.65, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 22, lineHeight: 1.5, color: 'textMuted', letterSpacing: 1 }
  },
  wordPool: ['Walkies!', 'Good Dog Days', 'Four Paws Away', 'Best Buddies', 'Fetch the Sun', 'Happy Trails', 'Sniffari', 'Paws on the Path', 'A Tail of Us', 'Treat Stop', 'Little Explorer', 'Wag More', 'Park Adventures', 'Outside Together', 'The Good Leash', 'Run Wild', 'Sunny Sniffs', 'Pup Passport', 'Adventure Buddy', 'Good Boy Hours', 'Homeward Bound'],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'caveat', family: 'serif', size: 112, color: 'grass' }, minScale: 0.48 },
    kicker: { text: '{location} · {year}', font: { glyph: 'oswald', family: 'sans-serif', size: 22, letterSpacing: 3, uppercase: true, color: 'accent' } }
  },
  pageNumber: { show: true, glyph: 'oswald', family: 'sans-serif', size: 22, color: 'grass', bottom: 64, format: 'pad2' },
  background: { type: 'texture', texture: 'paper', pattern: { name: 'dots', color: 'grass', alpha: 0.09, cell: 78 } },
  photoFrame: { borderWidth: 20, borderColor: '#FFFFFF', bottomExtra: 36, radius: 0, shadow: { color: 'rgba(73, 61, 49, 0.17)', blur: 14, offsetX: 0, offsetY: 4 }, rotateJitter: 2 },
  frameDecorations: [{ type: 'cornerDoodle', largestOnly: true, minWidth: 300, names: ['paw', 'bone'], corner: 'bottom-right', size: 82, color: 'accent' }],
  doodles: { names: ['paw', 'bone', 'sun', 'cloud', 'pin'], perSpread: [1, 3], size: [78, 112], colors: ['accent', 'grass', 'sky'], lineWidth: 3, rotate: 12, pageTypes: ['body'] },
  ornaments: {
    big: [
      { type: 'scenery', kinds: ['hills', 'forest'], layers: [2, 3], color: 'grass', mix: [0.9, 0.82, 0.7], desaturate: 0.25, height: [0.11, 0.19], weight: 2 },
      { type: 'patternBand', name: 'dots', edges: ['bottom'], width: 25, offset: 14, color: 'accent', alpha: 0.3, cell: 34, weight: 1 }
    ],
    small: [{ type: 'doodle', weight: 3 }, { type: 'luggageTag', size: [230, 290], paper: 'white', band: 'grass', weight: 1 }],
    smallPerSpread: [2, 3], pageTypes: ['body']
  },
  layoutWeights: { 'b-H1L-L1': 2.5, 'b-ST-L1T': 2, 'b-ST-P1': 2, 'b-AR-L1B': 2, 'b-P1S-P2': 1.5 }
}
