// 主题风格：公路旅行
// 沙漠橙 + 公路灰 + 天蓝；拍立得照片；路牌形标题牌（绿底白字 + 白色内框）；虚线路线 + 定位针；汽车、山、指南针线稿
module.exports = {
  id: 'roadtrip',
  name: '公路旅行',
  group: 'theme',
  description: '路牌标题、拍立得和一路的虚线路线',
  tags: ['road-trip', 'nature', 'couple'],
  assetsPackage: null,
  colors: {
    background: '#F4EBDD',
    text: '#3A3632',
    textMuted: '#8C8073',
    accent: '#E07A3F',
    road: '#4A4A4A',
    sky: '#5E9FCC',
    sign: '#2F6B4F',
    endpaper: '#E9D5BA',
    placeholder: '#E6DCCB',
    fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'sans-serif', weight: 'bold', size: 86, lineHeight: 1.2, color: 'text' },
    subtitle: { family: 'sans-serif', weight: 'normal', size: 32, lineHeight: 1.4, color: 'accent' },
    body: { family: 'sans-serif', weight: 'normal', size: 32, lineHeight: 1.7, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 24, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  // 装饰词池：整本书不重复（有标题槽的跨页才用掉一个），用完后重新开始
  wordPool: [
    'On the Road', 'Miles & Smiles', 'Next Exit', 'Scenic Route', 'Full Tank', 'Detour', 'Keep Driving',
    'Road Snacks', 'Windows Down', 'Mile Marker', 'Highway Song', 'Pit Stop', 'Map Notes', 'Open Highway',
    'Rest Stop', 'Road Less Traveled', 'Turn Left', 'Gas & Go', 'Cruise Control', 'Long Drive',
    'Sunset Drive'
  ],
  decoText: {
    // 路牌：绿底白字 + 白色内框
    headline: {
      text: '{word}',
      font: { glyph: 'oswald', family: 'sans-serif', size: 92, uppercase: true, letterSpacing: 2, color: '#FFFFFF' },
      minScale: 0.45,
      plate: { color: 'sign', radius: 18, padX: 40, padY: 30, border: { color: '#FFFFFF', width: 4, inset: 10 } }
    },
    // 下移，离路牌远一点
    kicker: { text: '{location} · {date}', dy: 30, font: { glyph: 'oswald', family: 'sans-serif', size: 24, letterSpacing: 4, uppercase: true, color: 'road' } }
  },
  pageNumber: { show: true, glyph: 'oswald', family: 'sans-serif', size: 26, color: 'accent', bottom: 60, format: 'pad2' },
  background: { type: 'color', color: '#F4EBDD' },
  photoFrame: {
    // 拍立得
    borderWidth: 18,
    borderColor: '#FFFFFF',
    bottomExtra: 50,
    radius: 0,
    shadow: { color: 'rgba(58, 54, 50, 0.22)', blur: 14, offsetX: 0, offsetY: 5 },
    rotateJitter: 2
  },
  doodles: {
    names: ['car', 'mountain', 'compass', 'sun'],
    perSpread: [1, 2],
    size: [90, 130],
    colors: ['accent', 'sky', 'road'],
    lineWidth: 3.5,
    rotate: 10,
    pageTypes: ['body']
  },
  decorations: [
    // 虚线路线 + 定位针：约 40% 的正文页（画在照片下面）
    { type: 'route', color: 'accent', width: 4, dash: 14, pinColor: 'accent', pageTypes: ['body'], chance: 0.4 }
  ],
  // 装饰计划（阶段 7d）：没有大装饰（路线仍按 decorations 出现）；小装饰为线稿 + 行李吊牌
  ornaments: {
    small: [
      { type: 'doodle', weight: 3 },
      { type: 'luggageTag', size: [250, 300], paper: 'white', band: 'accent', weight: 1.5 }
    ],
    smallPerSpread: [1, 2],
    pageTypes: ['body']
  },
  layoutWeights: {
    'b-H1L-L1': 3,
    'b-P1-H1P': 3,
    'b-XL': 2,
    'b-XR': 2,
    'b-SB': 2,
    'b-L1T-L1B': 1.5
  }
}
