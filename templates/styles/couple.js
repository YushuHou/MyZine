// 主题风格：心动旅程（阶段 8f，第五套使用图片素材的模板；情侣，不画人物）
// 淡玫瑰粉水彩纸纹 + 玫瑰粉 / 酒红 / 薄荷绿；水彩浪漫物件（爱心气球、玫瑰、戒指、情书……）、约会小物（热气球、摩天轮、拍立得……）
// 和成对的小动物（依偎的兔子、牵翅膀的企鹅、天鹅……）围着照片成组；粉条纹、小爱心纸胶带；方格便签、爱心便签；
// 飘落的小爱心、撕纸色带、水彩晕染；
// 复用其他模板的元素：邮票（里面是浪漫小物）+ 邮戳（大海沙滩）、撕纸条和爱心闪光线稿（手账）
// 素材在 pkg-couple 分包，由 scripts/packs/couple.json 生成
const ROMANCE = ['heartBalloons', 'roses', 'milkshakes', 'rings', 'giftBox', 'loveLetter']
const DATES = ['iceCreams', 'hotAirBalloon', 'ferrisWheel', 'camera', 'picnicBasket', 'heartCandle']
const PAIRS = ['bunnies', 'lovebirds', 'penguins', 'bears', 'swans', 'kittens']
const STICKERS = ROMANCE.concat(DATES, PAIRS)
// 小物件比成对的小动物小一些
const SCALES = { rings: 0.8, loveLetter: 0.8, heartCandle: 0.78, camera: 0.85, milkshakes: 0.85 }

module.exports = {
  id: 'couple',
  name: '心动旅程',
  group: 'theme',
  description: '玫瑰、情书和成对的小动物，两个人的甜蜜旅行',
  tags: ['couple', 'beach', 'city-night', 'amusement'],
  assetsPackage: null,
  // 图片素材分包（见 core/render/assetPacks.js）
  assetPack: 'couple',
  colors: {
    background: '#FAEDEA',
    text: '#5B2E38',
    textMuted: '#A7848A',
    accent: '#C2546B',
    wine: '#8E2F45',
    mint: '#8DBFAA',
    gold: '#C9A46A',
    // 邮戳、撕纸条等
    stampFill: '#FBE3E6',
    postmark: 'rgba(91, 46, 56, 0.7)',
    endpaper: '#F4DADC',
    placeholder: '#EFDCD8',
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
    'Love Story', 'You & Me', 'Sweet Escape', 'Forever Us', 'Better Together', 'Hand in Hand',
    'Our Little Trip', 'Falling in Love', 'Date Night', 'Two of Us', 'Sweetheart', 'Lovebirds',
    'Always You', 'Happy Together', 'Heartbeats', 'Pink Days', 'Little Romance', 'Made for Us', 'With You', 'Just Us'
  ],
  // 便签纸、撕纸条上的短句：整本书不重复
  stripPool: [
    'you & me', 'love you more', 'just us', 'sweet days', 'hand in hand', 'my favorite person',
    'date night', 'forever', 'xoxo', 'so in love', 'our story', 'pinky promise', 'heart eyes',
    'happy us', 'always', 'cheers to us', 'best day with you', 'sunset kisses'
  ],
  decoText: {
    // 封面问候语：第一行 MZ Playfair 字形，第二行地点；无地点时写 Love Story
    greeting: {
      lines: [
        { text: 'Love in', ifMissing: { var: 'location', text: 'Love Story' }, font: { glyph: 'playfair', family: 'serif', size: 64, color: '#FFFFFF' } },
        { text: '{location}', font: { family: 'serif', weight: 'bold', size: 84, color: '#FFFFFF' } }
      ],
      lineGap: 112,
      shadow: true
    },
    headline: { text: '{word}', font: { glyph: 'caveat', family: 'serif', size: 124, color: 'accent' }, minScale: 0.5 },
    kicker: { text: '{location} · {date}', font: { glyph: 'playfair', family: 'serif', size: 22, letterSpacing: 4, uppercase: true, color: 'textMuted' } }
  },
  pageNumber: { show: true, glyph: 'caveat', family: 'serif', size: 36, color: 'accent', bottom: 62 },
  // 淡玫瑰粉水彩纸纹平铺（素材分包加载失败时显示纯色）
  background: { type: 'image', src: 'pack:paper', repeat: 'tile', tile: 640, color: '#FAEDEA' },
  photoFrame: {
    borderWidth: 16,
    borderColor: '#FFFFFF',
    radius: 0,
    shadow: { color: 'rgba(91, 46, 56, 0.18)', blur: 16, offsetX: 0, offsetY: 5 },
    rotateJitter: 2,
    torn: { chance: 0.3, minArea: 0.16, depth: 20, jag: 7, fiber: 9, shadow: { color: 'rgba(91, 46, 56, 0.18)', blur: 10, offsetX: 0, offsetY: 3 } }
  },
  // 本页最大照片上的点睛装饰：每跨页二选一（邮票邮戳 / 照片角贴纸），只在一页上
  frameAccents: { postal: 1.2, sticker: 1.6 },
  frameDecorations: [
    // 真实纸胶带：粉条纹、小爱心、粉色素色
    { type: 'tape', images: ['tapeStripe', 'tapeHeart', 'tapePink'], colors: ['rgba(194, 84, 107, 0.6)'], width: 220, height: 56, placement: 'top', angleJitter: 8 },
    // 情书邮票：里面是浪漫小物，邮戳写地点和日期
    { type: 'stamp', accent: 'postal', largestOnly: true, minWidth: 380, w: 140, h: 170, inset: 26, fill: 'stampFill', stickers: ['heartBalloons', 'roses', 'lovebirds', 'swans', 'hotAirBalloon', 'loveLetter'] },
    { type: 'postmark', accent: 'postal', largestOnly: true, minWidth: 380, r: 92, color: 'postmark', font: { glyph: 'oswald', family: 'sans-serif', letterSpacing: 1.5, uppercase: true } },
    // 本页最大的照片角上压一张贴纸
    { type: 'frameSticker', accent: 'sticker', names: STICKERS, scales: SCALES, size: [210, 280], rotate: 14, corners: ['top-right', 'bottom-left', 'bottom-right'] }
  ],
  decorations: [],
  // 细线稿（手账）：爱心、闪光，只在装饰多的跨页里点缀
  doodles: { names: ['heart', 'sparkle', 'star'], size: [70, 100], colors: ['accent', 'gold', 'wine'], lineWidth: 3.5, rotate: 18, pageTypes: ['body'] },
  ornaments: {
    // 大装饰：飘落的小爱心 / 撕纸色带 / 水彩晕染，颜色取跨页主色调
    big: [
      { type: 'snowfall', shape: 'heart', density: 38, size: [8, 18], weight: 2.5 },
      { type: 'paperBand', colors: ['accent', 'wine', 'mint'], mix: 0.6, y: [0.22, 0.8], height: [0.18, 0.28], cover: 0.35, weight: 2.5 },
      { type: 'wash', colors: ['accent', 'wine', 'mint'], alpha: 0.36, size: [0.5, 0.72], weight: 1.5 }
    ],
    bigPerSpread: [1, 2],
    // 玫瑰粉为主，酒红、薄荷绿偶尔出现（薄荷绿和粉色互补，增加一点清爽）
    tones: ['accent', 'accent', 'wine', 'mint'],
    small: [
      { type: 'sticker', names: STICKERS, scales: SCALES, size: [230, 340], rotate: 14, weight: 5 },
      { type: 'note', images: ['noteGrid', 'noteHeart'], size: [250, 310], clip: 'clip', clipChance: 0.45, text: ['pool', 'place'], font: { glyph: 'caveat', family: 'serif', size: 50, color: 'text' }, weight: 1.3 },
      { type: 'tornStrip', paper: 'white', size: [240, 320], height: 74, text: ['pool'], font: { glyph: 'caveat', family: 'serif', size: 42, color: 'wine' }, weight: 0.5 },
      { type: 'doodle', weight: 0.8 }
    ],
    // 照片占得越少，装饰越多
    smallByCoverage: [[0.35, [5, 6]], [0.55, [3, 4]], [1, [2, 3]]],
    smallPerSpread: [3, 4],
    // 贴纸分主题：浪漫物件 / 约会小物 / 成对的小动物
    stickerGroups: [ROMANCE, DATES, PAIRS],
    anchorChance: 0.6,
    pageTypes: ['body']
  },
  // 偏好：叠压（两张照片挨在一起）、圆形框、拱形框、留白小图、跨中缝
  layoutWeights: {
    'b-OV-L1B': 3,
    'b-P1S-OV': 3,
    'b-CI-L1': 2.5,
    'b-AR-L1B': 2,
    'b-L1S-L1': 2,
    'b-H1L-L1': 2,
    'b-ST-P1': 1.5,
    'b-XL': 2,
    'b-XR': 2
  }
}
