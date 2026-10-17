// wx 回调式接口的 Promise 包装，以及常见错误的判断

function call(api, options) {
  return new Promise((resolve, reject) => {
    api(Object.assign({}, options, { success: resolve, fail: reject }))
  })
}

function errMsg(err) {
  return (err && err.errMsg) || ''
}

// 用户主动取消（如关闭选图界面）
function isCancel(err) {
  return /cancel/i.test(errMsg(err))
}

// 用户拒绝了系统权限（如相册写入）
function isAuthDenied(err) {
  return /auth deny|auth denied|authorize no response/i.test(errMsg(err))
}

// 隐私相关错误，返回给用户看的提示；不是隐私错误时返回空字符串
// 103/104：用户未同意隐私保护指引；112：小程序后台的隐私保护指引中未声明该接口
function privacyErrorText(err) {
  const no = err && err.errno
  if (no === 103 || no === 104) return '需同意隐私保护指引后才能使用'
  if (no === 112) return '隐私保护指引未声明该权限'
  return ''
}

module.exports = { call, isCancel, isAuthDenied, privacyErrorText }
