# MyZine

把旅行照片做成照片书的微信小程序。原生小程序 + JavaScript，WebView 渲染，画布用 `canvas type="2d"`；纯本地运行，不联网、不登录、不用云开发。

需求见 `docs/MyZine需求文档.md`，各阶段方案、真机验证结论和离线预览图见 `docs/plans/`。

---

## 1. 项目结构

```
app.js / app.json / app.wxss       入口；app.globalData.album 是当前相册（只在内存中）
pages/
  index/        首页：书籍信息卡片、导入照片、拖动排序、开始制作 / 继续编辑 / 重新排版
  info/         书籍信息：书名、作者、同游人、地点、起止日期、想说的话
  templates/    模板选择（第一次开始制作、首页「模板」卡片）：纯色 / 风格 / 主题三组，按主题筛选
  editor/       编辑：顶部栏（参考线、导出）→ 画布（左右滑动翻页）→ 翻页行 → 页面缩略图条 → 标签栏（书籍信息 / 页面 / 模板 / 预览）；
                点照片框选中 → 换照片 / 拖动缩放 / 填满完整切换
  spreads/      「页面」：缩略图列表、拖动排序、插入 / 换版式 / 删除（风格在模板面板里换）
  preview/      立体翻书预览（flip.wxs 处理拖动翻页）
  export/       导出：PDF（分享版 / 打印版）、保存图片（单页 / 跨页）
components/
  photo-picker/ 照片选择面板（页码标签、全部 / 未使用、当前高亮）
  layout-picker/版式选择面板（按张数分组、示意图）
  style-sheet/  模板面板（编辑页底部弹出）：只换当前两页 / 换整本书，真实照片缩略图按需渲染
assets/
  icons/        界面图标（SVG 细线图标，24×24、线宽 1.6），颜色写在文件里，见下方「界面配色」
core/                               逻辑层（不依赖页面）
  album.js      相册数据、页列表 getPageList（页名、页码、照片编号、装饰词）、反色跨页样式
  photos.js     导入：chooseMedia → getImageInfo（EXIF 校正）→ 压缩图 + 缩略图 → 横 / 竖 / 方
  book.js       生成整本书：封面 → 扉页 → 正文（autoLayout）→ 封底
  autoLayout.js 自动排版：方向匹配 → 节奏（density）→ 加权轮换；风格偏好版式；反色跨页标记
  spreads.js    跨页增删、排序、换版式
  registry.js   版式 / 风格注册表、阅读顺序
  styleAssets.js渲染前加载风格素材（代码纹理、字形字体、分包图片）
  usage.js      照片用在哪些页（照片面板标签）
  bookInfo.js   书籍信息字段、日期格式
  devConfig.js  开发工具开关
  render/       渲染（编辑、缩略图、预览、导出共用）
    renderPage.js   统一渲染函数 renderPage(ctx, page, layout, style, size, images, options)
    renderSpread.js 跨页图（左右页画到一张 3:2 画布）
    spreadImages.js 跨页图片渲染器（离屏画布 → JPG，按内容缓存）
    frames.js       照片框最终形态：倾斜、边框、形状、票根副券
    decorations.js  背景、颗粒、页面装饰、照片框装饰分发
    decoText.js     装饰文字：文字槽（大标题 / 副标题 / 问候语 / 路牌）、页眉、照片编号
    glyphText.js    字形路径文字（西文）+ 系统字体（中文），同一行基线对齐
    svgPath.js      SVG 路径解析（M/L/H/V/C/S/Q/T/A/Z）
    doodles.js      线稿绘制
    ornaments.js    跨页装饰计划：1 个大装饰 + 2–3 个小装饰，同一跨页线稿不重复；小装饰的摆放
    scenery.js      程序生成的场景剪影：山脉、树林、海浪、城市天际线、丘陵
    seals.js        中式红色方印（地名竖排）、护照入境章
    paperBits.js    撕纸条（毛边 + 纸芯，写短句或地点日期）、行李吊牌（孔、麻绳、栏位、条形码）
    patterns.js     几何纹样：青海波、回纹、麻叶、七宝、波点、条纹、方格纸、点阵、横线信纸
    color.js        颜色解析、混色、降饱和
    textures.js     代码生成的纹理：颗粒、纸张、牛皮纸、报纸
    paperCraft.js   照片滤镜、票根、撕边垫纸、霓虹描边、半调网点
    postcard.js     邮票、邮戳（沿圆弧写字）、航空信封斜条
    themeDeco.js    餐盘沿、照片角线稿、格纹 / 栅栏页边、虚线路线
    text.js / photoGeometry.js / exif.js / imageLoader.js / hitTest.js
  export/       canvasFile.js（画布导出）、saveImage.js、exportBook.js、pdf.js（自写 PDF 生成器）
  ui/           sortable.js + sortable.wxs（拖动排序）
templates/                          模板数据（新增风格 / 版式 / 线稿只改这里）
  layouts/      parts.js（单页组件）、body.js（正文版式）、cover / title / back.js
  styles/       solids.js（纯色 8 种）+ 每个风格一个文件，index.js 汇总
  doodles/      线稿路径数据
  themes.js     12 个主题标签
pkg-fonts/      分包：MZ Playfair / MZ Caveat / MZ Oswald 字形数据 + 字体授权页
pkg-beach/      分包：「大海沙滩」图片素材（贴纸、纸胶带、便签纸、纸纹，Data URL 写在 assets.js 中，脚本生成）
pkg-snow/       分包：「冬日雪国」图片素材
pkg-cat/        分包：「喵呜时光」图片素材
pkg-dog/        分包：「小汪出游」图片素材
pkg-couple/     分包：「心动旅程」图片素材
pkg-family/     分包：「温馨时刻」图片素材
pkg-city/       分包：「城市漫游」图片素材
pkg-mountain/   分包：「山野湖光」图片素材
dev/            分包（开发用，提审前移除）：素材与滤镜验证页、线稿与字形预览页
scripts/        build-glyphs.py（生成字形数据）、build-stickers.py + packs/*.json（处理图片素材），均不进小程序包
licenses/fonts/ OFL 授权全文（不进小程序包）
docs/           需求文档、阶段方案（不进小程序包）
```

### 界面配色

- 界面颜色都是 `app.wxss` 中 `page` 上的 CSS 变量（暗房灰卡：背景 `#EBEBE8`、浮层 `#F6F6F4`、主文字 `#1E1F22`、次要文字 `#6B6E73`、靛蓝 `#2C3E66`、柯达黄 `#F5B800`、黄底文字 `#1B1B1B`、书页缩略图下的桌面 `#CDCDC8`）。
- 读不到 CSS 变量的地方要同步修改：
  - `core/uiColors.js`：画布上的选中框、缩略图空白半边、翻书舞台、删除按钮。
  - `app.json`、`pages/preview/preview.json`：导航栏颜色。
  - `assets/icons/*.svg`：图标线条颜色。大部分是主文字色 `#1E1F22`；`guides-on.svg` 是白色 `#FFFFFF`（叠在靛蓝底上）；`check-brand.svg` 是靛蓝 `#2C3E66`（「完成」）。
- 照片书模板本身的配色在 `templates/styles/`，和界面配色无关。

## 2. 渲染流程

```
getPageList(album)            每页：spreadId、side（left / right / full / single）、页名、页码、照片编号、装饰词
   ↓
loadRenderImages(loader, …)   照片（display / original / thumb）+ 代码纹理 + 字形字体
   ↓
renderPage / renderSpread     背景（+ 纹样）→ 大装饰 → 色块 → 装饰 → 照片框（垫纸 → 底板 → 照片 → 滤镜 → 票根）
                              → 胶带 / 邮票等 → 文字块 → 装饰文字 → 小装饰（线稿 / 方印 / 护照章）→ 页码 → 颗粒
   ↓
编辑页画布 / 跨页缩略图 / 翻书预览 / 导出（离屏画布 → JPG → PDF 或相册）
```

所有尺寸以单页 1080 宽为基准 px，渲染时按画布宽度换算，同一套代码输出 1080 宽（分享版）和 2480 宽（打印版）。

## 3. 如何新增风格

1. 在 `templates/styles/` 新建 `xxx.js`，导出风格对象；在 `templates/styles/index.js` 中加上 `require('./xxx')`。不需要改其他代码。
2. 常用字段（完整用法可参考现有风格文件）：

| 字段 | 说明 |
|---|---|
| `id` / `name` / `group` | 唯一 id、显示名、分组 `solid` / `style` / `theme` |
| `description` / `tags` | 模板页说明；适合主题（`templates/themes.js` 的 key） |
| `colors` | 配色。必需：`background` `text` `textMuted` `accent` `endpaper` `placeholder` `fitFill`；可加自定义键，其他字段用键名引用 |
| `fonts` | 封面 / 扉页文字块的角色字体：`title` `subtitle` `body` `caption`（系统字体） |
| `background` | `{ type: 'color' }` / `{ type: 'texture', texture: 'paper' \| 'kraft' \| 'newsprint' }`；可加 `pattern: { name, color, alpha, cell }` 整页低对比度纹样 |
| `grain` / `pagePalette` | 颗粒感；底色在跨页间轮换（左右页可不同） |
| `assetPack` | 图片素材分包名（见第 3.1 节）；背景、图片装饰写 `'pack:素材名'`，贴纸等写素材名 |
| `photoFrame` | `borderWidth` `borderColor` `bottomExtra`（拍立得）`shadow` `rotateJitter` `backing`（撕边垫纸）`ticketStub`（票根）`torn`（撕纸边照片：`chance` `minArea` `depth` `jag` `fiber`） |
| `photoFilter` | `[{ type: 'grayscale' }, { type: 'tint', color, mode, alpha }, { type: 'lightLeak' }]` |
| `frameDecorations` | `tape`（加 `images` 用纸胶带图片）`frameSticker`（照片角贴纸，每跨页最多 1 张）`stamp`（`stickers` 时邮票里画贴纸） `postmark` `dateStamp` `outline` `plateRim` `cornerDoodle` `tornStrip`（照片角撕纸条，每跨页最多 1 条）；`largestOnly`、`layer: 'frame'` |
| `decorations` | `rect` `line` `text` `perforation` `gutterLine` `halftone` `airmailBorder` `checkerBorder` `fenceBorder` `route` `patternBand`（纹样页边条）`patternBlock`（纹样色块）；`rect` 可加 `pattern`；`chance`、`mirror`、`pageTypes` |
| `doodles` | 线稿：`names` `perSpread`（没有 `ornaments` 时的数量）`size` `colors` `lineWidth` `rotate` `avoid`。同一跨页不重复 |
| `ornaments` | 跨页装饰计划（见 `core/render/ornaments.js` 文件头）：`big` 大装饰候选（`scenery` 剪影 / `pagePattern` 整页底纹 / `patternBand` / `patternBlock` / `deco` 任意页面装饰 / `wash` 水彩晕染 / `paperBand` 跨中缝撕纸色带 / `snowfall` 飘雪（`shape: 'heart'` 为飘落的小爱心）/ `pawTrail` 猫爪印小路，带 `weight`，放不下自动换下一个；`bigPerSpread` 每跨页几个）；`small` 小装饰类型（`doodle` / `seal` 方印 / `passport` 护照章 / `tornStrip` 撕纸条 / `luggageTag` 行李吊牌 / `sticker` 素材贴纸 / `note` 素材便签纸）；`smallPerSpread`，或 `smallByCoverage` 按照片覆盖率定数量；`tones` 跨页主色调；`stickerGroups` 贴纸主题组；`anchorChance` 贴纸贴在照片角上的比例；`pageTypes` |
| `frameAccents` | 本页最大照片上的点睛装饰每跨页选一种：`{ postal: 1, sticker: 2 }`，对应照片框装饰的 `accent` 键，只出现在一页上 |
| `wordPool` / `decoText` | 装饰词池（建议 20 个以上：整本书不重复，用完才重来）；`headline` `kicker` `greeting` `runningHeader` `index` 的内容和字体（`glyph: 'playfair' \| 'caveat' \| 'oswald'` 用字形路径）；`plate` 底牌、`dy` 下移 |
| `stripPool` | 撕纸条短句（建议 20 条，整本书不重复），和「地点 · 日期」轮换 |
| `pageNumber` | `{ show, glyph, size, color, format: 'pad2' }` |
| `layoutWeights` | 偏好版式：`{ 版式 id: 倍数 }`，≥ 2 时方框按完全匹配计分 |
| `darkVariant` | 反色跨页的深色配置（约每 5 个正文跨页一次） |

3. 变量：`{title} {location} {date} {year} {month} {word}`，任一为空整条不显示。西文用字形路径画（`uppercase` 只作用于西文），中文用系统字体；中西文混排的长标题请分行（见大海沙滩的 `greeting.lines`）。

### 3.1 图片素材分包（阶段 8a 起）

画布读不到分包里的图片文件，所以图片素材转成 Data URL 写进分包 JS 模块，渲染前用 `require.async` 加载，只解码当前跨页用到的图片。

1. 用 AI 生成合集图：**纯浅灰底（#C8C8C8）**，2 行 × 3 列，物件互不接触、不碰画面边缘，不要白描边和文字（提示词见 `docs/plans/阶段8a-大海沙滩试点.md` 第 5 节）。原图放在**项目文件夹外**的 `../MyZine素材/主题名/`（不进仓库；放在项目里会被开发者工具算进主包大小）。
2. 写配置 `scripts/packs/xxx.json`：每张图的文件、类型（`sticker` 贴纸自动加白描边 / `paper` 纸胶带便签纸 / `texture` 背景纸纹）、网格和每格的素材名（`null` 跳过该格）。相邻物件伸进本格的小碎片用 `dropSmall`（如 0.05）丢弃；半透明物件（如透明胶带）列进 `solid`，避免抠出破洞，绘制时用风格 `tape.alphas` 调透明度。
3. 运行 `python -I scripts/build-stickers.py scripts/packs/xxx.json --preview 输出目录`：生成 `pkg-xxx/img/素材名.js`（每张图一个文件）和汇总入口 `pkg-xxx/assets.js`，打印每个素材的大小，并输出检查拼图。不要把素材合成一个大文件：单个 JS 文件达到 1MB 以上时，预览上传会失败，报「系统错误 -80418」或 abort（2026-10-20 实测，拆成每张图一个文件后正常）。分包上限 2MB，脚本默认预算 1900KB。
4. 在 `app.json` 的 `subpackages` 中加 `{ "root": "pkg-xxx", "name": "xxx", "pages": [] }`，在 `core/render/assetPacks.js` 的 `LOADERS` 中加一行（`require.async` 路径必须是字面量）。
5. 风格文件写 `assetPack: 'xxx'`，再用素材名配置贴纸、纸胶带、便签纸和背景（参考 `templates/styles/beach.js`）。分包加载失败时，素材不画，胶带退回代码绘制。

## 4. 如何新增版式

1. 单页组件写在 `templates/layouts/parts.js` 的 `parts` 中，按**左页**书写（外侧在左，坐标为基准 px），右页自动镜像：
   ```js
   XX: p => [frame(`${p}1`, 96, 400, 912, 608, 'landscape', { shape: 'arch' })]
   // 带文字槽 / 色块时返回 { frames, slots: [slot('headline', x, y, w)], blocks: [block(x, y, w, h, color)] }
   ```
2. 在 `templates/layouts/body.js` 中组合：`pair('XX', 'L1', '名称', 自动排版权重, 'normal' | 'airy' | 'dense')`；跨中缝或跨页大图用 `spread(id, 名称, [跨页坐标的框…], 权重, density)`。
3. 照片框方向（横 / 竖 / 方）要与实际宽高比一致（> 1.1 横、< 0.9 竖）；版心外侧 96、内侧 72、上 96、下 120，单页版式不贴中缝（满版出血除外）。
4. 页内照片按「从上到下、从左到右」填充和编号，不用关心框的书写顺序。

## 5. 如何新增线稿

1. 在 `templates/doodles/index.js` 中加一条：`name: { name: '中文名', viewBox: [0, 0, 100, 100], mode: 'stroke' | 'fill', d: 'SVG 路径' }`。
2. 打开开发工具「线稿与字形预览」页检查效果（描边宽度会随画布换算，大小两种尺寸都看一下）。
3. 在风格的 `doodles.names` 或 `cornerDoodle.names` 中引用。

## 6. 西文字体（字形路径）

- iPhone 上 `wx.loadFontFace` 注册的字体不能用于 canvas 2d（真机验证，见 `docs/plans/阶段6.md`），所以西文装饰文字用**字形路径**绘制：`scripts/build-glyphs.py` 用 fonttools 把字形轮廓和字距导出为 SVG 路径数据（`pkg-fonts/*.js`，`require.async` 加载），`core/render/glyphText.js` 绘制。
- 重新生成：`python scripts/build-glyphs.py <字体源目录>`（源字体从 Google Fonts 官方仓库下载：`Caveat[wght].ttf`、`PlayfairDisplay[wght].ttf`、`Oswald[wght].ttf`）。
- 授权：来源字体均为 SIL Open Font License 1.1；依 OFL 保留名称条款，转换后的数据命名为 MZ Playfair / MZ Caveat / MZ Oswald。授权全文见 `licenses/fonts/`，小程序内「字体授权」页（`pkg-fonts/license/license`）同样可查看。

## 7. 真机验证结论（摘要）

| 项目 | 结论 | 记录 |
|---|---|---|
| 画布读取分包里的图片文件 | ❌ 不可用 | 阶段 5 |
| 分包 JS 模块 `require.async` | ✅ | 阶段 6 |
| Data URL 图片用于画布 | ✅（今后的图片素材用 base64 写进分包 JS） | 阶段 6 |
| `loadFontFace` 字体用于 canvas 2d | ❌（iPhone），改用字形路径 | 阶段 6 |
| `ctx.filter` | ❌ 没有该属性 | 阶段 7 |
| `saturation` / `screen` / `multiply` 混合 | ✅ | 阶段 7 |
| `shareFileMessage` 发送 18.6MB 打印版 PDF | ✅ | 阶段 4 |

以上均在 iPhone 上验证；**安卓尚未测试**（打开预览后转发、字形文字、滤镜等）。

## 8. 开发工具与提审前检查（必做）

开发用页面（素材与滤镜验证页、线稿与字形预览页）放在分包 `dev` 中，正式版不应包含：

1. 打开 `core/devConfig.js`，把 `DEV_TOOLS` 改为 `false`（首页不再显示开发工具入口）。
2. 打开 `app.json`，从 `subpackages` 中删除 `root` 为 `"dev"` 的那一项：
   ```json
   {
     "root": "dev",
     "name": "dev",
     "pages": ["check/check", "doodles/doodles"]
   }
   ```
3. 打开 `project.config.json`，确认 `packOptions.ignore` 中有 `{ "type": "folder", "value": "dev" }`。`dev/` 文件夹不再是分包后，如果不排除，它会被当作主包文件一起上传。
4. 在开发者工具中重新编译，确认首页底部没有「开发工具」字样，且「详情 → 基本信息」中的代码包大小里没有 `dev` 分包。

**当前状态（2026-10-18）**：以上步骤已完成，`dev/` 文件夹保留在仓库中但不打包。以后要用开发工具：把 `DEV_TOOLS` 改回 `true`，在 `app.json` 中加回 dev 分包，并从 `packOptions.ignore` 中删掉 dev。

即使忘记第 1、2 步，开发工具入口在正式版（`envVersion === 'release'`）中也不会显示；但分包仍会被打包上传，所以第 2、3 步不能省略。`dev/check/ttf/` 中的 TTF base64 只供验证页对照使用，随开发分包一起移除。

## 9. 已知限制

- 相册只在内存中，关闭小程序后不会保留（编辑页首次进入时会提示，导出页常驻提示）。
- 只支持 3:4 页面；不支持印刷出血（3mm）和 CMYK。
- 满版出血照片冲印裁切时边缘可能有细白边。
- 中式方印只刻地名里的汉字；地名含英文字母（如 Kyoto）或为空时不画方印。汉字用系统衬线粗体，没有篆书字体。
