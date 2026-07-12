# Mecha Marco 4.3 Handoff

版本：`4.3.1-consequence-progression`

开发分支：`codex/mobile-controls-viewport-level-polish`

Draft PR：[#42](https://github.com/yueert1997ai-sys/mecha-marco/pull/42)

## 当前事实

- 正式战斗保持纯俯视 Top-down 与上半身机体轮廓；第一章保持 12 段连续战线和战场内闸门推进。
- 手机只有一套布局：左移动；右主炮环拖曳瞄准/按住射击；推进和军刀处于高频区，挂载、超限处于外围。
- `mobileViewport42.js` 以 visual viewport 同步页面和 Canvas；页面级滚动锁定，过高弹窗仅内部滚动。
- 十二段不再只是清怪换皮：任务依次覆盖突破、回收、占领、破坏、防守、序列占领、过载、追击、伏击、闸门破坏、指挥编队与三阶段 Boss。
- 每段有独立 `shape`、`widthProfile`、地标和任务实体；玩家与敌人共同受动态边界约束。
- 路线后果跨段生效，并改变敌群、危险、维修、奖励、情报和 Boss 支援。
- 三台机体各有三套横向战术套件；六条风险指令最多选三条；十二份档案和机体熟练度承担长期目标，不增加永久裸属性。
- 构筑使用 6 个标准容量与 2 个核心容量；满载必须替换；协议在 2 件共鸣、4 件专精时改变动作。
- 侧向套件需要 8 / 24 机体熟练度认证后再消耗舰队数据，已解锁旧存档不会被回收。
- 战术回执负责即时说明任务结果与后续变化；补给失败、监察官逃脱和前庭斩首失败都有真实局内代价。
- 存档 schema 为 7，v6 及更早存档通过字段合并迁移。

## 关键文件

- `src/run/frontlineDepth43.js`：任务状态机、敌群职责、动态边界、路线/Boss 因果
- `src/data/frontlineDepth43.js`：套件、风险指令、档案数据
- `src/meta/frontlineProgress43.js`：购买、选择与解锁
- `src/ui/frontlineDepth43.js`：舰队整备、任务 HUD、容量替换和战报
- `src/render/frontlineDepth43.js`：十二段空间轮廓、地标与任务标记
- `frontline-depth43.css`：短横屏军备界面

## 不可回退方向

- 不恢复斜俯视、完整腿部战斗轮廓、每关路线页、多套手机布局或永久百分比科技树。
- 不把任务重新降级为文案、背景色或只加血量的精英。
- 不把 Chromium/SwiftShader 数据写成实体 iPhone 帧率。

## 验证

```bash
cd v4
npm run verify
```

自动 smoke 覆盖 956×440、844×390、932×430、896×414、852×393。当前 Node 测试 57/57。Browser Harness 已完成十二段加速流程；4.3.1 还在 844×390、DPR 3 下验证了 0/8/24 熟练认证、三节点纪念序列、补给失联应急商店、18 秒斩首成功/失败、Boss 增援允许/阻断、+18 熟练回执与结算因果首屏，页面、关键操作和 Canvas 同步断言均通过且无控制台异常。

4.3.1 证据：`qa-artifacts/4.3.1-base-844x390-dpr3.png`、`4.3.1-armory-goals-844x390-dpr3.png`、`4.3.1-defense-consequence-844x390-dpr3.png`、`4.3.1-damaged-shop-844x390-dpr3.png`、`4.3.1-result-causality-844x390-dpr3.png`。

## 未验证风险

- 实体 iPhone 17 Pro Max 的 30 分钟发热、功耗、内存、持续帧率与真实系统手势竞争。
- WebKit 前后台切换后的 WebGL Context 重建。
- Three.js CDN 在中国大陆弱网下的首次加载和 Canvas fallback 体验。
- 防守失败目前给出局内惩罚，没有独立失败分支；复杂群体寻路仍是局部职责 + 边界约束。
