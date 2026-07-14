import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PlayerMech } from '../src/actors/player.js';
import { Enemy } from '../src/actors/enemy.js';
import { getMech } from '../src/data/mechs.js';
import { Game } from '../src/game.js';
import { sanitizeProfile } from '../src/meta/profile.js';
import {
  VANGUARD_IDENTITY_RULES_44,
  applyVanguardIdentity44,
  clearVanguardIdentityInput44,
  consumeCounter44,
  createVanguardIdentityState44,
  gainBladeMomentum44,
  handleSecondaryTransition44,
  registerDeflect44,
  tickVanguardIdentity44,
} from '../src/combat/vanguardIdentity44.js';
import { facilityVisualState44, og04SpatialEvidence44, OG04_IDENTITY_VISUAL_COMPONENTS_44 } from '../src/render/og04IdentityVisual44.js';
import { vanguardCounterHudState44 } from '../src/ui/vanguardIdentity44.js';

test('blade momentum gains clamp at 100 and decay only after 2.5 seconds',()=>{
  const state=createVanguardIdentityState44();
  gainBladeMomentum44(state,3);gainBladeMomentum44(state,8);gainBladeMomentum44(state,28);
  assert.equal(state.blade,39);
  tickVanguardIdentity44(state,2.5);assert.equal(state.blade,39);
  tickVanguardIdentity44(state,.5);assert.equal(state.blade,34);
  gainBladeMomentum44(state,90);assert.equal(state.blade,100);assert.equal(state.sinceGain,0);
});

test('saber tap, hold window, stance limit and failed-deflect fallback are distinct',()=>{
  const tap=createVanguardIdentityState44();handleSecondaryTransition44(tap,true);tickVanguardIdentity44(tap,.12);handleSecondaryTransition44(tap,false);assert.equal(tap.fallbackSlash,true);assert.equal(tap.deflectStance,false);
  const held=createVanguardIdentityState44();handleSecondaryTransition44(held,true);tickVanguardIdentity44(held,.18);assert.equal(held.deflectStance,true);assert.equal(held.deflectWindow,true);
  tickVanguardIdentity44(held,.18);assert.equal(held.deflectStance,true);assert.equal(held.deflectWindow,false);
  tickVanguardIdentity44(held,.27);assert.equal(held.deflectStance,false);handleSecondaryTransition44(held,false);assert.equal(held.fallbackSlash,true);
});

test('successful deflect grants 28, arms one three-second counter and does not fallback slash',()=>{
  const state=createVanguardIdentityState44();handleSecondaryTransition44(state,true);tickVanguardIdentity44(state,.18);
  assert.equal(registerDeflect44(state),true);assert.equal(state.blade,28);assert.equal(state.counterReady,true);assert.equal(state.counterSeconds,3);
  handleSecondaryTransition44(state,false);assert.equal(state.fallbackSlash,false);
  tickVanguardIdentity44(state,3);assert.equal(state.counterReady,false);assert.equal(state.blade,23);
});

test('counter requires readiness and 35 blade, consumes exactly 35, and expiry costs nothing',()=>{
  const state=createVanguardIdentityState44();state.blade=34;state.counterReady=true;assert.equal(consumeCounter44(state),false);assert.equal(state.blade,34);
  state.blade=60;assert.equal(consumeCounter44(state),true);assert.equal(state.blade,25);assert.equal(state.counterReady,false);
  state.blade=60;state.counterReady=true;state.counterSeconds=.1;state.sinceGain=0;tickVanguardIdentity44(state,.1);assert.equal(state.counterReady,false);assert.equal(state.blade,60);
});

class TestInput {
  constructor(){this.held={secondary:false};this.pressed={secondary:false};this.sources={secondary:new Set()};}
  setSourceHeld(action,source,value,alsoPress=false){const set=this.sources[action]||=new Set(),before=set.size>0;if(value)set.add(source);else set.delete(source);const after=set.size>0;this.held[action]=after;if(after&&!before&&alsoPress)this.pressed[action]=true;}
  press(action){this.pressed[action]=true;}
  clear(){for(const set of Object.values(this.sources))set.clear();this.held.secondary=false;this.pressed.secondary=false;}
}
class TestEnemy { receiveHit(){return{applied:true,damage:10,killed:false}} }
class TestGame {
  hitFacility42(target,damage){if(!target||target.dead)return false;target.hp=Math.max(0,target.hp-damage);if(target.hp===0)target.dead=true;return true;}
  startCampaignStage42(){this.stageCalls=(this.stageCalls||0)+1;}
  updateProjectiles(){
    this.projectiles=this.projectiles.filter((shot)=>{
      if(shot.owner!=='enemy'||Math.hypot(shot.x-this.player.x,shot.y-this.player.y)>=1)return true;
      this.player.hp-=shot.damage;this.damageTaken+=shot.damage;return false;
    });
  }
  updateSlashes(){
    this.slashes=this.slashes.filter((slash)=>{
      if(slash.owner!=='enemy'||Math.hypot(slash.x-this.player.x,slash.y-this.player.y)>slash.range+this.player.radius)return true;
      this.player.hp-=slash.damage;this.damageTaken+=slash.damage;return false;
    });
  }
  updateCombat(dt){
    if(this.input.pressed.secondary)this.normalSlashes+=1;
    this.input.pressed.secondary=false;
    for(const enemy of this.enemies)enemy.update?.(dt,this);
    this.beforeCombatDamageResolution?.(dt);
    this.updateProjectiles(dt);
    this.updateSlashes(dt);
  }
}
applyVanguardIdentity44({Game:TestGame,PlayerMech,InputRouter:TestInput,Enemy:TestEnemy});

const makeGame=(mech='vanguard')=>{
  const game=new TestGame();
  game.state='combat';game.time=1;game.run={campaign42:true,stageIndex:3};game.room={stage42:{index:3}};game.player=new PlayerMech(getMech(mech),[]);game.player.dead=false;game.player.x=0;game.player.y=0;
  game.input=new TestInput();game.enemies=[];game.projectiles=[];game.slashes=[];game.vfx=[];game.normalSlashes=0;game.damageTaken=0;game.comms=[];
  game.ui={showComms42:(...args)=>game.comms.push(args)};game.audio={play:()=>{}};
  game.spawnProjectile=(data)=>game.projectiles.push({...data,hitIds:new Set()});game.spawnVfx=(data)=>game.vfx.push({...data,maxLife:data.life});
  return game;
};

test('integration delays tap slash until release and failed hold still produces one normal slash',()=>{
  const game=makeGame();game.input.setSourceHeld('secondary','button',true,true);game.updateCombat(.08);assert.equal(game.normalSlashes,0);
  game.input.setSourceHeld('secondary','button',false);game.updateCombat(.01);assert.equal(game.normalSlashes,1);
  game.input.setSourceHeld('secondary','button',true,true);game.updateCombat(.2);game.input.setSourceHeld('secondary','button',false);game.updateCombat(.01);assert.equal(game.normalSlashes,2);
});

test('enemy projectile and saber are each removed once inside the valid deflect window',()=>{
  const game=makeGame();game.input.setSourceHeld('secondary','button',true,true);game.updateCombat(.18);
  game.projectiles.push({owner:'enemy',type:'enemyBeam',x:.4,y:0,angle:0,speed:1,damage:12,radius:.1,life:1});
  game.slashes.push({owner:'enemy',x:.3,y:0,range:1.3,damage:14,life:.2});
  game.updateCombat(.01);
  assert.equal(game.projectiles.length,0);assert.equal(game.slashes.length,0);assert.equal(game.damageTaken,0);assert.equal(game.vanguardIdentity44.blade,56);assert.equal(game.run.vanguardIdentity44.deflects,2);
  assert.equal(game.comms.filter(([speaker])=>speaker==='防卫军识别阵列').length,1);
});

test('enemy update spawns are deflected before collision damage without restoring health afterward',()=>{
  const game=makeGame(),hp=game.player.hp;
  game.input.setSourceHeld('secondary','button',true,true);game.updateCombat(.18);
  game.enemies.push({spawned:false,update(dt,world){if(this.spawned)return;this.spawned=true;world.projectiles.push({owner:'enemy',type:'enemyBeam',x:.35,y:0,angle:0,speed:0,damage:12,radius:.1,life:1});world.slashes.push({owner:'enemy',x:.3,y:0,range:1.3,damage:14,life:.2})}});
  game.updateCombat(.01);
  assert.equal(game.damageTaken,0);assert.equal(game.player.hp,hp);assert.equal(game.projectiles.length,0);assert.equal(game.slashes.length,0);assert.equal(game.run.vanguardIdentity44.deflects,2);
});

test('real Game and Enemy order deflects spawned projectile and slash before production collision methods',()=>{
  class OrderedInput extends TestInput { update(){return{pressed:{pause:false}}} setEnabled(){} }
  class OrderedPlayerPatch { firePrimary(){} executeSlash(){} }
  class OrderedEnemyPatch { receiveHit(){return{applied:false}} }
  class OrderedGame extends Game {}
  applyVanguardIdentity44({Game:OrderedGame,PlayerMech:OrderedPlayerPatch,InputRouter:OrderedInput,Enemy:OrderedEnemyPatch});
  const game=Object.create(OrderedGame.prototype),player={x:0,y:0,radius:.4,hp:120,maxHp:120,dead:false,mech:{id:'vanguard'},update(){},takeDamage(world,damage){this.hp-=damage}};
  Object.assign(game,{state:'combat',time:1,run:{campaign42:true,stageIndex:3},room:{stage42:{index:3},waveIndex:0,waves:[[]],clear:false},player,input:new OrderedInput(),renderer:{screenToWorld:(x,y)=>({x,y})},audio:{play(){}},ui:{showComms42(){}},bounds:{left:-9,right:9,top:-6,bottom:6},enemies:[],projectiles:[],missiles:[],slashes:[],hazards:[],vfx:[],decoys:[],damageNumbers:[],waveDelay:0,roomClearTimer:0,pendingResult:0,resolveBodyCollisions(){}});
  const arm=(enemy)=>{enemy.spawn=0;enemy.attackCooldown=0;enemy.machine={fired:false,is:()=>false,set(){},update(dt,self){if(this.fired)return;this.fired=true;self.performAttack()}};return enemy};
  game.enemies.push(arm(new Enemy('grunt',1.05,0)),arm(new Enemy('striker',1.05,0)));
  game.input.setSourceHeld('secondary','button',true,true);game.updateCombat(.18);
  assert.equal(player.hp,120);assert.equal(game.projectiles.length,0);assert.equal(game.slashes.length,0);assert.equal(game.run.vanguardIdentity44.deflects,2);assert.equal(game.vanguardIdentity44.blade,56);
});

test('counter HUD is locked at 28 of 35 and becomes READY only at the real firing threshold',()=>{
  assert.deepEqual(vanguardCounterHudState44({blade:28,counterReady:true}),{ready:false,text:'反击锁定 · 刃势 28/35'});
  assert.deepEqual(vanguardCounterHudState44({blade:35,counterReady:true}),{ready:true,text:'反击射击 READY'});
});

test('crossing 60 blade through a real deflect emits the high-state system line once',()=>{
  const game=makeGame();game.updateCombat(.01);game.vanguardIdentity44.blade=35;game.input.setSourceHeld('secondary','button',true,true);game.updateCombat(.18);
  game.projectiles.push({owner:'enemy',type:'enemyBeam',x:.4,y:0,angle:0,speed:0,damage:12,radius:.1,life:1});game.updateCombat(.01);
  assert.equal(game.vanguardIdentity44.blade,63);assert.equal(game.comms.filter(([speaker])=>speaker==='MA-00 / 系统').length,1);
  game.input.setSourceHeld('secondary','button',false);game.updateCombat(.01);assert.equal(game.comms.filter(([speaker])=>speaker==='MA-00 / 系统').length,1);
});

test('artillery hazards and boss-wide projectiles remain outside the deflect contract',()=>{
  const game=makeGame(),hp=game.player.hp;game.input.setSourceHeld('secondary','button',true,true);game.updateCombat(.18);
  game.projectiles.push({owner:'enemy',type:'bossRing',x:.3,y:0,angle:0,speed:0,damage:9,radius:.1,life:1});
  game.hazards=[{type:'artillery',x:0,y:0,damage:20}];game.updateCombat(.01);
  assert.equal(game.projectiles.length,0);assert.equal(game.damageTaken,9);assert.equal(game.player.hp,hp-9);assert.equal(game.vanguardIdentity44.blade,0);
});

test('effective primary and saber hits award only their specified blade amounts and comms stay once per run',()=>{
  const game=makeGame(),enemy=new TestEnemy();game.updateCombat(.01);
  for(let i=0;i<20;i+=1)enemy.receiveHit(game,{owner:'primary',source:{identityHit44:'primary'}});
  assert.equal(game.vanguardIdentity44.blade,60);assert.equal(game.run.vanguardIdentity44.primaryHits,20);
  enemy.receiveHit(game,{owner:'secondary',type:'saber',source:{}});assert.equal(game.vanguardIdentity44.blade,68);assert.equal(game.run.vanguardIdentity44.saberHits,1);
  assert.equal(game.comms.filter(([speaker])=>speaker==='MA-00 / 系统').length,1);
});

test('main cannon and saber effective hits on OG-04 facilities also build blade momentum',()=>{
  const game=makeGame();game.updateCombat(.01);const primary={identityHit44:'primary'},saber={identityHit44:'secondary'},target={hp:70,maxHp:70,dead:false};
  assert.equal(game.hitFacility42(target,5,primary),true);assert.equal(game.vanguardIdentity44.blade,3);
  assert.equal(game.hitFacility42(target,5,saber),true);assert.equal(game.vanguardIdentity44.blade,11);
  target.dead=true;assert.equal(game.hitFacility42(target,5,primary),false);assert.equal(game.vanguardIdentity44.blade,11);
});

test('armed primary becomes a 2.2x high-penetration shot and consumes readiness once',()=>{
  const game=makeGame();game.updateCombat(.01);const state=game.vanguardIdentity44;state.blade=70;state.counterReady=true;state.counterSeconds=3;
  const base=game.player.stats.primaryDamage;game.player.firePrimary(game);
  assert.equal(game.projectiles.length,1);assert.equal(game.projectiles[0].type,'vanguard-counter44');assert.equal(game.projectiles[0].damage,base*VANGUARD_IDENTITY_RULES_44.counterDamageMultiplier);assert.ok(game.projectiles[0].pierce>=3);assert.equal(state.blade,35);assert.equal(state.counterReady,false);
  assert.equal(game.run.vanguardIdentity44.counters,1);assert.equal(game.comms.filter(([speaker])=>speaker==='MA-00').length,1);
});

test('input clear, stage transition and death clear held deflect residue',()=>{
  const game=makeGame();game.input.setSourceHeld('secondary','button',true,true);game.updateCombat(.2);assert.equal(game.vanguardIdentity44.deflectStance,true);
  game.input.clear();assert.equal(game.vanguardIdentity44.secondaryHolding,false);assert.equal(game.vanguardIdentity44.deflectWindow,false);
  game.input.setSourceHeld('secondary','button',true,true);game.updateCombat(.2);game.startCampaignStage42(4,false);assert.equal(game.vanguardIdentity44,null);
  const state=createVanguardIdentityState44();state.secondaryHolding=true;state.deflectWindow=true;clearVanguardIdentityInput44(state);assert.equal(state.secondaryHolding,false);assert.equal(state.deflectWindow,false);
  const dead=makeGame();dead.input.setSourceHeld('secondary','button',true,true);dead.updateCombat(.2);dead.player.dead=true;dead.updateCombat(.01);assert.equal(dead.vanguardIdentity44.secondaryHolding,false);assert.equal(dead.vanguardIdentity44.deflectWindow,false);
});

test('non-vanguard and non-OG04 input behavior remains the original press-to-slash path',()=>{
  const starwing=makeGame('starwing');starwing.input.setSourceHeld('secondary','button',true,true);starwing.updateCombat(.01);assert.equal(starwing.normalSlashes,1);assert.equal(starwing.vanguardIdentity44,undefined);
  const other=makeGame();other.room.stage42.index=2;other.input.setSourceHeld('secondary','button',true,true);other.updateCombat(.01);assert.equal(other.normalSlashes,1);assert.equal(other.vanguardIdentity44,undefined);
});

test('schema 7 profile remains unchanged because 4.4A identity state is run-local',()=>{
  const profile=sanitizeProfile({version:7,permanent:21,settings:{autoFire:false},unlockedKits:['vanguard-standard']});
  assert.equal(profile.version,7);assert.equal(profile.permanent,21);assert.equal(profile.settings.autoFire,false);assert.ok(profile.unlockedKits.includes('vanguard-standard'));assert.equal('vanguardIdentity44' in profile,false);
});

test('OG-04 visual contract exposes poetic ruin components and four facility states',()=>{
  assert.equal(OG04_IDENTITY_VISUAL_COMPONENTS_44.ship.minimumPlayerScale,5);assert.match(OG04_IDENTITY_VISUAL_COMPONENTS_44.futureAssetBoundary,/glb/);assert.equal(OG04_IDENTITY_VISUAL_COMPONENTS_44.pylons.length,3);
  assert.equal(facilityVisualState44({hp:70,maxHp:70,dead:false},false),'intact');assert.equal(facilityVisualState44({hp:70,maxHp:70,dead:false},true),'active');assert.equal(facilityVisualState44({hp:20,maxHp:70,dead:false},false),'heavy-damage');assert.equal(facilityVisualState44({hp:0,maxHp:70,dead:true},false),'destroyed');
});

test('OG-04 custom arena preserves real obstacles, mission label, corridor and both gate states',()=>{
  const stage={index:3,code:'OG-04',name:'身份识别阵列',centerY:-42,spatial:{obstacles:[[-3.6,-1.5,.8],[-3.6,1.5,.8],[3.6,-1.5,.8],[3.6,1.5,.8]]}};
  const world={room:{stage42:stage},run:{exitOpen:false},facilities42:[{hp:0,dead:true},{hp:70,dead:false},{hp:70,dead:false}]};
  const closed=og04SpatialEvidence44(world);assert.equal(closed.obstacles.length,4);assert.deepEqual(closed.obstacles[0],{x:-3.6,y:-43.5,r:.8});assert.equal(closed.missionLabel,'摧毁识别节点 · 1/3');assert.equal(closed.gateLabel,'闸门锁定 · 摧毁全部节点');assert.deepEqual(closed.connector,{left:-3.4,right:3.4,nearY:-48,farY:-50});
  world.run.exitOpen=true;const open=og04SpatialEvidence44(world);assert.equal(open.exitOpen,true);assert.equal(open.gateLabel,'闸门开放 · 向北推进');
});

test('runtime stays modular with exactly one new updateCombat wrapper and compact 844 HUD placement',async()=>{
  const [combat,ui,main,run]=await Promise.all([
    readFile(new URL('../src/combat/vanguardIdentity44.js',import.meta.url),'utf8'),
    readFile(new URL('../src/ui/vanguardIdentity44.js',import.meta.url),'utf8'),
    readFile(new URL('../src/main.js',import.meta.url),'utf8'),
    readFile(new URL('../src/run/frontlineDepth43.js',import.meta.url),'utf8'),
  ]);
  assert.equal((combat.match(/Game\.prototype\.updateCombat\s*=/g)||[]).length,1);assert.match(ui,/width:min\(176px,21vw\)/);assert.match(ui,/right:calc/);assert.match(main,/applyVanguardIdentity44/);assert.match(main,/applyOg04IdentityVisual44/);
  assert.match(run,/optional\?\.type==='spoof'/);assert.match(run,/mission\.type==='destroy'/);
});
