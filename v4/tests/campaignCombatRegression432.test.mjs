import test from 'node:test';
import assert from 'node:assert/strict';
import { applyContinuousCampaign42 } from '../src/run/continuousCampaign42.js';
import { applyFrontlineDepth43 } from '../src/run/frontlineDepth43.js';
import { getCampaignStage42 } from '../src/data/regionOrbitalGraveyard42.js';

const noop=()=>{};

class CampaignGame {
  constructor(){
    this.showRouteCalls=0;this.state='base';this.time=0;this.selectedMech='vanguard';
    this.enemies=[];this.projectiles=[];this.missiles=[];this.slashes=[];this.facilities42=[];
    this.input={clear:noop,setEnabled:noop};this.audio={play:noop,unlock:noop};
    this.ui={hidePanel:noop,setCombatVisible:noop,showStageBanner42:noop,showComms42:noop,notify:noop};
    this.player={x:0,y:0,vx:0,vy:0,radius:.6,hp:100,maxHp:100,invulnerable:0,stats:{effects:{}},resetForRoom(position){Object.assign(this,position)},refreshBuild:noop};
  }
  bindEvents(){}
  startRun(){this.run={seed:43,graph:{nodes:[]},depth:0,modules:[],credits:0,permanentEarned:0,kills:0,secondaryKills:0,roomsCleared:0,events:[],nextElite:false};this.showRoute()}
  showRoute(){this.showRouteCalls+=1}
  clearRoomObjects(){this.enemies=[];this.projectiles=[];this.missiles=[];this.slashes=[]}
  clearHostileObjects(){}
  spawnPositions(){return[]}
  registerKill(){}
  updateProjectiles(){}
  updateMissiles(){}
  updateSlashes(){}
  updateCombat(){}
  updateHazards(){}
  advanceDepth(){}
  pause(){}
  finishRun(){}
  explodeMissile(){this.baseMissileExplosions=(this.baseMissileExplosions||0)+1}
  damageEnemiesInCircle(){this.enemyAreaCalls=(this.enemyAreaCalls||0)+1}
  getNearestEnemies(point,count=1,maxDistance=Infinity,predicate=()=>true){
    return this.enemies.filter((target)=>!target.dead&&predicate(target)).map((target)=>({target,d:Math.hypot(target.x-point.x,target.y-point.y)})).filter(({d})=>d<=maxDistance).sort((a,b)=>a.d-b.d).slice(0,count).map(({target})=>target);
  }
  spawnVfx(){}
}

applyContinuousCampaign42({Game:CampaignGame});

const facility=(id,x=0,y=0)=>({id,x,y,radius:.3,maxHp:100,hp:100,label:'测试设施',dead:false});
const campaignGame=(targets=[])=>{const game=new CampaignGame();game.run={campaign42:true};game.room={stage42:{theme:{accent:'#fff'}}};game.facilities42=targets;return game};

test('continuous campaign starts directly in OG-01 without exposing the retired route screen',()=>{
  const game=new CampaignGame();game.startRun();
  assert.equal(game.showRouteCalls,0);assert.equal(game.state,'combat');assert.equal(game.run.stageIndex,0);
});

test('primary, sentry and wingman projectiles each damage an objective exactly once',()=>{
  for(const type of['beam','sentry-shot','wingman-copy']){
    const target=facility(type),game=campaignGame([target]);
    game.projectiles=[{owner:'player',type,x:0,y:0,radius:.12,damage:17,life:1,pierce:0,hitIds:new Set()}];
    game.updateProjectiles(.016);game.updateProjectiles(.016);
    assert.equal(target.hp,83,`${type} applies once`);assert.equal(game.projectiles.length,0);
  }
});

test('saber objective collision follows the blade segment and does not hit behind the mech',()=>{
  const ahead=facility('ahead',.8,0),behind=facility('behind',-.65,0),game=campaignGame([ahead,behind]);
  game.slashes=[{owner:'player',x:0,y:0,base:{x:0,y:0},tip:{x:1,y:0},width:.12,range:1.2,damage:25,hitIds:new Set()}];
  game.updateSlashes(.016);
  assert.equal(ahead.hp,75);assert.equal(behind.hp,100);
});

test('missile collision creates one objective explosion without double-counting the direct target',()=>{
  const direct=facility('direct',0,0),splash=facility('splash',.8,0),game=campaignGame([direct,splash]);
  game.missiles=[{owner:'player',x:0,y:0,damage:30,life:1}];
  game.updateMissiles(.016);game.updateMissiles(.016);
  assert.equal(game.baseMissileExplosions,1);assert.equal(direct.hp,70);assert.equal(splash.hp,70);assert.equal(game.missiles.length,0);
});

test('area attacks damage objectives and autonomous targeting can acquire remaining facilities',()=>{
  const near=facility('near',.5,0),far=facility('far',4,0),game=campaignGame([near,far]);
  game.damageEnemiesInCircle({x:0,y:0},1,22,{type:'overdrive'});
  assert.equal(near.hp,78);assert.equal(far.hp,100);
  assert.equal(game.getNearestEnemies({x:0,y:0},1,12)[0],near);
});

let nextEnemyId=900;
class DepthEnemy {
  constructor(type,x,y){this.id=nextEnemyId+=1;this.type=type;this.x=x;this.y=y;this.vx=0;this.vy=0;this.radius=.7;this.dead=false;this.phase=1;this.def={role:'ranged'}}
  update(){}
  moveToward(){}
}

class DepthGame {
  constructor(stage,mission){
    this.state='combat';this.time=0;this.waveDelay=0;this.enemies=[];this.facilities42=[];
    this.room={stage42:stage,waves:stage.waves,waveIndex:stage.waves.length-1,clear:false,resolved42:false,boss:Boolean(stage.boss)};
    this.bounds={left:-9,right:9,top:stage.centerY-6,bottom:stage.centerY+6};
    this.player={x:0,y:stage.centerY+3,radius:.6,hp:100,maxHp:100,stats:{effects:{}},refreshBuild:noop};
    this.run={campaign42:true,mission43:mission,directives:[],bossPrep:{},routeConsequences:{},optionalObjectives:[],archiveNodes:[],intel:0,stageIndex:stage.index,permanentEarned:0};
    this.ui={showTacticalReceipt43:noop,showComms42:noop,notify:noop};
  }
  startRun(){}
  startCampaignStage42(){}
  spawnNextWave(){}
  spawnPositions(){return[]}
  hitFacility42(){return true}
  completeCombatRoom(){}
  resolveCampaignReward42(){}
  updateCombat(){}
  finishRun(){this.finishCalls=(this.finishCalls||0)+1;this._finishing42=true}
  spawnHazard(){}
}

applyFrontlineDepth43({Game:DepthGame,Enemy:DepthEnemy});

const pursuitMission=(escapeTime=24)=>({type:'pursuit',label:'监察官',progress:0,escapeTime,targetId:0,complete:false,escaped:false,outcomeAnnounced:false});
const pursuitGame=({atBoundary=false}={})=>{
  const stage=getCampaignStage42(7,{routeFlags:{},routeConsequences:{}}),mission=pursuitMission(),game=new DepthGame(stage,mission);
  const target=new DepthEnemy('eliteCannon',0,atBoundary?game.bounds.top+.7:stage.centerY-2.7);mission.targetId=target.id;game.enemies=[target];return{game,mission,target,stage};
};

test('OG-08 resolves escape both at the clamped north boundary and when its timer expires',()=>{
  for(const scenario of[{atBoundary:true,dt:.01},{atBoundary:false,dt:24}]){
    const{game,mission,target,stage}=pursuitGame(scenario);game.waveDelay=1;game.updateCombat(scenario.dt);
    assert.equal(target.dead,true);assert.equal(mission.escaped,true);assert.equal(game.run.routeConsequences.inspector,'escaped');assert.equal(game.run.nextElite,true);assert.equal(mission.complete,false);
    game.waveDelay=0;game.updateCombat(.01);assert.equal(mission.complete,true);assert.equal(stage.post,null);
  }
});

test('destroy stages remain gated until both facilities and enemy waves are complete',()=>{
  const stage=getCampaignStage42(3,{routeFlags:{},routeConsequences:{}}),mission={type:'destroy',complete:false},game=new DepthGame(stage,mission),target=facility('array');game.facilities42=[target];
  game.updateCombat(.016);assert.equal(mission.complete,false);assert.equal(game.room.clear,false);
  target.dead=true;game.updateCombat(.016);assert.equal(mission.complete,true);assert.equal(game.room.clear,true);
});

test('OG-11 decapitation result controls real boss reinforcement spawning',()=>{
  const commandStage=getCampaignStage42(10,{routeFlags:{},routeConsequences:{}});
  for(const [elapsed,expected] of[[12,true],[22,false]]){
    const mission={type:'command',commandIds:[1],startedAt:0,complete:false,outcomeAnnounced:false},game=new DepthGame(commandStage,mission);game.time=elapsed;game.enemies=[{id:1,dead:true,x:0,y:0,radius:.7}];game.updateCombat(.016);
    assert.equal(game.run.bossPrep.commandBroken,expected);assert.equal(game.run.routeConsequences.command,expected?'broken':'online');

    const bossStage=getCampaignStage42(11,{routeFlags:{},routeConsequences:{}}),bossMission={type:'boss',complete:false},bossGame=new DepthGame(bossStage,bossMission);
    bossGame.run.bossPrep.commandBroken=expected;bossGame.run.bossPhase43=1;bossGame.enemies=[{id:2,boss:true,dead:false,phase:2,x:0,y:bossStage.centerY,radius:.8,attackCooldown:1}];bossGame.updateCombat(.016);
    assert.equal(bossGame.enemies.length,expected?1:2);
  }
});

test('frontline completion rewards are idempotent while the ending sequence is pending',()=>{
  const stage=getCampaignStage42(11,{routeFlags:{},routeConsequences:{}}),game=new DepthGame(stage,{type:'boss',complete:true});
  game.finishRun(true);const earned=game.run.permanentEarned;game.finishRun(true);
  assert.equal(game.finishCalls,1);assert.equal(game.run.permanentEarned,earned);assert.ok(earned>0);
});
