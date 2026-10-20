// 主题风格：大海沙滩（阶段 8a 起，第一套使用图片素材的模板；8b 并入原「海边明信片」）
// 奶油色水彩纸纹 + 雾蓝 / 海水青 / 珊瑚橘；水彩模切贴纸（海鸥、贝壳、灯塔……）围着照片成组；
// 真实纸胶带、撕边便签纸和燕尾夹；部分大图撕纸边；跨中缝的撕纸色带和水彩晕染把左右页连成一体；
// 明信片元素：邮票（里面是水彩贴纸）+ 邮戳、航空信封斜条、护照章、行李吊牌、封面「Greetings from {location}」
// 素材在 pkg-beach 分包，由 scripts/packs/beach.json 生成
const SEA_LIFE = ['seagull', 'gulls', 'scallop', 'starfish', 'conch', 'wave']
const BEACH_DAY = ['umbrella', 'lifebuoy', 'strawHat', 'flipflops', 'bucket', 'icecream', 'surfboard']
const HARBOR = ['sailboat', 'rowboat', 'lighthouse', 'palm']
const STICKERS = SEA_LIFE.concat(BEACH_DAY, HARBOR)

module.exports = {
  id: 'beach',
  name: '大海沙滩',
  group: 'theme',
  description: '水彩贴纸、纸胶带、邮票和撕边照片，夏天海边的手账',
  tags: ['beach', 'nature', 'couple', 'family'],
  assetsPackage: null,
  // 图片素材分包（见 core/render/assetPacks.js）
  assetPack: 'beach',
  colors: {
    background: '#F4ECDF',
    text: '#2D4356',
    textMuted: '#7D8C96',
    accent: '#5E8FB0',
    coral: '#E08E6D',
    teal: '#5E9C9A',
    // 明信片元素
    red: '#C8423B',
    blue: '#2B5C8A',
    stampFill: '#E3EEF2',
    postmark: 'rgba(45, 67, 86, 0.72)',
    endpaper: '#DCE6EA',
    placeholder: '#E8DDCB',
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
    'Ocean Air', 'Salt & Sun', 'Sandy Toes', 'Sea Breeze', 'Low Tide', 'Hello Summer', 'Seaside Days',
    'Blue Hours', 'Wish You Were Here', 'Sun Kissed', 'Shell Seekers', 'High Tide', 'Wave Hello', 'Salty Hair',
    'Endless Summer', 'Golden Hour', 'Coastal Days', 'Island Time', 'Sea You Soon', 'Vitamin Sea',
    'Postcard Days', 'Blue Horizon', 'Hello from the Sea', 'Tidal Notes'
  ],
  // 便签纸上的短句：整本书不重复
  stripPool: [
    'sea you soon', 'salty & happy', 'beach day', 'good vibes only', 'sun, sand, smiles', 'tide pools',
    'ice cream break', 'barefoot', 'waves all day', 'take me back', 'happy place', 'golden hour',
    'shell hunting', 'ocean mood', 'seagull friends', 'summer forever', 'just breathe', 'lazy afternoon',
    'wish you were here', 'postcard weather'
  ],
  decoText: {
    // 封面问候语（原海边明信片）：第一行 MZ Playfair 字形，第二行地点用较大的系统衬线字；无地点时只写 Greetings
    greeting: {
      lines: [
        { text: 'Greetings from', ifMissing: { var: 'location', text: 'Greetings' }, font: { glyph: 'playfair', family: 'serif', size: 64, color: '#FFFFFF' } },
        { text: '{location}', font: { family: 'serif', weight: 'bold', size: 84, color: '#FFFFFF' } }
      ],
      lineGap: 112,
      shadow: true
    },
    headline: { text: '{word}', font: { glyph: 'caveat', family: 'serif', size: 124, color: 'accent' }, minScale: 0.5 },
    kicker: { text: '{location} · {date}', font: { glyph: 'playfair', family: 'serif', size: 22, letterSpacing: 4, uppercase: true, color: 'textMuted' } }
  },
  pageNumber: { show: true, glyph: 'caveat', family: 'serif', size: 36, color: 'accent', bottom: 62 },
  // 水彩纸纹平铺（素材分包加载失败时显示纯色）
  background: { type: 'image', src: 'pack:paper', repeat: 'tile', tile: 640, color: '#F4ECDF' },
  photoFrame: {
    borderWidth: 16,
    borderColor: '#FFFFFF',
    radius: 0,
    shadow: { color: 'rgba(60, 45, 30, 0.2)', blur: 16, offsetX: 0, offsetY: 5 },
    rotateJitter: 2,
    // 撕纸边：面积够大的照片约四成撕一两条边（满版照片撕不贴页边的一侧）
    torn: { chance: 0.42, minArea: 0.16, depth: 20, jag: 7, fiber: 9 }
  },
  // 本页最大照片上的点睛装饰：每跨页二选一（邮票邮戳 / 照片角贴纸），只在一页上
  frameAccents: { postal: 1, sticker: 1.6 },
  frameDecorations: [
    // 真实纸胶带：顶边一条（图片缺失时退回 colors 的代码胶带）
    { type: 'tape', images: ['tapeStripe', 'tapeDot', 'tapePlain'], colors: ['rgba(126, 157, 181, 0.75)'], width: 220, height: 56, placement: 'top', angleJitter: 8 },
    // 明信片：邮票里是水彩贴纸，邮戳写地点和日期（太小的照片不贴）
    { type: 'stamp', accent: 'postal', largestOnly: true, minWidth: 380, w: 140, h: 170, inset: 26, fill: 'stampFill', stickers: ['seagull', 'lighthouse', 'sailboat', 'palm', 'scallop', 'starfish', 'conch'] },
    { type: 'postmark', accent: 'postal', largestOnly: true, minWidth: 380, r: 92, color: 'postmark', font: { glyph: 'oswald', family: 'sans-serif', letterSpacing: 1.5, uppercase: true } },
    // 本页最大的照片角上压一张贴纸
    { type: 'frameSticker', accent: 'sticker', names: STICKERS, size: [210, 280], rotate: 14, corners: ['top-right', 'bottom-left', 'bottom-right'] }
  ],
  decorations: [
    // 航空信封红蓝斜条：封面始终有
    { type: 'airmailBorder', colors: ['red', 'blue'], width: 22, stripe: 28, pageTypes: ['cover'] }
  ],
  // 细线稿：只在装饰多的跨页里少量点缀
  doodles: { names: ['wave', 'sun', 'sparkle'], size: [70, 100], colors: ['accent', 'coral'], lineWidth: 3.5, rotate: 15, pageTypes: ['body'] },
  ornaments: {
    // 大装饰：跨中缝的撕纸色带 / 水彩晕染 / 航空信封斜条，颜色取跨页主色调
    big: [
      { type: 'paperBand', colors: ['accent', 'teal', 'coral'], mix: 0.5, y: [0.22, 0.8], height: [0.18, 0.28], cover: 0.35, weight: 3 },
      { type: 'wash', colors: ['accent', 'teal', 'coral'], alpha: 0.42, size: [0.5, 0.72], weight: 2 },
      { type: 'deco', deco: { type: 'airmailBorder', colors: ['red', 'blue'], width: 22, stripe: 28 }, weight: 0.5 }
    ],
    // 约一半跨页同时有色带和晕染
    bigPerSpread: [1, 2],
    tones: ['accent', 'teal', 'coral'],
    small: [
      { type: 'sticker', names: STICKERS, size: [230, 340], rotate: 14, weight: 5 },
      { type: 'note', images: ['noteGrid', 'noteLined'], size: [250, 310], clip: 'clip', clipChance: 0.5, text: ['pool', 'place'], font: { glyph: 'caveat', family: 'serif', size: 50, color: 'text' }, weight: 1.2 },
      { type: 'passport', size: [170, 200], count: [1, 2], colors: ['accent', 'coral'], weight: 0.6 },
      { type: 'luggageTag', size: [240, 290], paper: 'white', band: 'coral', weight: 0.5 },
      { type: 'doodle', weight: 0.6 }
    ],
    // 照片占得越少，装饰越多
    smallByCoverage: [[0.35, [5, 6]], [0.55, [3, 4]], [1, [2, 3]]],
    smallPerSpread: [3, 4],
    // 贴纸分主题：每个跨页先从一组里挑，讲一个小故事
    stickerGroups: [SEA_LIFE, BEACH_DAY, HARBOR],
    // 约六成的贴纸贴在照片角上，和照片组成一组
    anchorChance: 0.6,
    pageTypes: ['body']
  },
  // 偏好：叠压、留白小图、满版出血、跨中缝、圆形框
  layoutWeights: {
    'b-OV-L1B': 3,
    'b-P1S-OV': 3,
    'b-FB-P1S': 2.5,
    'b-FB-H1L': 2.5,
    'b-L1S-L1': 2,
    'b-H1L-L1': 2,
    'b-CI-L1': 2,
    'b-XL': 2,
    'b-XR': 2,
    'b-SB': 1.5
  }
}
