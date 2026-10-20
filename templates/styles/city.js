// 主题风格：现代都市
// 夜幕蓝、玻璃灰和霓虹珊瑚色，搭配城市天际线、线路图和清晰的杂志式标题
module.exports = {
  id: 'city',
  name: '现代都市',
  group: 'theme',
  description: '夜幕蓝与霓虹珊瑚色，收集城市街角和灯火',
  tags: ['city-night', 'architecture', 'food', 'couple'],
  assetsPackage: null,
  colors: {
    background: '#E9EDF0', text: '#202B3A', textMuted: '#73808D', accent: '#E56D63',
    neon: '#E7B857', skyline: '#506071', endpaper: '#D7DEE3', placeholder: '#DDE2E5', fitFill: '#F8F9F8'
  },
  fonts: {
    title: { family: 'sans-serif', weight: 'bold', size: 88, lineHeight: 1.2, color: 'text' },
    subtitle: { family: 'sans-serif', weight: 'normal', size: 30, lineHeight: 1.4, color: 'accent' },
    body: { family: 'sans-serif', weight: 'normal', size: 30, lineHeight: 1.65, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 22, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  wordPool: ['City Afterglow', 'Neon Hours', 'Side Streets', 'Night Windows', 'Downtown Days', 'Urban Love', 'One More Block', 'Blue Hour', 'Street Stories', 'Lights On', 'Crossing Paths', 'The Long Way Home', 'Window Seat', 'City Notes', 'Late Checkout', 'Bright Corners', 'Here Tonight', 'Between Stops', 'Good Company', 'After the Rain', 'A Little Electric'],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'oswald', family: 'sans-serif', size: 94, uppercase: true, letterSpacing: 2, color: 'text' }, minScale: 0.48 },
    kicker: { text: '{location} · {year}', font: { glyph: 'oswald', family: 'sans-serif', size: 22, letterSpacing: 4, uppercase: true, color: 'accent' } },
    runningHeader: { text: '{location} · {date}', font: { glyph: 'oswald', family: 'sans-serif', size: 20, letterSpacing: 2, color: 'textMuted' }, line: { color: 'accent', width: 1 }, y: 58, pageTypes: ['body'] }
  },
  pageNumber: { show: true, glyph: 'oswald', family: 'sans-serif', size: 24, color: 'accent', bottom: 62, format: 'pad2' },
  background: { type: 'color', color: '#E9EDF0', pattern: { name: 'grid', color: 'skyline', alpha: 0.12, cell: 80 } },
  photoFrame: { borderWidth: 10, borderColor: '#F8F9F8', radius: 0, shadow: { color: 'rgba(32, 43, 58, 0.2)', blur: 16, offsetX: 0, offsetY: 5 }, rotateJitter: 0 },
  doodles: { names: ['building', 'pin', 'sparkle', 'sun'], perSpread: [1, 2], size: [82, 116], colors: ['accent', 'neon', 'skyline'], lineWidth: 3, rotate: 4, pageTypes: ['body'] },
  ornaments: {
    big: [
      { type: 'scenery', kinds: ['skyline'], layers: [2, 3], color: 'skyline', mix: [0.9, 0.82, 0.72], desaturate: 0.2, height: [0.1, 0.18], weight: 2 },
      { type: 'patternBand', name: 'stripes', edges: ['bottom'], width: 30, offset: 18, color: 'accent', alpha: 0.28, cell: 42, weight: 1 }
    ],
    small: [{ type: 'doodle', weight: 3 }, { type: 'passport', size: [130, 165], count: [1, 2], colors: ['skyline', 'accent'], weight: 1 }],
    smallPerSpread: [2, 3], pageTypes: ['body']
  },
  layoutWeights: { 'b-H1L-L1': 3, 'b-L1T-L1B': 2.5, 'b-XL': 2, 'b-XR': 2, 'b-SB': 1.5, 'b-L1S-L1': 1.5 }
}
