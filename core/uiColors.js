// 画布上画的界面元素颜色（canvas 不能读 CSS 变量）。与 app.wxss 中的「暗房灰卡」变量保持一致，改配色时两处一起改
// 照片书模板本身的配色不在这里，在 templates/styles/
module.exports = {
  // 编辑页选中照片框的高亮（--color-accent 柯达黄）
  selection: '#F5B800',
  // 缩略图空白半边（封面左侧、封底右侧）：和缩略图下面的「桌面」同色（--color-desk），看起来就是一页纸放在桌上
  desk: '#CDCDC8',
  // 翻书预览的暗色舞台（--color-stage）
  stage: '#1E1F22',
  // 删除等危险操作的弹窗按钮
  danger: '#D9534F'
}
