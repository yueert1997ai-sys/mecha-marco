import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(file)=>readFile(path.join(root,file),'utf8');

test('mobile feel patch improves stick response, boost fire and combat camera',async()=>{
  const source=await read('src/combat/mobileFeel42.js');
  const main=await read('src/main.js');
  assert.match(source,/curveStick/);
  assert.match(source,/length\(output\) > \.18/);
  assert.match(source,/updateBoostFire/);
  assert.match(source,/lookAhead/);
  assert.match(source,/this\.height \* \.58/);
  assert.match(main,/applyMobileFeel42/);
  assert.match(main,/4\.1\.1-controls-camera-polish/);
});

test('3D tuning adds readable anime-mecha posture and lock feedback',async()=>{
  const source=await read('src/render/mech3dTuning41.js');
  assert.match(source,/addMechanicalDetails/);
  assert.match(source,/flatShading=true/);
  assert.match(source,/buildTargetReticle/);
  assert.match(source,/selectTarget/);
  assert.match(source,/entry\.root\.rotation\.y=-\.08-side\*\.18/);
});
