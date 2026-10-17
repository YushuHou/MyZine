// 风格：票根邮戳
// 牛皮纸底（代码纹理）；照片框做成票根：奶白纸边 + 副券（虚线撕线、半圆缺口、ADMIT ONE、照片编号）；邮戳圆环
module.exports = {
  id: 'ticket',
  name: '票根邮戳',
  group: 'style',
  description: '牛皮纸、票根撕线和邮戳，像收集了一路的车票',
  tags: ['city-night', 'amusement', 'architecture', 'road-trip', 'party'],
  assetsPackage: null,
  colors: {
    background: '#C9A57A',
    text: '#3B2A1E',
    textMuted: '#6E5643',
    accent: '#B23A2E',
    blue: '#2F4A6B',
    paper: '#F6EEDC',
    postmark: 'rgba(47, 74, 107, 0.7)',
    endpaper: '#B9925F',
    placeholder: '#E6DAC4',
    fitFill: '#F6EEDC'
  },
  fonts: {
    title: { family: 'serif', weight: 'bold', size: 86, lineHeight: 1.25, color: 'text' },
    subtitle: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.4, color: 'accent' },
    body: { family: 'serif', weight: 'normal', size: 32, lineHeight: 1.7, color: 'text' },
    caption: { family: 'sans-serif', weight: 'normal', size: 24, lineHeight: 1.5, color: 'textMuted', letterSpacing: 2 }
  },
  wordPool: ['Admit One', 'Round Trip', 'Next Stop', 'Platform 7', 'Window Seat', 'One Way', 'Boarding Pass'],
  decoText: {
    headline: { text: '{word}', font: { glyph: 'oswald', family: 'sans-serif', size: 110, uppercase: true, color: 'text' }, minScale: 0.5 },
    kicker: { text: '{location} · {date}', font: { glyph: 'oswald', family: 'sans-serif', size: 24, letterSpacing: 4, uppercase: true, color: 'accent' } }
  },
  pageNumber: { show: true, glyph: 'oswald', family: 'sans-serif', size: 26, color: 'text', bottom: 60, format: 'pad2' },
  background: { type: 'texture', texture: 'kraft', tile: 540, color: '#C9A57A' },
  photoFrame: {
    borderWidth: 16,
    borderColor: '#F6EEDC',
    radius: 0,
    shadow: { color: 'rgba(60, 40, 20, 0.28)', blur: 14, offsetX: 0, offsetY: 4 },
    rotateJitter: 1.5,
    // 票根副券：占照片框长边的 22%
    ticketStub: { ratio: 0.22, notchColor: 'background', text: 'ADMIT ONE', textColor: 'accent', font: { glyph: 'oswald', size: 22, letterSpacing: 3 } }
  },
  frameDecorations: [
    // 每页最大的照片压一个邮戳（环内写地点、日期）
    { type: 'postmark', largestOnly: true, minWidth: 360, r: 86, position: 'top-left', color: 'postmark', font: { glyph: 'oswald', family: 'sans-serif', letterSpacing: 1.5, uppercase: true } }
  ],
  decorations: []
}
