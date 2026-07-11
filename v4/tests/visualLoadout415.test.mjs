import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildLoadoutVisual, getModuleVisualHint } from '../src/meta/loadoutProfile.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(file)=>readFile(path.join(root,file),'utf8');

test('module categories evolve visible mech hardware tiers',()=>{
  const modules=[
    {id:'beam-1',slot:'Primary',rarity:'common',tags:['beam']},
    {id:'beam-2',slot:'Primary',rarity:'rare',tags:['pierce']},
    {id:'dash-1',slot:'Dash',rarity:'rare',tags:['dash']},
    {id:'missile-1',slot:'Ordnance',rarity:'rare',tags:['missile']},
    {id:'armor-1',slot:'Passive',rarity:'common',tags:['armor']},
    {id:'duo-1',slot:'Duo',rarity:'duo',requires:['beam','saber']},
  ];
  const visual=buildLoadoutVisual(modules);
  assert.equal(visual.moduleCount,6);
  assert.equal(visual.beamTier,2);
  assert.equal(visual.mobilityTier,1);
  assert.equal(visual.ordnanceTier,1);
  assert.equal(visual.defenseTier,1);
  assert.equal(visual.duoCount,1);
  assert.ok(visual.labels.some((label)=>label.includes('主武装')));
  assert.match(getModuleVisualHint(modules[3]),/背包|挂舱/);
});

test('runtime retains loadout model evolution, arena detail and UI polish',async()=>{
  const main=await read('src/main.js');
  const model=await read('src/render/loadoutVisual415.js');
  const runtime=await read('src/combat/loadoutRuntime415.js');
  const ui=await read('src/ui/uiPolish415.js');
  const arena=await read('src/render/arenaDetail415.js');
  assert.match(main,/enhanceLoadoutVisual415/);
  assert.match(main,/applyLoadoutRuntime415/);
  assert.match(main,/applyUIPolish415/);
  assert.match(main,/applyArenaDetail415/);
  assert.match(model,/upgrade-shoulder/);
  assert.match(model,/upgrade-pod/);
  assert.match(model,/upgrade-fin/);
  assert.match(model,/upgrade-drone/);
  assert.match(runtime,/mecha-loadout-changed/);
  assert.match(ui,/LIVE LOADOUT PREVIEW/);
  assert.match(arena,/drawArena415/);
});

test('low-saturation loadout assets remain wired in continuous campaign',async()=>{
  const html=await read('index.html');
  const css=await read('visual415.css');
  const refine=await read('visual415-refine.css');
  const depth=await read('depth416.css');
  const campaign=await read('campaign42.css');
  const sw=await read('sw.js');
  const version=(await read('VERSION')).trim();
  assert.match(html,/visual415\.css/);
  assert.match(html,/visual415-refine\.css/);
  assert.match(html,/depth416\.css/);
  assert.match(html,/campaign42\.css/);
  assert.match(css,/low-saturation-glass/);
  assert.match(css,/\.loadout-dock/);
  assert.match(css,/\.dock-mech/);
  assert.match(refine,/\.shop-actions \.primary-cta/);
  assert.match(refine,/position:sticky/);
  assert.match(depth,/\.paint-selector416/);
  assert.match(depth,/\.settings-screen416/);
  assert.match(campaign,/\.campaign-progress42/);
  assert.match(campaign,/\.campaign-comms42/);
  assert.match(sw,/continuous-graveyard-r2/);
  assert.match(sw,/paintVariants416\.js/);
  assert.match(sw,/rogueTransform416\.js/);
  assert.match(sw,/regionOrbitalGraveyard42\.js/);
  assert.match(sw,/continuousCampaignPolish42\.js/);
  assert.equal(version,'4.2.0-continuous-graveyard');
});
