// 素材分包「family」：由 scripts/build-stickers.py 根据 family.json 生成，请勿手改
// 画布读不到分包里的图片文件，所以图片以 Data URL 写在 JS 模块里（每张图一个文件），用 require.async 加载本文件
module.exports = {
  "bears": require('./img/bears.js'),
  "ducks": require('./img/ducks.js'),
  "giraffes": require('./img/giraffes.js'),
  "foxes": require('./img/foxes.js'),
  "elephants": require('./img/elephants.js'),
  "penguins": require('./img/penguins.js'),
  "kite": require('./img/kite.js'),
  "balloons": require('./img/balloons.js'),
  "wagon": require('./img/wagon.js'),
  "tent": require('./img/tent.js'),
  "picnic": require('./img/picnic.js'),
  "teacup": require('./img/teacup.js'),
  "house": require('./img/house.js'),
  "sunflower": require('./img/sunflower.js'),
  "rainbow": require('./img/rainbow.js'),
  "shoes": require('./img/shoes.js'),
  "teddy": require('./img/teddy.js'),
  "cake": require('./img/cake.js'),
  "tapeGingham": require('./img/tapeGingham.js'),
  "tapeDots": require('./img/tapeDots.js'),
  "tapeBlue": require('./img/tapeBlue.js'),
  "noteGrid": require('./img/noteGrid.js'),
  "noteCloud": require('./img/noteCloud.js'),
  "clip": require('./img/clip.js'),
  "paper": require('./img/paper.js')
}
