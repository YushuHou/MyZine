// 主题风格：温馨时刻（阶段 8g，第六套使用图片素材的模板；家庭，不画人物）
// 暖奶油水彩纸纹 + 向日葵黄 / 天空蓝 / 苹果红 / 草绿，明快温暖的绘本风；
// 水彩动物一家（熊一家三口、鸭妈妈带小鸭……）、出游物件（风筝、气球、帐篷……）、温暖小物（小房子、彩虹、四双鞋……）围着照片成组；
// 黄格纹、彩色波点、天蓝纸胶带；黄色方格便签、云朵便签；飘落的彩色纸屑、撕纸色带、水彩晕染；
// 复用其他模板的元素：草地小丘剪影（自然风光）、野餐格纹页边（美食）、邮票 + 邮戳（大海沙滩）、行李吊牌（公路旅行）、星星线稿（手账）
// 素材在 pkg-family 分包，由 scripts/packs/family.json 生成
const ANIMALS = ['bears', 'ducks', 'giraffes', 'foxes', 'elephants', 'penguins']
const OUTING = ['kite', 'balloons', 'wagon', 'tent', 'picnic', 'teacup']
const HOME = ['house', 'sunflower', 'rainbow', 'shoes', 'teddy', 'cake']
const STICKERS = ANIMALS.concat(OUTING, HOME)
// 小物件比动物一家小一些
const SCALES = { teddy: 0.8, cake: 0.82, teacup: 0.85, sunflower: 0.85 }

module.exports = {
  id: 'family',
  name: '温馨时刻',
  group: 'theme',
  description: '动物一家、风筝气球和小房子，一家人出游的温暖时光',
  tags: ['family', 'amusement', 'zoo-farm', 'nature'],
  assetsPackage: null,
  // 图片素材分包（见 core/render/assetPacks.js）
  assetPack: 'family',
  colors: {
    background: '#FCF6E8',
    text: '#3E3A33',
    textMuted: '#968B78',
    accent: '#5B97D1',
    sun: '#F2BE3A',
    apple: '#DD5A48',
    leaf: '#78AE57',
    // 野餐格纹、邮戳等
    stampFill: '#FDF3D6',
    postmark: 'rgba(62, 58, 51, 0.7)',
    endpaper: '#F8E8BF',
    placeholder: '#F0E6CF',
    fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 84, lineHeight: 1.25, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.4, color: 'accent' },
    body: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.7, color: 'text' },
    caption: { family: 'serif', weight: 'normal', size: 26, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  // 手写体西文标题：整本书不重复（有标题槽的跨页才用掉一个）
  wordPool: [
    'Family Time', 'Happy Days', 'Home Sweet Home', 'Together', 'Little Moments', 'Sunny Days',
    'Family Fun', 'Our Little Trip', 'Big Smiles', 'Weekend Adventure', 'Love Grows Here', 'Best Day Ever',
    'Hand in Hand', 'All of Us', 'Making Memories', 'Picnic Day', 'Growing Up', 'Happy Family', 'Joyful', 'Little Explorers'
  ],
  // 便签纸、撕纸条上的短句：整本书不重复
  stripPool: [
    'family time', 'all together', 'big hugs', 'happy days', 'picnic day', 'little explorer',
    'love you all', 'so much fun', 'sweet home', 'growing up', 'best day ever', 'tiny steps',
    'laugh a lot', 'sunny smiles', 'kite day', 'make a wish', 'home is us', 'our happy place'
  ],
  decoText: {
    // 封面问候语：第一行 MZ Playfair 字形，第二行地点；无地点时写 Family Time
    greeting: {
      lines: [
        { text: 'Family Trip to', ifMissing: { var: 'location', text: 'Family Time' }, font: { glyph: 'playfair', family: 'serif', size: 64, color: '#FFFFFF' } },
        { text: '{location}', font: { family: 'serif', weight: 'bold', size: 84, color: '#FFFFFF' } }
      ],
      lineGap: 112,
      shadow: true
    },
    headline: { text: '{word}', font: { glyph: 'caveat', family: 'serif', size: 124, color: 'accent' }, minScale: 0.5 },
    kicker: { text: '{location} · {date}', font: { glyph: 'playfair', family: 'serif', size: 22, letterSpacing: 4, uppercase: true, color: 'textMuted' } }
  },
  pageNumber: { show: true, glyph: 'caveat', family: 'serif', size: 36, color: 'accent', bottom: 62 },
  // 暖奶油水彩纸纹平铺（素材分包加载失败时显示纯色）
  background: { type: 'image', src: 'pack:paper', repeat: 'tile', tile: 640, color: '#FCF6E8' },
  photoFrame: {
    borderWidth: 16,
    borderColor: '#FFFFFF',
    radius: 0,
    shadow: { color: 'rgba(80, 65, 40, 0.2)', blur: 16, offsetX: 0, offsetY: 5 },
    rotateJitter: 2.5,
    torn: { chance: 0.3, minArea: 0.16, depth: 20, jag: 7, fiber: 9, shadow: { color: 'rgba(80, 65, 40, 0.2)', blur: 10, offsetX: 0, offsetY: 3 } }
  },
  // 本页最大照片上的点睛装饰：每跨页二选一（邮票邮戳 / 照片角贴纸），只在一页上
  frameAccents: { postal: 1, sticker: 1.8 },
  frameDecorations: [
    // 真实纸胶带：黄格纹、彩色波点、天蓝
    { type: 'tape', images: ['tapeGingham', 'tapeDots', 'tapeBlue'], colors: ['rgba(242, 190, 58, 0.7)'], width: 220, height: 56, placement: 'top', angleJitter: 8 },
    // 邮票里是动物一家或温暖小物，邮戳写地点和日期
    { type: 'stamp', accent: 'postal', largestOnly: true, minWidth: 380, w: 140, h: 170, inset: 26, fill: 'stampFill', stickers: ['house', 'rainbow', 'sunflower', 'penguins', 'balloons', 'foxes'] },
    { type: 'postmark', accent: 'postal', largestOnly: true, minWidth: 380, r: 92, color: 'postmark', font: { glyph: 'oswald', family: 'sans-serif', letterSpacing: 1.5, uppercase: true } },
    // 本页最大的照片角上压一张贴纸
    { type: 'frameSticker', accent: 'sticker', names: STICKERS, scales: SCALES, size: [210, 280], rotate: 14, corners: ['top-right', 'bottom-left', 'bottom-right'] }
  ],
  decorations: [],
  // 细线稿：星星、太阳、云朵、爱心，只在装饰多的跨页里点缀
  doodles: { names: ['star', 'sun', 'cloud', 'heart'], size: [70, 100], colors: ['accent', 'sun', 'apple'], lineWidth: 3.5, rotate: 15, pageTypes: ['body'] },
  ornaments: {
    // 大装饰：撕纸色带 / 水彩晕染 / 飘落的彩色小爱心 / 草地小丘剪影（自然风光）/ 野餐格纹页边（美食）
    big: [
      { type: 'paperBand', colors: ['accent', 'sun', 'leaf'], mix: 0.55, y: [0.22, 0.8], height: [0.18, 0.28], cover: 0.35, weight: 2.5 },
      { type: 'wash', colors: ['accent', 'sun', 'leaf', 'apple'], alpha: 0.36, size: [0.5, 0.72], weight: 1.5 },
      { type: 'snowfall', shape: 'heart', density: 26, size: [8, 16], weight: 1.2 },
      { type: 'scenery', kinds: ['hills'], layers: [2, 3], color: 'leaf', mix: [0.82, 0.7, 0.58], desaturate: 0.15, height: [0.12, 0.2], weight: 1.5 },
      { type: 'deco', deco: { type: 'checkerBorder', color: 'apple', width: 40, check: 16, edges: ['bottom'] }, weight: 0.8 }
    ],
    bigPerSpread: [1, 2],
    // 天空蓝、向日葵黄、草绿轮换（苹果红只做小点缀）
    tones: ['accent', 'sun', 'leaf'],
    small: [
      { type: 'sticker', names: STICKERS, scales: SCALES, size: [230, 340], rotate: 14, weight: 5 },
      { type: 'note', images: ['noteGrid', 'noteCloud'], size: [250, 310], clip: 'clip', clipChance: 0.45, text: ['pool', 'place'], font: { glyph: 'caveat', family: 'serif', size: 50, color: 'text' }, weight: 1.3 },
      { type: 'luggageTag', size: [240, 290], paper: 'white', band: 'apple', weight: 0.4 },
      { type: 'doodle', weight: 0.8 }
    ],
    // 照片占得越少，装饰越多
    smallByCoverage: [[0.35, [5, 6]], [0.55, [3, 4]], [1, [2, 3]]],
    smallPerSpread: [3, 4],
    // 贴纸分主题：动物一家 / 出游物件 / 温暖小物
    stickerGroups: [ANIMALS, OUTING, HOME],
    anchorChance: 0.6,
    pageTypes: ['body']
  },
  // 偏好：多图版式（全家福多）、叠压、大头贴四格条、跨中缝
  layoutWeights: {
    'b-OV-L1B': 3,
    'b-P1S-OV': 2.5,
    'b-ST-L1T': 2,
    'b-ST-P1': 2,
    'b-G4L-L1S': 1.5,
    'b-L2-L2': 2,
    'b-CI-L1': 2,
    'b-H1L-L1': 2,
    'b-XL': 2,
    'b-XR': 2
  }
}
