// 开发验证页（6a-0）：在真机上确认素材方案是否可行，结果显示在页面上，可一键复制
// 1. 主包代码 require.async 加载分包 JS（字体 base64）
// 2. wx.loadFontFace 用 Data URL 注册字体
// 3. 字体在 canvas 2d（页面画布 + 离屏画布）中是否生效：比较同一串文字的宽度，并测试多种 font 写法
// 4. 页面普通文字（webview）是否生效：肉眼看，用来区分「字体数据有问题」还是「画布不认」
// 5. 画布能否加载 Data URL 图片
const { FONTS, loadFont } = require('../../core/fonts')
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
    // 页面普通文字样例
    webFonts: []
  },

  onLoad() {
    const sys = wx.getSystemInfoSync()
    const win = wx.getWindowInfo ? wx.getWindowInfo() : sys
    this.setData({
      env: `${sys.brand} ${sys.model} · ${sys.system} · 微信 ${sys.version} · 基础库 ${sys.SDKVersion}`,
      canvasW: win.windowWidth - 32
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

    this.setData({ running: false })
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
