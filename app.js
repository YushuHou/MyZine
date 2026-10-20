// app.js
const { preloadAssetPacks } = require('./core/render/assetPacks')

// 启动后多久开始在后台预下载素材分包（避开首页加载）
const PRELOAD_DELAY = 2000

App({
  onLaunch() {
    setTimeout(() => { preloadAssetPacks() }, PRELOAD_DELAY)
  },

  globalData: {
    // 当前正在制作的相册（只存在内存中，不做持久化）
    album: null,
    // 本次打开小程序后，是否已提示过「相册不会保存」
    saveNoticeShown: false
  }
})
