// 主题风格：城市漫游（阶段 8h，第七套使用图片素材的模板）
// 冷调素描纸纹 + 雾蓝灰 / 砖红 / 暖黄灯光；城市速写风贴纸（细墨线 + 淡水彩）：建筑、交通、城市生活小物，围着照片成组；
// 黑白斜纹、城市地图、透明纸胶带；方格便签、车票卡片；城市天际线剪影、撕纸色带、水彩晕染、虚线路线；
// 复用其他模板的元素：天际线剪影、护照章、行李吊牌、邮戳（票根邮戳）、虚线路线和定位针（公路旅行）、邮票（大海沙滩）
// 素材在 pkg-city 分包，由 scripts/packs/city.json 生成
const BUILDINGS = ['tower', 'cafe', 'clockTower', 'bridge', 'brownstone', 'subway']
const TRANSIT = ['tram', 'taxi', 'bus', 'bike', 'streetLamp', 'trafficLight']
const DAILY = ['coffee', 'croissant', 'camera', 'umbrella', 'sneakers', 'groceryBag']
const STICKERS = BUILDINGS.concat(TRANSIT, DAILY)
// 生活小物比建筑、车辆小一些
const SCALES = { coffee: 0.72, croissant: 0.72, camera: 0.75, sneakers: 0.8, groceryBag: 0.85, streetLamp: 0.9, trafficLight: 0.85 }

module.exports = {
  id: 'city',
  name: '城市漫游',
  group: 'theme',
  description: '城市速写、电车咖啡和车票卡片，在街头慢慢走',
  tags: ['city-night', 'architecture', 'food', 'couple'],
  assetsPackage: null,
  // 图片素材分包（见 core/render/assetPacks.js）
  assetPack: 'city',
  colors: {
    background: '#EEEFF0',
    text: '#2B2F36',
    textMuted: '#80868F',
    accent: '#5D7590',
    brick: '#B4553F',
    lamp: '#E3B655',
    ink: '#3A3F47',
    // 护照章、邮戳、吊牌等
    red: '#B4553F',
    blue: '#3F5874',
    stampFill: '#E5EAF0',
    postmark: 'rgba(43, 47, 54, 0.7)',
    endpaper: '#DADFE5',
    placeholder: '#E1E3E6',
    fitFill: '#FFFFFF'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 84, lineHeight: 1.25, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.4, color: 'accent' },
    body: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.7, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 24, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  // 西文标题：整本书不重复（有标题槽的跨页才用掉一个）
  wordPool: [
    'City Walk', 'Next Stop', 'Downtown', 'Street Corner', 'Coffee & Streets', 'Urban Diary',
    'Lost in the City', 'Metro Days', 'City Lights', 'Hello City', 'Window Seat', 'Rainy Streets',
    'Golden Hour', 'Side Streets', 'One Way', 'Little Cafe', 'Skyline', 'Wander More', 'Block by Block', 'After Dark'
  ],
  // 便签纸、车票卡片上的短句：整本书不重复
  stripPool: [
    'next stop', 'coffee first', 'city walk', 'one more block', 'lost & found', 'take the tram',
    'window seat', 'street snacks', 'rainy day', 'golden hour', 'night lights', 'just wander',
    'left at the corner', 'see you downtown', 'metro ride', 'people watching', 'map not needed', 'city mood'
  ],
  decoText: {
    // 封面问候语：第一行 MZ Playfair 字形，第二行地点；无地点时写 City Walk
    greeting: {
      lines: [
        { text: 'Walking in', ifMissing: { var: 'location', text: 'City Walk' }, font: { glyph: 'playfair', family: 'serif', size: 64, color: '#FFFFFF' } },
        { text: '{location}', font: { family: 'serif', weight: 'bold', size: 84, color: '#FFFFFF' } }
      ],
      lineGap: 112,
      shadow: true
    },
    // 城市风格用衬线标题更有杂志感
    headline: { text: '{word}', font: { glyph: 'playfair', family: 'serif', size: 104, color: 'ink' }, minScale: 0.5 },
    kicker: { text: '{location} · {date}', font: { glyph: 'oswald', family: 'sans-serif', size: 22, letterSpacing: 5, uppercase: true, color: 'brick' } }
  },
  pageNumber: { show: true, glyph: 'oswald', family: 'sans-serif', size: 26, color: 'textMuted', bottom: 60, format: 'pad2' },
  // 冷调素描纸纹平铺（素材分包加载失败时显示纯色）
  background: { type: 'image', src: 'pack:paper', repeat: 'tile', tile: 640, color: '#EEEFF0' },
  photoFrame: {
    borderWidth: 14,
    borderColor: '#FFFFFF',
    radius: 0,
    shadow: { color: 'rgba(30, 35, 45, 0.2)', blur: 16, offsetX: 0, offsetY: 5 },
    rotateJitter: 1.5,
    torn: { chance: 0.35, minArea: 0.16, depth: 20, jag: 7, fiber: 9, shadow: { color: 'rgba(30, 35, 45, 0.2)', blur: 10, offsetX: 0, offsetY: 3 } }
  },
  // 本页最大照片上的点睛装饰：每跨页二选一（邮票邮戳 / 照片角贴纸），只在一页上
  frameAccents: { postal: 1, sticker: 1.6 },
  frameDecorations: [
    // 真实纸胶带：黑白斜纹、城市地图、透明
    { type: 'tape', images: ['tapeStripe', 'tapeMap', 'tapeClear'], alphas: { tapeClear: 0.72 }, colors: ['rgba(93, 117, 144, 0.6)'], width: 220, height: 56, placement: 'top', angleJitter: 8 },
    // 邮票里是城市建筑，邮戳写地点和日期
    { type: 'stamp', accent: 'postal', largestOnly: true, minWidth: 380, w: 140, h: 170, inset: 26, fill: 'stampFill', stickers: ['clockTower', 'tower', 'cafe', 'tram', 'bus', 'subway'] },
    { type: 'postmark', accent: 'postal', largestOnly: true, minWidth: 380, r: 92, color: 'postmark', font: { glyph: 'oswald', family: 'sans-serif', letterSpacing: 1.5, uppercase: true } },
    // 本页最大的照片角上压一张贴纸
    { type: 'frameSticker', accent: 'sticker', names: STICKERS, scales: SCALES, size: [240, 310], rotate: 10, corners: ['top-right', 'bottom-left', 'bottom-right'] }
  ],
  decorations: [],
  // 细线稿：箭头、定位针、星星，只在装饰多的跨页里点缀
  doodles: { names: ['arrow', 'pin', 'star'], size: [70, 100], colors: ['ink', 'brick'], lineWidth: 3, rotate: 12, pageTypes: ['body'] },
  ornaments: {
    // 大装饰：城市天际线剪影（票根邮戳）/ 撕纸色带 / 水彩晕染 / 虚线路线（公路旅行）
    big: [
      { type: 'scenery', kinds: ['skyline'], layers: [2, 3], color: 'accent', mix: [0.84, 0.74, 0.64], desaturate: 0.2, height: [0.14, 0.24], weight: 2.5 },
      { type: 'paperBand', colors: ['accent', 'lamp'], mix: 0.6, y: [0.22, 0.8], height: [0.18, 0.28], cover: 0.35, weight: 2.5 },
      { type: 'wash', colors: ['accent', 'lamp'], alpha: 0.32, size: [0.5, 0.72], weight: 1.2 },
      { type: 'deco', deco: { type: 'route', color: 'brick', width: 4, dash: 14, pinColor: 'brick' }, weight: 1.2 }
    ],
    bigPerSpread: [1, 2],
    // 雾蓝灰为主，暖黄偶尔出现；砖红做大面积色带会偏粉，只用在路线、印章、吊牌等小点缀上
    tones: ['accent', 'accent', 'lamp'],
    small: [
      // 建筑、路灯这类细高的贴纸按长边缩放后显得窄，整体尺寸比其他主题大一些
      { type: 'sticker', names: STICKERS, scales: SCALES, size: [270, 390], rotate: 10, weight: 5 },
      // 车票卡片和方格便签（车票卡片上写短句或地点日期）
      { type: 'note', images: ['noteGrid', 'ticket'], size: [250, 320], clip: 'clip', clipChance: 0.4, text: ['pool', 'place'], font: { glyph: 'caveat', family: 'serif', size: 48, color: 'ink' }, weight: 1.3 },
      { type: 'passport', size: [170, 200], count: [1, 2], colors: ['blue', 'brick'], weight: 0.8 },
      { type: 'luggageTag', size: [240, 290], paper: 'white', band: 'brick', weight: 0.5 },
      { type: 'doodle', weight: 0.5 }
    ],
    // 照片占得越少，装饰越多
    smallByCoverage: [[0.35, [5, 6]], [0.55, [3, 4]], [1, [2, 3]]],
    smallPerSpread: [3, 4],
    // 贴纸分主题：城市建筑 / 城市交通 / 城市生活小物
    stickerGroups: [BUILDINGS, TRANSIT, DAILY],
    anchorChance: 0.6,
    pageTypes: ['body']
  },
  // 偏好：满版出血、跨中缝、标题 + 小图（杂志感）、叠压
  layoutWeights: {
    'b-FB-P1S': 2.5,
    'b-FB-H1L': 2.5,
    'b-SB': 2,
    'b-XL': 2,
    'b-XR': 2,
    'b-H1L-L1': 2,
    'b-L1S-L1': 2,
    'b-OV-L1B': 2,
    'b-P2S-L1': 1.5
  }
}
