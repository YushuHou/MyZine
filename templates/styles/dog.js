// 主题风格：小汪出游（阶段 8e，第四套使用图片素材的模板）
// 暖奶油水彩纸纹 + 蜂蜜黄 / 草地绿 / 天空蓝；水彩狗狗贴纸（柯基、金毛、柴犬、车筐里的狗……）和狗狗小物围着照片成组；
// 黄格纹、骨头、牛皮纸纸胶带；黄色方格便签和骨头便签；横穿跨页的狗爪印小路、撕纸色带、水彩晕染；
// 复用其他模板的元素：爪印小路（喵呜时光）、虚线路线和定位针（公路旅行）、木栅栏页边（动物园农场）、
// 邮票 + 邮戳（大海沙滩）、行李吊牌和护照章（公路旅行）
// 素材在 pkg-dog 分包，由 scripts/packs/dog.json 生成
const DOGS = ['corgi', 'golden', 'bichon', 'shiba', 'dachshund', 'collie']
const TOYS = ['biscuit', 'ball', 'leash', 'bowl', 'frisbee', 'duck']
const TRAVEL = ['dogBike', 'dogBackpack', 'dogTent', 'dogSuitcase', 'dogMap', 'dogPicnic']
const STICKERS = DOGS.concat(TOYS, TRAVEL)
// 小物件比狗狗小一些，避免「网球比柯基还大」
const SCALES = { biscuit: 0.72, ball: 0.6, leash: 0.8, bowl: 0.75, frisbee: 0.68, duck: 0.62 }

module.exports = {
  id: 'dog',
  name: '小汪出游',
  group: 'theme',
  description: '水彩狗狗、骨头便签和爪印小路，带上毛孩子去旅行',
  tags: ['pets', 'family', 'road-trip', 'nature'],
  assetsPackage: null,
  // 图片素材分包（见 core/render/assetPacks.js）
  assetPack: 'dog',
  colors: {
    background: '#FBF5E6',
    text: '#4A3A2C',
    textMuted: '#9C8B78',
    accent: '#E2A33B',
    grass: '#7FA65A',
    sky: '#7FB2D9',
    caramel: '#B9783F',
    red: '#D2553F',
    // 木栅栏、邮戳等
    wood: '#C9A27A',
    stampFill: '#FDF0D2',
    postmark: 'rgba(74, 58, 44, 0.7)',
    endpaper: '#F6E7C4',
    placeholder: '#EFE4CC',
    fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 84, lineHeight: 1.25, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.4, color: 'caramel' },
    body: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.7, color: 'text' },
    caption: { family: 'serif', weight: 'normal', size: 26, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  // 手写体西文标题：整本书不重复（有标题槽的跨页才用掉一个）
  wordPool: [
    'Happy Tails', 'Good Boy', 'Puppy Love', 'Walkies', 'Sniff & Explore', 'Tail Wags', 'Ruff Day',
    'Best Buddy', 'Paws on Tour', 'Fetch Fun', 'Doggo Days', 'Sunny Walks', 'Wag More', 'Little Adventurer',
    'Muddy Paws', 'Bark & Roam', 'Road Trip Pup', 'Furry Friend', 'Zoomies', 'Off We Go'
  ],
  // 便签纸上的短句：整本书不重复
  stripPool: [
    'good boy', 'walkies!', 'zoomies', 'treat please', 'tail wags', 'sniff sniff', 'nap in the sun',
    'best buddy', 'fetch time', 'muddy paws', 'happy pup', 'off we go', 'belly rubs', 'sunny walk',
    'paws up', 'road trip', 'so loved', 'one more ball'
  ],
  decoText: {
    // 封面问候语：第一行 MZ Playfair 字形，第二行地点；无地点时写 Happy Tails
    greeting: {
      lines: [
        { text: 'Woof from', ifMissing: { var: 'location', text: 'Happy Tails' }, font: { glyph: 'playfair', family: 'serif', size: 64, color: '#FFFFFF' } },
        { text: '{location}', font: { family: 'serif', weight: 'bold', size: 84, color: '#FFFFFF' } }
      ],
      lineGap: 112,
      shadow: true
    },
    headline: { text: '{word}', font: { glyph: 'caveat', family: 'serif', size: 124, color: 'caramel' }, minScale: 0.5 },
    kicker: { text: '{location} · {date}', font: { glyph: 'playfair', family: 'serif', size: 22, letterSpacing: 4, uppercase: true, color: 'textMuted' } }
  },
  pageNumber: { show: true, glyph: 'caveat', family: 'serif', size: 36, color: 'caramel', bottom: 62 },
  // 暖奶油水彩纸纹平铺（素材分包加载失败时显示纯色）
  background: { type: 'image', src: 'pack:paper', repeat: 'tile', tile: 640, color: '#FBF5E6' },
  photoFrame: {
    borderWidth: 16,
    borderColor: '#FFFFFF',
    radius: 0,
    shadow: { color: 'rgba(80, 60, 30, 0.2)', blur: 16, offsetX: 0, offsetY: 5 },
    rotateJitter: 2.5,
    torn: { chance: 0.32, minArea: 0.16, depth: 20, jag: 7, fiber: 9, shadow: { color: 'rgba(80, 60, 30, 0.2)', blur: 10, offsetX: 0, offsetY: 3 } }
  },
  // 本页最大照片上的点睛装饰：每跨页二选一（邮票邮戳 / 照片角贴纸），只在一页上
  frameAccents: { postal: 1, sticker: 1.8 },
  frameDecorations: [
    // 真实纸胶带：黄格纹、骨头、牛皮纸
    { type: 'tape', images: ['tapeGingham', 'tapeBone', 'tapeKraft'], colors: ['rgba(226, 163, 59, 0.7)'], width: 220, height: 56, placement: 'top', angleJitter: 8 },
    // 邮票里是狗狗，邮戳写地点和日期
    { type: 'stamp', accent: 'postal', largestOnly: true, minWidth: 380, w: 140, h: 170, inset: 26, fill: 'stampFill', stickers: ['corgi', 'shiba', 'bichon', 'dogBike', 'dogMap', 'biscuit'] },
    { type: 'postmark', accent: 'postal', largestOnly: true, minWidth: 380, r: 92, color: 'postmark', font: { glyph: 'oswald', family: 'sans-serif', letterSpacing: 1.5, uppercase: true } },
    // 本页最大的照片角上压一只狗狗或狗狗小物
    { type: 'frameSticker', accent: 'sticker', names: STICKERS, scales: SCALES, size: [210, 280], rotate: 14, corners: ['top-right', 'bottom-left', 'bottom-right'] }
  ],
  decorations: [],
  // 细线稿：只在装饰多的跨页里点缀
  doodles: { names: ['sun', 'cloud', 'heart', 'sparkle'], size: [70, 100], colors: ['accent', 'sky', 'caramel'], lineWidth: 3.5, rotate: 15, pageTypes: ['body'] },
  ornaments: {
    // 大装饰：狗爪印小路 / 撕纸色带 / 水彩晕染 / 虚线路线（公路旅行）/ 木栅栏页边（动物园农场）
    big: [
      { type: 'pawTrail', size: 84, stride: 150, color: 'caramel', alpha: 0.45, mix: 0.05, y: [0.15, 0.85], weight: 2.5 },
      { type: 'paperBand', colors: ['accent', 'grass', 'sky'], mix: 0.55, y: [0.22, 0.8], height: [0.18, 0.28], cover: 0.35, weight: 2.5 },
      { type: 'wash', colors: ['accent', 'grass', 'sky'], alpha: 0.38, size: [0.5, 0.72], weight: 1.5 },
      { type: 'deco', deco: { type: 'route', color: 'caramel', width: 4, dash: 14, pinColor: 'red' }, weight: 1 },
      { type: 'deco', deco: { type: 'fenceBorder', color: 'wood', height: 100, post: 30, gap: 20 }, weight: 0.8 }
    ],
    bigPerSpread: [1, 2],
    tones: ['accent', 'grass', 'sky'],
    small: [
      { type: 'sticker', names: STICKERS, scales: SCALES, size: [230, 340], rotate: 14, weight: 5 },
      { type: 'note', images: ['noteGrid', 'noteBone'], size: [250, 310], clip: 'clip', clipChance: 0.45, text: ['pool', 'place'], font: { glyph: 'caveat', family: 'serif', size: 50, color: 'text' }, weight: 1.3 },
      { type: 'luggageTag', size: [240, 290], paper: 'white', band: 'accent', weight: 0.5 },
      { type: 'passport', size: [170, 200], count: [1, 2], colors: ['caramel', 'sky'], weight: 0.4 },
      { type: 'doodle', weight: 0.6 }
    ],
    // 照片占得越少，装饰越多
    smallByCoverage: [[0.35, [5, 6]], [0.55, [3, 4]], [1, [2, 3]]],
    smallPerSpread: [3, 4],
    // 贴纸分主题：狗狗 / 狗狗小物 / 出游中的狗狗
    stickerGroups: [DOGS, TOYS, TRAVEL],
    anchorChance: 0.6,
    pageTypes: ['body']
  },
  // 偏好：叠压、圆形框、留白小图、满版出血、跨中缝
  layoutWeights: {
    'b-OV-L1B': 3,
    'b-P1S-OV': 3,
    'b-CI-L1': 2.5,
    'b-L1S-L1': 2,
    'b-H1L-L1': 2,
    'b-FB-P1S': 2,
    'b-XL': 2,
    'b-XR': 2,
    'b-SB': 1.5
  }
}
