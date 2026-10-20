// 素材分包「couple」：由 scripts/build-stickers.py 根据 couple.json 生成，请勿手改
// 画布读不到分包里的图片文件，所以图片以 Data URL 写在 JS 模块里（每张图一个文件），用 require.async 加载本文件
module.exports = {
  "heartBalloons": require('./img/heartBalloons.js'),
  "roses": require('./img/roses.js'),
  "milkshakes": require('./img/milkshakes.js'),
  "rings": require('./img/rings.js'),
  "giftBox": require('./img/giftBox.js'),
  "loveLetter": require('./img/loveLetter.js'),
  "iceCreams": require('./img/iceCreams.js'),
  "hotAirBalloon": require('./img/hotAirBalloon.js'),
  "ferrisWheel": require('./img/ferrisWheel.js'),
  "camera": require('./img/camera.js'),
  "picnicBasket": require('./img/picnicBasket.js'),
  "heartCandle": require('./img/heartCandle.js'),
  "bunnies": require('./img/bunnies.js'),
  "lovebirds": require('./img/lovebirds.js'),
  "penguins": require('./img/penguins.js'),
  "bears": require('./img/bears.js'),
  "swans": require('./img/swans.js'),
  "kittens": require('./img/kittens.js'),
  "tapeStripe": require('./img/tapeStripe.js'),
  "tapeHeart": require('./img/tapeHeart.js'),
  "tapePink": require('./img/tapePink.js'),
  "noteGrid": require('./img/noteGrid.js'),
  "noteHeart": require('./img/noteHeart.js'),
  "clip": require('./img/clip.js'),
  "paper": require('./img/paper.js')
}
