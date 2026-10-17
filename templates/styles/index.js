// 全部风格汇总，第一个为默认风格（纸白）。新增风格：新建数据文件后加到这里
// group：solid 纯色 / style 风格 / theme 主题（模板页按组显示）
module.exports = [].concat(
  require('./solids'),
  [
    require('./magazine'),
    require('./journal'),
    require('./film'),
    require('./postcard')
  ]
)
