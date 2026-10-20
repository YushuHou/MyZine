// 素材分包「snow」：由 scripts/build-stickers.py 根据 snow.json 生成，请勿手改
// 画布读不到分包里的图片文件，所以图片以 Data URL 写在 JS 模块里（每张图一个文件），用 require.async 加载本文件
module.exports = {
  "snowman": require('./img/snowman.js'),
  "beanie": require('./img/beanie.js'),
  "mittens": require('./img/mittens.js'),
  "cocoa": require('./img/cocoa.js'),
  "scarf": require('./img/scarf.js'),
  "tanghulu": require('./img/tanghulu.js'),
  "pine": require('./img/pine.js'),
  "cabin": require('./img/cabin.js'),
  "sled": require('./img/sled.js'),
  "skis": require('./img/skis.js'),
  "snowflake": require('./img/snowflake.js'),
  "postbox": require('./img/postbox.js'),
  "fox": require('./img/fox.js'),
  "bullfinch": require('./img/bullfinch.js'),
  "iceCastle": require('./img/iceCastle.js'),
  "onsen": require('./img/onsen.js'),
  "train": require('./img/train.js'),
  "lamppost": require('./img/lamppost.js'),
  "tapeGingham": require('./img/tapeGingham.js'),
  "tapeSnow": require('./img/tapeSnow.js'),
  "tapeClear": require('./img/tapeClear.js'),
  "noteGrid": require('./img/noteGrid.js'),
  "noteKraft": require('./img/noteKraft.js'),
  "clip": require('./img/clip.js'),
  "paper": require('./img/paper.js')
}
