// 正文页面组件：先按「左页」设计（外侧 = 左边留白大，内侧 = 右边靠近中缝留白小），
// 右页用 mirror() 左右镜像得到。坐标用基准 px（单页 1080×1440）书写，便于阅读，输出 0–1 比例
//
// 左页版心：x 96 ~ 1008（外侧 96、内侧 72，大于中缝 40），y 96 ~ 1320
// 例外：满版组件 F 上、下、外侧出血，内侧仍保留 72，不进入中缝

const PAGE_W = 1080
const PAGE_H = 1440

function round4(v) {
  return Math.round(v * 10000) / 10000
}

// 一个照片框（px → 比例）；extra：shape（rect / rounded / circle / ellipse / arch）、mat（自带白边阴影）等
function frame(id, x, y, w, h, orientation, extra) {
  return Object.assign({
    id,
    x: round4(x / PAGE_W),
    y: round4(y / PAGE_H),
    w: round4(w / PAGE_W),
    h: round4(h / PAGE_H),
    orientation,
    radius: 0,
    rotate: 0,
    border: true
  }, extra)
}

// 文字槽（px → 比例）：type 为 headline / kicker 等，y 为基线
function slot(type, x, y, w, align) {
  return { type, x: round4(x / PAGE_W), y: round4(y / PAGE_H), w: round4(w / PAGE_W), align: align || 'left' }
}

// 色块（px → 比例）；color 为风格 colors 的键名或颜色值
function block(x, y, w, h, color) {
  return { x: round4(x / PAGE_W), y: round4(y / PAGE_H), w: round4(w / PAGE_W), h: round4(h / PAGE_H), color }
}

// 左右镜像：左页组件 → 右页（照片框、文字槽、色块都镜像，文字左右对齐互换）
function mirror(frames) {
  return frames.map(f => Object.assign({}, f, { x: round4(1 - f.x - f.w) }))
}
function mirrorPage(page) {
  const swap = { left: 'right', right: 'left', center: 'center' }
  return {
    frames: mirror(page.frames),
    slots: (page.slots || []).map(sl => Object.assign({}, sl, { x: round4(1 - sl.x - sl.w), align: swap[sl.align] || sl.align })),
    blocks: (page.blocks || []).map(b => Object.assign({}, b, { x: round4(1 - b.x - b.w) }))
  }
}

// 组件可以返回照片框数组，或 { frames, slots, blocks }
function normalize(part) {
  return Array.isArray(part) ? { frames: part, slots: [], blocks: [] } : Object.assign({ slots: [], blocks: [] }, part)
}

// 各组件：p 为照片框 id 前缀（左页 'L'、右页 'R'），返回左页坐标的照片框
//
// 设计原则：不总是居中。用「大小对比」「贴边对齐」「错落」「留白」制造节奏：
// - 版心：外侧 96、内侧 72、上 96、下 120（下边距略大，书籍常用比例），照片间距 40
// - 同一跨页左右两页尽量对齐到共同的上沿 / 下沿，让错落看起来是有意的
const parts = {
  // ---- 一张 ----
  // 横图居中（912×608）
  L1: p => [frame(`${p}1`, 96, 404, 912, 608, 'landscape')],
  // 横图贴上沿，下方留白
  L1T: p => [frame(`${p}1`, 96, 96, 912, 608, 'landscape')],
  // 较窄横图贴外侧和下沿（720×480）
  L1B: p => [frame(`${p}1`, 96, 840, 720, 480, 'landscape')],
  // 小横图靠内侧上方（560×373），大面积留白；下方留白处有标题槽（风格定义了才显示）
  L1S: p => ({
    frames: [frame(`${p}1`, 448, 200, 560, 373, 'landscape')],
    slots: [slot('headline', 96, 1000, 880), slot('kicker', 96, 1070, 880)]
  }),
  // 竖图居中（816×1088）
  P1: p => [frame(`${p}1`, 144, 164, 816, 1088, 'portrait')],
  // 竖图贴外侧和下沿（600×800）
  P1O: p => [frame(`${p}1`, 96, 520, 600, 800, 'portrait')],
  // 小竖图靠内侧上方（420×560）；下方留白处有标题槽（风格定义了才显示）
  P1S: p => ({
    frames: [frame(`${p}1`, 588, 240, 420, 560, 'portrait')],
    slots: [slot('headline', 96, 1040, 880), slot('kicker', 96, 1110, 880)]
  }),
  // 满版：上、下、外侧出血铺满，内侧保留 72 不进中缝（1008×1440）
  F: p => [frame(`${p}1`, 0, 0, 1008, 1440, 'portrait')],

  // ---- 两张 ----
  // 两张横图上下等分（各 912×592）
  L2: p => [
    frame(`${p}1`, 96, 96, 912, 592, 'landscape'),
    frame(`${p}2`, 96, 728, 912, 592, 'landscape')
  ],
  // 一大一小：上方大横图，下方小横图靠内侧
  L2D: p => [
    frame(`${p}1`, 96, 96, 912, 608, 'landscape'),
    frame(`${p}2`, 488, 744, 520, 347, 'landscape')
  ],
  // 两张竖图并排（各 436×581）
  P2: p => [
    frame(`${p}1`, 96, 418, 436, 581, 'portrait'),
    frame(`${p}2`, 572, 418, 436, 581, 'portrait')
  ],
  // 两张竖图错落：外侧一张偏上，内侧一张偏下
  P2S: p => [
    frame(`${p}1`, 96, 160, 436, 581, 'portrait'),
    frame(`${p}2`, 572, 600, 436, 581, 'portrait')
  ],

  // ---- 三张 ----
  // 上一张横图 + 下两张竖图
  M3: p => [
    frame(`${p}1`, 96, 96, 912, 560, 'landscape'),
    frame(`${p}2`, 96, 696, 436, 624, 'portrait'),
    frame(`${p}3`, 572, 696, 436, 624, 'portrait')
  ],
  // 三张横图竖排一列，贴外侧（各 600×381），内侧留白
  T3: p => [
    frame(`${p}1`, 96, 96, 600, 381, 'landscape'),
    frame(`${p}2`, 96, 517, 600, 381, 'landscape'),
    frame(`${p}3`, 96, 938, 600, 381, 'landscape')
  ],

  // ---- 四张 ----
  // 横图四宫格（各 436×327，4:3）
  G4L: p => [
    frame(`${p}1`, 96, 361, 436, 327, 'landscape'),
    frame(`${p}2`, 572, 361, 436, 327, 'landscape'),
    frame(`${p}3`, 96, 728, 436, 327, 'landscape'),
    frame(`${p}4`, 572, 728, 436, 327, 'landscape')
  ],
  // 竖图四宫格（各 436×581）
  G4P: p => [
    frame(`${p}1`, 96, 107, 436, 581, 'portrait'),
    frame(`${p}2`, 572, 107, 436, 581, 'portrait'),
    frame(`${p}3`, 96, 728, 436, 581, 'portrait'),
    frame(`${p}4`, 572, 728, 436, 581, 'portrait')
  ],

  // ---- 阶段 6 新组件 ----
  // 满版出血：铺满整页（含靠中缝一侧）
  FB: p => [frame(`${p}1`, 0, 0, 1080, 1440, 'portrait')],

  // 小横图 + 大留白 + 标题槽：标题在上方留白，照片贴外侧下沿
  H1L: p => ({
    frames: [frame(`${p}1`, 96, 947, 560, 373, 'landscape')],
    slots: [slot('headline', 96, 430, 880), slot('kicker', 96, 500, 880)]
  }),

  // 小竖图 + 大留白 + 标题槽：照片在内侧上方，标题在下方留白
  H1P: p => ({
    frames: [frame(`${p}1`, 588, 160, 420, 560, 'portrait')],
    slots: [slot('headline', 96, 1060, 880), slot('kicker', 96, 1130, 880)]
  }),

  // 密集网格 2×3（各 436×370）
  G6: p => [0, 1, 2].reduce((all, row) => all.concat([
    frame(`${p}${row * 2 + 1}`, 96, 113 + row * 410, 436, 370, 'landscape'),
    frame(`${p}${row * 2 + 2}`, 572, 113 + row * 410, 436, 370, 'landscape')
  ]), []),

  // 密集：上一张大横图 + 下 2×2（共 5 张）
  G5: p => [
    frame(`${p}1`, 96, 96, 912, 512, 'landscape'),
    frame(`${p}2`, 96, 648, 436, 306, 'landscape'),
    frame(`${p}3`, 572, 648, 436, 306, 'landscape'),
    frame(`${p}4`, 96, 994, 436, 306, 'landscape'),
    frame(`${p}5`, 572, 994, 436, 306, 'landscape')
  ],

  // 大头贴四格条：白色纸条上竖排 4 张小方图，贴外侧
  ST: p => ({
    frames: [0, 1, 2, 3].map(i => frame(`${p}${i + 1}`, 116, 170 + i * 280, 260, 260, 'square', { border: false })),
    blocks: [block(96, 150, 300, 1140, '#FFFFFF')]
  }),

  // 叠压：大横图在后，带白边阴影的竖图叠在右下
  OV: p => [
    frame(`${p}1`, 96, 200, 760, 507, 'landscape'),
    frame(`${p}2`, 600, 560, 400, 533, 'portrait', { mat: { border: 14, color: '#FFFFFF', shadow: true } })
  ],

  // 圆形框
  CI: p => [frame(`${p}1`, 200, 300, 680, 680, 'square', { shape: 'circle' })],

  // 拱形框
  AR: p => [frame(`${p}1`, 240, 280, 600, 820, 'portrait', { shape: 'arch' })],

  // 双餐盘：一大一小两个圆形框错落摆放（美食餐桌）
  PL: p => [
    frame(`${p}1`, 96, 150, 600, 600, 'square', { shape: 'circle' }),
    frame(`${p}2`, 588, 800, 420, 420, 'square', { shape: 'circle' })
  ]
}

/**
 * 用两个组件组成一个左右成对的正文跨页版式
 * @param autoWeight 自动排版时的出现权重：1 普通，越小越少出现，0 不参与自动排版
 */
/**
 * 用两个组件组成一个左右成对的正文跨页版式
 * @param autoWeight 自动排版时的出现权重：1 普通，越小越少出现，0 不参与自动排版
 * @param density    dense 密集 / normal 普通 / airy 留白，用于版式节奏
 */
function pair(left, right, name, autoWeight = 1, density = 'normal') {
  const l = normalize(parts[left]('L'))
  const r = mirrorPage(normalize(parts[right]('R')))
  return {
    id: `b-${left}-${right}`,
    name,
    pageType: 'body',
    span: 'pair',
    capacity: l.frames.length + r.frames.length,
    autoWeight,
    density,
    pages: [
      { frames: l.frames, slots: l.slots, blocks: l.blocks, texts: [] },
      { frames: r.frames, slots: r.slots, blocks: r.blocks, texts: [] }
    ]
  }
}

/**
 * 跨页版式：照片框坐标相对跨页 2160×1440（px），可以多个框（如跨中缝 + 小图）
 * @param frames [{ x, y, w, h, orientation, shape }]
 */
function spread(id, name, frames, autoWeight, density = 'normal') {
  return {
    id,
    name,
    pageType: 'body',
    span: 'spread',
    capacity: frames.length,
    autoWeight,
    density,
    pages: [
      {
        frames: frames.map((f, i) => Object.assign({
          id: `S${i + 1}`,
          x: round4(f.x / (PAGE_W * 2)),
          y: round4(f.y / PAGE_H),
          w: round4(f.w / (PAGE_W * 2)),
          h: round4(f.h / PAGE_H),
          orientation: f.orientation || 'landscape',
          radius: 0,
          rotate: 0,
          border: true
        }, f.shape ? { shape: f.shape } : {})),
        texts: []
      }
    ]
  }
}

module.exports = { parts, frame, slot, block, mirror, pair, spread, PAGE_W, PAGE_H }
