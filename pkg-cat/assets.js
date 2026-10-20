// 素材分包「cat」：由 scripts/build-stickers.py 根据 cat.json 生成，请勿手改
// 画布读不到分包里的图片文件，所以图片以 Data URL 写在 JS 模块里（每张图一个文件），用 require.async 加载本文件
module.exports = {
  "catNap": require('./img/catNap.js'),
  "catStretch": require('./img/catStretch.js'),
  "catLoaf": require('./img/catLoaf.js'),
  "catBelly": require('./img/catBelly.js'),
  "catBox": require('./img/catBox.js'),
  "catBack": require('./img/catBack.js'),
  "yarn": require('./img/yarn.js'),
  "driedFish": require('./img/driedFish.js'),
  "wand": require('./img/wand.js'),
  "bowl": require('./img/bowl.js'),
  "paw": require('./img/paw.js'),
  "collar": require('./img/collar.js'),
  "catSuitcase": require('./img/catSuitcase.js'),
  "catTote": require('./img/catTote.js'),
  "catCamera": require('./img/catCamera.js'),
  "catPicnic": require('./img/catPicnic.js'),
  "catPlane": require('./img/catPlane.js'),
  "catLetter": require('./img/catLetter.js'),
  "tapeGingham": require('./img/tapeGingham.js'),
  "tapePaw": require('./img/tapePaw.js'),
  "tapePlain": require('./img/tapePlain.js'),
  "notePink": require('./img/notePink.js'),
  "noteCat": require('./img/noteCat.js'),
  "clip": require('./img/clip.js'),
  "paper": require('./img/paper.js')
}
