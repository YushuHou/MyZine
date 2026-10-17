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
  // 装饰词池：整本书不重复（有标题槽的跨页才用掉一个），用完后重新开始
  wordPool: [
    'Yum!', 'Bon Appétit', "Today's Menu", 'Second Helping', 'Taste Notes', 'Table for Two', 'Sweet Tooth',
    'Delicious', 'Good Eats', "Chef's Special", 'Tasty Trip', 'Snack Attack', 'Dessert First', 'Fresh & Hot',
    'Local Flavors', 'Street Eats', 'Brunch Club', 'Spoonful', 'Hungry Again', 'Coffee Break',
    'Sweet & Salty'
  ],
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
    { type: 'checkerBorder', color: 'accent', width: 56, check: 18, edges: ['top', 'bottom', 'side'], pageTypes: ['cover'] }
  ],
  // 装饰计划（阶段 7c）：大装饰为格纹桌布页边（从 decorations 移到这里）或外侧下角的波点 / 条纹桌布色块
  ornaments: {
    big: [
      { type: 'deco', deco: { type: 'checkerBorder', color: 'accent', width: 44, check: 16, edges: ['top', 'bottom'] }, weight: 2 },
      { type: 'patternBlock', name: 'dots', x: 0, y: 0.78, w: 0.26, h: 0.22, mirror: true, fill: 'endpaper', color: 'accent', alpha: 0.45, cell: 30, weight: 1.5 },
      { type: 'patternBlock', name: 'stripes', x: 0, y: 0, w: 0.24, h: 0.2, mirror: true, fill: 'endpaper', color: 'olive', alpha: 0.35, cell: 28, angle: 0, weight: 1 }
    ],
    small: [
      { type: 'doodle', weight: 3 },
      { type: 'seal', size: [120, 150], weight: 1.5 }
    ],
    smallPerSpread: [2, 3],
    pageTypes: ['body']
  },
  // 偏好餐盘（圆形）版式
  layoutWeights: {
    'b-PL-P1': 4,
    'b-CI-L1': 4,
    'b-H1L-L1': 2,
    'b-OV-L1B': 1.5
  }
}
