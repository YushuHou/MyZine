// 轻量 SVG 路径解析与绘制：支持 M/L/H/V/C/S/Q/T/A/Z（含小写相对坐标）
// 解析结果统一成绝对坐标的 M / L / C / Q / Z，可缓存后反复绘制（线稿、字形共用）

// 把路径字符串拆成命令和数字
function tokenize(d) {
  const tokens = []
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)/g
  let m
  while ((m = re.exec(d))) tokens.push(m[1] || parseFloat(m[2]))
  return tokens
}

// SVG 椭圆弧 → 若干段三次贝塞尔（端点参数化 → 中心参数化，每段不超过 90°）
function arcToBeziers(x1, y1, rx, ry, angle, largeArc, sweep, x2, y2) {
  if (rx === 0 || ry === 0) return [[x1, y1, x2, y2, x2, y2]]
  const phi = angle * Math.PI / 180
  const cos = Math.cos(phi)
  const sin = Math.sin(phi)
  const dx = (x1 - x2) / 2
  const dy = (y1 - y2) / 2
  const x1p = cos * dx + sin * dy
  const y1p = -sin * dx + cos * dy
  rx = Math.abs(rx)
  ry = Math.abs(ry)
  const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
  if (lambda > 1) {
    rx *= Math.sqrt(lambda)
    ry *= Math.sqrt(lambda)
  }
  const sign = largeArc === sweep ? -1 : 1
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
  const coef = sign * Math.sqrt(Math.max(0, num / den))
  const cxp = coef * (rx * y1p / ry)
  const cyp = coef * -(ry * x1p / rx)
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2
  const vecAngle = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy)
  const theta1 = vecAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry)
  let delta = vecAngle((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry)
  if (!sweep && delta > 0) delta -= 2 * Math.PI
  if (sweep && delta < 0) delta += 2 * Math.PI
  const segments = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2)))
  const step = delta / segments
  const k = 4 / 3 * Math.tan(step / 4)
  // 单位圆上的点 (ux, uy) → 椭圆上的点（缩放、旋转、平移）
  const map = (ux, uy) => {
    const ex = rx * ux
    const ey = ry * uy
    return [cos * ex - sin * ey + cx, sin * ex + cos * ey + cy]
  }
  const curves = []
  let t = theta1
  for (let i = 0; i < segments; i++) {
    const t2 = t + step
    const c1 = map(Math.cos(t) - k * Math.sin(t), Math.sin(t) + k * Math.cos(t))
    const c2 = map(Math.cos(t2) + k * Math.sin(t2), Math.sin(t2) - k * Math.cos(t2))
    const p = map(Math.cos(t2), Math.sin(t2))
    curves.push([c1[0], c1[1], c2[0], c2[1], p[0], p[1]])
    t = t2
  }
  return curves
}

/**
 * 解析路径字符串
 * @returns [['M', x, y], ['L', x, y], ['C', x1, y1, x2, y2, x, y], ['Q', x1, y1, x, y], ['Z']]
 */
function parsePath(d) {
  const t = tokenize(d)
  const ops = []
  let i = 0
  let cmd = ''
  let x = 0
  let y = 0
  let sx = 0
  let sy = 0
  // 上一段的控制点（S / T 反射用）
  let lastC = null
  let lastQ = null
  const num = () => t[i++]
  while (i < t.length) {
    if (typeof t[i] === 'string') cmd = t[i++]
    const rel = cmd === cmd.toLowerCase()
    const C = cmd.toUpperCase()
    let ox = rel ? x : 0
    let oy = rel ? y : 0
    switch (C) {
      case 'M':
        x = num() + ox
        y = num() + oy
        sx = x
        sy = y
        ops.push(['M', x, y])
        // M 后面跟的多组坐标视为 L
        cmd = rel ? 'l' : 'L'
        lastC = lastQ = null
        break
      case 'L':
        x = num() + ox
        y = num() + oy
        ops.push(['L', x, y])
        lastC = lastQ = null
        break
      case 'H':
        x = num() + (rel ? x : 0)
        ops.push(['L', x, y])
        lastC = lastQ = null
        break
      case 'V':
        y = num() + (rel ? y : 0)
        ops.push(['L', x, y])
        lastC = lastQ = null
        break
      case 'C': {
        const x1 = num() + ox
        const y1 = num() + oy
        const x2 = num() + ox
        const y2 = num() + oy
        x = num() + ox
        y = num() + oy
        ops.push(['C', x1, y1, x2, y2, x, y])
        lastC = [x2, y2]
        lastQ = null
        break
      }
      case 'S': {
        const x1 = lastC ? 2 * x - lastC[0] : x
        const y1 = lastC ? 2 * y - lastC[1] : y
        const x2 = num() + ox
        const y2 = num() + oy
        x = num() + ox
        y = num() + oy
        ops.push(['C', x1, y1, x2, y2, x, y])
        lastC = [x2, y2]
        lastQ = null
        break
      }
      case 'Q': {
        const x1 = num() + ox
        const y1 = num() + oy
        x = num() + ox
        y = num() + oy
        ops.push(['Q', x1, y1, x, y])
        lastQ = [x1, y1]
        lastC = null
        break
      }
      case 'T': {
        const x1 = lastQ ? 2 * x - lastQ[0] : x
        const y1 = lastQ ? 2 * y - lastQ[1] : y
        x = num() + ox
        y = num() + oy
        ops.push(['Q', x1, y1, x, y])
        lastQ = [x1, y1]
        lastC = null
        break
      }
      case 'A': {
        const rx = num()
        const ry = num()
        const rot = num()
        const large = num()
        const sweep = num()
        const nx = num() + ox
        const ny = num() + oy
        arcToBeziers(x, y, rx, ry, rot, large, sweep, nx, ny).forEach(c => ops.push(['C'].concat(c)))
        x = nx
        y = ny
        lastC = lastQ = null
        break
      }
      case 'Z':
        ops.push(['Z'])
        x = sx
        y = sy
        lastC = lastQ = null
        break
      default:
        // 无法识别：跳过一个记号，避免死循环
        i++
    }
  }
  return ops
}

// 把解析结果描到画布当前路径上（调用方负责 beginPath 和 fill / stroke）
function tracePath(ctx, ops) {
  for (let i = 0; i < ops.length; i++) {
    const o = ops[i]
    switch (o[0]) {
      case 'M': ctx.moveTo(o[1], o[2]); break
      case 'L': ctx.lineTo(o[1], o[2]); break
      case 'C': ctx.bezierCurveTo(o[1], o[2], o[3], o[4], o[5], o[6]); break
      case 'Q': ctx.quadraticCurveTo(o[1], o[2], o[3], o[4]); break
      case 'Z': ctx.closePath(); break
      default: break
    }
  }
}

// 解析缓存：同一路径字符串只解析一次
const cache = {}
function getPathOps(d) {
  if (!cache[d]) cache[d] = parsePath(d)
  return cache[d]
}

module.exports = { parsePath, tracePath, getPathOps }
