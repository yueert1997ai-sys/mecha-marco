# Mecha Marco Agent Rules

## Current source of truth

- Runtime: `v4/`
- Version: `v4/VERSION`
- Current design: `docs/MECHA_MARCO_DESIGN_4.2.md`
- Region implementation: `v4/docs/REGION_01_ORBITAL_GRAVEYARD_4.2.md`
- QA and risks: `v4/docs/QA_REPORT_4.0.md`
- Handoff: `v4/docs/HANDOFF_4.2.md`

## Required invariants

- Keep combat pure Top-down with upper-body mech silhouettes; do not restore oblique combat or full front-facing legs.
- Keep one unified mobile layout and the continuous 12-stage campaign; ordinary clears open a physical gate instead of returning to a route screen.
- Weapon effects originate from Hardpoint Rig nodes, melee keeps visible motion, and enemies keep hit reactions.
- Do not describe Chromium/SwiftShader measurements as physical iPhone performance.
- Keep VERSION, package.json, index title, main runtime marker, Service Worker cache, README, design, QA, changelog and Actions checks aligned.

## Validation

```bash
cd v4
npm run verify
```

The verification command is cross-platform and includes syntax, Node systems, five mobile landscape browser sizes, critical-button visibility and Canvas/viewport synchronization.
