// 拖动排序的网格计算（逻辑层），与 sortable.wxs 配合使用

/**
 * 网格布局
 * @param width   容器宽度（px）
 * @param columns 列数
 * @param gap     间距（px）
 * @param aspect  单元格 高/宽
 */
function createGrid(width, columns, gap, aspect) {
  const cellW = (width - gap * (columns - 1)) / columns
  const cellH = cellW * aspect
  return {
    cellW,
    cellH,
    // 第 index 个单元格左上角位置
    position(index) {
      return { x: (index % columns) * (cellW + gap), y: Math.floor(index / columns) * (cellH + gap) }
    },
    // count 个单元格的总高度
    height(count) {
      const rows = Math.ceil(count / columns)
      return rows ? rows * (cellH + gap) - gap : 0
    },
    // 容器内坐标 → 单元格序号（限制在 0 ~ count-1）
    indexAt(x, y, count) {
      const col = Math.max(0, Math.min(columns - 1, Math.floor(x / (cellW + gap))))
      const row = Math.max(0, Math.floor(y / (cellH + gap)))
      return Math.max(0, Math.min(count - 1, row * columns + col))
    }
  }
}

// 把 from 位置的元素移到 to，返回新数组
function moveItem(list, from, to) {
  const result = list.slice()
  const item = result.splice(from, 1)[0]
  result.splice(to, 0, item)
  return result
}

module.exports = { createGrid, moveItem }
