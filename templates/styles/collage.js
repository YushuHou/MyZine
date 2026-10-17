// 风格：拼贴剪报
// 报纸纹理底（代码生成）；照片垫一层撕边白纸、贴胶带、轻微倾斜；MZ Playfair 大标题、页眉 + 细线、分栏细线
module.exports = {
  id: 'collage',
  name: '拼贴剪报',
  group: 'style',
  description: '报纸底、撕边纸和胶带，像一本剪报本',
  tags: ['architecture', 'city-night', 'food', 'party'],
  assetsPackage: null,
  colors: {
    background: '#E7E4DC',
    text: '#1A1A1A',
    textMuted: '#6A6660',
    accent: '#C0392B',
    endpaper: '#D6D1C6',
    placeholder: '#D4CFC4',
    fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 90, lineHeight: 1.2, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.4, color: 'accent' },
    body: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.7, color: 'text' },
    caption: { family: 'serif', weight: 'normal', size: 24, lineHeight: 1.5, color: 'textMuted', letterSpacing: 1 }
  },
  wordPool: ['Extra! Extra!', 'Headlines', 'The Daily Wander', 'Cut & Paste', 'Clippings', 'Front Page', 'Late Edition'],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'playfair', family: 'serif', size: 112, color: 'text' }, minScale: 0.5 },
    kicker: { text: '{location} · {date}', font: { glyph: 'oswald', family: 'sans-serif', size: 24, letterSpacing: 4, uppercase: true, color: 'accent' } },
    runningHeader: {
      text: '{title}',
      font: { family: 'serif', weight: 'bold', size: 22, letterSpacing: 2, color: 'text' },
      line: { color: 'text', width: 2 },
      y: 58,
      pageTypes: ['body']
    }
  },
  pageNumber: { show: true, glyph: 'playfair', family: 'serif', size: 24, color: 'text', bottom: 60, format: 'pad2' },
  background: { type: 'texture', texture: 'newsprint', tile: 540, color: '#E7E4DC' },
  photoFrame: {
    borderWidth: 0,
    radius: 0,
    shadow: null,
    rotateJitter: 3,
    // 撕边垫纸
    backing: { color: '#FFFFFF', margin: 18, jag: 7 }
  },
  frameDecorations: [
    { type: 'tape', colors: ['rgba(240, 230, 200, 0.85)', 'rgba(220, 220, 215, 0.85)'], width: 150, height: 42, placement: 'corners', angleJitter: 8 }
  ],
  decorations: [
    // 分栏细线：外侧一条竖线，约一半的页出现
    { type: 'line', color: 'text', x: 0.045, y: 0.1, w: 0, h: 0.8, lineWidth: 1.5, chance: 0.5, pageTypes: ['body'] }
  ],
  layoutWeights: {
    'b-OV-L1B': 2,
    'b-P1S-OV': 2,
    'b-M3-L1B': 1.5,
    'b-H1L-L1': 2
  }
}
