import { angleOf, circleHit, clamp, distance, fromAngle, normalize, segmentPointDistanceSq, sub } from '../core/math.js';

export function projectileHitsActor(projectile, actor) {
  return !actor.dead && circleHit(projectile, projectile.radius || .12, actor, actor.radius || .6);
}

export function saberHitsActor(base, tip, width, actor) {
  return !actor.dead && segmentPointDistanceSq(base, tip, actor) <= (width + (actor.radius || .6)) ** 2;
}

export function applyDirectionalHit(actor, hit) {
  if (actor.dead || actor.invulnerable > 0) return { applied:false, damage:0 };
  const source = hit.source || { x: actor.x - 1, y: actor.y };
  const incoming = normalize(sub(actor, source));
  const forward = fromAngle(actor.aim ?? actor.yaw ?? 0);
  const side = clamp(forward.x * incoming.y - forward.y * incoming.x, -1, 1);
  const front = clamp(forward.x * incoming.x + forward.y * incoming.y, -1, 1);
  const armor = clamp(actor.armor || 0, 0, .8);
  const markedMul = actor.markTime > 0 ? 1 + (actor.markAmount || 0) : 1;
  const raw = Math.max(1, hit.damage * (1 - armor) * markedMul);
  const damage = Math.round(raw * 10) / 10;
  actor.hp = Math.max(0, actor.hp - damage);
  const resist = clamp(actor.staggerResist || 0, 0, .9);
  actor.hitStun = Math.max(actor.hitStun || 0, (hit.stagger || .12) * (1 - resist));
  actor.hitVisual = {
    back: Math.max(actor.hitVisual?.back || 0, Math.max(0, front) * (hit.force || 1)),
    side: side * (hit.force || 1),
  };
  actor.vx = (actor.vx || 0) + incoming.x * (hit.knockback || 0) * (1 - resist);
  actor.vy = (actor.vy || 0) + incoming.y * (hit.knockback || 0) * (1 - resist);
  if (hit.mark) {
    actor.markTime = hit.mark.duration;
    actor.markAmount = hit.mark.amount;
  }
  actor.lastHitType = hit.type || 'generic';
  actor.lastHitSource = source;
  if (actor.hp <= 0) actor.dead = true;
  return { applied:true, damage, killed:actor.dead, side, front };
}

export function nearestActor(point, actors, maxDistance = Infinity, predicate = () => true) {
  let best = null;
  let bestDistance = maxDistance;
  for (const actor of actors) {
    if (actor.dead || !predicate(actor)) continue;
    const d = distance(point, actor);
    if (d < bestDistance) {
      bestDistance = d;
      best = actor;
    }
  }
  return best;
}
