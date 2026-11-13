# 游戏想法合集 Game Ideas Collection

一些游戏与互动原型的合集：地铁题材小游戏 × 2、共享单车通勤游戏、风控主题互动叙事页，以及一套五城地铁图生成工具。

## 项目总览

| 目录 | 项目 | 类型 | 打开方式 |
|---|---|---|---|
| [`last-train-home/`](last-train-home/) | 末班车 Last Train Home | React 19 + Vite 游戏（乘客 / 司机双模式） | `npm install && npm run dev` |
| [`metro-puzzle/`](metro-puzzle/) | 地铁拼图师 | React 19 + Vite 拼图游戏 | `npm install && npm run dev` |
| [`last-mile-game/`](last-mile-game/) | 最后一公里 | 共享单车通勤游戏 · 单文件 HTML 可玩版 | 浏览器打开 `game.html` |
| [`metro-puzzle-maker/`](metro-puzzle-maker/) | 地铁拼图师 · 北京环城记 | 静态 HTML 三个迭代版（环线版 / 四线版 / 三幕解谜版） | 浏览器打开 `pages/puzzle-v3.html` |
| [`digital-border/`](digital-border/) | 数字边境 | 风控主题互动叙事页 ×2 + 三版设计稿 | 浏览器打开 `数字边境.html` 或 `我是风控系统.html` |
| [`metro-map/`](metro-map/) | 五城互联地铁图 | Python 生成器 + 北京/上海/广州/深圳/香港 JSON 数据 | 浏览器打开 `huaxia-metro-map.html`；重新生成：`python build_map.py` |

## 各项目简介

### 🚇 末班车 Last Train Home
地铁题材游戏，带完整游戏引擎（驱动 / 引擎 / 网络 / 音效模块）。三种模式路由：
- `/` 模式选择首页
- `/passenger` 乘客模式
- `/driver` 司机模式

技术栈：React 19 + TypeScript + Vite + Tailwind CSS + Radix UI。

### 🧩 地铁拼图师（React 版）
单页拼图游戏，为静态版玩法基础上重制的 React 实现。

### 🚲 最后一公里 Last Mile
早高峰打工人视角：5 分钟倒计时内完成「找共享单车 → 验车（车况盲盒）→ 开锁 → 骑行（红绿灯 / QTE）→ 打卡」全流程。核心乐趣是车况盲盒与时间压力下的决策。
- `game.html` 完整可玩版（手机竖屏 390×844）
- `design-spec.md` 设计 Spec，`design-demos/` 四版设计方向稿 + 截图

### 🗺️ 地铁拼图师 · 北京环城记（静态版）
同一玩法的三个静态迭代版本：
- `pages/puzzle.html` 2 号线环线版（18 站）
- `pages/puzzle-v2.html` 四线全图版（1/2/4/5 号线 · 80 站 · 每站城市故事）
- `pages/puzzle-v3.html` 三幕解谜版

### 🛂 数字边境 Digital Border
风控系统主题的互动叙事：
- `数字边境.html` ——「一份永远打回的受理单」（纸面档案风格）
- `我是风控系统.html` ——「一份没有标准答案的判断记录」（终端风格）
- `design-demos/` 三个设计方向的初稿与评审截图

### 🌆 五城互联地铁图
用高德官方线图格式的 JSON 数据（`metro-data/`）生成北京、上海、广州、深圳、香港五城互联轨道交通图（`huaxia-metro-map.html`）。改数据后运行 `python build_map.py` 即可重新生成。

## 目录结构

```
game-ideas-collection/
├── last-train-home/      # 末班车（React 工程）
├── metro-puzzle/         # 地铁拼图师（React 工程）
├── last-mile-game/       # 最后一公里（HTML 原型 + 设计稿）
├── metro-puzzle-maker/   # 地铁拼图师静态版（HTML 迭代）
├── digital-border/       # 数字边境（HTML 互动叙事）
└── metro-map/            # 五城地铁图（Python 生成器 + 数据）
    ├── build_map.py
    ├── huaxia-metro-map.html   # 生成结果
    └── metro-data/             # 五城线路 JSON
```
