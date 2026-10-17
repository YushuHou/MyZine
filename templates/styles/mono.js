// 风格：黑白
// 照片转黑白（saturation 叠灰，真机验证可用）；黑白灰配色、强对比版面；MZ Playfair 大标题 + 照片编号；反色跨页
module.exports = {
  id: 'mono',
  name: '黑白',
  group: 'style',
  description: '黑白照片和强烈的版面对比，安静又有力量',
  tags: ['architecture', 'city-night', 'couple', 'road-trip'],
  assetsPackage: null,
  colors: {
    background: '#F2F2F0',
    text: '#111111',
    textMuted: '#777777',
    accent: '#111111',
    endpaper: '#1A1A1A',
    placeholder: '#D9D9D6',
    fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 92, lineHeight: 1.2, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.4, color: 'text' },
    body: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.7, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 24, lineHeight: 1.5, color: 'textMuted', letterSpacing: 3 }
  },
  wordPool: ['Black & White', 'Shadows', 'Silence', 'Contrast', 'Monochrome', 'Still Life', 'Light Study'],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'playfair', family: 'serif', size: 130, color: 'text' }, minScale: 0.45 },
    kicker: { text: '{location} · {year}', font: { glyph: 'oswald', family: 'sans-serif', size: 24, letterSpacing: 8, uppercase: true, color: 'textMuted' } },
    runningHeader: {
      text: '{location} · {date}',
      font: { glyph: 'oswald', family: 'sans-serif', size: 20, letterSpacing: 4, uppercase: true, color: 'text' },
      line: { color: 'text', width: 1 },
      y: 58,
      pageTypes: ['body']
    },
    index: { font: { glyph: 'oswald', family: 'sans-serif', size: 18, letterSpacing: 3, color: 'textMuted' }, gap: 14 }
  },
  pageNumber: { show: true, glyph: 'playfair', family: 'serif', size: 28, color: 'text', bottom: 60, format: 'pad2' },
  background: { type: 'color', color: '#F2F2F0' },
  photoFrame: { borderWidth: 0, radius: 0, shadow: null, rotateJitter: 0 },
  photoFilter: [{ type: 'grayscale' }],
  decorations: [],
  layoutWeights: {
    'b-FB-P1S': 2,
    'b-FB-H1L': 2.5,
    'b-XL': 2.5,
    'b-XR': 2.5,
    'b-SB': 2,
    'b-H1L-L1': 2
  },
  // 反色跨页：黑底白字
  darkVariant: {
    colors: { background: '#111111', text: '#F2F2F0', textMuted: '#8C8C8C', accent: '#F2F2F0', endpaper: '#000000', placeholder: '#2A2A2A', fitFill: '#000000' },
    background: { type: 'color', color: '#111111' }
  }
}
