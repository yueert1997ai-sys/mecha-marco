# 4.4B OG-04 Painterly Scene Pipeline QA

Scope: GitHub Issue #46 only. This prototype does not change Vanguard combat rules, save schema, any other stage, the formal version markers, the page title, or the Service Worker cache identifier.

## Runtime architecture

`src/render/painterlyScene44b.js` owns a data-driven Canvas scene renderer. `src/main.js` performs one import and one apply call. The module adds no `Game.prototype.updateCombat` wrapper and does not edit `game.js`.

The ordered manifest contract is:

| Order | Role | Draw phase | High | Medium | Low |
| --- | --- | --- | --- | --- | --- |
| 1 | background | before actors | yes | yes | yes |
| 2 | far | before actors | yes | yes | yes |
| 3 | mid | before actors | yes | yes | no |
| 4 | playfield | before actors | yes | yes | yes |
| 5 | foreground | after actors and effects, before damage numbers | yes | no | no |
| 6 | atmosphere | after actors and effects, before damage numbers | yes | yes | no |

Each layer owns `src`, two-axis `anchor`, `scale`, `opacity`, two-axis `parallax`, `fit`, `blend`, `minTier`, and `fallback`. `safeCrop.focus` clamps cover placement so landscape viewports never expose an empty edge. `safeCrop.protectedArea` documents the combat-safe center; the foreground asset also carries a baked alpha safety mask.

The existing 4.4A OG-04 arena pass is suppressed only while the 4.4B scene draws. The earlier continuous-campaign arena still runs underneath before the full background plane covers it. This preserves the current wrapper order without rewriting the renderer, but leaves one known overdraw pass.

## Asset boundary

All five WebP files in `assets/scenes/og04/` are original temporary assets created from text-only art direction. The supplied third-party reference image, its logos, pixels, structures, and composition are not present in the repository.

The far, mid, foreground, and atmosphere planes have real alpha channels. This avoids runtime black-background blend passes and makes the layers directly replaceable. Final art only needs to replace:

- `background.webp`
- `far.webp`
- `mid.webp`
- `foreground.webp`
- `atmosphere.webp`

If art direction changes crop, visual weight, or depth speed, update only `scene.json`; combat code remains unchanged.

## Gameplay readability evidence

- Four collision obstacles are rendered from `stage.spatial.obstacles`, not painted collision guesses.
- Three identification nodes are rendered from `facilities42` and expose intact, active, heavy-damage, and destroyed states.
- Hazards, enemies, player, projectiles, damage numbers, the closed gate, open gate, and northward prompt remain above or within the protected combat area.
- The foreground alpha safety mask keeps the center clear and confines large dark debris to the perimeter.
- The player silhouette occupies a small fraction of the frame while the broken wreck spans the far plane.

## Automated evidence

The browser audit is Chromium with SwiftShader and is not a physical iPhone performance test.

| Evidence | Artifact |
| --- | --- |
| 4.4A / 4.4B same-camera comparison | `4.4B-og04-before-844x390.png`, `4.4B-og04-after-844x390.png` |
| Required phone viewports | `4.4B-og04-after-844x390.png`, `4.4B-og04-after-956x440.png` |
| Gate closed / open | `4.4B-og04-exit-closed-844x390.png`, `4.4B-og04-exit-open-844x390.png` |
| Four facility states | `4.4B-og04-facility-intact-844x390.png`, `4.4B-og04-facility-active-844x390.png`, `4.4B-og04-facility-heavy-damage-844x390.png`, `4.4B-og04-facility-destroyed-844x390.png` |
| Missing far image fallback | `4.4B-og04-missing-far-fallback-844x390.png` |
| Low-tier Canvas fallback | `4.4B-og04-low-tier-canvas-844x390.png` |

`tests/painterlyScene44b.test.mjs` validates layer order, independent controls, crop placement, quality tiers, missing-image behavior, and the absence of a new combat wrapper. `tests/qaAssets44b.test.mjs` validates WebP signatures and all required PNG signatures and dimensions. The browser audit validates the same runtime states before writing evidence.

## Performance and residual risk

- Five decoded 1792×828 RGBA planes can occupy roughly 28 MiB before browser overhead, even though medium and low tiers skip drawing some planes. Tier-aware lazy loading is a future optimization, not part of Issue #46.
- High quality adds four full-screen image draws around the existing playfield; the foreground and atmosphere are omitted on low quality.
- The continuous campaign renderer still performs one covered arena draw on OG-04 because this issue forbids a core rewrite.
- Safari WebP decode, memory pressure, rotation recovery, thermal throttling, and touch readability still require a physical iPhone pass.
- Temporary art needs final art-director replacement before calling the scene production-final.
