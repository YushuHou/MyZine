// 封面版式（单页，位于书的右侧）
// 坐标为 0–1 比例，相对单页 1080×1440；注释中为对应的基准 px

module.exports = [
  {
    id: 'cover-photo',
    name: '封面·大图 + 书名',
    pageType: 'cover',
    span: 'single',
    capacity: 1,
    pages: [
      {
        // 照片框：x 96、y 96、888×864
        frames: [
          { id: 'C1', x: 0.0889, y: 0.0667, w: 0.8222, h: 0.6, orientation: 'square', radius: 0, rotate: 0, border: true }
        ],
        // 问候语槽：压在照片左上部（风格定义了 greeting 才显示，如海边明信片「Greetings from {location}」）
        slots: [
          { type: 'greeting', x: 0.1444, y: 0.16, w: 0.5, align: 'left' }
        ],
        // 文字块底部对齐 y 1344，内容少时贴底，多时向上长
        texts: [
          {
            id: 'cover-info',
            x: 0.0889, y: 0.9333, w: 0.8222,
            anchor: 'bottom',
            align: 'left',
            gap: 20,
            items: [
              { field: 'title', role: 'title', maxLines: 2, minScale: 0.7 },
              { field: 'locationDate', role: 'subtitle' },
              { field: 'author', role: 'caption' }
            ]
          }
        ]
      }
    ]
  }
]
