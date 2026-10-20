// 主题风格：心动同行
// 杏粉、莓果红与柔紫，像两个人共同写下的旅行情书，甜而不腻
module.exports = {
  id: 'couple',
  name: '心动同行',
  group: 'theme',
  description: '两个人的旅行情书，柔软的心形线稿与拍立得小卡',
  tags: ['couple', 'beach', 'city-night', 'road-trip'],
  assetsPackage: null,
  colors: {
    background: '#FBF2EF', text: '#513B42', textMuted: '#9B7E83', accent: '#C96F7D',
    rose: '#E8B7B3', plum: '#80647D', endpaper: '#F2DFDC', placeholder: '#EFE3E1', fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 86, lineHeight: 1.22, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 30, lineHeight: 1.4, color: 'accent' },
    body: { family: 'serif', weight: 'normal', size: 30, lineHeight: 1.65, color: 'text' },
    caption: { family: 'serif', weight: 'normal', size: 22, lineHeight: 1.5, color: 'textMuted', letterSpacing: 1 }
  },
  wordPool: ['Just Us', 'Side by Side', 'Our Little Escape', 'You and the View', 'Two Tickets', 'Love in the Details', 'Better Together', 'Meet Me Here', 'A Date with Somewhere', 'My Favorite Place', 'Us, Away', 'The Scenic Route', 'One More Sunset', 'Only Us', 'A Little Romance', 'Here with You', 'Postcards for Two', 'A Weekend to Keep', 'Our Kind of Magic', 'The Way We Wander', 'Always This'],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'caveat', family: 'serif', size: 118, color: 'accent' }, minScale: 0.48 },
    kicker: { text: '{location} · {date}', font: { glyph: 'playfair', family: 'serif', size: 22, letterSpacing: 2, color: 'plum' } },
    runningHeader: { text: '{location} · {date}', font: { glyph: 'playfair', family: 'serif', size: 20, color: 'textMuted' }, line: { color: 'rose', width: 1 }, y: 58, pageTypes: ['body'] }
  },
  pageNumber: { show: true, glyph: 'caveat', family: 'serif', size: 32, color: 'accent', bottom: 62 },
  background: { type: 'color', color: '#FBF2EF', pattern: { name: 'dots', color: 'rose', alpha: 0.08, cell: 72 } },
  photoFrame: { borderWidth: 20, borderColor: '#FFFFFF', bottomExtra: 30, radius: 0, shadow: { color: 'rgba(81, 59, 66, 0.17)', blur: 15, offsetX: 0, offsetY: 5 }, rotateJitter: 1.5 },
  frameDecorations: [{ type: 'cornerDoodle', largestOnly: true, minWidth: 330, names: ['heart', 'bow'], corner: 'top-right', size: 80, color: 'accent' }],
  doodles: { names: ['heart', 'sparkle', 'flower', 'bow', 'sun'], perSpread: [1, 2], size: [72, 104], colors: ['accent', 'plum', 'rose'], lineWidth: 3, rotate: 8, pageTypes: ['body'] },
  ornaments: {
    big: [
      { type: 'patternBlock', name: 'shippo', x: 0, y: 0.8, w: 0.2, h: 0.2, fill: 'endpaper', color: 'rose', alpha: 0.35, cell: 44, mirror: true, weight: 1 },
      { type: 'patternBand', name: 'dots', edges: ['bottom'], width: 22, offset: 12, color: 'accent', alpha: 0.25, cell: 28, weight: 1 }
    ],
    small: [{ type: 'doodle', weight: 4 }, { type: 'tornStrip', paper: 'white', size: [240, 340], height: 64, weight: 1 }],
    smallPerSpread: [2, 3], pageTypes: ['body']
  },
  layoutWeights: { 'b-CI-L1': 2, 'b-ST-L1T': 2.5, 'b-ST-P1': 2.5, 'b-H1L-L1': 2, 'b-L1T-AR': 1.5, 'b-XL': 1.5 }
}
