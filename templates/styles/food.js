// 主题风格：美食餐桌
// 番茄红 + 奶油 + 红白格纹桌布页边；圆形「餐盘」框（白色盘沿 + 内圈细线）；叉子、勺子、咖啡杯、枝叶线稿
module.exports = {
  id: 'food',
  name: '美食餐桌',
  group: 'theme',
  description: '红白格纹桌布和餐盘照片，一路吃过来',
  tags: ['food', 'party', 'family'],
  assetsPackage: null,
  colors: {
    background: '#FFF6E8',
    text: '#4A2E26',
    textMuted: '#9A7B6E',
    accent: '#D2483C',
    olive: '#7E8C4A',
    endpaper: '#F6DCCF',
    placeholder: '#F0E2CF',
    fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 86, lineHeight: 1.25, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.4, color: 'accent' },
    body: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.7, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 24, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  wordPool: ['Yum!', 'Bon Appétit', "Today's Menu", 'Second Helping', 'Taste Notes', 'Table for Two', 'Sweet Tooth'],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'caveat', family: 'serif', size: 120, color: 'accent' }, minScale: 0.5 },
    kicker: { text: '{location} · {date}', font: { glyph: 'oswald', family: 'sans-serif', size: 24, letterSpacing: 4, uppercase: true, color: 'text' } }
  },
  pageNumber: { show: true, glyph: 'caveat', family: 'serif', size: 34, color: 'accent', bottom: 62 },
  background: { type: 'color', color: '#FFF6E8' },
  photoFrame: {
    // 白色盘沿 / 卡片边
    borderWidth: 22,
    borderColor: '#FFFFFF',
    radius: 0,
    shadow: { color: 'rgba(74, 46, 38, 0.18)', blur: 16, offsetX: 0, offsetY: 5 },
    rotateJitter: 1
  },
  frameDecorations: [
    // 圆形框画盘沿内圈细线
    { type: 'plateRim', color: '#EADFCB', outerColor: 'rgba(74, 46, 38, 0.1)', width: 2 }
  ],
  doodles: {
    names: ['fork', 'spoon', 'cup', 'branch'],
    perSpread: [1, 3],
    size: [90, 130],
    colors: ['accent', 'olive'],
    lineWidth: 3.5,
    rotate: 20,
    pageTypes: ['body']
  },
  decorations: [
    // 红白格纹桌布：封面四周；正文约 1/3 的页只在上下边
    { type: 'checkerBorder', color: 'accent', width: 56, check: 18, edges: ['top', 'bottom', 'side'], pageTypes: ['cover'] },
    { type: 'checkerBorder', color: 'accent', width: 44, check: 16, edges: ['top', 'bottom'], pageTypes: ['body'], chance: 0.35 }
  ],
  // 偏好餐盘（圆形）版式
  layoutWeights: {
    'b-PL-P1': 4,
    'b-CI-L1': 4,
    'b-H1L-L1': 2,
    'b-OV-L1B': 1.5
  }
}
