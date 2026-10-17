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

// 改名的风格：旧 id → 新 id（原「极简」并入纸白）
const STYLE_ALIASES = { minimal: 'paper' }

// 找不到时退回第一个风格，避免旧数据引用已删除的风格时崩溃
function getStyle(id) {
  return styleMap[id] || styleMap[STYLE_ALIASES[id]] || styles[0]
}

// 列出某种页面类型（cover / title / body / back）的版式；不传则返回全部
function listLayouts(pageType) {
  return layouts.filter(l => !pageType || l.pageType === pageType)
}

function listStyles() {
  return styles.slice()
}

// 某一页的版式数据：右页取 pages[1]，左页、单页、跨页大图取 pages[0]
function getLayoutPage(layout, side) {
  return side === 'right' ? layout.pages[1] : layout.pages[0]
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
  getLayoutPage,
  getLayoutFrames,
  DEFAULT_STYLE_ID: styles[0].id
}
