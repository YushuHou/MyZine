// 主题风格：喵呜时光（阶段 8d，第三套使用图片素材的模板）
// 奶油粉水彩纸纹 + 樱花粉 / 蜜桃橘 / 雾紫；水彩猫咪贴纸（睡觉、伸懒腰、纸箱、旅行中的小猫……）和猫咪小物围着照片成组；
// 格纹、爪印、奶油纸胶带；粉色便签和猫耳便签；横穿跨页的猫爪印小路、撕纸色带、水彩晕染；
// 复用其他模板的元素：邮票（里面是小猫）+ 邮戳（大海沙滩）、点阵手账纸底纹、爱心闪光线稿、撕纸条（手账）
// 素材在 pkg-cat 分包，由 scripts/packs/cat.json 生成
const CATS = ['catNap', 'catStretch', 'catLoaf', 'catBelly', 'catBox', 'catBack']
const TOYS = ['yarn', 'driedFish', 'wand', 'bowl', 'paw', 'collar']
const TRAVEL = ['catSuitcase', 'catTote', 'catCamera', 'catPicnic', 'catPlane', 'catLetter']
const STICKERS = CATS.concat(TOYS, TRAVEL)
// 小物件比猫咪小一些
const SCALES = { yarn: 0.75, driedFish: 0.75, wand: 0.85, bowl: 0.75, paw: 0.6, collar: 0.72 }

module.exports = {
  id: 'cat',
  name: '喵呜时光',
  group: 'theme',
  description: '水彩小猫、爪印和猫耳便签，和毛孩子的旅行日常',
  tags: ['pets', 'family', 'couple'],
  assetsPackage: null,
  // 图片素材分包（见 core/render/assetPacks.js）
  assetPack: 'cat',
  colors: {
    background: '#FBF1EA',
    text: '#5A4048',
    textMuted: '#A48A8F',
    accent: '#D98A9A',
    peach: '#E8A27C',
    lilac: '#B3A2C8',
    latte: '#B08A6E',
    // 邮戳、撕纸条等
    stampFill: '#FBE6E6',
    postmark: 'rgba(90, 64, 72, 0.7)',
    endpaper: '#F6E1E1',
    placeholder: '#F0E2DC',
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
    'Meow Moments', 'Purrfect Day', 'Little Paws', 'Cat Nap', 'Sunny Purrs', 'Paws & Travel',
    'Whisker Days', 'Soft Paws', 'Meow Diary', 'Nine Lives', 'Tiny Explorer', 'Cozy Purrs',
    'Curious Cat', 'Tail Tales', 'Fluffy Days', 'Pawsome', 'Purr More', 'Snuggle Time', 'Meow & Me', 'Box Is Life'
  ],
  // 便签纸、撕纸条上的短句：整本书不重复
  stripPool: [
    'meow meow', 'nap time', 'purr purr', 'tiny paws', 'snack please', 'so fluffy', 'cat mode on',
    'sunny window', 'zzz...', 'box is life', 'treat time', 'love you meow', 'curious me', 'soft & warm',
    'happy purrs', 'little explorer', 'whisker kisses', 'one more nap'
  ],
  decoText: {
    // 封面问候语：第一行 MZ Playfair 字形，第二行地点；无地点时写 Meow Days
    greeting: {
      lines: [
        { text: 'Meow from', ifMissing: { var: 'location', text: 'Meow Days' }, font: { glyph: 'playfair', family: 'serif', size: 64, color: '#FFFFFF' } },
        { text: '{location}', font: { family: 'serif', weight: 'bold', size: 84, color: '#FFFFFF' } }
      ],
      lineGap: 112,
      shadow: true
    },
    headline: { text: '{word}', font: { glyph: 'caveat', family: 'serif', size: 124, color: 'accent' }, minScale: 0.5 },
    kicker: { text: '{location} · {date}', font: { glyph: 'playfair', family: 'serif', size: 22, letterSpacing: 4, uppercase: true, color: 'textMuted' } }
  },
  pageNumber: { show: true, glyph: 'caveat', family: 'serif', size: 36, color: 'accent', bottom: 62 },
  // 奶油粉水彩纸纹平铺（素材分包加载失败时显示纯色）
  background: { type: 'image', src: 'pack:paper', repeat: 'tile', tile: 640, color: '#FBF1EA' },
  photoFrame: {
    borderWidth: 16,
    borderColor: '#FFFFFF',
    radius: 0,
    shadow: { color: 'rgba(90, 60, 60, 0.18)', blur: 16, offsetX: 0, offsetY: 5 },
    rotateJitter: 2.5,
    // 撕纸边：比前两套少一些，保持软萌
    torn: { chance: 0.3, minArea: 0.16, depth: 20, jag: 7, fiber: 9, shadow: { color: 'rgba(90, 60, 60, 0.18)', blur: 10, offsetX: 0, offsetY: 3 } }
  },
  // 本页最大照片上的点睛装饰：每跨页二选一（邮票邮戳 / 照片角贴纸），只在一页上
  frameAccents: { postal: 1, sticker: 1.8 },
  frameDecorations: [
    // 真实纸胶带：粉格纹、爪印、奶油色
    { type: 'tape', images: ['tapeGingham', 'tapePaw', 'tapePlain'], colors: ['rgba(217, 138, 154, 0.7)'], width: 220, height: 56, placement: 'top', angleJitter: 8 },
    // 喵星来信：邮票里是小猫，邮戳写地点和日期
    { type: 'stamp', accent: 'postal', largestOnly: true, minWidth: 380, w: 140, h: 170, inset: 26, fill: 'stampFill', stickers: ['catLoaf', 'catNap', 'catBox', 'catLetter', 'catPlane', 'paw'] },
    { type: 'postmark', accent: 'postal', largestOnly: true, minWidth: 380, r: 92, color: 'postmark', font: { glyph: 'oswald', family: 'sans-serif', letterSpacing: 1.5, uppercase: true } },
    // 本页最大的照片角上压一只小猫或猫咪小物
    { type: 'frameSticker', accent: 'sticker', names: STICKERS, scales: SCALES, size: [210, 280], rotate: 14, corners: ['top-right', 'bottom-left', 'bottom-right'] }
  ],
  decorations: [],
  // 细线稿（手账）：爱心、闪光、星星，只在装饰多的跨页里点缀
  doodles: { names: ['heart', 'sparkle', 'star'], size: [70, 100], colors: ['accent', 'lilac', 'peach'], lineWidth: 3.5, rotate: 18, pageTypes: ['body'] },
  ornaments: {
    // 大装饰：猫爪印小路 / 跨中缝撕纸色带 / 水彩晕染 / 点阵手账纸，颜色取跨页主色调
    big: [
      // 爪印用奶茶棕：粉色爪印印在粉色纸上看不清
      { type: 'pawTrail', size: 84, stride: 150, color: 'latte', alpha: 0.5, mix: 0.05, y: [0.15, 0.85], weight: 2.5 },
      { type: 'paperBand', colors: ['accent', 'peach', 'lilac'], mix: 0.6, y: [0.22, 0.8], height: [0.18, 0.28], cover: 0.35, weight: 2.5 },
      { type: 'wash', colors: ['accent', 'peach', 'lilac'], alpha: 0.38, size: [0.5, 0.72], weight: 1.5 },
      { type: 'pagePattern', names: ['dotgrid'], color: 'accent', alpha: 0.22, cell: 44, weight: 0.8 }
    ],
    bigPerSpread: [1, 2],
    tones: ['accent', 'accent', 'peach', 'lilac'],
    small: [
      { type: 'sticker', names: STICKERS, scales: SCALES, size: [230, 340], rotate: 14, weight: 5 },
      { type: 'note', images: ['notePink', 'noteCat'], size: [250, 310], clip: 'clip', clipChance: 0.45, text: ['pool', 'place'], font: { glyph: 'caveat', family: 'serif', size: 50, color: 'text' }, weight: 1.3 },
      { type: 'tornStrip', paper: 'lined', size: [240, 320], height: 74, text: ['pool'], font: { glyph: 'caveat', family: 'serif', size: 42, color: 'text' }, weight: 0.5 },
      { type: 'doodle', weight: 0.8 }
    ],
    // 照片占得越少，装饰越多
    smallByCoverage: [[0.35, [5, 6]], [0.55, [3, 4]], [1, [2, 3]]],
    smallPerSpread: [3, 4],
    // 贴纸分主题：猫咪姿态 / 猫咪小物 / 旅行中的小猫
    stickerGroups: [CATS, TOYS, TRAVEL],
    anchorChance: 0.6,
    pageTypes: ['body']
  },
  // 偏好：圆形框、叠压、留白小图、大头贴四格条、跨中缝
  layoutWeights: {
    'b-CI-L1': 3,
    'b-OV-L1B': 3,
    'b-P1S-OV': 3,
    'b-ST-L1T': 2,
    'b-ST-P1': 2,
    'b-L1S-L1': 2,
    'b-H1L-L1': 2,
    'b-XL': 1.5,
    'b-XR': 1.5
  }
}
