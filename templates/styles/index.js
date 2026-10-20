// 全部风格汇总，第一个为默认风格（纸白）。新增风格：新建数据文件后加到这里
// group：solid 纯色 / style 风格 / theme 主题（模板页按组显示）
const styles = [].concat(
  require('./solids'),
  [
    // 风格
    require('./magazine'),
    require('./journal'),
    require('./film'),
    require('./zine'),
    require('./ticket'),
    require('./collage'),
    require('./hkretro'),
    require('./japanese'),
    require('./mono'),
    // 主题
    require('./postcard'),
    require('./nature'),
    require('./food'),
    require('./farm'),
    require('./roadtrip'),
    require('./heritage'),
    require('./renaissance'),
    require('./city'),
    require('./cat'),
    require('./dog'),
    require('./couple'),
    require('./family')
  ]
)

const styleMotifs = {
  magazine: ['leafSprig', 'butterfly', 'sparkle'],
  journal: ['cherry', 'camera', 'leafSprig', 'flower'],
  film: ['camera', 'bird', 'star', 'sparkle'],
  zine: ['camera', 'arrow', 'butterfly', 'star'],
  ticket: ['postmark', 'star', 'arrow', 'camera'],
  collage: ['leafSprig', 'cherry', 'camera', 'flower'],
  hkretro: ['camera', 'building', 'sun', 'sparkle'],
  japanese: ['cherry', 'leafSprig', 'bird', 'cloud'],
  mono: ['camera', 'building', 'arrow', 'star'],
  postcard: ['shell', 'gull', 'wave', 'sun', 'butterfly'],
  nature: ['pine', 'leafSprig', 'cherry', 'butterfly', 'cloud'],
  food: ['fork', 'spoon', 'cup', 'flower', 'mushroom'],
  farm: ['paw', 'carrot', 'chick', 'barn', 'mushroom'],
  roadtrip: ['car', 'mountain', 'compass', 'camera', 'sun'],
  heritage: ['branch', 'flower', 'building', 'leafSprig', 'sparkle'],
  renaissance: ['branch', 'flower', 'leafSprig', 'butterfly'],
  city: ['building', 'camera', 'pin', 'sparkle', 'arrow'],
  cat: ['cat', 'bow', 'paw', 'mushroom', 'heart', 'sparkle'],
  dog: ['paw', 'bone', 'sun', 'mushroom', 'cloud', 'pin'],
  couple: ['heart', 'sparkle', 'flower', 'bow', 'butterfly'],
  family: ['house', 'sun', 'cloud', 'star', 'balloon', 'flower']
}

// 风格和主题统一补充轻量纸片层与可适配留白的便签，不影响纯色系列
styles.forEach(style => {
  if (style.group === 'solid') return
  if (!style.doodles || !style.doodles.names || !style.doodles.names.length) {
    style.doodles = {
      names: ['sparkle', 'star', 'arrow', 'flower'],
      perSpread: [1, 2],
      size: [62, 90],
      colors: ['accent', 'textMuted'],
      lineWidth: 2.6,
      rotate: 8,
      pageTypes: ['body']
    }
  }
  style.doodles.names = Array.from(new Set(style.doodles.names.concat(styleMotifs[style.id] || [])))
  style.decorations = style.decorations || []
  style.decorations.unshift({
    type: 'paperCollage',
    chance: 0.78,
    colors: ['endpaper', 'fitFill'],
    regions: [
      { x: 0.015, y: 0.16, w: 0.16, h: 0.19, color: 'endpaper', alpha: 0.62, rotate: 5, roughness: 12 },
      { x: 0.77, y: 0.82, w: 0.21, h: 0.15, color: 'accent', alpha: 0.2, rotate: 3, roughness: 9 },
      { x: 0.73, y: 0.08, w: 0.23, h: 0.1, color: 'fitFill', alpha: 0.42, rotate: 2, roughness: 6 }
    ]
  })
  if (!style.ornaments) style.ornaments = { big: [], small: [], smallPerSpread: [2, 3], pageTypes: ['body'] }
  style.ornaments.small = style.ornaments.small || []
  if (!style.ornaments.small.some(item => item.type === 'miniCard')) {
    style.ornaments.small.push({ type: 'miniCard', size: [145, 205], weight: 1.2 })
  }
  style.ornaments.adaptive = true
  style.ornaments.smallPerSpread = style.ornaments.smallPerSpread || [2, 3]
  style.ornaments.pageTypes = style.ornaments.pageTypes || ['body']
})

module.exports = styles
