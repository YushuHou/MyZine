// 主题风格：动物园农场小动物
// 谷仓红 + 稻草黄 + 草地绿；圆形框 + 爪印角标；页面底部木栅栏；爪印、胡萝卜、小鸡、谷仓线稿
module.exports = {
  id: 'farm',
  name: '动物园农场',
  group: 'theme',
  description: '木栅栏、爪印和小动物线稿，和小伙伴们的一天',
  tags: ['zoo-farm', 'family', 'nature'],
  assetsPackage: null,
  colors: {
    background: '#FBF6E9',
    text: '#5A3B2A',
    textMuted: '#A08670',
    accent: '#B5442F',
    hay: '#E3BC4E',
    grass: '#7DA453',
    wood: '#C9945A',
    endpaper: '#F3E4BF',
    placeholder: '#EFE4CC',
    fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'sans-serif', weight: 'bold', size: 84, lineHeight: 1.25, color: 'text' },
    subtitle: { family: 'sans-serif', weight: 'normal', size: 32, lineHeight: 1.4, color: 'accent' },
    body: { family: 'sans-serif', weight: 'normal', size: 32, lineHeight: 1.7, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 24, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  // 装饰词池：整本书不重复（有标题槽的跨页才用掉一个），用完后重新开始
  wordPool: [
    'Hello Friends', 'Farm Days', 'Little Buddies', 'Happy Tails', 'Sunny Barn', 'Moo & Baa', 'Best Friends',
    'Moo!', 'Oink Oink', 'Cluck Cluck', 'Barn Buddies', 'Muddy Boots', 'Fresh Hay', 'Happy Farm',
    'Little Paws', 'Feeding Time', 'Meadow Days', 'Hello Piggy', 'Woolly Friends', 'Quack!', 'Tiny Hooves'
  ],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'caveat', family: 'serif', size: 120, color: 'accent' }, minScale: 0.5 },
    kicker: { text: '{month} {year}', font: { glyph: 'caveat', family: 'serif', size: 44, color: 'grass' } }
  },
  // 底部有木栅栏，不印页码
  pageNumber: { show: false },
  background: { type: 'color', color: '#FBF6E9' },
  photoFrame: {
    borderWidth: 16,
    borderColor: '#FFFFFF',
    radius: 0,
    shadow: { color: 'rgba(90, 59, 42, 0.18)', blur: 14, offsetX: 0, offsetY: 4 },
    rotateJitter: 2
  },
  frameDecorations: [
    // 爪印角标：每页最大的照片右下角
    { type: 'cornerDoodle', largestOnly: true, minWidth: 300, names: ['paw'], corner: 'bottom-right', size: 90, color: 'accent' }
  ],
  doodles: {
    names: ['paw', 'carrot', 'chick', 'barn'],
    perSpread: [2, 3],
    size: [90, 130],
    colors: ['accent', 'grass', 'hay'],
    lineWidth: 3.5,
    rotate: 15,
    pageTypes: ['body'],
    // 避开底部栅栏
    avoid: [{ x: 0, y: 0.86, w: 1, h: 0.14 }]
  },
  decorations: [
    // 木栅栏：页面底部，约一半的正文页出现
    { type: 'fenceBorder', color: 'wood', height: 100, post: 30, gap: 20, pageTypes: ['body'], chance: 0.5 }
  ],
  // 偏好圆形框、四格条
  layoutWeights: {
    'b-CI-L1': 4,
    'b-ST-L1T': 2,
    'b-ST-P1': 2,
    'b-H1L-L1': 2
  }
}
