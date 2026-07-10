# Mecha Marco / 天穹断刃

纯网页 2.5D 超级系机甲动作肉鸽实验项目，面向 iPhone Safari 与桌面浏览器。

## 在线入口

- 正式入口：`https://yueert1997ai-sys.github.io/mecha-marco/`
- 4.0 直接入口：`https://yueert1997ai-sys.github.io/mecha-marco/v4/`
- v3.2 旧版回退：`https://yueert1997ai-sys.github.io/mecha-marco/v3/`

仓库根目录会自动进入 4.0；旧版运行资源仍保留，便于兼容问题回退。

## 4.0 当前纵切

- 三台差异化机体
- 五个战斗动作槽位
- 模块与组合协议构筑
- 可预判奖励的房间路径
- 普通战、精英战、商店、维修、事件与三阶段首领
- 基地、永久资源、战役记录与条件对话
- 键鼠与 iPhone 横屏触控

4.0 代码位于 `v4/`，设计基线见 `docs/HADES_ARCHITECTURE_4.0.md`，验收记录见 `v4/docs/QA_REPORT_4.0.md`。

## 自动检查

GitHub Actions 会检查：

- 根目录是否正确路由到 4.0
- v3.2 回退入口与资源路径
- v3 运行代码语法
- v4 全部 ES 模块语法
- v4 静态资源与 PWA 文件
- Chromium 实际加载 v4 模块并生成 smoke readiness 标记

## 当前边界

4.0 是可持续迭代的核心纵切，还未达到完整 Steam 发行版本。后续重点是场景美术、障碍导航、音频资产、真机压力测试和更多内容生产。
