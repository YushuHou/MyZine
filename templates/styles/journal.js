// 风格：手账（全部由代码绘制：纸张纹理、拍立得白边、轻微倾斜、和纸胶带）
// 阶段 6b 升级：每跨页 2–4 个线稿；粉 / 奶油 / 浅棕底色在跨页间变化（左右页可不同）；
// 偏好大头贴四格条、叠压；MZ Caveat 手写体西文标题
module.exports = {
  id: 'journal',
  name: '手账',
  group: 'style',
  description: '米色纸张、拍立得白边、和纸胶带，轻松随手',
  tags: ['food', 'family', 'pets', 'zoo-farm', 'amusement', 'party'],
  assetsPackage: null,
  colors: {
    background: '#F3EBDD',
    text: '#4A3F35',
    textMuted: '#9A8B7A',
    accent: '#D9825B',
    endpaper: '#E6D6BE',
    placeholder: '#E3D7C4',
    fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 84, lineHeight: 1.25, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.4, color: 'accent' },
    body: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.75, color: 'text' },
    caption: { family: 'serif', weight: 'normal', size: 26, lineHeight: 1.5, color: 'textMuted', letterSpacing: 1 }
  },
  // 手账风格不印页码
  pageNumber: { show: false },
  // 手写体西文标题（装饰词），放在版式的留白标题槽；整本书不重复：整本书不重复（有标题槽的跨页才用掉一个），用完后重新开始
  wordPool: [
    'Good Days', 'Summer Travel', 'Yum!', 'Happy Trip', 'Little Things', 'Oh Happy Day', 'Hello Sunshine',
    'Sweet Memories', 'Best Day Ever', 'So Fun', 'Snack Time', 'Little Joys', 'Hello Friend', 'Weekend Mood',
    'Yay!', 'Happy Moments', 'Just Us', 'Oh My!', 'Lovely Day', 'Pocket Notes', 'Sunny Side'
  ],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'caveat', family: 'serif', size: 120, color: 'accent' }, minScale: 0.5 },
    kicker: { text: '{month} {year}', font: { glyph: 'caveat', family: 'serif', size: 44, color: 'textMuted' } }
  },
  // 底色在跨页间变化、左右页可不同：粉、奶油、浅棕（纸张纹理以正片叠底叠在上面）
  pagePalette: ['#F6E4E1', '#F6EEDB', '#EBDCC8'],
  // 线稿：每个跨页 2–4 个，位置按跨页稳定变化
  doodles: {
    names: ['star', 'heart', 'cloud', 'note', 'flower', 'arrow', 'sparkle'],
    perSpread: [2, 4],
    size: [95, 140],
    colors: ['accent', '#D98C8C', '#7FA79B', '#D9B25E'],
    lineWidth: 4.5,
    rotate: 20,
    pageTypes: ['body']
  },
  // 偏好版式：大头贴四格条、叠压
  layoutWeights: {
    'b-ST-L1T': 3,
    'b-ST-P1': 3,
    'b-OV-L1B': 3,
    'b-P1S-OV': 3,
    'b-H1L-L1': 1.5,
    'b-P1-H1P': 1.5
  },
  // 代码生成的纸张纹理平铺；生成失败时显示 color 纯色
  background: { type: 'texture', texture: 'paper', tile: 540, color: '#F2E9D9' },
  photoFrame: {
    borderWidth: 20,
    borderColor: '#FFFFFF',
    // 拍立得：底边加宽
    bottomExtra: 56,
    radius: 0,
    shadow: { color: 'rgba(80, 60, 40, 0.25)', blur: 18, offsetX: 0, offsetY: 6 },
    // 每张照片随机倾斜 ±2.5°（满版照片不倾斜）
    rotateJitter: 2.5
  },
  frameDecorations: [
    // 顶边一条和纸胶带，颜色随机
    {
      type: 'tape',
      colors: ['rgba(232, 176, 156, 0.78)', 'rgba(164, 198, 186, 0.78)', 'rgba(238, 210, 134, 0.78)', 'rgba(190, 176, 214, 0.78)'],
      width: 170,
      height: 46,
      placement: 'top',
      angleJitter: 10
    }
  ],
  decorations: [],
  // 装饰计划（阶段 7c）：大装饰为整页手账纸底纹；小装饰 2–3 个（线稿、护照章、方印）
  ornaments: {
    big: [
      { type: 'pagePattern', names: ['grid', 'dotgrid', 'lined'], color: 'textMuted', alpha: 0.32, cell: 44, margin: '#D98C8C' }
    ],
    small: [
      { type: 'doodle', weight: 4 },
      { type: 'passport', size: [160, 190], count: [1, 2], colors: ['#7FA79B', '#D9825B', '#8C7BB0'], weight: 1 },
      { type: 'seal', size: [120, 150], weight: 1 }
    ],
    smallPerSpread: [2, 3],
    pageTypes: ['body']
  }
}
