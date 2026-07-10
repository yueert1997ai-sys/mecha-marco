import { add, fromAngle, mul, rotate, TAU } from '../core/math.js';

const localPoint = (root, yaw, x, y) => add(root, rotate({ x, y }, yaw));

export function computeMechRig(actor, time = 0) {
  const root = { x: actor.x, y: actor.y };
  const yaw = actor.aim ?? actor.yaw ?? 0;
  const stride = Math.sin(time * 12 + (actor.id || 0)) * Math.min(1, actor.speed01 || 0) * 0.16;
  const recoil = actor.primaryKick || 0;
  const hit = actor.hitVisual || { back:0, side:0 };
  const torsoYaw = yaw + (hit.side || 0) * 0.12;
  const bodyShift = rotate({ x: -(hit.back || 0) * .16, y: (hit.side || 0) * .08 }, yaw);
  const body = add(root, bodyShift);

  const shoulderR = localPoint(body, torsoYaw, .15, .55);
  const shoulderL = localPoint(body, torsoYaw, .15, -.55);
  const primaryAim = yaw + (actor.primarySpreadVisual || 0);
  const forearmR = add(shoulderR, fromAngle(primaryAim, .66 - recoil * .13));
  const rifleBase = add(forearmR, fromAngle(primaryAim, .18));
  const muzzle = add(rifleBase, fromAngle(primaryAim, .92));

  let saberAngle = yaw - .28;
  let saberReach = .72;
  const saberPhase = actor.saberPhase || 0;
  if (saberPhase > 0) {
    const t = Math.min(1, saberPhase);
    const eased = 1 - (1 - t) ** 3;
    saberAngle = yaw - 2.1 + eased * 3.6;
    saberReach = .92 + Math.sin(t * Math.PI) * .25;
  }
  const forearmL = add(shoulderL, fromAngle(saberAngle, .58));
  const saberBase = add(forearmL, fromAngle(saberAngle, .18));
  const saberTip = add(saberBase, fromAngle(saberAngle, saberReach));

  const hipR = localPoint(body, torsoYaw, -.28, .28);
  const hipL = localPoint(body, torsoYaw, -.28, -.28);
  const legAngleR = torsoYaw + .03 + stride;
  const legAngleL = torsoYaw - .03 - stride;
  const kneeR = add(hipR, fromAngle(legAngleR + Math.PI, .48));
  const kneeL = add(hipL, fromAngle(legAngleL + Math.PI, .48));
  const footR = add(kneeR, fromAngle(legAngleR + Math.PI, .48));
  const footL = add(kneeL, fromAngle(legAngleL + Math.PI, .48));

  const backpack = localPoint(body, torsoYaw, -.36, 0);
  const missileL = localPoint(backpack, torsoYaw, -.12, -.52);
  const missileR = localPoint(backpack, torsoYaw, -.12, .52);
  const thrusterL = localPoint(backpack, torsoYaw, -.58, -.3);
  const thrusterR = localPoint(backpack, torsoYaw, -.58, .3);
  const head = localPoint(body, torsoYaw, .52, 0);
  const wingL = localPoint(backpack, torsoYaw, -.15, -.78);
  const wingR = localPoint(backpack, torsoYaw, -.15, .78);

  return {
    root, body, yaw, torsoYaw,
    head, shoulderR, shoulderL, forearmR, forearmL,
    rifleBase, muzzle, saberBase, saberTip, saberAngle,
    hipR, hipL, kneeR, kneeL, footR, footL,
    backpack, missileL, missileR, thrusterL, thrusterR, wingL, wingR,
    nodes: { muzzle, saberBase, saberTip, missileL, missileR, thrusterL, thrusterR },
  };
}

export function sampleSaberSweep(actor, samples = 9) {
  const original = actor.saberPhase;
  const points = [];
  for (let i = 0; i < samples; i += 1) {
    actor.saberPhase = i / (samples - 1);
    points.push(computeMechRig(actor).saberTip);
  }
  actor.saberPhase = original;
  return points;
}

export function verifyRigAlignment(actor) {
  const rig = computeMechRig(actor);
  const forward = fromAngle(actor.aim || 0, 1);
  const muzzleVector = { x: rig.muzzle.x - rig.rifleBase.x, y: rig.muzzle.y - rig.rifleBase.y };
  const muzzleDot = muzzleVector.x * forward.x + muzzleVector.y * forward.y;
  const lateral = Math.abs(muzzleVector.x * forward.y - muzzleVector.y * forward.x);
  return {
    muzzleForward: muzzleDot > .7,
    muzzleLateralError: lateral,
    saberLength: Math.hypot(rig.saberTip.x - rig.saberBase.x, rig.saberTip.y - rig.saberBase.y),
  };
}
