// 照片使用情况：每张照片用在哪些页，供照片面板显示标签
const { getLayout, getLayoutPage } = require('./registry')
const { getPageList } = require('./album')

// 标签最多显示几个页名，多出的显示为 +N
const MAX_TAGS = 3

/**
 * @returns { photoId: ['封面', 'P3', ...] }，按页序排列，同一页只记一次
 */
function getPhotoUsage(album) {
  const usage = {}
  getPageList(album).forEach(page => {
    const spread = album.spreads.find(s => s.id === page.spreadId)
    const frames = getLayoutPage(getLayout(spread.layoutId), page.side).frames
    frames.forEach(frame => {
      const slot = spread.slots[frame.id]
      if (!slot) return
      const labels = usage[slot.photoId] || (usage[slot.photoId] = [])
      if (labels[labels.length - 1] !== page.label) labels.push(page.label)
    })
  })
  return usage
}

// ['P3', 'P8', 'P12', 'P20', 'P21'] → 'P3 P8 P12 +2'
function formatUsage(labels) {
  if (!labels || !labels.length) return ''
  const shown = labels.slice(0, MAX_TAGS).join(' ')
  return labels.length > MAX_TAGS ? `${shown} +${labels.length - MAX_TAGS}` : shown
}

module.exports = { getPhotoUsage, formatUsage }
