// 模板注册表：按 id 取版式和风格。新增版式/风格只需改 templates 目录
const layouts = require('../templates/layouts/index')
const styles = require('../templates/styles/index')

const layoutMap = {}
const styleMap = {}
layouts.forEach(l => { layoutMap[l.id] = l })
styles.forEach(s => { styleMap[s.id] = s })

function getLayout(id) {
  const layout = layoutMap[id]
  if (!layout) throw new Error(`未知版式：${id}`)
  return layout
}

// 找不到时退回第一个风格，避免旧数据引用已删除的风格时崩溃
function getStyle(id) {
  return styleMap[id] || styles[0]
}

// 列出某种页面类型（cover / title / body / back）的版式；不传则返回全部
function listLayouts(pageType) {
  return layouts.filter(l => !pageType || l.pageType === pageType)
}

function listStyles() {
  return styles.slice()
}

// 版式中全部照片框，按左页 → 右页、页内书写顺序排列
function getLayoutFrames(layout) {
  return layout.pages.reduce((all, page) => all.concat(page.frames), [])
}

module.exports = {
  getLayout,
  getStyle,
  listLayouts,
  listStyles,
  getLayoutFrames,
  DEFAULT_STYLE_ID: styles[0].id
}
