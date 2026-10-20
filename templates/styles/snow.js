// 主题风格：冬日雪国（阶段 8c，第二套使用图片素材的模板）
// 冷白水彩纸纹 + 冰川蓝 / 松针绿 / 莓果红；水彩贴纸（雪人、毛线帽、小木屋、小狐狸、冰灯……）围着照片成组；
// 格纹、雪花、透明纸胶带；方格纸和牛皮纸便签；飘雪、跨中缝撕纸色带、水彩晕染、远山松林剪影；
// 复用其他模板的元素：邮票 + 邮戳（大海沙滩）、护照章和行李吊牌（票根邮戳）、红色方印（人文建筑）、山峦松林剪影（自然风光）
// 素材在 pkg-snow 分包，由 scripts/packs/snow.json 生成
const COZY = ['snowman', 'beanie', 'mittens', 'cocoa', 'scarf', 'tanghulu']
const OUTDOOR = ['pine', 'cabin', 'sled', 'skis', 'snowflake', 'lamppost']
const JOURNEY = ['fox', 'bullfinch', 'iceCastle', 'onsen', 'train', 'postbox']
const STICKERS = COZY.concat(OUTDOOR, JOURNEY)

module.exports = {
  id: 'snow',
  name: '冬日雪国',
  group: 'theme',
  description: '水彩雪人、毛线帽和小木屋，飘雪的冬日旅行',
  tags: ['nature', 'family', 'couple', 'road-trip'],
  assetsPackage: null,
  // 图片素材分包（见 core/render/assetPacks.js）
  assetPack: 'snow',
  colors: {
    background: '#F2F5F8',
    text: '#2E3F52',
    textMuted: '#8193A3',
    accent: '#6F93B3',
    pine: '#4F7565',
    berry: '#B8434A',
    // 方印、邮戳等
    red: '#B8434A',
    blue: '#3D5A80',
    stampFill: '#E6EEF4',
    postmark: 'rgba(46, 63, 82, 0.72)',
    endpaper: '#DDE6EE',
    placeholder: '#E3E8EC',
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
    'Hello Winter', 'Snow Day', 'Let It Snow', 'Winter Wonderland', 'Frosty Mornings', 'Cozy Days',
    'First Snow', 'Warm Wishes', 'Into the Snow', 'White Silence', 'Hot Cocoa', 'Winter Tales',
    'Snow Globe', 'Ice & Light', 'Snowy Roads', 'Fireside', 'Breath of Frost', 'Cold Hands, Warm Heart',
    'Snowbound', 'Winter Walk'
  ],
  // 便签纸上的短句：整本书不重复
  stripPool: [
    'let it snow', 'snow day', 'hot cocoa time', 'frozen toes', 'winter mood', 'first snow',
    'cozy & warm', 'snowball fight', 'stay warm', 'white world', 'sweet tanghulu', 'under the snow',
    'winter walk', 'fluffy flakes', 'warm hands', 'into the woods', 'frosty air', 'next stop: snow'
  ],
  decoText: {
    // 封面问候语：第一行 MZ Playfair 字形，第二行地点；无地点时写 Hello Winter
    greeting: {
      lines: [
        { text: 'Winter in', ifMissing: { var: 'location', text: 'Hello Winter' }, font: { glyph: 'playfair', family: 'serif', size: 64, color: '#FFFFFF' } },
        { text: '{location}', font: { family: 'serif', weight: 'bold', size: 84, color: '#FFFFFF' } }
      ],
      lineGap: 112,
      shadow: true
    },
    headline: { text: '{word}', font: { glyph: 'caveat', family: 'serif', size: 124, color: 'accent' }, minScale: 0.5 },
    kicker: { text: '{location} · {date}', font: { glyph: 'playfair', family: 'serif', size: 22, letterSpacing: 4, uppercase: true, color: 'textMuted' } }
  },
  pageNumber: { show: true, glyph: 'caveat', family: 'serif', size: 36, color: 'accent', bottom: 62 },
  // 冷白水彩纸纹平铺（素材分包加载失败时显示纯色）
  background: { type: 'image', src: 'pack:paper', repeat: 'tile', tile: 640, color: '#F2F5F8' },
  photoFrame: {
    borderWidth: 16,
    borderColor: '#FFFFFF',
    radius: 0,
    shadow: { color: 'rgba(40, 60, 80, 0.2)', blur: 16, offsetX: 0, offsetY: 5 },
    rotateJitter: 2,
    // 撕纸边：面积够大的照片约三成多撕一两条边
    torn: { chance: 0.36, minArea: 0.16, depth: 20, jag: 7, fiber: 9, shadow: { color: 'rgba(40, 60, 80, 0.2)', blur: 10, offsetX: 0, offsetY: 3 } }
  },
  // 本页最大照片上的点睛装饰：每跨页二选一（邮票邮戳 / 照片角贴纸），只在一页上
  frameAccents: { postal: 1, sticker: 1.6 },
  frameDecorations: [
    // 真实纸胶带：格纹、雪花、透明（透明胶带单独调低不透明度）
    { type: 'tape', images: ['tapeGingham', 'tapeSnow', 'tapeClear'], alphas: { tapeClear: 0.72 }, colors: ['rgba(111, 147, 179, 0.7)'], width: 220, height: 56, placement: 'top', angleJitter: 8 },
    // 明信片：邮票里是水彩贴纸，邮戳写地点和日期
    { type: 'stamp', accent: 'postal', largestOnly: true, minWidth: 380, w: 140, h: 170, inset: 26, fill: 'stampFill', stickers: ['snowflake', 'fox', 'bullfinch', 'pine', 'iceCastle', 'lamppost', 'snowman'] },
    { type: 'postmark', accent: 'postal', largestOnly: true, minWidth: 380, r: 92, color: 'postmark', font: { glyph: 'oswald', family: 'sans-serif', letterSpacing: 1.5, uppercase: true } },
    // 本页最大的照片角上压一张贴纸
    { type: 'frameSticker', accent: 'sticker', names: STICKERS, size: [210, 280], rotate: 14, corners: ['top-right', 'bottom-left', 'bottom-right'] }
  ],
  decorations: [],
  // 细线稿：只在装饰多的跨页里少量点缀
  doodles: { names: ['sparkle', 'star', 'pine'], size: [70, 100], colors: ['accent', 'berry'], lineWidth: 3.5, rotate: 15, pageTypes: ['body'] },
  ornaments: {
    // 大装饰：跨中缝撕纸色带 / 飘雪 / 水彩晕染 / 远山松林剪影，颜色取跨页主色调
    big: [
      { type: 'paperBand', colors: ['accent', 'pine'], mix: 0.55, y: [0.22, 0.8], height: [0.18, 0.28], cover: 0.35, weight: 3 },
      { type: 'snowfall', density: 70, flakes: 0.1, size: [5, 14], weight: 2.5 },
      { type: 'wash', colors: ['accent', 'pine'], alpha: 0.4, size: [0.5, 0.72], weight: 1.5 },
      { type: 'scenery', kinds: ['mountains', 'forest'], layers: [2, 3], color: 'accent', mix: [0.86, 0.74, 0.62], desaturate: 0.2, height: [0.14, 0.24], weight: 1.5 }
    ],
    bigPerSpread: [1, 2],
    // 冰川蓝为主，松针绿偶尔出现；莓果红只用在贴纸、方印、吊牌等小点缀上（做大面积色带会偏粉）
    tones: ['accent', 'accent', 'pine'],
    small: [
      { type: 'sticker', names: STICKERS, size: [230, 340], rotate: 14, weight: 5 },
      { type: 'note', images: ['noteGrid', 'noteKraft'], size: [250, 310], clip: 'clip', clipChance: 0.5, text: ['pool', 'place'], font: { glyph: 'caveat', family: 'serif', size: 50, color: 'text' }, weight: 1.2 },
      { type: 'seal', size: [120, 150], weight: 0.6 },
      { type: 'passport', size: [170, 200], count: [1, 2], colors: ['accent', 'berry'], weight: 0.5 },
      { type: 'luggageTag', size: [240, 290], paper: 'white', band: 'berry', weight: 0.5 },
      { type: 'doodle', weight: 0.5 }
    ],
    // 照片占得越少，装饰越多
    smallByCoverage: [[0.35, [5, 6]], [0.55, [3, 4]], [1, [2, 3]]],
    smallPerSpread: [3, 4],
    // 贴纸分主题：暖暖的小物 / 雪地户外 / 旅途风物
    stickerGroups: [COZY, OUTDOOR, JOURNEY],
    anchorChance: 0.6,
    pageTypes: ['body']
  },
  // 偏好：叠压、留白小图、满版出血、跨中缝、拱形框（像木屋窗户）
  layoutWeights: {
    'b-OV-L1B': 3,
    'b-P1S-OV': 3,
    'b-FB-P1S': 2.5,
    'b-FB-H1L': 2.5,
    'b-L1S-L1': 2,
    'b-H1L-L1': 2,
    'b-AR-L1B': 2,
    'b-L1T-AR': 2,
    'b-XL': 2,
    'b-XR': 2,
    'b-SB': 1.5
  }
}
