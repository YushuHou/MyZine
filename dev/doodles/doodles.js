// 开发用：线稿预览页（逐个检查线稿效果）+ 字形路径文字样例
const { DOODLES, drawDoodle } = require('../../core/render/doodles')
const { loadGlyphFont, drawGlyphText } = require('../../core/render/glyphText')

const COLS = 3
const CELL_H = 150
const TEXT_H = 330

Page({
  data: { canvasW: 0, canvasH: 0, names: [] },

  onLoad() {
    const win = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    const names = Object.keys(DOODLES)
    this.setData({
      canvasW: win.windowWidth - 32,
      canvasH: Math.ceil(names.length / COLS) * CELL_H + TEXT_H,
      names
    })
  },

  async onReady() {
    // 先加载字形字体
    await Promise.all(['playfair', 'caveat', 'oswald'].map(loadGlyphFont))
    wx.createSelectorQuery().select('#doodleCanvas').fields({ node: true }).exec(res => {
      const canvas = res[0] && res[0].node
      if (!canvas) return
      const dpr = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()).pixelRatio || 2
      const { canvasW: W, canvasH: H, names } = this.data
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      const ctx = canvas.getContext('2d')
      ctx.scale(dpr, dpr)
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, W, H)

      // 线稿网格：每格一大一小两个，下方写名称
      const cellW = W / COLS
      names.forEach((name, i) => {
        const cx = (i % COLS) * cellW + cellW / 2
        const cy = Math.floor(i / COLS) * CELL_H + 62
        drawDoodle(ctx, name, cx - 22, cy, 80, { color: '#2B2B2B', lineWidth: 2.5 })
        drawDoodle(ctx, name, cx + 42, cy + 18, 34, { color: '#D9825B', lineWidth: 1.5 })
        ctx.fillStyle = '#8A847A'
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(`${DOODLES[name].name} ${name}`, cx, cy + 66)
      })

      // 字形路径文字样例（含中西文同一行混排，检查基线对齐）
      let y = Math.ceil(names.length / COLS) * CELL_H + 46
      const samples = [
        { glyph: 'playfair', family: 'serif', size: 34, text: 'Good Places — “Still Becoming”' },
        { glyph: 'caveat', family: 'serif', size: 40, text: 'Good Days · Yum! 07' },
        { glyph: 'oswald', family: 'sans-serif', size: 34, text: 'SUMMER TRAVEL 2026', letterSpacing: 2 },
        { glyph: 'playfair', family: 'serif', size: 22, text: '新西兰 · 2026.07.12 – 07.20', letterSpacing: 1 }
      ]
      samples.forEach(s => {
        ctx.strokeStyle = 'rgba(47,128,237,0.35)'
        ctx.beginPath()
        ctx.moveTo(12, y)
        ctx.lineTo(W - 12, y)
        ctx.stroke()
        drawGlyphText(ctx, { glyph: s.glyph, family: s.family, size: s.size, letterSpacing: s.letterSpacing || 0 }, s.text, 12, y, 'left', '#2B2B2B')
        y += s.size + 34
      })
    })
  }
})
