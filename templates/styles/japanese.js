// 风格：日系清新
// 极浅蓝绿底、大量留白（偏好留白版式）；照片轻微提亮（screen 叠白）；细线页眉、手写体小注释、枝叶 / 云朵线稿
module.exports = {
  id: 'japanese',
  name: '日系清新',
  group: 'style',
  description: '浅色、留白和一点点手写，空气感',
  tags: ['nature', 'beach', 'family', 'food'],
  assetsPackage: null,
  colors: {
    background: '#F5F8F6',
    text: '#4A5A55',
    textMuted: '#9AA8A3',
    accent: '#7FB3A7',
    endpaper: '#E6EFEB',
    placeholder: '#E2E9E6',
    fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'sans-serif', weight: 'normal', size: 76, lineHeight: 1.3, color: 'text' },
    subtitle: { family: 'sans-serif', weight: 'normal', size: 30, lineHeight: 1.5, color: 'accent' },
    body: { family: 'sans-serif', weight: 'normal', size: 30, lineHeight: 1.8, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 24, lineHeight: 1.6, color: 'textMuted', letterSpacing: 2 }
  },
  // 装饰词池：整本书不重复（有标题槽的跨页才用掉一个），用完后重新开始
  wordPool: [
    'a little breeze', 'slow days', 'sunny side', 'just today', 'soft light', 'here and now', 'little walks',
    'quiet morning', 'tiny moments', 'gentle days', 'cloud watching', 'after the rain', 'fresh air',
    'sweet nothing', 'a cup of tea', 'window light', 'slow walk', 'soft breeze', 'little garden',
    'summer air', 'simple joys'
  ],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'caveat', family: 'serif', size: 90, color: 'accent' }, minScale: 0.5 },
    kicker: { text: '{month} {year}', font: { glyph: 'caveat', family: 'serif', size: 40, color: 'textMuted' } },
    runningHeader: {
      text: '{location} · {date}',
      font: { glyph: 'playfair', family: 'sans-serif', size: 20, letterSpacing: 2, color: 'textMuted' },
      line: { color: 'accent', width: 1 },
      y: 58,
      pageTypes: ['body']
    }
  },
  pageNumber: { show: true, glyph: 'playfair', family: 'sans-serif', size: 22, color: 'textMuted', bottom: 60, format: 'pad2' },
  background: { type: 'color', color: '#F5F8F6' },
  photoFrame: { borderWidth: 0, radius: 0, shadow: null, rotateJitter: 0 },
  // 照片轻微提亮
  photoFilter: [
    { type: 'tint', color: '#FFFFFF', mode: 'screen', alpha: 0.14 }
  ],
  doodles: {
    names: ['branch', 'cloud', 'sparkle'],
    perSpread: [1, 2],
    size: [80, 110],
    colors: ['accent'],
    lineWidth: 2.5,
    rotate: 15,
    pageTypes: ['body']
  },
  decorations: [],
  // 偏好留白版式
  layoutWeights: {
    'b-L1S-L1': 3,
    'b-P1S-P2': 3,
    'b-H1L-L1': 3,
    'b-P1-H1P': 3,
    'b-P1O-P1S': 2.5,
    'b-F-P1S': 1.5,
    'b-CI-L1': 2
  }
}
