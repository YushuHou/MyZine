// 正文版式（成对设计：左页 + 右页）
// 坐标为 0–1 比例，相对单页 1080×1440；注释中为对应的基准 px
// 左页外侧（左）留白大于内侧（右），右页对称，照片框不贴中缝

module.exports = [
  {
    id: 'body-landscape',
    name: '横图·上下双框',
    pageType: 'body',
    span: 'pair',
    capacity: 4,
    pages: [
      {
        // 左页：x 96、宽 912，框 3:2（912×608），上下间距 48
        frames: [
          { id: 'L1', x: 0.0889, y: 0.0611, w: 0.8444, h: 0.4222, orientation: 'landscape', radius: 0, rotate: 0, border: true },
          { id: 'L2', x: 0.0889, y: 0.5167, w: 0.8444, h: 0.4222, orientation: 'landscape', radius: 0, rotate: 0, border: true }
        ],
        texts: []
      },
      {
        // 右页：x 72
        frames: [
          { id: 'R1', x: 0.0667, y: 0.0611, w: 0.8444, h: 0.4222, orientation: 'landscape', radius: 0, rotate: 0, border: true },
          { id: 'R2', x: 0.0667, y: 0.5167, w: 0.8444, h: 0.4222, orientation: 'landscape', radius: 0, rotate: 0, border: true }
        ],
        texts: []
      }
    ]
  },
  {
    id: 'body-portrait',
    name: '竖图·单页大框',
    pageType: 'body',
    span: 'pair',
    capacity: 2,
    pages: [
      {
        // 左页：框 3:4（816×1088），x 144、y 176
        frames: [
          { id: 'L1', x: 0.1333, y: 0.1222, w: 0.7556, h: 0.7556, orientation: 'portrait', radius: 0, rotate: 0, border: true }
        ],
        texts: []
      },
      {
        // 右页：x 120
        frames: [
          { id: 'R1', x: 0.1111, y: 0.1222, w: 0.7556, h: 0.7556, orientation: 'portrait', radius: 0, rotate: 0, border: true }
        ],
        texts: []
      }
    ]
  }
]
