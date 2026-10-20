// 素材分包「beach」：由 scripts/build-stickers.py 根据 beach.json 生成，请勿手改
// 画布读不到分包里的图片文件，所以图片以 Data URL 写在 JS 模块里（每张图一个文件），用 require.async 加载本文件
module.exports = {
  "seagull": require('./img/seagull.js'),
  "scallop": require('./img/scallop.js'),
  "starfish": require('./img/starfish.js'),
  "lifebuoy": require('./img/lifebuoy.js'),
  "umbrella": require('./img/umbrella.js'),
  "sailboat": require('./img/sailboat.js'),
  "lighthouse": require('./img/lighthouse.js'),
  "palm": require('./img/palm.js'),
  "rowboat": require('./img/rowboat.js'),
  "surfboard": require('./img/surfboard.js'),
  "strawHat": require('./img/strawHat.js'),
  "flipflops": require('./img/flipflops.js'),
  "gulls": require('./img/gulls.js'),
  "conch": require('./img/conch.js'),
  "icecream": require('./img/icecream.js'),
  "bucket": require('./img/bucket.js'),
  "wave": require('./img/wave.js'),
  "tapeStripe": require('./img/tapeStripe.js'),
  "tapeDot": require('./img/tapeDot.js'),
  "tapePlain": require('./img/tapePlain.js'),
  "noteGrid": require('./img/noteGrid.js'),
  "noteLined": require('./img/noteLined.js'),
  "clip": require('./img/clip.js'),
  "paper": require('./img/paper.js')
}
