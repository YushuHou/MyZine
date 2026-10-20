// 主题风格：山野湖光（阶段 8i，第八套使用图片素材的模板；并入原「自然风光」）
// 淡绿米白水彩纸纹 + 松绿 / 湖蓝 / 暖阳橙；水彩山水（雪山、湖边码头、松树、红枫、瀑布）、露营徒步装备和林间生灵（小鹿、松鼠、翠鸟……）围着照片成组；
// 绿格纹、叶子、牛皮纸纸胶带；浅绿方格便签、树叶便签；山峦松林剪影、撕纸色带、水彩晕染；
// 沿用原自然风光：山峦 / 树林 / 丘陵剪影、拱形照片偏好、细线页眉、Playfair 衬线标题、国家公园式护照章、方印；
// 复用其他模板：邮票 + 邮戳（大海沙滩）、虚线路线和定位针（公路旅行，像徒步路线）
// 素材在 pkg-mountain 分包，由 scripts/packs/mountain.json 生成
const LANDSCAPE = ['peak', 'dock', 'pine', 'maple', 'waterfall', 'mossRock']
const CAMPING = ['tent', 'campfire', 'boots', 'backpack', 'compass', 'mug']
const WILDLIFE = ['fawn', 'squirrel', 'kingfisher', 'wildflowers', 'mushrooms', 'butterfly']
const STICKERS = LANDSCAPE.concat(CAMPING, WILDLIFE)
// 小物件比山水小一些
const SCALES = { compass: 0.7, mug: 0.72, boots: 0.8, butterfly: 0.7, mushrooms: 0.8, campfire: 0.85 }

module.exports = {
  id: 'mountain',
  name: '山野湖光',
  group: 'theme',
  description: '水彩雪山湖泊、露营装备和林间小鹿，山野的空气',
  tags: ['nature', 'road-trip', 'family'],
  assetsPackage: null,
  // 图片素材分包（见 core/render/assetPacks.js）
  assetPack: 'mountain',
  colors: {
    background: '#F2F3E6',
    text: '#2F4A3A',
    textMuted: '#7D8C80',
    accent: '#4E7A5E',
    lake: '#5F93B0',
    sun: '#E39A4E',
    leaf: '#6E9A6B',
    // 印章、邮戳等
    red: '#B9573F',
    stampFill: '#E6EEE3',
    postmark: 'rgba(47, 74, 58, 0.7)',
    endpaper: '#DDE6DA',
    placeholder: '#E1E3D8',
    fitFill: '#FBFAF5'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 86, lineHeight: 1.25, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.4, color: 'accent' },
    body: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.7, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 24, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  // 装饰词池（沿用自然风光）：整本书不重复（有标题槽的跨页才用掉一个）
  wordPool: [
    'Into the Wild', 'Fresh Air', 'Mountains Calling', 'Trail Notes', 'Wild & Free', 'Green Days',
    'Under the Sky', 'Wild Places', 'Take a Hike', 'Forest Bathing', 'Summit Day', 'River Song',
    'Pine & Stone', 'Open Sky', 'Valley Light', 'Into the Woods', 'Morning Mist', 'Wildflowers',
    'High Country', 'Earth & Sky', 'Lake Days', 'Campfire Stories'
  ],
  // 便签纸上的短句：整本书不重复
  stripPool: [
    'fresh air', 'trail notes', 'summit day', 'lake swim', 'campfire night', 'pine & stone',
    'wild & free', 'morning mist', 'off the grid', 'trail mix time', 'happy camper', 'leave no trace',
    'mountain time', 'by the lake', 'stars tonight', 'muddy boots', 'take a hike', 'deep breath'
  ],
  decoText: {
    // 封面问候语：第一行 MZ Playfair 字形，第二行地点；无地点时写 Into the Wild
    greeting: {
      lines: [
        { text: 'Wandering in', ifMissing: { var: 'location', text: 'Into the Wild' }, font: { glyph: 'playfair', family: 'serif', size: 64, color: '#FFFFFF' } },
        { text: '{location}', font: { family: 'serif', weight: 'bold', size: 84, color: '#FFFFFF' } }
      ],
      lineGap: 112,
      shadow: true
    },
    headline: { text: '{word}', font: { glyph: 'playfair', family: 'serif', size: 108, color: 'text' }, minScale: 0.5 },
    kicker: { text: '{location} · {month} {year}', font: { glyph: 'playfair', family: 'serif', size: 24, letterSpacing: 4, uppercase: true, color: 'accent' } },
    runningHeader: {
      text: '{location} · {date}',
      font: { glyph: 'playfair', family: 'serif', size: 22, letterSpacing: 2, color: 'textMuted' },
      line: { color: 'leaf', width: 1 },
      y: 58,
      pageTypes: ['body']
    }
  },
  pageNumber: { show: true, glyph: 'playfair', family: 'serif', size: 24, color: 'accent', bottom: 60, format: 'pad2' },
  // 淡绿米白水彩纸纹平铺（素材分包加载失败时显示纯色）
  background: { type: 'image', src: 'pack:paper', repeat: 'tile', tile: 640, color: '#F2F3E6' },
  photoFrame: {
    borderWidth: 14,
    borderColor: '#FBFAF5',
    radius: 0,
    shadow: { color: 'rgba(47, 74, 58, 0.18)', blur: 14, offsetX: 0, offsetY: 4 },
    rotateJitter: 1.5,
    torn: { chance: 0.35, minArea: 0.16, depth: 20, jag: 7, fiber: 9, shadow: { color: 'rgba(47, 74, 58, 0.18)', blur: 10, offsetX: 0, offsetY: 3 } }
  },
  // 本页最大照片上的点睛装饰：每跨页二选一（邮票邮戳 / 照片角贴纸），只在一页上
  frameAccents: { postal: 1, sticker: 1.6 },
  frameDecorations: [
    // 真实纸胶带：绿格纹、叶子、牛皮纸
    { type: 'tape', images: ['tapeGingham', 'tapeLeaf', 'tapeKraft'], colors: ['rgba(78, 122, 94, 0.6)'], width: 220, height: 56, placement: 'top', angleJitter: 8 },
    // 邮票里是山水和林间生灵，邮戳写地点和日期
    { type: 'stamp', accent: 'postal', largestOnly: true, minWidth: 380, w: 140, h: 170, inset: 26, fill: 'stampFill', stickers: ['peak', 'pine', 'fawn', 'kingfisher', 'maple', 'tent'] },
    { type: 'postmark', accent: 'postal', largestOnly: true, minWidth: 380, r: 92, color: 'postmark', font: { glyph: 'oswald', family: 'sans-serif', letterSpacing: 1.5, uppercase: true } },
    // 本页最大的照片角上压一张贴纸
    { type: 'frameSticker', accent: 'sticker', names: STICKERS, scales: SCALES, size: [220, 290], rotate: 12, corners: ['top-right', 'bottom-left', 'bottom-right'] }
  ],
  decorations: [],
  // 细线稿（沿用自然风光）：山、松树、枝叶、太阳、云朵，只在装饰多的跨页里点缀
  doodles: { names: ['mountain', 'branch', 'sun', 'cloud'], size: [80, 110], colors: ['accent', 'lake'], lineWidth: 3.5, rotate: 8, pageTypes: ['body'] },
  ornaments: {
    // 大装饰：山峦松林剪影（自然风光）/ 撕纸色带 / 水彩晕染 / 徒步虚线路线（公路旅行）
    big: [
      { type: 'scenery', kinds: ['mountains', 'forest', 'hills'], layers: [2, 3], color: 'accent', mix: [0.82, 0.68, 0.54], desaturate: 0.3, height: [0.14, 0.24], weight: 2.5 },
      { type: 'paperBand', colors: ['accent', 'lake', 'sun'], mix: 0.55, y: [0.22, 0.8], height: [0.18, 0.28], cover: 0.35, weight: 2.5 },
      { type: 'wash', colors: ['accent', 'lake', 'sun'], alpha: 0.36, size: [0.5, 0.72], weight: 1.5 },
      { type: 'deco', deco: { type: 'route', color: 'sun', width: 4, dash: 14, pinColor: 'red' }, weight: 1 }
    ],
    bigPerSpread: [1, 2],
    // 松绿、湖蓝为主，暖阳橙偶尔出现
    tones: ['accent', 'lake', 'lake', 'sun'],
    small: [
      { type: 'sticker', names: STICKERS, scales: SCALES, size: [260, 370], rotate: 12, weight: 5 },
      { type: 'note', images: ['noteGrid', 'noteLeaf'], size: [250, 310], clip: 'clip', clipChance: 0.4, text: ['pool', 'place'], font: { glyph: 'caveat', family: 'serif', size: 48, color: 'text' }, weight: 1.3 },
      // 国家公园式护照章、地点方印（沿用自然风光）
      { type: 'passport', size: [170, 200], count: [1, 2], colors: ['accent', '#7A6A4F'], weight: 0.8 },
      { type: 'seal', size: [120, 150], weight: 0.5 },
      { type: 'doodle', weight: 0.6 }
    ],
    // 照片占得越少，装饰越多
    smallByCoverage: [[0.35, [5, 6]], [0.55, [3, 4]], [1, [2, 3]]],
    smallPerSpread: [3, 4],
    // 贴纸分主题：山水 / 露营徒步 / 林间生灵
    stickerGroups: [LANDSCAPE, CAMPING, WILDLIFE],
    anchorChance: 0.6,
    pageTypes: ['body']
  },
  // 偏好（沿用自然风光）：拱形、满版、留白
  layoutWeights: {
    'b-AR-L1B': 3.5,
    'b-L1T-AR': 3.5,
    'b-FB-P1S': 2.5,
    'b-SB': 2,
    'b-SP': 1.5,
    'b-H1L-L1': 2,
    'b-L1S-L1': 2,
    'b-OV-L1B': 2,
    'b-XL': 1.5
  }
}
