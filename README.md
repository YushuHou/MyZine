# MyZine

把旅行照片做成照片书的微信小程序（原生小程序 + JavaScript，纯本地运行）。

> 完整的项目结构、如何新增风格 / 版式 / 线稿，将在阶段 7 补充。需求见 `docs/MyZine需求文档.md`，各阶段方案见 `docs/plans/`。

## 提审前检查（必做）

开发用页面（素材方案验证页、线稿预览页）放在分包 `dev` 中，正式版不应包含：

1. 打开 `core/devConfig.js`，把 `DEV_TOOLS` 改为 `false`（首页不再显示开发工具入口）。
2. 打开 `app.json`，从 `subpackages` 中删除 `root` 为 `"dev"` 的那一项：
   ```json
   {
     "root": "dev",
     "name": "dev",
     "pages": ["check/check"]
   }
   ```
3. 在开发者工具中重新编译，确认首页底部没有「开发工具」字样，且「详情 → 基本信息」中的代码包大小里没有 `dev` 分包。

即使忘记第 1、2 步，开发工具入口在正式版（`envVersion === 'release'`）中也不会显示；但分包仍会被打包上传，所以第 2 步不能省略。

## 字体授权

西文字体 Playfair Display、Caveat、Oswald 均为 SIL Open Font License 1.1 授权，已子集化并以 base64 形式放在分包 `pkg-fonts` 中。授权全文见 `licenses/fonts/`，小程序内「字体授权」页（`pkg-fonts/license/license`）同样可查看。
