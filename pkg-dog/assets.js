// 素材分包「dog」：由 scripts/build-stickers.py 根据 dog.json 生成，请勿手改
// 画布读不到分包里的图片文件，所以图片以 Data URL 写在 JS 模块里（每张图一个文件），用 require.async 加载本文件
module.exports = {
  "corgi": require('./img/corgi.js'),
  "golden": require('./img/golden.js'),
  "bichon": require('./img/bichon.js'),
  "shiba": require('./img/shiba.js'),
  "dachshund": require('./img/dachshund.js'),
  "collie": require('./img/collie.js'),
  "biscuit": require('./img/biscuit.js'),
  "ball": require('./img/ball.js'),
  "leash": require('./img/leash.js'),
  "bowl": require('./img/bowl.js'),
  "frisbee": require('./img/frisbee.js'),
  "duck": require('./img/duck.js'),
  "dogBike": require('./img/dogBike.js'),
  "dogBackpack": require('./img/dogBackpack.js'),
  "dogTent": require('./img/dogTent.js'),
  "dogSuitcase": require('./img/dogSuitcase.js'),
  "dogMap": require('./img/dogMap.js'),
  "dogPicnic": require('./img/dogPicnic.js'),
  "tapeGingham": require('./img/tapeGingham.js'),
  "tapeBone": require('./img/tapeBone.js'),
  "tapeKraft": require('./img/tapeKraft.js'),
  "noteGrid": require('./img/noteGrid.js'),
  "noteBone": require('./img/noteBone.js'),
  "clip": require('./img/clip.js'),
  "paper": require('./img/paper.js')
}
