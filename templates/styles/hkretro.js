// 风格：复古港风
// 深酒红底 + 霓虹粉 / 青 / 黄；照片暖调（multiply 叠色）+ 漏光（screen 渐变）+ 颗粒；霓虹描边；MZ Oswald 窄体粗标题
module.exports = {
  id: 'hkretro',
  name: '复古港风',
  group: 'style',
  description: '暖色胶片、漏光和霓虹描边，老电影的夜晚',
  tags: ['city-night', 'couple', 'architecture', 'food'],
  assetsPackage: null,
  colors: {
    background: '#2A1416',
    text: '#F3E6D0',
    textMuted: '#B59A86',
    accent: '#FF4D6D',
    teal: '#18A999',
    yellow: '#F2C14E',
    endpaper: '#3A1C1F',
    placeholder: '#432528',
    fitFill: '#1A0C0D'
  },
  fonts: {
    title: { family: 'sans-serif', weight: 'bold', size: 90, lineHeight: 1.2, color: 'text', letterSpacing: 4 },
    subtitle: { family: 'sans-serif', weight: 'normal', size: 30, lineHeight: 1.4, color: 'yellow', letterSpacing: 2 },
    body: { family: 'sans-serif', weight: 'normal', size: 32, lineHeight: 1.7, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 24, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  // 装饰词池：整本书不重复（有标题槽的跨页才用掉一个），用完后重新开始
  wordPool: [
    'Neon Nights', 'Midnight Express', 'Last Tram', 'After Dark', 'Fallen Lights', 'Slow Burn',
    'Night Market', 'City of Lights', 'Neon Dreams', 'Late Show', 'Rainy Neon', 'Night Owls', 'Back Alley',
    'Electric Blue', 'Last Call', 'Lights On', 'Red Lantern', 'Midnight Snack', 'Moonlit Street',
    'After Hours', 'Star Ferry'
  ],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'oswald', family: 'sans-serif', size: 124, uppercase: true, color: 'accent' }, minScale: 0.45 },
    kicker: { text: '{location} · {year}', font: { glyph: 'oswald', family: 'sans-serif', size: 26, letterSpacing: 6, uppercase: true, color: 'yellow' } },
    runningHeader: {
      text: '{location} · {date}',
      font: { glyph: 'oswald', family: 'sans-serif', size: 22, letterSpacing: 3, uppercase: true, color: 'teal' },
      line: { color: 'teal', width: 1.5 },
      y: 58,
      pageTypes: ['body']
    }
  },
  pageNumber: { show: true, glyph: 'oswald', family: 'sans-serif', size: 26, color: 'accent', bottom: 60, format: 'pad2' },
  background: { type: 'color', color: '#2A1416' },
  grain: { opacity: 0.14 },
  photoFrame: { borderWidth: 0, radius: 0, shadow: null, rotateJitter: 0 },
  // 照片暖调 + 漏光
  photoFilter: [
    { type: 'tint', color: '#FFB37A', mode: 'multiply', alpha: 0.28 },
    { type: 'lightLeak', color: '#FF6A3D', alpha: 0.45, size: 0.75 }
  ],
  frameDecorations: [
    // 每页最大的照片外一圈霓虹描边
    { type: 'outline', largestOnly: true, layer: 'frame', color: 'teal', width: 3, offset: 12, glow: 16 }
  ],
  decorations: [],
  layoutWeights: {
    'b-FB-H1L': 2,
    'b-XL': 2,
    'b-XR': 2,
    'b-H1L-L1': 2,
    'b-SB': 1.5
  }
}
