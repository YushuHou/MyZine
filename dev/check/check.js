// 开发验证页（6a-0）：在真机上确认素材方案是否可行，结果显示在页面上，可一键复制
// 1. 主包代码 require.async 加载分包 JS（字体 base64）
// 2. wx.loadFontFace 用 Data URL 注册字体
// 3. 字体在 canvas 2d（页面画布 + 离屏画布）中是否生效：比较同一串文字的宽度，并测试多种 font 写法
// 4. 页面普通文字（webview）是否生效：肉眼看，用来区分「字体数据有问题」还是「画布不认」
// 5. 画布能否加载 Data URL 图片
// 6. 照片滤镜（阶段 7 黑白、港风暖调、日系提亮）：ctx.filter 灰度、saturation 叠灰、screen 提亮、multiply 叠色
//    读取像素颜色自动判断，并画出对比图
const { FONTS, loadFont } = require('./fontFace')
const testImage = require('./testImage.js')

const SAMPLE = 'Hamburgefonstiv 0123'
const CANVAS_H = 360

// 第 2 轮验证：同一字体的几种 ctx.font 写法
const FONT_FORMS = [
  { label: '不带引号', css: fam => `40px ${fam}` },
  { label: '带引号', css: fam => `40px "${fam}"` },
  { label: '完整声明', css: fam => `normal normal 400 40px ${fam}` }
]

function measure(ctx, font) {
  ctx.font = font
  return ctx.measureText(SAMPLE).width
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

Page({
  data: {
    env: '',
    results: [],
    running: false,
    canvasW: 0,
    canvasH: CANVAS_H,
    filterW: 0,
    // 页面普通文字样例
    webFonts: []
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    const win = wx.getWindowInfo ? wx.getWindowInfo() : sys
    this.setData({
      env: `${sys.brand} ${sys.model} · ${sys.system} · 微信 ${sys.version} · 基础库 ${sys.SDKVersion}`,
      canvasW: win.windowWidth - 32,
      filterW: win.windowWidth - 32
    })
  },

  onReady() {
    this.run()
  },

  push(name, ok, detail) {
    this.results.push({ name, ok, detail })
    this.setData({ results: this.results })
  },

  getCanvas() {
    return new Promise(resolve => {
      wx.createSelectorQuery().select('#checkCanvas').fields({ node: true }).exec(res => resolve(res[0] && res[0].node))
    })
  },

  async run() {
    if (this.data.running) return
    this.results = []
    this.setData({ running: true, results: [] })

    // ---- 1、2：加载分包模块并注册字体 ----
    const fonts = []
    for (const key of Object.keys(FONTS)) {
      const t0 = Date.now()
      const r = await loadFont(key)
      fonts.push(r)
      this.push(
        `加载字体 ${r.family}`,
        r.ok,
        r.ok
          ? `require.async + loadFontFace 成功（${Math.round(r.bytes / 1024)}KB，${Date.now() - t0}ms）`
          : `失败于 ${r.step === 'require' ? 'require.async 加载分包模块' : 'wx.loadFontFace 注册'}：${r.error}`
      )
    }
    this.setData({ webFonts: fonts.map(f => f.family) })

    const canvas = await this.getCanvas()
    if (!canvas) {
      this.push('获取画布', false, '找不到 canvas 节点')
      this.setData({ running: false })
      return
    }
    const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio || 2
    canvas.width = Math.round(this.data.canvasW * dpr)
    canvas.height = Math.round(CANVAS_H * dpr)
    const ctx = canvas.getContext('2d')
    const off = wx.createOffscreenCanvas({ type: '2d', width: 800, height: 100 })
    const offCtx = off.getContext('2d')

    // ---- 3：等 0.5 秒测一次，1.5 秒后再测一次（排除生效延迟） ----
    await wait(500)
    const best = this.checkCanvasFonts('0.5 秒', ctx, offCtx, fonts)
    await wait(1000)
    this.checkCanvasFonts('1.5 秒', ctx, offCtx, fonts)

    // 画出来肉眼对比：每种字体用「不带引号」写法一行，最后一行系统衬线体
    ctx.scale(dpr, dpr)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, this.data.canvasW, CANVAS_H)
    ctx.textBaseline = 'middle'
    const rows = fonts.map(f => ({ label: `${f.family}（${best[f.family] || '无生效写法，显示不带引号'}）`, font: (FONT_FORMS.find(x => x.label === best[f.family]) || FONT_FORMS[0]).css(f.family).replace('40px', '30px') }))
      .concat([{ label: '系统 serif（对照）', font: '30px serif' }])
    rows.forEach((row, i) => {
      const y = 30 + i * 62
      ctx.fillStyle = '#8A847A'
      ctx.font = '12px sans-serif'
      ctx.fillText(row.label, 12, y)
      ctx.fillStyle = '#2B2B2B'
      ctx.font = row.font
      ctx.fillText('Good Days 07 · 新西兰', 12, y + 28)
    })

    // ---- 5：Data URL 图片 ----
    await new Promise(resolve => {
      const img = canvas.createImage()
      img.onload = () => {
        ctx.drawImage(img, this.data.canvasW - 76, CANVAS_H - 76, 64, 64)
        this.push('画布加载 Data URL 图片', true, `成功（${img.width}×${img.height}，右下角橙色星形）`)
        resolve()
      }
      img.onerror = err => {
        this.push('画布加载 Data URL 图片', false, (err && (err.errMsg || err.message)) || JSON.stringify(err))
        resolve()
      }
      img.src = testImage
    })

    // ---- 6：照片滤镜（页面画布 + 离屏画布） ----
    await this.checkFilters(dpr)

    this.setData({ running: false })
  },

  // 加载测试图（橙色星形）到指定画布
  loadTestImage(canvas) {
    return new Promise(resolve => {
      const img = canvas.createImage()
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = testImage
    })
  },

  /**
   * 五格对比：原图 / ctx.filter 灰度 / saturation 叠灰 / screen 提亮 / multiply 叠色
   * 每格读取中心像素判断是否生效
   */
  runFilterTiles(ctx, img, k) {
    const T = 56
    const gap = 8
    const px = (x, y) => {
      try {
        const d = ctx.getImageData(Math.round(x * k), Math.round(y * k), 1, 1).data
        return [d[0], d[1], d[2]]
      } catch (err) {
        return null
      }
    }
    const isGray = c => c && Math.abs(c[0] - c[1]) < 12 && Math.abs(c[1] - c[2]) < 12
    const fmt = c => (c ? `rgb(${c.join(',')})` : '无法读取像素')
    const results = []
    const tile = i => i * (T + gap)
    // 0 原图
    ctx.drawImage(img, tile(0), 0, T, T)
    const original = px(tile(0) + T / 2, T / 2)
    // 1 ctx.filter = 'grayscale(1)'
    ctx.save()
    const hasFilter = 'filter' in ctx
    ctx.filter = 'grayscale(1)'
    ctx.drawImage(img, tile(1), 0, T, T)
    ctx.restore()
    const c1 = px(tile(1) + T / 2, T / 2)
    results.push(['黑白方式① ctx.filter = grayscale(1)', isGray(c1), `${hasFilter ? '支持 filter 属性' : '没有 filter 属性'}；中心像素 ${fmt(c1)}（原图 ${fmt(original)}）`])
    // 2 saturation 叠灰
    ctx.drawImage(img, tile(2), 0, T, T)
    ctx.save()
    ctx.beginPath()
    ctx.rect(tile(2), 0, T, T)
    ctx.clip()
    ctx.globalCompositeOperation = 'saturation'
    ctx.fillStyle = '#808080'
    ctx.fillRect(tile(2), 0, T, T)
    ctx.restore()
    const c2 = px(tile(2) + T / 2, T / 2)
    results.push(['黑白方式② saturation 叠灰', isGray(c2), `中心像素 ${fmt(c2)}`])
    // 3 screen 提亮：橙色 + 40% 白色滤色，绿色分量应明显变大
    ctx.fillStyle = '#FF8A2A'
    ctx.fillRect(tile(3), 0, T, T)
    ctx.save()
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
    ctx.fillRect(tile(3), 0, T, T)
    ctx.restore()
    const c3 = px(tile(3) + T / 2, T / 2)
    results.push(['提亮 screen 滤色', !!c3 && c3[1] > 160 && c3[2] > 100, `中心像素 ${fmt(c3)}（未生效约为 rgb(255,138,42)）`])
    // 4 multiply 叠色：橙色 × 灰色，红色分量应明显变小
    ctx.fillStyle = '#FF8A2A'
    ctx.fillRect(tile(4), 0, T, T)
    ctx.save()
    ctx.globalCompositeOperation = 'multiply'
    ctx.fillStyle = '#808080'
    ctx.fillRect(tile(4), 0, T, T)
    ctx.restore()
    const c4 = px(tile(4) + T / 2, T / 2)
    results.push(['叠色 multiply 正片叠底', !!c4 && c4[0] < 170, `中心像素 ${fmt(c4)}（未生效约为 rgb(128,128,128)）`])
    return results
  },

  async checkFilters(dpr) {
    // 页面画布：画出来肉眼对比
    const canvas = await new Promise(resolve => {
      wx.createSelectorQuery().select('#filterCanvas').fields({ node: true }).exec(res => resolve(res[0] && res[0].node))
    })
    if (canvas) {
      canvas.width = Math.round(this.data.filterW * dpr)
      canvas.height = Math.round(64 * dpr)
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      const img = await this.loadTestImage(canvas)
      if (img) this.runFilterTiles(ctx, img, dpr).forEach(r => this.push(`页面画布·${r[0]}`, r[1], r[2]))
    }
    // 离屏画布：导出用的就是它
    try {
      const off = wx.createOffscreenCanvas({ type: '2d', width: 400, height: 64 })
      const img = await this.loadTestImage(off)
      if (img) this.runFilterTiles(off.getContext('2d'), img, 1).forEach(r => this.push(`离屏画布·${r[0]}`, r[1], r[2]))
      else this.push('离屏画布·加载测试图', false, '加载失败')
    } catch (err) {
      this.push('离屏画布·滤镜', false, (err && err.message) || String(err))
    }
  },

  /**
   * 每个字体 × 每种写法 × 页面 / 离屏画布：与系统 serif、sans-serif 宽度都不同才算生效
   * 每个字体只输出一行汇总，列出生效的写法；返回 { family: 第一个生效的写法 }
   */
  checkCanvasFonts(round, ctx, offCtx, fonts) {
    const best = {}
    const base = c => ({ serif: measure(c, '40px serif'), sans: measure(c, '40px sans-serif') })
    const baseOn = base(ctx)
    const baseOff = base(offCtx)
    fonts.forEach(f => {
      const works = []
      const widths = []
      FONT_FORMS.forEach(form => {
        const wOn = measure(ctx, form.css(f.family))
        const wOff = measure(offCtx, form.css(f.family))
        const okOn = Math.abs(wOn - baseOn.serif) > 1 && Math.abs(wOn - baseOn.sans) > 1
        const okOff = Math.abs(wOff - baseOff.serif) > 1 && Math.abs(wOff - baseOff.sans) > 1
        widths.push(`${form.label} ${wOn.toFixed(0)}/${wOff.toFixed(0)}`)
        if (okOn && okOff) works.push(form.label)
        else if (okOn) works.push(`${form.label}（仅页面画布）`)
        else if (okOff) works.push(`${form.label}（仅离屏画布）`)
        if (okOn && !best[f.family]) best[f.family] = form.label
      })
      this.push(
        `${round}·画布生效 ${f.family}`,
        works.length > 0,
        `生效写法：${works.join('、') || '无'}；宽度（页面/离屏）${widths.join('，')}；serif ${baseOn.serif.toFixed(0)}，sans ${baseOn.sans.toFixed(0)}`
      )
    })
    return best
  },

  onRerun() {
    this.run()
  },

  onCopy() {
    const lines = [this.data.env].concat(this.data.results.map(r => `${r.ok ? '✅' : '❌'} ${r.name}：${r.detail}`))
    wx.setClipboardData({ data: lines.join('\n') })
  }
})
