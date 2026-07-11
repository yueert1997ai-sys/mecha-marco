import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(file)=>readFile(path.join(root,file),'utf8');

test('mobile feel patch improves stick response, boost fire and arena entry',async()=>{
  const source=await read('src/combat/mobileFeel42.js');
  const main=await read('src/main.js');
  assert.match(source,/curveStick/);
  assert.match(source,/length\(output\) > \.18/);
  assert.match(source,/resetInsideArena/);
  assert.match(source,/Math\.min\(position\.y,3\.55\)/);
  assert.match(source,/updateBoostFire/);
  assert.match(main,/applyMobileFeel42/);
  assert.match(main,/drawMechWithWebGLFallback/);
  assert.match(main,/dataset\.mechRender = 'webgl'/);
});

test('3D tuning adds readable posture, lock feedback and low-cost mobile crowds',async()=>{
  const source=await read('src/render/mech3dTuning41.js');
  const enhance=await read('src/render/mechLiteEnhance42.js');
  const main=await read('src/main.js');
  const sw=await read('sw.js');
  assert.match(source,/addMechanicalDetails/);
  assert.match(source,/flatShading=true/);
  assert.match(source,/buildTargetReticle/);
  assert.match(source,/selectTarget/);
  assert.match(source,/coarse\?\.9:1\.5/);
  assert.match(source,/buildLiteEnemy/);
  assert.match(source,/liteEnemyDesign/);
  assert.match(source,/!isPlayer&&!actor\.elite&&!actor\.boss/);
  assert.match(enhance,/liteEnemyEnhanced/);
  assert.match(enhance,/parts\.arms\.push/);
  assert.match(main,/enhanceLiteEnemies42/);
  assert.match(sw,/mechLiteEnhance42\.js/);
});

test('top-down view keeps upper-body silhouettes while 4.1.5 adds visual loadouts',async()=>{
  const camera=await read('src/render/topdownCamera.js');
  const pose=await read('src/render/topdownMechPose.js');
  const main=await read('src/main.js');
  const sw=await read('sw.js');
  const version=await read('VERSION');
  assert.match(camera,/worldToScreenTopDown/);
  assert.match(camera,/screenToWorldTopDown/);
  assert.match(camera,/drawArenaTopDown/);
  assert.match(camera,/drawLayoutTopDown/);
  assert.doesNotMatch(camera,/shear/);
  assert.doesNotMatch(camera,/platformDepth/);
  assert.match(pose,/LEG_MESH/);
  assert.match(pose,/leg\.hip\.visible=false/);
  assert.match(pose,/topDownSilhouette/);
  assert.match(pose,/topdown-rear-deck/);
  assert.match(pose,/entry\.root\.rotation\.z=-aim-Math\.PI\*\.5/);
  assert.match(pose,/entry\.root\.rotation\.x=\.025/);
  assert.match(pose,/entry\.root\.rotation\.y=0/);
  assert.match(pose,/reticle\.scale\.y=reticle\.scale\.x/);
  assert.match(main,/applyTopDownCamera/);
  assert.match(main,/applyTopDownMechPose/);
  assert.match(main,/enhanceLoadoutVisual415/);
  assert.match(main,/dataset\.combatView = 'topdown'/);
  assert.match(main,/dataset\.mechSilhouette = 'upper-body'/);
  assert.match(main,/4\.1\.5-visual-loadout-pass/);
  assert.match(sw,/topdownCamera\.js/);
  assert.match(sw,/topdownMechPose\.js/);
  assert.match(sw,/loadoutVisual415\.js/);
  assert.equal(version.trim(),'4.1.5-visual-loadout-pass');
});
