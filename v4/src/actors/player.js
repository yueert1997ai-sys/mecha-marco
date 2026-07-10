import { AbilitySystem } from '../combat/abilitySystem.js';
import { computeMechRig } from '../combat/hardpointRig.js';
import { clamp, fromAngle, length, normalize, approachAngle, TAU } from '../core/math.js';
import { buildRunStats } from '../run/rewardResolver.js';

let NEXT_ID = 1;

export class PlayerMech {
  constructor(mech, modules = []) {
    this.id = NEXT_ID += 1;
    this.mech = mech;
    this.modules = modules;
    this.stats = buildRunStats(mech, modules);
    this.x = 0;
    this.y = 2.5;
    this.vx = 0;
    this.vy = 0;
    this.aim = -Math.PI / 2;
    this.yaw = this.aim;
    this.radius = .62;
    this.maxHp = this.stats.maxHp;
    this.hp = this.maxHp;
    this.dead = false;
    this.invulnerable = 0;
    this.hitStun = 0;
    this.hitVisual = { back:0, side:0 };
    this.markTime = 0;
    this.markAmount = 0;
    this.primaryKick = 0;
    this.primarySpreadVisual = 0;
    this.saberPhase = 0;
    this.saberTimer = 0;
    this.saberHitDone = false;
    this.secondSlashQueued = false;
    this.burstRemaining = 0;
    this.burstTimer = 0;
    this.dashTimer = 0;
    this.dashVector = { x:0, y:-1 };
    this.dashCharges = (this.stats.dashCharges || 1) + (this.stats.effects.dashCharges || 0);
    this.maxDashCharges = this.dashCharges;
    this.dashRecharge = 0;
    this.dashTrailTimer = 0;
    this.overdrive = 0;
    this.overdriveTimer = 0;
    this.speed01 = 0;
    this.ability = new AbilitySystem();
  }

  refreshBuild(modules, preserveHpRatio = true) {
    const ratio = this.maxHp > 0 ? this.hp / this.maxHp : 1;
    this.modules = modules;
    this.stats = buildRunStats(this.mech, modules);
    this.maxHp = this.stats.maxHp;
    this.hp = preserveHpRatio ? Math.max(1, this.maxHp * ratio) : this.maxHp;
    this.maxDashCharges = (this.stats.dashCharges || 1) + (this.stats.effects.dashCharges || 0);
    this.dashCharges = Math.min(this.maxDashCharges, Math.max(this.dashCharges, 1));
  }

  resetForRoom(position = { x:0, y:4.5 }) {
    this.x = position.x;
    this.y = position.y;
    this.vx = 0;
    this.vy = 0;
    this.dead = false;
    this.hitStun = 0;
    this.saberTimer = 0;
    this.saberPhase = 0;
    this.dashTimer = 0;
    this.invulnerable = .5;
    this.ability.clear();
  }

  update(dt, input, world) {
    if (this.dead) return;
    this.ability.tick(dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.hitStun = Math.max(0, this.hitStun - dt);
    this.markTime = Math.max(0, this.markTime - dt);
    this.primaryKick = Math.max(0, this.primaryKick - dt * 8);
    this.hitVisual.back *= Math.max(0, 1 - dt * 12);
    this.hitVisual.side *= Math.max(0, 1 - dt * 12);
    this.overdriveTimer = Math.max(0, this.overdriveTimer - dt);
    this.overdrive = clamp(this.overdrive, 0, this.stats.overdriveNeed || 100);

    if (input.pressed.primary) this.ability.request('primary');
    if (input.held.primary) this.ability.request('primary', .08);
    if (input.pressed.secondary) this.ability.request('secondary');
    if (input.pressed.dash) this.ability.request('dash');
    if (input.pressed.ordnance) this.ability.request('ordnance');
    if (input.pressed.overdrive) this.ability.request('overdrive');

    const aimLength = length(input.aim);
    if (aimLength > .12) {
      const targetAim = Math.atan2(input.aim.y, input.aim.x);
      this.aim = approachAngle(this.aim, targetAim, this.stats.turnSpeed * dt);
    }
    this.yaw = approachAngle(this.yaw, this.aim, this.stats.turnSpeed * .72 * dt);

    this.updateDash(dt, input, world);
    this.updateSecondary(dt, world);
    this.updatePrimary(dt, world);
    this.updateOrdnance(world);
    this.updateOverdrive(world);

    if (this.dashTimer <= 0) {
      const move = length(input.move) > 1 ? normalize(input.move) : input.move;
      const stunnedMul = this.hitStun > 0 ? .2 : 1;
      const speedMul = this.overdriveTimer > 0 ? 1.18 : 1;
      const targetVx = move.x * this.stats.moveSpeed * stunnedMul * speedMul;
      const targetVy = move.y * this.stats.moveSpeed * stunnedMul * speedMul;
      const accel = 1 - Math.exp(-dt * 14);
      this.vx += (targetVx - this.vx) * accel;
      this.vy += (targetVy - this.vy) * accel;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const bounds = world.bounds;
    this.x = clamp(this.x, bounds.left + this.radius, bounds.right - this.radius);
    this.y = clamp(this.y, bounds.top + this.radius, bounds.bottom - this.radius);
    this.speed01 = clamp(Math.hypot(this.vx, this.vy) / Math.max(1, this.stats.moveSpeed), 0, 1);

    this.rechargeDash(dt);
  }

  updateDash(dt, input, world) {
    const dashReady = this.dashCharges > 0 && this.dashTimer <= 0 && this.hitStun <= 0;
    if (this.ability.consume('dash', dashReady)) {
      const source = length(input.move) > .15 ? normalize(input.move) : fromAngle(this.aim);
      this.dashVector = source;
      this.dashTimer = this.stats.dashDuration;
      this.invulnerable = Math.max(this.invulnerable, this.stats.dashDuration * .8);
      this.dashCharges -= 1;
      this.dashRecharge = Math.max(this.dashRecharge, this.stats.dashCooldown);
      if (this.stats.effects.dashReload) this.ability.setCooldown('primary', 0);
      world.audio.play('dash');
      world.spawnVfx({ type:'dashStart', x:this.x, y:this.y, angle:Math.atan2(source.y, source.x), color:this.mech.palette.glow, life:.25 });
      if (this.stats.effects.dashDecoy) world.spawnDecoy({ x:this.x, y:this.y, life:1.2 });
    }
    if (this.dashTimer > 0) {
      this.dashTimer = Math.max(0, this.dashTimer - dt);
      this.vx = this.dashVector.x * this.stats.dashSpeed;
      this.vy = this.dashVector.y * this.stats.dashSpeed;
      this.dashTrailTimer -= dt;
      if (this.dashTrailTimer <= 0) {
        this.dashTrailTimer = .035;
        world.spawnVfx({ type:'afterimage', x:this.x, y:this.y, angle:this.aim, color:this.mech.palette.primary, life:.2, alpha:.35 });
      }
      if (this.stats.effects.dashDamage) world.damageEnemiesInCircle(this, .78, this.stats.effects.dashDamage, { type:'dash', stagger:.22, knockback:3.2 });
    }
  }

  rechargeDash(dt) {
    if (this.dashCharges >= this.maxDashCharges) return;
    this.dashRecharge -= dt;
    if (this.dashRecharge <= 0) {
      this.dashCharges += 1;
      if (this.dashCharges < this.maxDashCharges) this.dashRecharge = this.stats.dashCooldown;
    }
  }

  updatePrimary(dt, world) {
    const canFire = this.saberTimer <= 0 && this.dashTimer <= 0 && this.hitStun <= 0 && this.ability.ready('primary');
    if (this.burstRemaining > 0) {
      this.burstTimer -= dt;
      if (this.burstTimer <= 0) {
        this.firePrimary(world);
        this.burstRemaining -= 1;
        this.burstTimer = .075;
      }
    }
    if (this.ability.consume('primary', canFire)) {
      const burst = this.stats.effects.primaryBurst || 1;
      this.firePrimary(world);
      this.burstRemaining = Math.max(0, burst - 1);
      this.burstTimer = .075;
      this.ability.setCooldown('primary', this.stats.primaryRate * (this.overdriveTimer > 0 ? .62 : 1));
    }
  }

  firePrimary(world) {
    const rig = computeMechRig(this, world.time);
    const count = this.stats.effects.primaryCount || 1;
    const spread = this.stats.effects.primarySpread || .07;
    const baseDamage = this.stats.primaryDamage * (this.overdriveTimer > 0 ? 1.25 : 1);
    for (let i = 0; i < count; i += 1) {
      const offset = (i - (count - 1) / 2) * spread;
      const angle = this.aim + offset;
      world.spawnProjectile({
        owner:'player', x:rig.muzzle.x, y:rig.muzzle.y, angle,
        speed:this.stats.projectileSpeed, damage:baseDamage,
        color:this.mech.palette.glow, life:1.35, radius:.13,
        pierce:this.stats.effects.primaryPierce || 0,
        ricochet:this.stats.effects.primaryRicochet || 0,
        type:'beam', source:{ x:this.x, y:this.y },
      });
    }
    this.primaryKick = 1;
    this.primarySpreadVisual = (Math.random() - .5) * .025;
    world.spawnVfx({ type:'muzzle', x:rig.muzzle.x, y:rig.muzzle.y, angle:this.aim, color:this.mech.palette.glow, life:.12 });
    world.audio.play('beam');
  }

  updateSecondary(dt, world) {
    const canStart = this.saberTimer <= 0 && this.dashTimer <= 0 && this.hitStun <= 0;
    if (this.ability.consume('secondary', canStart)) {
      this.saberTimer = .42;
      this.saberHitDone = false;
      this.secondSlashQueued = Boolean(this.stats.effects.secondaryDouble);
      world.audio.play('saberCharge');
    }
    if (this.saberTimer <= 0) {
      this.saberPhase = 0;
      return;
    }
    this.saberTimer = Math.max(0, this.saberTimer - dt);
    this.saberPhase = clamp(1 - this.saberTimer / .42, 0, 1);
    if (!this.saberHitDone && this.saberPhase >= .28) {
      this.saberHitDone = true;
      this.executeSlash(world, false);
    }
    if (this.secondSlashQueued && this.saberPhase >= .76) {
      this.secondSlashQueued = false;
      this.executeSlash(world, true);
    }
  }

  executeSlash(world, reverse) {
    const rig = computeMechRig(this, world.time);
    const range = 1.2 * (this.stats.effects.secondaryRangeMul || 1);
    world.spawnSlash({
      owner:'player', x:this.x, y:this.y, angle:this.aim,
      base:rig.saberBase, tip:rig.saberTip, range, width:.35,
      damage:this.stats.secondaryDamage, reverse,
      color:this.mech.palette.glow, life:.22,
      mark:this.stats.effects.secondaryMark ? { amount:this.stats.effects.secondaryMark, duration:4 } : null,
    });
    if (this.stats.effects.secondaryWave) {
      world.spawnProjectile({ owner:'player', x:rig.saberTip.x, y:rig.saberTip.y, angle:this.aim, speed:11, damage:this.stats.secondaryDamage * .55, color:this.mech.palette.glow, life:.7, radius:.25, pierce:1, type:'wave', source:{x:this.x,y:this.y} });
    }
    world.audio.play('saber');
  }

  updateOrdnance(world) {
    const canUse = this.dashTimer <= 0 && this.hitStun <= 0 && this.ability.ready('ordnance');
    if (!this.ability.consume('ordnance', canUse)) return;
    const rig = computeMechRig(this, world.time);
    const targetCount = this.stats.effects.ordnanceTargets || 1;
    const targets = world.getNearestEnemies(this, targetCount, 14);
    const extra = this.stats.effects.ordnanceExtra || 0;
    const count = Math.max(2, targetCount + extra);
    for (let i = 0; i < count; i += 1) {
      const origin = i % 2 === 0 ? rig.missileL : rig.missileR;
      world.spawnMissile({
        owner:'player', x:origin.x, y:origin.y,
        target:targets[i % Math.max(1, targets.length)] || null,
        angle:this.aim + (i % 2 ? .35 : -.35),
        damage:this.stats.ordnanceDamage,
        color:'#ffb45e', life:4.2, speed:7.2,
        cluster:this.stats.effects.ordnanceCluster || 0,
        pull:this.stats.effects.ordnancePull || 0,
      });
    }
    this.ability.setCooldown('ordnance', this.stats.ordnanceCooldown);
    world.audio.play('missile');
  }

  updateOverdrive(world) {
    const ready = this.overdrive >= this.stats.overdriveNeed && this.overdriveTimer <= 0;
    if (!this.ability.consume('overdrive', ready)) return;
    this.overdrive = 0;
    this.overdriveTimer = 5 * (this.stats.effects.overdriveDurationMul || 1);
    this.invulnerable = Math.max(this.invulnerable, .55);
    world.spawnVfx({ type:'overdrive', x:this.x, y:this.y, color:this.mech.palette.glow, life:1.1 });
    if (this.stats.effects.overdriveNova) world.damageEnemiesInCircle(this, 5.5, this.stats.effects.overdriveNova, { type:'overdrive', stagger:.55, knockback:5 });
    world.audio.play('overdrive');
  }

  gainOverdrive(amount) {
    this.overdrive = clamp(this.overdrive + amount * (this.stats.effects.overdriveGainMul || 1), 0, this.stats.overdriveNeed);
  }

  takeDamage(world, damage, source, type='enemy') {
    if (this.dead || this.invulnerable > 0) return 0;
    const guard = this.saberTimer > 0 && this.stats.effects.secondaryGuard;
    const finalDamage = damage * (guard ? 1 - this.stats.effects.secondaryGuard : 1);
    this.hp = Math.max(0, this.hp - finalDamage);
    this.hitStun = guard ? .04 : .16;
    const dx = this.x - source.x;
    const dy = this.y - source.y;
    const d = Math.hypot(dx, dy) || 1;
    this.vx += dx / d * 2.8;
    this.vy += dy / d * 2.8;
    this.hitVisual = { back:.8, side:Math.sin(Math.atan2(dy,dx)-this.aim) };
    world.spawnVfx({ type:'playerHit', x:this.x, y:this.y, color:'#ff4d66', life:.28 });
    world.audio.play('playerHit');
    if (world.vibrate) navigator.vibrate?.(guard ? 20 : 45);
    if (this.hp <= 0) {
      if (this.stats.effects.absoluteGuard && guard) this.hp = 1;
      else this.dead = true;
    }
    return finalDamage;
  }
}
