// 全部风格汇总，第一个为默认风格（纸白）。新增风格：新建数据文件后加到这里
// group：solid 纯色 / style 风格 / theme 主题（模板页按组显示）
module.exports = [].concat(
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
    // 主题（大海沙滩起使用图片素材分包；原「海边明信片」已并入大海沙滩）
    require('./beach'),
    require('./snow'),
    require('./cat'),
    require('./dog'),
    require('./couple'),
    require('./nature'),
    require('./food'),
    require('./farm'),
    require('./roadtrip'),
    require('./heritage')
  ]
)
