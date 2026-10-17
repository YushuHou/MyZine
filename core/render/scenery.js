// 程序生成的场景剪影：山脉、树林、海浪、城市天际线、丘陵
// 按跨页 id 生成，2–3 层由浅到深（远淡近浓），颜色从风格配色混出低饱和的浅色
// 剪影按整个跨页（2160 基准 px 宽）生成，左右页各画自己那一半，跨过中缝是连续的
const { hashRandom } = require('./frames')
const { mix, desaturate } = require('./color')

const KINDS = ['mountains', 'forest', 'waves', 'skyline', 'hills']
const PAGE_W = 1080
const PAGE_H = 1440

// 可重复的伪随机序列（mulberry32），种子来自字符串
function rng(key) {
  let a = Math.floor(hashRandom(key) * 4294967296) >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 轮廓：返回 x（基准 px，跨页坐标）→ 高度 0–1 的函数
const PROFILES = {
  // 山脉：中点位移，折线峰顶；近处的层更粗糙
  mountains(r, width, k) {
    const n = 128
    const pts = new Array(n + 1)
    pts[0] = r()
    pts[n] = r()
    let step = n
    let amp = 0.9
    while (step > 1) {
      const half = step / 2
      for (let i = half; i < n; i += step) pts[i] = (pts[i - half] + pts[i + half]) / 2 + (r() * 2 - 1) * amp
      amp *= 0.5 + k * 0.04
      step = half
    }
    return normalized(pts, width)
  },
  // 丘陵：几段长波叠加，起伏平缓
  hills(r, width) {
    const waves = [0, 1, 2].map(i => ({ l: 700 + r() * 900 / (i + 1), p: r() * Math.PI * 2, a: 1 / (i + 1) }))
    return sampled(width, x => waves.reduce((s, w) => s + w.a * Math.sin(x / w.l * Math.PI * 2 + w.p), 0))
  },
  // 海浪：较短的正弦波 + 一点次级波动
  waves(r, width, k) {
    const l = 180 + r() * 120 - k * 20
    const p = r() * Math.PI * 2
    const l2 = l * (2.3 + r())
    return sampled(width, x => Math.sin(x / l * Math.PI * 2 + p) + 0.35 * Math.sin(x / l2 * Math.PI * 2 + p * 1.7))
  }
}

// 采样后归一化到 0–1，返回插值函数
function sampled(width, fn) {
  const n = 160
  const pts = []
  for (let i = 0; i <= n; i++) pts.push(fn(width * i / n))
  return normalized(pts, width)
}

function normalized(pts, width) {
  const min = Math.min.apply(null, pts)
  const max = Math.max.apply(null, pts)
  const span = max - min || 1
  const v = pts.map(p => (p - min) / span)
  const n = v.length - 1
  return x => {
    const t = Math.max(0, Math.min(n, x / width * n))
    const i = Math.min(n - 1, Math.floor(t))
    return v[i] + (v[i + 1] - v[i]) * (t - i)
  }
}

/**
 * 画场景剪影（在当前页坐标系中）
 * @param cfg   { kinds, layers: [2, 3], color（风格颜色键，默认 accent）, mix: [远, 中, 近]（向底色混合的比例）,
 *               desaturate（0–1）, height: [最小, 最大]（占页高的比例） }
 * @param spec  装饰计划给出的 { kind, layers, height（页高比例） }
 * @param page  页对象（side 决定画跨页的哪一半）
 * @param bg    本页底色（混色用）
 * @param spreadW 跨页宽（基准 px）：左右页 / 跨页大图为 2160，单页为 1080
 */
function drawScenery(ctx, style, cfg, spec, page, W, H, unit, bg, spreadW) {
  const kind = spec.kind
  const n = spec.layers
  const base = (cfg.color && style.colors[cfg.color]) || cfg.color || style.colors.accent
  const mixes = cfg.mix || [0.8, 0.65, 0.5]
  // 本页在跨页中的起点（基准 px）
  const x0 = page.side === 'right' ? PAGE_W : 0
  const pageW = page.side === 'full' ? PAGE_W * 2 : PAGE_W
  const hb = spec.height * PAGE_H
  ctx.save()
  ctx.scale(unit, unit)
  ctx.translate(-x0, 0)
  for (let k = 0; k < n; k++) {
    // 只有两层时用远、近两档颜色
    const m = mixes[n === 2 ? (k === 0 ? 0 : 2) : k]
    const color = desaturate(mix(base, bg, m), cfg.desaturate == null ? 0.35 : cfg.desaturate)
    const r = rng(`${page.spreadId || ''}:scenery:${kind}:${k}`)
    // 远处的层更高、近处的层更矮
    const top = PAGE_H - hb * (1 - k * (kind === 'waves' ? 0.3 : 0.24))
    const layer = { r, k, n, top, hb, x0, x1: x0 + pageW, spreadW, color, bg }
    ctx.fillStyle = color
    if (kind === 'forest') drawForest(ctx, layer)
    else if (kind === 'skyline') drawSkyline(ctx, layer)
    else drawProfile(ctx, layer, kind)
  }
  ctx.restore()
}

// 山、丘陵、海浪：轮廓线以下填满
function drawProfile(ctx, L, kind) {
  const profile = PROFILES[kind](L.r, L.spreadW, L.k)
  const amp = kind === 'waves' ? L.hb * 0.12 : kind === 'hills' ? L.hb * 0.45 : L.hb * (0.7 - L.k * 0.08)
  const ground = L.top + amp
  const yAt = x => ground - profile(x) * amp
  ctx.beginPath()
  ctx.moveTo(L.x0 - 10, PAGE_H + 10)
  for (let x = L.x0 - 10; x <= L.x1 + 10; x += 8) ctx.lineTo(x, yAt(x))
  ctx.lineTo(L.x1 + 10, PAGE_H + 10)
  ctx.closePath()
  ctx.fill()
  // 海浪：最近一层加一道浪花白边
  if (kind === 'waves' && L.k === L.n - 1) {
    ctx.strokeStyle = mix(L.bg, '#FFFFFF', 0.5)
    ctx.lineWidth = 4
    ctx.beginPath()
    for (let x = L.x0 - 10; x <= L.x1 + 10; x += 8) {
      const y = yAt(x) + 10
      if (x === L.x0 - 10) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

// 树林：起伏的地面 + 一排松树 / 圆冠树，远处的树更小更密
function drawForest(ctx, L) {
  const ground = PROFILES.hills(L.r, L.spreadW)
  const amp = L.hb * 0.18
  const gy = x => L.top + L.hb * 0.55 - ground(x) * amp
  ctx.beginPath()
  ctx.moveTo(L.x0 - 10, PAGE_H + 10)
  for (let x = L.x0 - 10; x <= L.x1 + 10; x += 10) ctx.lineTo(x, gy(x))
  ctx.lineTo(L.x1 + 10, PAGE_H + 10)
  ctx.closePath()
  ctx.fill()
  const scale = 0.6 + L.k * 0.22
  // 从跨页左端开始按随机间距种树（保证左右页一致），只画落在本页范围内的
  for (let x = -40; x < L.spreadW + 40;) {
    const h = L.hb * (0.32 + L.r() * 0.3) * scale
    const round = L.r() < 0.28
    const wid = h * (round ? 0.55 : 0.42)
    const step = wid * (0.55 + L.r() * 0.6)
    if (x + wid > L.x0 - 10 && x - wid < L.x1 + 10) {
      const by = gy(x) + 4
      if (round) {
        ctx.fillRect(x - h * 0.04, by - h * 0.4, h * 0.08, h * 0.4)
        ctx.beginPath()
        ctx.arc(x, by - h * 0.62, wid / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // 松树：三层叠起的三角形
        ctx.beginPath()
        for (let t = 0; t < 3; t++) {
          const ty = by - h * (0.12 + t * 0.26)
          const tw = wid * (1 - t * 0.22) / 2
          ctx.moveTo(x - tw, ty)
          ctx.lineTo(x, ty - h * 0.42)
          ctx.lineTo(x + tw, ty)
          ctx.closePath()
        }
        ctx.fill()
        ctx.fillRect(x - h * 0.03, by - h * 0.14, h * 0.06, h * 0.14)
      }
    }
    x += step
  }
}

// 城市天际线：高低不一的楼，偶有尖顶、山墙、阶梯顶、天线
function drawSkyline(ctx, L) {
  // 远处的楼更高（从近楼后面露出来）、更窄
  const scale = 1 - L.k * 0.24
  const groundY = PAGE_H + 10
  for (let x = -20; x < L.spreadW + 20;) {
    const w = (40 + L.r() * 90) * (L.k === 0 ? 0.8 : 1)
    const h = L.hb * (0.25 + L.r() * 0.6) * scale
    const roof = L.r()
    const extra = L.r()
    if (x + w > L.x0 - 10 && x < L.x1 + 10) {
      const top = PAGE_H - h
      ctx.beginPath()
      ctx.rect(x, top, w + 1, groundY - top)
      if (roof < 0.12) {
        // 尖顶
        ctx.moveTo(x + w * 0.3, top)
        ctx.lineTo(x + w * 0.5, top - h * 0.35)
        ctx.lineTo(x + w * 0.7, top)
      } else if (roof < 0.27) {
        // 山墙（人字顶）
        ctx.moveTo(x, top)
        ctx.lineTo(x + w / 2, top - w * 0.4)
        ctx.lineTo(x + w, top)
      } else if (roof < 0.42) {
        // 阶梯顶
        ctx.rect(x + w * 0.15, top - h * 0.1, w * 0.7, h * 0.1 + 1)
        ctx.rect(x + w * 0.32, top - h * 0.18, w * 0.36, h * 0.08 + 1)
      } else if (roof < 0.5) {
        // 圆顶
        ctx.moveTo(x + w * 0.8, top)
        ctx.arc(x + w / 2, top, w * 0.3, 0, Math.PI, true)
      }
      ctx.fill()
      if (extra < 0.15) ctx.fillRect(x + w * 0.6, top - h * 0.25, 3, h * 0.25)
    }
    // 楼间偶尔留一点空隙
    x += w + (L.r() < 0.3 ? 6 + L.r() * 20 : 0)
  }
}

module.exports = { KINDS, drawScenery }
