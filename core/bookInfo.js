// 书籍信息：字段取值与日期格式化

// 'YYYY-MM-DD' → { y, m, d }
function parseDate(str) {
  const parts = str.split('-')
  return { y: parts[0], m: parts[1], d: parts[2] }
}

/**
 * 旅行日期显示格式：
 * 单日 2026.10.01；同年 2026.10.01 – 10.05 / 2026.09.28 – 10.03；跨年 2025.12.30 – 2026.01.02
 */
function formatDate(dateStart, dateEnd) {
  let start = dateStart || dateEnd
  let end = dateStart && dateEnd ? dateEnd : ''
  if (!start) return ''
  if (end && end < start) {
    const t = start
    start = end
    end = t
  }
  const s = parseDate(start)
  const head = `${s.y}.${s.m}.${s.d}`
  if (!end || end === start) return head
  const e = parseDate(end)
  return e.y === s.y ? `${head} – ${e.m}.${e.d}` : `${head} – ${e.y}.${e.m}.${e.d}`
}

/**
 * 取版式文字条目要显示的内容，空字段返回 ''
 * 组合字段：date 旅行日期；locationDate 地点 · 日期（缺哪个去掉哪个）
 */
function getFieldText(info, field) {
  if (!info) return ''
  if (field === 'date') return formatDate(info.dateStart, info.dateEnd)
  if (field === 'locationDate') {
    return [(info.location || '').trim(), formatDate(info.dateStart, info.dateEnd)].filter(Boolean).join(' · ')
  }
  return (info[field] || '').trim()
}

module.exports = { formatDate, getFieldText }
