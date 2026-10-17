// 开发工具开关：验证页、线稿预览页等开发用页面（在分包 dev 中）
// 提审前：把 DEV_TOOLS 改为 false，并从 app.json 的 subpackages 中删除 root 为 "dev" 的分包（见 README）
const DEV_TOOLS = false

// 是否显示开发工具入口：开关打开，且不是正式版
function showDevTools() {
  if (!DEV_TOOLS) return false
  try {
    const env = wx.getAccountInfoSync().miniProgram.envVersion
    return env !== 'release'
  } catch (err) {
    return false
  }
}

module.exports = { DEV_TOOLS, showDevTools }
