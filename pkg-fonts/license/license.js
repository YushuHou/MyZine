// 字体授权页：显示随小程序分发的西文字体及其 SIL OFL 授权全文
// （字体分包需要至少一个页面，这个页面同时满足 OFL 随字体附带授权的要求）
const licenses = require('../licenses.js')

Page({
  data: {
    licenses
  }
})
