// 代码生成的纹理：颗粒（透明底噪点）、纸张（米色纸面）。整个小程序每种只生成一次，渲染时平铺
// 不依赖图片素材：真机验证中，画布和文件接口都无法读取分包里的图片，因此纹理改为代码生成
const { exportCanvas } = require('../export/canvasFile')

// 固定种子的伪随机数，保证每次生成的纹理一样（缩略图缓存、导出结果稳定）
function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

// 跨边的元素在对边再画一次，保证平铺无缝
function wrapped(N, fn) {
  for (const ox of [-N, 0, N]) {
    for (const oy of [-N, 0, N]) fn(ox, oy)
  }
}

// 颗粒：透明底，亮暗噪点
function drawGrain(ctx, N) {
  const rnd = seededRandom(20261017)
  ctx.clearRect(0, 0, N, N)
  for (let i = 0; i < 14000; i++) {
    const light = rnd() < 0.5
    const alpha = 0.25 + rnd() * 0.5
    ctx.fillStyle = light ? `rgba(255,255,255,${alpha})` : `rgba(0,0,0,${alpha})`
    const size = rnd() < 0.85 ? 1 : 2
    ctx.fillRect(Math.floor(rnd() * N), Math.floor(rnd() * N), size, size)
  }
}

// 纸张：米色底 + 大块明暗 + 细噪点 + 纤维
function drawPaper(ctx, N) {
  const rnd = seededRandom(1017)
  ctx.fillStyle = '#F2E9D9'
  ctx.fillRect(0, 0, N, N)
  // 大块明暗：柔和的径向渐变
  for (let i = 0; i < 14; i++) {
    const x = rnd() * N
    const y = rnd() * N
    const r = N * (0.22 + rnd() * 0.22)
    const dark = rnd() < 0.5
    const alpha = 0.012 + rnd() * 0.014
    wrapped(N, (ox, oy) => {
      const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, r)
      g.addColorStop(0, dark ? `rgba(150,120,80,${alpha})` : `rgba(255,252,244,${alpha * 1.6})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(x + ox - r, y + oy - r, r * 2, r * 2)
    })
  }
  // 细噪点
  for (let i = 0; i < 26000; i++) {
    const dark = rnd() < 0.5
    ctx.fillStyle = dark ? `rgba(120,95,60,${0.05 + rnd() * 0.08})` : `rgba(255,255,250,${0.08 + rnd() * 0.12})`
    ctx.fillRect(Math.floor(rnd() * N), Math.floor(rnd() * N), 1, 1)
  }
  // 纤维：短而略弯的细线
  ctx.lineWidth = 1
  for (let i = 0; i < 420; i++) {
    const x = rnd() * N
    const y = rnd() * N
    const len = 10 + rnd() * 24
    const angle = (rnd() - 0.5) * 1.4
    const bend = (rnd() - 0.5) * 6
    const dark = rnd() < 0.5
    ctx.strokeStyle = dark ? `rgba(130,105,70,${0.10 + rnd() * 0.10})` : `rgba(255,255,248,${0.25 + rnd() * 0.2})`
    const x2 = x + len * Math.cos(angle)
    const y2 = y + len * Math.sin(angle)
    wrapped(N, (ox, oy) => {
      ctx.beginPath()
      ctx.moveTo(x + ox, y + oy)
      ctx.quadraticCurveTo((x + x2) / 2 + ox, (y + y2) / 2 + bend + oy, x2 + ox, y2 + oy)
      ctx.stroke()
    })
  }
}

// 牛皮纸：棕黄底 + 深浅纤维 + 噪点
function drawKraft(ctx, N) {
  const rnd = seededRandom(7070)
  ctx.fillStyle = '#C9A57A'
  ctx.fillRect(0, 0, N, N)
  for (let i = 0; i < 22000; i++) {
    const dark = rnd() < 0.55
    ctx.fillStyle = dark ? `rgba(90,60,30,${0.06 + rnd() * 0.08})` : `rgba(255,235,200,${0.06 + rnd() * 0.1})`
    ctx.fillRect(Math.floor(rnd() * N), Math.floor(rnd() * N), 1 + Math.floor(rnd() * 2), 1)
  }
  ctx.lineWidth = 1
  for (let i = 0; i < 520; i++) {
    const x = rnd() * N
    const y = rnd() * N
    const len = 8 + rnd() * 22
    const a = (rnd() - 0.5) * 0.8
    const dark = rnd() < 0.6
    ctx.strokeStyle = dark ? `rgba(100,70,35,${0.15 + rnd() * 0.15})` : `rgba(240,215,170,${0.2 + rnd() * 0.2})`
    wrapped(N, (ox, oy) => {
      ctx.beginPath()
      ctx.moveTo(x + ox, y + oy)
      ctx.lineTo(x + ox + len * Math.cos(a), y + oy + len * Math.sin(a))
      ctx.stroke()
    })
  }
}

// 报纸：浅灰新闻纸 + 噪点 + 极淡的「文字行」（短横线排成的行），像印刷背透
function drawNewsprint(ctx, N) {
  const rnd = seededRandom(1888)
  ctx.fillStyle = '#E7E4DC'
  ctx.fillRect(0, 0, N, N)
  for (let i = 0; i < 16000; i++) {
    ctx.fillStyle = rnd() < 0.6 ? `rgba(60,60,60,${0.04 + rnd() * 0.05})` : `rgba(255,255,255,${0.1 + rnd() * 0.1})`
    ctx.fillRect(Math.floor(rnd() * N), Math.floor(rnd() * N), 1, 1)
  }
  // 两栏文字行（平铺后连续）
  const lineH = 9
  ctx.fillStyle = 'rgba(40,40,40,0.06)'
  for (let col = 0; col < 2; col++) {
    const x0 = col * N / 2 + 10
    const colW = N / 2 - 20
    for (let y = 6; y < N; y += lineH) {
      let x = x0
      while (x < x0 + colW) {
        const w = 6 + rnd() * 26
        ctx.fillRect(x, y, Math.min(w, x0 + colW - x), 3)
        x += w + 4
      }
    }
  }
}

// 纹理定义：生成函数、边长（px）、导出格式（需要透明用 png）
const TEXTURES = {
  grain: { draw: drawGrain, size: 256, fileType: 'png' },
  paper: { draw: drawPaper, size: 512, fileType: 'jpg' },
  kraft: { draw: drawKraft, size: 512, fileType: 'jpg' },
  newsprint: { draw: drawNewsprint, size: 512, fileType: 'jpg' }
}

const cache = {}

async function generate(name) {
  const def = TEXTURES[name]
  const canvas = wx.createOffscreenCanvas({ type: '2d', width: def.size, height: def.size })
  def.draw(canvas.getContext('2d'), def.size)
  return exportCanvas(canvas, def.size, def.size, 0.9, def.fileType)
}

// 返回纹理图片路径；未知纹理或生成失败时返回 ''（不画纹理，不影响其他内容）
function getTexturePath(name) {
  if (!TEXTURES[name]) return Promise.resolve('')
  if (!cache[name]) {
    cache[name] = generate(name).catch(err => {
      console.warn('生成纹理失败', name, err)
      delete cache[name]
      return ''
    })
  }
  return cache[name]
}

// 纹理原始边长（px），平铺时默认按此尺寸换算
function textureSize(name) {
  return TEXTURES[name] ? TEXTURES[name].size : 256
}

module.exports = { getTexturePath, textureSize, drawPaper, drawGrain, drawKraft, drawNewsprint }
