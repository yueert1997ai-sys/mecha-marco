import test from 'node:test';
import assert from 'node:assert/strict';

class MemoryStorage { constructor(){this.map=new Map();} getItem(k){return this.map.get(k)??null;} setItem(k,v){this.map.set(k,v);} }
globalThis.localStorage = new MemoryStorage();
globalThis.document = { hidden:false, addEventListener(){}, removeEventListener(){} };

const { Game } = await import('../src/game.js');

function makeHarness(){
  const callbacks={};
  const ui={
    setCombatVisible(){}, hidePanel(){}, notify(){}, updateHud(){},
    showBase(profile,mechs,dialogue,selected,onSelect,onStart){callbacks.start=onStart;},
    showRoute(node,onChoose){callbacks.route=onChoose;callbacks.node=node;},
    showReward(modules,type,onChoose){callbacks.reward=onChoose;callbacks.modules=modules;},
    showShop(run,items,onBuy,onRepair,onLeave){callbacks.shopLeave=onLeave;},
    showEvent(event,onChoose){callbacks.event=onChoose;callbacks.eventDef=event;},
    showResult(report,onReturn){callbacks.result=onReturn;callbacks.report=report;},
    showPause(onResume,onRetire){callbacks.resume=onResume;callbacks.retire=onRetire;},
  };
  const input={setEnabled(){},clear(){},update(){return {move:{x:0,y:0},aim:{x:0,y:-1},held:{primary:false},pressed:{primary:false,secondary:false,dash:false,ordnance:false,overdrive:false,pause:false}};}};
  const renderer={dpr:1,camera:{shake:0},screenToWorld(x,y){return{x,y};},render(){}};
  const audio={unlock(){},play(){}};
  return {game:new Game({renderer,input,ui,audio}),callbacks};
}

test('combat room flows into a visible reward and next route',()=>{
  const {game,callbacks}=makeHarness();
  game.startRun();
  assert.equal(game.state,'route');
  const combatIndex=callbacks.node.choices.findIndex((c)=>c.type==='combat');
  callbacks.route(combatIndex);
  assert.equal(game.state,'combat');
  game.waveDelay=0;
  game.spawnNextWave();
  for(const enemy of game.enemies) enemy.receiveHit(game,{damage:9999,source:{x:0,y:0},stagger:1,knockback:0,type:'test',owner:'primary'});
  game.update(1);
  if(game.room.waveIndex+1<game.room.waves.length){game.waveDelay=0;game.spawnNextWave();for(const enemy of game.enemies)if(!enemy.dead)enemy.receiveHit(game,{damage:9999,source:{x:0,y:0},stagger:1,knockback:0,type:'test',owner:'primary'});}
  game.update(1);
  game.update(1);
  assert.ok(['reward','route'].includes(game.state));
  if(game.state==='reward'){
    assert.ok(callbacks.modules.length>0);
    callbacks.reward(0);
  }
  assert.equal(game.state,'route');
  assert.equal(game.run.depth,1);
});

test('pause clears combat state and resumes safely',()=>{
  const {game,callbacks}=makeHarness();
  game.startRun();
  callbacks.route(callbacks.node.choices.findIndex((c)=>c.type==='combat'));
  game.pause();
  assert.equal(game.state,'paused');
  callbacks.resume();
  assert.equal(game.state,'combat');
});

test('failed run records persistent progress and returns result',()=>{
  const {game,callbacks}=makeHarness();
  game.startRun();
  game.run.permanentEarned=4;
  game.finishRun(false);
  assert.equal(game.state,'result');
  assert.equal(callbacks.report.permanentEarned,4);
  assert.equal(game.profile.runs,1);
  assert.equal(game.profile.permanent,4);
});
