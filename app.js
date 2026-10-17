// app.js
App({
  globalData: {
    // 当前正在制作的相册（只存在内存中，不做持久化）
    album: null,
    // 本次打开小程序后，是否已提示过「相册不会保存」
    saveNoticeShown: false
  }
})
