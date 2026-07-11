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

test('Hades 2.5D view uses an oblique arena and keeps mechs upright before matrix calculation',async()=>{
  const camera=await read('src/render/hades25dCamera.js');
  const pose=await read('src/render/hades25dMechPose.js');
  const main=await read('src/main.js');
  const sw=await read('sw.js');
  const version=await read('VERSION');
  assert.match(camera,/shear:0\.30/);
  assert.match(camera,/yScale:0\.58/);
  assert.match(camera,/screenToWorldHades25D/);
  assert.match(camera,/drawArenaHades25D/);
  assert.match(camera,/platformDepth:18/);
  assert.match(camera,/drawLayoutHades25D/);
  assert.match(pose,/signedScreenAngle/);
  assert.match(pose,/liveActors/);
  assert.match(pose,/actor\.yaw=-Math\.PI\/2\+clamp\(screenAngle\*\.04,-\.07,\.07\)/);
  assert.match(pose,/actor\.primarySpreadVisual=clamp\(-screenAngle\/3,-\.52,\.52\)/);
  assert.match(pose,/reticle\.geometry\.scale\(1,\.46,1\)/);
  assert.match(pose,/finally/);
  assert.match(main,/applyHades25DCamera/);
  assert.match(main,/applyHades25DMechPose/);
  assert.match(main,/dataset\.combatView = 'hades25d'/);
  assert.match(main,/4\.1\.2-hades25d-view/);
  assert.match(sw,/hades25dCamera\.js/);
  assert.match(sw,/hades25dMechPose\.js/);
  assert.equal(version.trim(),'4.1.2-hades25d-view');
});
