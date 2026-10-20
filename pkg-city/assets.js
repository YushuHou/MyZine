// 素材分包「city」：由 scripts/build-stickers.py 根据 city.json 生成，请勿手改
// 画布读不到分包里的图片文件，所以图片以 Data URL 写在 JS 模块里（每张图一个文件），用 require.async 加载本文件
module.exports = {
  "tower": require('./img/tower.js'),
  "cafe": require('./img/cafe.js'),
  "clockTower": require('./img/clockTower.js'),
  "bridge": require('./img/bridge.js'),
  "brownstone": require('./img/brownstone.js'),
  "subway": require('./img/subway.js'),
  "tram": require('./img/tram.js'),
  "taxi": require('./img/taxi.js'),
  "bus": require('./img/bus.js'),
  "bike": require('./img/bike.js'),
  "streetLamp": require('./img/streetLamp.js'),
  "trafficLight": require('./img/trafficLight.js'),
  "coffee": require('./img/coffee.js'),
  "croissant": require('./img/croissant.js'),
  "camera": require('./img/camera.js'),
  "umbrella": require('./img/umbrella.js'),
  "sneakers": require('./img/sneakers.js'),
  "groceryBag": require('./img/groceryBag.js'),
  "tapeStripe": require('./img/tapeStripe.js'),
  "tapeMap": require('./img/tapeMap.js'),
  "tapeClear": require('./img/tapeClear.js'),
  "noteGrid": require('./img/noteGrid.js'),
  "ticket": require('./img/ticket.js'),
  "clip": require('./img/clip.js'),
  "paper": require('./img/paper.js')
}
