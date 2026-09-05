# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

「玉兔奔月｜月宫大冒险」——为小红书小工具平台打造的中秋主题竖屏跑酷小游戏。纯本地 HTML5，**无构建、无测试、无依赖、无网络请求**；全部美术与音效由 Canvas / Web Audio 程序生成，零外部资源，包体约 172KB。

## 常用命令

静态服务即可运行（无构建/lint/test 脚本，不要去找）：

```bash
python3 -m http.server 8765   # 打开 http://127.0.0.1:8765
```

浏览器 DevTools 切移动端视口（375×812）体验最佳；`window.xhs` 不存在时自动进入浏览器降级模式。

打包/上架前的合规审计与 zip 打包使用 `.skill/minitool-zip-builder/scripts/audit_artifact.mjs`（或 `.py`）。平台约束一律以 `.skill/minitool-zip-builder/SKILL.md` 及其 reference 为准（写 HTML 先读 `zip-artifact-spec.md`，调 JS 先读 `js-compatibility.md`，调端 API 先读 `jsbridge-api.md`）。

## 平台约束（改任何代码前必读）

面向小红书小工具容器，基线为 Android 8.1 出场 Chrome / WebView 61：

- **ES2017 子集**：禁止 `?.`、`??`、`Array.flat`、async/await、可选参数/对象展开等新语法。无 fetch/XHR、无 Worker/WASM/iframe、无 CDN 与任何网络资源，所有资源必须打包在 zip 内
- **无行内事件**：全部 `addEventListener`，JS 全部外置 `.js`，`index.html` 内无 `<script>` 内联逻辑
- **端能力检测**：`window.xhs.miniTool` 的调用统一封装在 `js/xhs.js`；不可用时游戏照常运行（保存走下载提示）。新增端能力调用必须走该层并做能力检测
- **配置不用 JSON**：容器禁 fetch 导致本地 JSON 无法读取，所有数值配置以全局变量 `window.YT_DATA` 注入（`data/game.js`）

## 架构

### 模块组织：IIFE + 全局命名空间

每个 JS 文件是一个 IIFE，向 `window.YT` 挂载一个模块（Util/Store/Audio/Sprites/Player/Obstacles/Items/FX/Render/Score/Skins/Skills/Daily/XHS/Result/UI/Game/App），模块间经 `YT` 互相调用，无 import/require。新增模块照此模式。

**脚本加载顺序即依赖顺序**（见 `index.html` 底部）：`data/game.js` 最先（定义 `window.YT_DATA`，几乎所有模块依赖它），`js/app.js` 最后（唯一入口，末尾 `YT.App.boot()` 启动）。新增 JS 文件必须插在其依赖的模块之后、`app.js` 之前。

### 数据流与主循环

1. `YT.App.boot()`（`js/app.js`）：`YT.Store.load()` → `YT.UI.init()` → `YT.Game.init()` → 启动 `requestAnimationFrame` 主循环
2. 主循环：每帧 `dt = min((ts-last)/1000, 0.05)`（上限 50ms，切后台回来不瞬移）→ `YT.Game.update(dt)`
3. 更新（`js/game.js`）：状态机 `IDLE / COUNTDOWN / PLAYING / PAUSED / ENDING`，处理输入、难度插值、事件生成、碰撞、彩蛋、HUD
4. 渲染：`Game.renderFrame()` 组装 `g` 快照对象，交给 `YT.Render.drawBG / drawGround / drawWorld`

### 渲染与坐标

- 双层 Canvas：`cv-bg`（静态天空/月相/视差）+ `cv-game`（动态世界），由 `YT.Render.init` 挂接
- **逻辑坐标系**：固定高 1334（`YT.Render.H`），`scale = cssH / 1334`，逻辑宽随之缩放；地面顶 `groundY = 1150`。DPR 自适应上限 2x
- 视觉元素全部由 `YT.Sprites` 程序化绘制并离屏缓存（`sprites.js`）

### 存档

`js/storage.js`：单 key `yutu_benyue_save_v1` 存 localStorage。`DEFAULTS` 即存档 schema，`YT.Store.state` 是唯一读写入口，每次保存整个 state。**新增存档字段必须同步加入 `DEFAULTS`**（load 时对旧存档做深合并）。

### 每日挑战与随机

`util.js` 的 `YT.LCG(seed)` 线性同余伪随机（`daily.js` 用固定种子生成当日关卡日程）——同一天关卡完全一致、可复现、离线。日常生成与彩蛋判定混用 `Math.random`。**修改事件生成逻辑时勿破坏"同天同关"的可复现性**。

### 数值平衡

所有分数/称号/成就/皮肤/技能/关卡数值集中在 `data/game.js`（`window.YT_DATA`）。调平衡只改这一个文件，不碰 `js/` 逻辑。

## 上架注意

- 上传前的最终校验与打包依据，是平台上传页当前的「改写口令」及对应版本 `SKILL.md`
- 打包根目录全部静态文件为 zip；产物 zip 已加入 `.gitignore`
- 真机须验证三项端能力：保存相册、临时文件、发布笔记
