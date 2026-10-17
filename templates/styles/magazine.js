// 风格：杂志（大标题旅行杂志、留白排版）
// 纸白底、MZ Playfair 西文大标题（装饰词）、加宽字距副标题、页眉 + 细线、两位数页码、照片编号；
// 偏好满版出血、跨中缝、小图 + 大留白；约每 5 个跨页一个反色跨页；赤陶色块偶尔出现在页面外侧下角
module.exports = {
  id: 'magazine',
  name: '杂志',
  group: 'style',
  description: '西文大标题、留白和页眉，像一本旅行杂志',
  tags: ['architecture', 'city-night', 'nature', 'road-trip', 'couple'],
  assetsPackage: null,
  colors: {
    background: '#F7F5F0',
    text: '#1E1E1E',
    textMuted: '#8A847A',
    accent: '#B8735A',
    // 低饱和赤陶色块
    terracotta: '#DDB4A0',
    endpaper: '#E9DED3',
    placeholder: '#E6E1D8',
    fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 88, lineHeight: 1.25, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.4, color: 'accent' },
    body: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.7, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 26, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  // 装饰词池：按跨页稳定选取，相邻跨页不重复
  wordPool: ['Good Places', 'Still Becoming', 'Side Notes', 'More Good Days', 'Slow Mornings', 'Field Notes', 'Somewhere New', 'Golden Hour', 'Long Walks', 'Quiet Streets'],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'playfair', family: 'serif', size: 118, color: 'text' }, minScale: 0.5 },
    kicker: { text: '{location} · {year}', font: { glyph: 'playfair', family: 'serif', size: 24, letterSpacing: 6, uppercase: true, color: 'accent' } },
    runningHeader: {
      text: '{location} · {date}',
      font: { glyph: 'playfair', family: 'serif', size: 22, letterSpacing: 2, uppercase: true, color: 'textMuted' },
      line: { color: 'text', width: 1 },
      y: 58,
      pageTypes: ['body']
    },
    index: { font: { glyph: 'oswald', family: 'sans-serif', size: 18, letterSpacing: 2, color: 'textMuted' }, gap: 14 }
  },
  pageNumber: { show: true, glyph: 'playfair', family: 'serif', size: 26, color: 'text', bottom: 60, format: 'pad2' },
  background: { type: 'color', color: '#F7F5F0' },
  photoFrame: { borderWidth: 0, borderColor: '#FFFFFF', radius: null, shadow: null },
  decorations: [
    // 赤陶色块：外侧下角，约三分之一的正文页出现（在照片下面）
    { type: 'rect', color: 'terracotta', x: 0, y: 0.82, w: 0.2, h: 0.18, mirror: true, chance: 0.33, pageTypes: ['body'] }
  ],
  // 偏好版式：自动排版时提高出现权重
  layoutWeights: {
    'b-FB-P1S': 2.5,
    'b-FB-H1L': 3,
    'b-XL': 3,
    'b-XR': 3,
    'b-H1L-L1': 3,
    'b-P1-H1P': 3,
    'b-L1S-F': 1.6,
    'b-F-P1S': 1.6,
    'b-SB': 1.5
  },
  // 反色跨页：深色底 + 浅色字
  darkVariant: {
    colors: {
      background: '#1C1C1C',
      text: '#F2EEE6',
      textMuted: '#9A958C',
      accent: '#D49478',
      terracotta: '#5A3A30',
      endpaper: '#2A2826',
      placeholder: '#2E2C2A',
      fitFill: '#111111'
    },
    background: { type: 'color', color: '#1C1C1C' }
  }
}
