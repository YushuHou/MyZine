// 封底版式（单页，位于书的左侧）
// 坐标为 0–1 比例，相对单页 1080×1440；注释中为对应的基准 px

module.exports = [
  {
    id: 'back-basic',
    name: '封底·底部署名',
    pageType: 'back',
    span: 'single',
    capacity: 0,
    pages: [
      {
        frames: [],
        // 底部对齐 y 1344，居中
        texts: [
          {
            id: 'back-info',
            x: 0.0889, y: 0.9333, w: 0.8222,
            anchor: 'bottom',
            align: 'center',
            gap: 16,
            items: [
              { field: 'title', role: 'subtitle' },
              { text: 'MADE WITH MYZINE', role: 'caption' }
            ]
          }
        ]
      }
    ]
  }
]
