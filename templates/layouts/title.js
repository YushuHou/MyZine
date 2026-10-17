// 扉页版式（跨页：左页环衬 + 右页扉页）
// 坐标为 0–1 比例，相对单页 1080×1440；注释中为对应的基准 px

module.exports = [
  {
    id: 'title-basic',
    name: '扉页·居中文字',
    pageType: 'title',
    span: 'pair',
    capacity: 0,
    pages: [
      {
        // 左页：环衬，用风格的 endpaper 颜色铺满
        fill: 'endpaper',
        frames: [],
        texts: []
      },
      {
        frames: [],
        // 右页：x 144、宽 792，整体垂直居中
        texts: [
          {
            id: 'title-info',
            x: 0.1333, y: 0.5, w: 0.7333,
            anchor: 'center',
            align: 'center',
            gap: 16,
            items: [
              { field: 'message', role: 'body', maxLines: 10, minScale: 0.7 },
              { field: 'author', role: 'caption', prefix: '作者  ', gapBefore: 72 },
              { field: 'companions', role: 'caption', prefix: '同游  ', maxLines: 2 },
              { field: 'locationDate', role: 'caption' }
            ]
          }
        ]
      }
    ]
  }
]
