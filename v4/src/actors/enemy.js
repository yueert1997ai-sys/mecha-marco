import { StateMachine } from '../core/stateMachine.js';
import { angleDelta, angleOf, clamp, distance, fromAngle, normalize, rand, sub } from '../core/math.js';
import { ENEMY_TYPES } from '../data/encounters.js';
import { applyDirectionalHit } from '../combat/hitSystem.js';

let NEXT_ENEMY_ID = 100;

export class Enemy {
  constructor(typeId, x, y, scale = 1) {
    const def = ENEMY_TYPES[typeId] || ENEMY_TYPES.grunt;
    this.id = NEXT_ENEMY_ID += 1;
    this.def = def;
    this.type = def.id;
    this.name = def.name;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.yaw = Math.PI / 2;
    this.aim = this.yaw;
    this.radius = def.radius * scale;
    this.maxHp = def.hp * scale;
    this.hp = this.maxHp;
    this.speed = def.speed;
    this.damage = def.damage;
    this.armor = def.armor || 0;
    this.dead = false;
    this.spawn = .45;
    this.hitStun = 0;
    this.hitVisual = { back:0, side:0 };
    this.markTime = 0;
    this.markAmount = 0;
    this.telegraph = 0;
    this.attackCooldown = rand(.2, .8);
    this.phase = 1;
    this.phaseAnnounced = 1;
    this.elite = Boolean(def.elite);
    this.boss = Boolean(def.boss);
    this.speed01 = 0;
    this.saberPhase = 0;
    this.primaryKick = 0;
    this.lastDamageSource = null;
    this.machine = new StateMachine('spawn', {
      spawn: { update:(self, dt, time)=>{ if (time >= .45) self.machine.set('acquire', self); } },
      acquire: { enter:(self)=>{ self.thinkTimer = rand(.08,.22); }, update:(self,dt)=>{ self.thinkTimer -= dt; if (self.thinkTimer <= 0) self.chooseTactic(); } },
      approach: { update:(self,dt)=>self.updateApproach(dt) },
      strafe: { update:(self,dt)=>self.updateStrafe(dt) },
      retreat: { update:(self,dt)=>self.updateRetreat(dt) },
      telegraph: { enter:(self)=>{ self.telegraph=self.telegraphDuration(); self.vx*=.25; self.vy*=.25; }, update:(self,dt)=>{ self.telegraph-=dt; if(self.telegraph<=0) self.performAttack(); } },
      recover: { enter:(self)=>{ self.recoverTimer=self.recoveryDuration(); }, update:(self,dt)=>{ self.recoverTimer-=dt; if(self.recoverTimer<=0) self.machine.set('acquire',self); } },
      hitReact: { enter:(self)=>{ self.reactTimer=Math.max(.06,self.hitStun); }, update:(self,dt)=>{ self.reactTimer-=dt; if(self.reactTimer<=0) self.machine.set('acquire',self); } },
      dead: {},
    });
  }

  chooseTactic() {
    const player = this.world.player;
    if (!player || player.dead) return;
    const d = distance(this, player);
    const role = this.def.role;
    if (this.boss) {
      if (d > 6.5) this.machine.set('approach', this);
      else this.machine.set(Math.random() < .55 ? 'strafe' : 'telegraph', this);
      return;
    }
    if (['melee','eliteMelee'].includes(role)) this.machine.set(d > this.def.range ? 'approach' : 'telegraph', this);
    else if (['sniper','artillery'].includes(role)) this.machine.set(d < 6 ? 'retreat' : (this.attackCooldown <= 0 ? 'telegraph' : 'strafe'), this);
    else if (role === 'tank') this.machine.set(d > this.def.range ? 'approach' : (this.attackCooldown <= 0 ? 'telegraph' : 'strafe'), this);
    else this.machine.set(d > this.def.range * .9 ? 'approach' : (this.attackCooldown <= 0 ? 'telegraph' : 'strafe'), this);
  }

  update(dt, world) {
    this.world = world;
    if (this.dead) return;
    this.spawn = Math.max(0, this.spawn - dt);
    this.hitStun = Math.max(0, this.hitStun - dt);
    this.markTime = Math.max(0, this.markTime - dt);
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.primaryKick = Math.max(0, this.primaryKick - dt * 7);
    this.saberPhase = Math.max(0, this.saberPhase - dt * 2.2);
    this.hitVisual.back *= Math.max(0, 1 - dt * 11);
    this.hitVisual.side *= Math.max(0, 1 - dt * 11);
    if (this.hitStun > 0 && !this.machine.is('hitReact','dead')) this.machine.set('hitReact', this);
    this.machine.update(dt, this);

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= Math.max(0, 1 - dt * 7);
    this.vy *= Math.max(0, 1 - dt * 7);
    this.x = clamp(this.x, world.bounds.left + this.radius, world.bounds.right - this.radius);
    this.y = clamp(this.y, world.bounds.top + this.radius, world.bounds.bottom - this.radius);
    this.speed01 = clamp(Math.hypot(this.vx,this.vy)/Math.max(1,this.speed),0,1);
    this.aim = Math.atan2(world.player.y - this.y, world.player.x - this.x);
    this.yaw += clamp(angleDelta(this.yaw, this.aim), -dt * 5.5, dt * 5.5);

    if (this.boss) {
      const ratio = this.hp / this.maxHp;
      this.phase = ratio < .33 ? 3 : ratio < .66 ? 2 : 1;
      if (this.phase > this.phaseAnnounced) {
        this.phaseAnnounced = this.phase;
        world.bus.emit('bossPhase', { phase:this.phase, enemy:this });
        world.spawnVfx({ type:'bossPhase', x:this.x, y:this.y, color:this.def.color, life:1.2 });
        this.attackCooldown = 0;
      }
    }
  }

  moveToward(target, speedMul = 1) {
    const dir = normalize(sub(target, this));
    this.vx += dir.x * this.speed * speedMul * .18;
    this.vy += dir.y * this.speed * speedMul * .18;
  }

  updateApproach() {
    const p = this.world.player;
    this.moveToward(p, 1);
    if (distance(this,p) <= this.def.range * .88 || this.attackCooldown <= 0 && this.def.role === 'boss') this.machine.set('telegraph', this);
  }

  updateStrafe(dt) {
    const p = this.world.player;
    const d = distance(this,p);
    const to = normalize(sub(p,this));
    const side = this.id % 2 ? 1 : -1;
    this.vx += (-to.y * side + to.x * clamp((d-this.def.range)/4,-.4,.4)) * this.speed * .11;
    this.vy += (to.x * side + to.y * clamp((d-this.def.range)/4,-.4,.4)) * this.speed * .11;
    if (this.attackCooldown <= 0) this.machine.set('telegraph', this);
  }

  updateRetreat() {
    const p = this.world.player;
    const away = normalize(sub(this,p));
    this.vx += away.x * this.speed * .18;
    this.vy += away.y * this.speed * .18;
    if (distance(this,p) >= this.def.range * .72) this.machine.set('strafe', this);
  }

  telegraphDuration() {
    if (this.boss) return this.phase === 3 ? .48 : .62;
    if (this.def.role === 'sniper') return 1.05;
    if (this.def.role === 'artillery') return .82;
    if (['melee','eliteMelee'].includes(this.def.role)) return .48;
    return .58;
  }

  recoveryDuration() {
    if (this.boss) return this.phase === 3 ? .45 : .7;
    return .62;
  }

  performAttack() {
    if (this.dead || this.world.player.dead) return;
    const world = this.world;
    const role = this.def.role;
    const p = world.player;
    const angle = Math.atan2(p.y - this.y, p.x - this.x);
    if (['melee','eliteMelee'].includes(role)) {
      this.saberPhase = 1;
      world.spawnEnemySlash(this, angle, this.damage, this.elite ? 1.7 : 1.3);
      world.audio.play('enemySaber');
    } else if (role === 'artillery') {
      world.spawnHazard({ x:p.x, y:p.y, radius:1.25, delay:.75, damage:this.damage, owner:this });
      world.audio.play('warning');
    } else if (role === 'sniper') {
      world.spawnProjectile({ owner:'enemy', x:this.x, y:this.y, angle, speed:this.def.projectileSpeed, damage:this.damage, color:this.def.color, life:1.8, radius:.16, type:'sniper', source:{x:this.x,y:this.y} });
      this.primaryKick = 1;
      world.audio.play('enemyShot');
    } else if (this.boss) {
      this.performBossAttack(angle);
    } else {
      const count = this.elite ? 3 : 1;
      for (let i=0;i<count;i+=1) {
        world.spawnProjectile({ owner:'enemy', x:this.x, y:this.y, angle:angle+(i-(count-1)/2)*.16, speed:this.def.projectileSpeed||9, damage:this.damage*(this.elite?.72:1), color:this.def.color, life:2, radius:.12, type:'enemyBeam', source:{x:this.x,y:this.y} });
      }
      this.primaryKick = 1;
      world.audio.play('enemyShot');
    }
    this.attackCooldown = this.def.attackCooldown * (this.boss ? (this.phase===3?.68:this.phase===2?.82:1) : 1);
    this.machine.set('recover', this);
  }

  performBossAttack(angle) {
    const world = this.world;
    const roll = Math.random();
    if (this.phase === 1 || roll < .34) {
      const count = this.phase === 3 ? 11 : this.phase === 2 ? 9 : 7;
      for (let i=0;i<count;i+=1) {
        world.spawnProjectile({ owner:'enemy', x:this.x, y:this.y, angle:angle+(i-(count-1)/2)*.14, speed:10.5, damage:this.damage*.62, color:this.def.color, life:2.2, radius:.13, type:'bossSpread', source:{x:this.x,y:this.y} });
      }
      world.audio.play('enemyShot');
    } else if (roll < .67) {
      const ring = this.phase === 3 ? 18 : 12;
      for (let i=0;i<ring;i+=1) {
        world.spawnProjectile({ owner:'enemy', x:this.x, y:this.y, angle:i/ring*Math.PI*2+world.time*.2, speed:7.8, damage:this.damage*.48, color:'#ff6aab', life:3, radius:.14, type:'bossRing', source:{x:this.x,y:this.y} });
      }
      world.audio.play('warning');
    } else {
      const targets = this.phase === 3 ? 4 : 3;
      for (let i=0;i<targets;i+=1) {
        const offset=fromAngle(i/targets*Math.PI*2,1.3);
        world.spawnHazard({ x:world.player.x+offset.x, y:world.player.y+offset.y, radius:1.1, delay:.65, damage:this.damage*.85, owner:this });
      }
      world.audio.play('warning');
    }
  }

  receiveHit(world, hit) {
    const result = applyDirectionalHit(this, hit);
    if (!result.applied) return result;
    this.lastDamageSource = hit.owner || null;
    world.spawnVfx({ type:result.killed?'explosion':'enemyHit', x:this.x, y:this.y, angle:Math.atan2(this.y-hit.source.y,this.x-hit.source.x), color:this.def.color, life:result.killed?.65:.22, scale:this.boss?1.8:this.elite?1.3:1 });
    world.spawnDamageNumber(this.x, this.y-.45, result.damage, result.killed);
    if (result.killed) {
      this.machine.set('dead', this);
      world.audio.play(this.boss?'bossDown':'enemyHit');
    } else {
      this.machine.set('hitReact', this);
      world.audio.play('enemyHit');
    }
    return result;
  }
}
