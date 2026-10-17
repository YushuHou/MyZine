// 全部版式汇总。新增版式：在对应文件中添加数据，或新建文件后在这里合并
// 同一页面类型的第一个版式为自动生成时的默认版式
module.exports = [].concat(
  require('./cover'),
  require('./title'),
  require('./body'),
  require('./back')
)
