# Mecha Marco 4.2.1 Handoff

版本：`4.2.1-mobile-frontline-polish`
开发分支：`codex/mobile-controls-viewport-level-polish`
Draft PR：[#42](https://github.com/yueert1997ai-sys/mecha-marco/pull/42)
CI：Verify Web Build、Verify Mecha 4.0、Pages Live Smoke 全部通过。

## 当前事实

- 正式战斗保持纯俯视 Top-down 与上半身机体轮廓。
- 第一章保持 12 段连续战线；普通段清场后穿过物理闸门，不恢复每关全屏路线页。
- 手机只有一套布局：左移动摇杆；右主炮环按住射击、拖曳瞄准；推进/军刀在高频区，挂载/超限在外围。
- `mobileViewport42.js` 以 visual viewport 为准同步 `--app-width/--app-height`，页面级滚动被锁定；弹窗继续使用面板内部滚动。
- 输入按触点来源持有，pointer cancel/lost capture/旋转/后台恢复都会清理输入。
- 十二段各有独立空间与地面身份；身份阵列、输能带、核心外环包含真实可摧毁设施，实体障碍同时约束玩家和敌人。

## 不可回退方向

- 不恢复斜俯视、完整腿部战斗轮廓、每关路线页或多套手机布局。
- 不把设施目标重新降级为只换文案/背景色。
- 不把 Chromium/SwiftShader 结果写成实体 iPhone 帧率。

## 验证入口

```bash
cd v4
npm run verify
```

`browser-smoke` 跨 Windows/Linux 探测 Chrome/Chromium，覆盖 956×440、844×390、932×430、896×414、852×393，并检查页面溢出、关键按钮和 Canvas 同步。

## 未验证风险

- 实体 iPhone 17 Pro Max 30 分钟发热、功耗、内存和持续帧率。
- WebKit 前后台切换后的 WebGL Context 丢失与重建。
- 真机 Home Indicator 附近四指长按和系统手势竞争。
- Three.js CDN 在中国大陆弱网下的首次加载与 Canvas fallback 体验。
- 设施目标目前覆盖 3 个关键段，防守、追击和 Boss 房阶段地形仍可继续深化。

## 下一轮优先级

1. 实体 iPhone 长时间性能与多指压力。
2. 把维修栈桥做成可失败的区域防守，把监察官做成真正移动追击。
3. 增加 Boss 三阶段场地变化和核心闸门破坏。
4. 继续压缩移动端 HUD 并补正式音频资产与许可清单。
