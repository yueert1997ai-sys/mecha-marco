import test from 'node:test';
import assert from 'node:assert/strict';
import { computeMechRig, sampleSaberSweep, verifyRigAlignment } from '../src/combat/hardpointRig.js';

const actor = { id:1, x:2, y:-1, aim:.37, yaw:.37, speed01:0, primaryKick:0, saberPhase:0, hitVisual:{back:0,side:0} };

test('rifle muzzle is derived from right-hand weapon chain', () => {
  const rig = computeMechRig(actor);
  const check = verifyRigAlignment(actor);
  assert.ok(check.muzzleForward);
  assert.ok(check.muzzleLateralError < 1e-8);
  assert.ok(Math.hypot(rig.muzzle.x-actor.x,rig.muzzle.y-actor.y) > 1.2);
  assert.ok(Math.hypot(rig.muzzle.x-rig.forearmR.x,rig.muzzle.y-rig.forearmR.y) > .9);
});

test('saber sweep produces meaningful articulated motion', () => {
  const points = sampleSaberSweep({...actor}, 11);
  const first = points[0];
  const last = points.at(-1);
  assert.ok(Math.hypot(last.x-first.x,last.y-first.y) > 1.4);
  const unique = new Set(points.map((p)=>`${p.x.toFixed(3)}:${p.y.toFixed(3)}`));
  assert.ok(unique.size >= 9);
});
