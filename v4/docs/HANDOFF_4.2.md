# Mecha Marco 4.4.0 Handoff

版本：`4.4.0-vanguard-identity`

开发分支：`feat/v4-4a-vanguard-identity-og04`

Draft PR：https://github.com/yueert1997ai-sys/mecha-marco/pull/45

PR 状态：PM 第二轮功能验收已通过，当前执行 4.4.0 发布标记同步；继续保持 Draft，不直接合并，不进入 4.4B。

发布前提交链：`ba3305b6b9cb036c1fade64447d4482878e97a95` → `c8ca337fd3cba4844f31ae3794b0b5b52bf91d11` → `64833e6a4c6fbbfd3c99bf2b99b96ecafadcb6a8` → `e0f4005eddba0da4744153a6051ec01a3305ea7d` → `c9d13204d7cb13e3d0c223a42c5d0ccfe74d8967` → `85a6a4d940bcc68fd6a114cf43de06b9720c2705`。首个提交对象的真实父节点为 main `3c4a14994c4db35d0a53d5a128b12fe4e1c26e68`。

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
- 先锋机在 OG-04 具备刃势、短蓄偏转和反击射击身份循环；OG-04 保留真实障碍、任务标签、连接走廊和开关闸门。

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

自动 smoke 覆盖 956×440、844×390、932×430、896×414、852×393，并在每个尺寸进入实战验证任务目标；844×390 额外覆盖设置、军备、奖励、商店、事件、暂停、结算、分支与 Boss 信息叠层。Node 行为测试增加动作按钮与 move/aim 摇杆输入中断、clear capture 释放、设施伤害矩阵、OG-08 逃脱、设施门控、斩首增援、结算幂等、Service Worker 依赖闭包和弹窗滚动回归。

最终 `npm run verify` 结果：语法 84 项通过，Node 83/83，通过 20 个 Chromium / SwiftShader 浏览器场景；其中加速完整流程依次建立 OG-01～OG-12，处理奖励、分支、商店、事件、闸门转换并到达胜利结算。存档迁移覆盖 schema 5 / 6 / 7 的资源、涂装、设置、许可、套件、指令和熟练度。六张 4.3.2 截图已重新编码为真实 844×390 PNG，并由自动测试校验签名、IHDR 与尺寸：`qa-artifacts/4.3.2-base-844x390.png`、`4.3.2-settings-844x390.png`、`4.3.2-combat-844x390.png`、`4.3.2-shop-844x390.png`、`4.3.2-result-844x390.png`、`4.3.2-boss-844x390.png`。

4.3.1 证据：`qa-artifacts/4.3.1-base-844x390-dpr3.png`、`4.3.1-armory-goals-844x390-dpr3.png`、`4.3.1-defense-consequence-844x390-dpr3.png`、`4.3.1-damaged-shop-844x390-dpr3.png`、`4.3.1-result-causality-844x390-dpr3.png`。

## 未验证风险

- 实体 iPhone 17 Pro Max 的 30 分钟发热、功耗、内存、持续帧率与真实系统手势竞争。
- WebKit 前后台切换后的 WebGL Context 重建。
- Three.js CDN 在中国大陆弱网下的首次加载和 Canvas fallback 体验。
- 防守失败目前给出局内惩罚，没有独立失败分支；复杂群体寻路仍是局部职责 + 边界约束。

## 4.4.0 Issue #44 分支交接

- 基线：main `736c6dda090f744002a2d34656b21c254c347562`；PM 第二轮验收后正式发布标记同步为 `4.4.0-vanguard-identity`。
- 分支：`feat/v4-4a-vanguard-identity-og04`；仅实现先锋机在 OG-04 的身份循环和该关视觉纵切，不包含重装机、星翼机、其他关卡或正式 GLB。
- 战斗接口：`src/combat/vanguardIdentity44.js` 只新增一层 `Game.prototype.updateCombat` 包装；偏转接入敌人更新之后、投射物/军刀碰撞之前的 `beforeCombatDamageResolution` 钩子。
- 视觉接口：`src/render/og04IdentityVisual44.js` 暴露程序化组件描述和四状态设施映射，未来可将同名组件映射到 GLB 节点而不改碰撞。
- UI：`src/ui/vanguardIdentity44.js` 提供刃势细条、偏转状态和反击就绪提示，不增加触控按钮。
- 证据：`docs/QA_4.4A_ISSUE_44.md` 与 `docs/qa-artifacts/4.4A-og04-*.png`。
- 第二轮阻塞修复验证：语法 90 项、Node 104/104、既有 20 个 Chromium / SwiftShader 场景加 1 个 OG-04 844×390 专项审计全部通过。
- 非阻塞风险：OG-04 自定义背景仍会覆盖一次已经执行的通用场地绘制；实体 iPhone 仍需单独验证。
