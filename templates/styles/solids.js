// 纯色系列（8 种）：同一套克制的装饰——页眉（地点 · 日期 + 点缀色细线）、两位数页码，照片是主角
// 深色三种的页码、页眉、中缝细线用点缀色（淡金）
// 纸白替代原「极简」（registry 中 minimal 是 paper 的别名）

// 两个十六进制颜色按比例混合：t = 0 为 a，t = 1 为 b
function blend(a, b, t) {
  const pa = [1, 3, 5].map(i => parseInt(a.slice(i, i + 2), 16))
  const pb = [1, 3, 5].map(i => parseInt(b.slice(i, i + 2), 16))
  return '#' + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, '0')).join('').toUpperCase()
}

function solid({ id, name, description, bg, text, accent, dark, tags }) {
  const muted = dark ? 'accent' : 'textMuted'
  return {
    id,
    name,
    group: 'solid',
    // 模板页的色块小圆点
    swatch: bg,
    description,
    tags,
    assetsPackage: null,
    colors: {
      background: bg,
      text,
      textMuted: blend(text, bg, 0.45),
      accent,
      endpaper: blend(bg, accent, dark ? 0.12 : 0.18),
      placeholder: blend(bg, text, dark ? 0.14 : 0.1),
      fitFill: dark ? blend(bg, '#000000', 0.25) : '#FFFFFF'
    },
    fonts: {
      title: { family: 'serif', weight: 'bold', size: 88, lineHeight: 1.25, color: 'text' },
      subtitle: { family: 'serif', weight: 'normal', size: 36, lineHeight: 1.4, color: 'text' },
      body: { family: 'serif', weight: 'normal', size: 34, lineHeight: 1.7, color: 'text' },
      caption: { family: 'sans-serif', weight: 'normal', size: 26, lineHeight: 1.5, color: muted, letterSpacing: 2 }
    },
    // 两位数页码（07），用 MZ Playfair 字形
    pageNumber: { show: true, glyph: 'playfair', family: 'serif', size: 26, color: muted, bottom: 60, format: 'pad2' },
    decoText: {
      // 页眉：外侧「地点 · 日期」+ 点缀色细线延伸到内侧；地点或日期为空时整条不显示
      runningHeader: {
        text: '{location} · {date}',
        font: { glyph: 'playfair', family: 'serif', size: 24, letterSpacing: 1.5, color: muted },
        line: { color: 'accent', width: 1 },
        y: 58,
        pageTypes: ['body']
      }
    },
    background: { type: 'color', color: bg },
    photoFrame: { borderWidth: 0, borderColor: '#FFFFFF', radius: null, shadow: null },
    decorations: dark ? [{ type: 'gutterLine', color: 'accent', width: 1.5, pageTypes: ['body'] }] : []
  }
}

module.exports = [
  solid({ id: 'paper', name: '纸白', description: '暖白纸色，最百搭', bg: '#F7F5F0', text: '#2B2B2B', accent: '#B5835A', tags: ['nature', 'architecture', 'beach', 'city-night'] }),
  solid({ id: 'oat', name: '燕麦', description: '温暖的燕麦米色', bg: '#EDE6DA', text: '#3A3530', accent: '#A68A64', tags: ['food', 'family', 'couple'] }),
  solid({ id: 'mist', name: '雾灰', description: '安静的浅灰', bg: '#E4E4E1', text: '#2F2F2F', accent: '#8C8C88', tags: ['architecture', 'city-night'] }),
  solid({ id: 'haze', name: '雾霾蓝', description: '低饱和的灰蓝', bg: '#D8DEE4', text: '#2A3440', accent: '#6F8299', tags: ['beach', 'nature'] }),
  solid({ id: 'sage', name: '鼠尾草', description: '柔和的灰绿', bg: '#DCE0D5', text: '#2F3A2F', accent: '#7C8A6E', tags: ['nature', 'road-trip', 'zoo-farm'] }),
  solid({ id: 'navy', name: '深蓝', description: '深蓝底配淡金', bg: '#1F2A3C', text: '#E8E4DA', accent: '#C9A96E', dark: true, tags: ['city-night', 'couple'] }),
  solid({ id: 'forest', name: '墨绿', description: '墨绿底配淡金', bg: '#24332B', text: '#E9E6DC', accent: '#B8A57A', dark: true, tags: ['nature', 'road-trip'] }),
  solid({ id: 'wine', name: '酒红', description: '酒红底配淡金', bg: '#4A1F24', text: '#F0E6DD', accent: '#C9A27E', dark: true, tags: ['couple', 'party', 'food'] })
]
