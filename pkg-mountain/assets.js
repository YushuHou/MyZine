// 素材分包「mountain」：由 scripts/build-stickers.py 根据 mountain.json 生成，请勿手改
// 画布读不到分包里的图片文件，所以图片以 Data URL 写在 JS 模块里（每张图一个文件），用 require.async 加载本文件
module.exports = {
  "peak": require('./img/peak.js'),
  "dock": require('./img/dock.js'),
  "pine": require('./img/pine.js'),
  "maple": require('./img/maple.js'),
  "waterfall": require('./img/waterfall.js'),
  "mossRock": require('./img/mossRock.js'),
  "tent": require('./img/tent.js'),
  "campfire": require('./img/campfire.js'),
  "boots": require('./img/boots.js'),
  "backpack": require('./img/backpack.js'),
  "compass": require('./img/compass.js'),
  "mug": require('./img/mug.js'),
  "fawn": require('./img/fawn.js'),
  "squirrel": require('./img/squirrel.js'),
  "kingfisher": require('./img/kingfisher.js'),
  "wildflowers": require('./img/wildflowers.js'),
  "mushrooms": require('./img/mushrooms.js'),
  "butterfly": require('./img/butterfly.js'),
  "tapeGingham": require('./img/tapeGingham.js'),
  "tapeLeaf": require('./img/tapeLeaf.js'),
  "tapeKraft": require('./img/tapeKraft.js'),
  "noteGrid": require('./img/noteGrid.js'),
  "noteLeaf": require('./img/noteLeaf.js'),
  "clip": require('./img/clip.js'),
  "paper": require('./img/paper.js')
}
