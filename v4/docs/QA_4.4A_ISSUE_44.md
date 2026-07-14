# 4.4A Issue #44 QA 记录

## 范围与基线

- 执行源：GitHub Issue #44《4.4A：先锋机身份循环 + OG-04 玩法与视觉纵切》。
- main 基线：`736c6dda090f744002a2d34656b21c254c347562`。
- 开发分支：`feat/v4-4a-vanguard-identity-og04`。
- 正式版本保持 `4.3.2-stability-pass`；未改 VERSION、页面标题或 Service Worker 缓存版本。
- 未开发重装机、星翼机、其他关卡或正式 GLB。

## 玩家操作循环

1. 在 OG-04 使用先锋机，以主炮和普通军刀有效命中累积刃势。
2. 轻触军刀仍执行普通斩击；按住 180ms 进入偏转姿态，不增加按钮。
3. 有效窗口内偏转敌方投射物或军刀，攻击被移除，刃势 +28，获得 3 秒反击资格。
4. 刃势至少 35 时，下一次主炮自动消耗资格与 35 刃势，发射 2.2 倍伤害、至少 3 层贯穿的反击射击。
5. 首次偏转、首次达到 60 刃势、首次反击各触发一次与真实行为绑定的短通讯。

## 自动化证据

- Node 专项回归覆盖：3 / 8 / 28 获得、0–100 限制、2.5 秒延迟衰减、轻触/短蓄/失败回退、投射物与军刀单次偏转、炮击和 Boss 全屏排除、35 点消耗、2.2 倍伤害、至少 3 层贯穿、3 秒过期不扣除、输入清理、schema 7 不变、非先锋/非 OG-04 回归、设施命中、通讯单次触发和四状态映射。
- 844×390 Chromium / SwiftShader 浏览器模拟直接进入 OG-04，验证 HUD 在视口内且不遮挡任务目标，并在真实运行时完成一次“短蓄 → 偏转 → 反击”链路。
- 既有完整 verify 继续覆盖五组手机横屏、所有阻塞弹窗、12 段加速流程、三节点摧毁门控、中央节点情报欺骗、存档迁移与 Service Worker import closure。

## 844×390 PNG 证据

- 改造前：`qa-artifacts/4.4A-og04-before-844x390.png`
- 改造后：`qa-artifacts/4.4A-og04-after-844x390.png`
- intact：`qa-artifacts/4.4A-og04-facility-intact-844x390.png`
- active：`qa-artifacts/4.4A-og04-facility-active-844x390.png`
- heavy-damage：`qa-artifacts/4.4A-og04-facility-heavy-damage-844x390.png`
- destroyed：`qa-artifacts/4.4A-og04-facility-destroyed-844x390.png`

以上文件均由测试校验 PNG 签名、IHDR 与 844×390 尺寸。

## 改造前后

| 项目 | 改造前 | 4.4A |
| --- | --- | --- |
| 场地基底 | 高亮完整矩形边框与均匀网格 | 深靛紫/紫黑负空间与断裂边界 |
| 地标 | 规则扫描器与同构节点 | 单侧巨构残骸、残缺弧线、三座不等高识别塔 |
| 设施反馈 | 血条与死亡叉线 | intact / active / heavy-damage / destroyed 四态 |
| 战斗读数 | 通用 HUD | 右上细条刃势、偏转窗口与反击就绪，不新增按钮 |
| 玩法 | 三节点摧毁 + 情报欺骗 | 原任务保持，先锋额外获得身份动作循环 |

## 架构与风险

- 4.4A 只新增一层 `Game.prototype.updateCombat` 包装；没有新增 `updateProjectiles` 或 `updateSlashes` 包装。
- 主炮、军刀和设施有效命中通过窄包装记录刃势，运行态不写入存档，因此 schema 7 不变。
- 程序化 OG-04 绘制覆盖旧场地绘制结果，避免修改通用场景和碰撞；代价是当前仍执行一次旧 OG-04 drawArena，后续若进入 4.4B 可在不改玩法的前提下增加专用渲染分派，减少被覆盖的绘制成本。
- 为保持 Issue 边界，Service Worker 仅补齐新模块 precache 清单，缓存版本未变；正式发布前必须由 PM 决定是否随正式版本统一提升缓存键。

## 实体 iPhone 未验证

- Safari 真实触控下 180ms 临界值、长按手感、系统手势竞争和多指同时操作。
- 30 分钟发热、功耗、内存、持续帧率与 WebGL context 恢复。
- Home Indicator、安全区和不同显示缩放下 HUD 的最终可读性。
- 扬声器/振动反馈与偏转窗口的主观同步感。

Chromium / SwiftShader 结果仅是浏览器模拟测试，不是实体 iPhone 性能结论。

## 最终验证结果

- `npm run syntax`：90 个 JavaScript / MJS 文件通过。
- `npm test`：100 / 100 通过。
- `npm run browser-smoke`：五组横屏基地与实战、九类 844×390 阻塞叠层、12 段加速流程和 1 个 OG-04 844×390 身份循环/截图审计全部通过。
