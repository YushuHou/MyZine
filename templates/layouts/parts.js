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

// 一个照片框（px → 比例）
function frame(id, x, y, w, h, orientation) {
  return {
    id,
    x: round4(x / PAGE_W),
    y: round4(y / PAGE_H),
    w: round4(w / PAGE_W),
    h: round4(h / PAGE_H),
    orientation,
    radius: 0,
    rotate: 0,
    border: true
  }
}

// 左右镜像：左页组件 → 右页
function mirror(frames) {
  return frames.map(f => Object.assign({}, f, { x: round4(1 - f.x - f.w) }))
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
  // 小横图靠内侧上方（560×373），大面积留白
  L1S: p => [frame(`${p}1`, 448, 200, 560, 373, 'landscape')],
  // 竖图居中（816×1088）
  P1: p => [frame(`${p}1`, 144, 164, 816, 1088, 'portrait')],
  // 竖图贴外侧和下沿（600×800）
  P1O: p => [frame(`${p}1`, 96, 520, 600, 800, 'portrait')],
  // 小竖图靠内侧上方（420×560）
  P1S: p => [frame(`${p}1`, 588, 240, 420, 560, 'portrait')],
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
  ]
}

/**
 * 用两个组件组成一个左右成对的正文跨页版式
 * @param autoWeight 自动排版时的出现权重：1 普通，越小越少出现，0 不参与自动排版
 */
function pair(left, right, name, autoWeight = 1) {
  const leftFrames = parts[left]('L')
  const rightFrames = mirror(parts[right]('R'))
  return {
    id: `b-${left}-${right}`,
    name,
    pageType: 'body',
    span: 'pair',
    capacity: leftFrames.length + rightFrames.length,
    autoWeight,
    pages: [
      { frames: leftFrames, texts: [] },
      { frames: rightFrames, texts: [] }
    ]
  }
}

/**
 * 跨页大图版式：照片框坐标相对跨页 2160×1440（px）
 */
function spread(id, name, x, y, w, h, autoWeight) {
  return {
    id,
    name,
    pageType: 'body',
    span: 'spread',
    capacity: 1,
    autoWeight,
    pages: [
      {
        frames: [{
          id: 'S1',
          x: round4(x / (PAGE_W * 2)),
          y: round4(y / PAGE_H),
          w: round4(w / (PAGE_W * 2)),
          h: round4(h / PAGE_H),
          orientation: 'landscape',
          radius: 0,
          rotate: 0,
          border: true
        }],
        texts: []
      }
    ]
  }
}

module.exports = { parts, frame, mirror, pair, spread, PAGE_W, PAGE_H }
