import { clamp } from '../core/math.js';
import { computeMechRig } from './hardpointRig.js';

export const VANGUARD_IDENTITY_RULES_44 = Object.freeze({
  tapSeconds:.18,
  deflectSeconds:.45,
  validDeflectSeconds:.18,
  counterSeconds:3,
  decayDelaySeconds:2.5,
  decayPerSecond:10,
  primaryGain:3,
  saberGain:8,
  deflectGain:28,
  highThreshold:60,
  counterCost:35,
  counterDamageMultiplier:2.2,
  counterPierce:3,
});

export function createVanguardIdentityState44() {
  return {
    blade:0,
    sinceGain:0,
    secondaryHolding:false,
    holdSeconds:0,
    deflectStance:false,
    deflectWindow:false,
    deflectSucceeded:false,
    fallbackSlash:false,
    counterReady:false,
    counterSeconds:0,
  };
}

export function clearVanguardIdentityInput44(state) {
  if (!state) return;
  state.secondaryHolding=false;
  state.holdSeconds=0;
  state.deflectStance=false;
  state.deflectWindow=false;
  state.deflectSucceeded=false;
  state.fallbackSlash=false;
}

export function gainBladeMomentum44(state, amount) {
  if (!state || amount <= 0) return state?.blade || 0;
  state.blade=clamp(state.blade+amount,0,100);
  state.sinceGain=0;
  return state.blade;
}

export function tickVanguardIdentity44(state, dt) {
  if (!state) return;
  const previousSinceGain=state.sinceGain;
  state.sinceGain+=dt;
  const previousDecay=Math.max(0,previousSinceGain-VANGUARD_IDENTITY_RULES_44.decayDelaySeconds);
  const currentDecay=Math.max(0,state.sinceGain-VANGUARD_IDENTITY_RULES_44.decayDelaySeconds);
  if (currentDecay>previousDecay) {
    state.blade=Math.max(0,state.blade-VANGUARD_IDENTITY_RULES_44.decayPerSecond*(currentDecay-previousDecay));
  }
  if (state.counterReady) {
    state.counterSeconds=Math.max(0,state.counterSeconds-dt);
    if (state.counterSeconds<=0) state.counterReady=false;
  }
  if (!state.secondaryHolding) return;
  state.holdSeconds+=dt;
  const stanceStart=VANGUARD_IDENTITY_RULES_44.tapSeconds;
  const stanceEnd=stanceStart+VANGUARD_IDENTITY_RULES_44.deflectSeconds;
  state.deflectStance=state.holdSeconds>=stanceStart&&state.holdSeconds<stanceEnd;
  state.deflectWindow=state.deflectStance&&state.holdSeconds<stanceStart+VANGUARD_IDENTITY_RULES_44.validDeflectSeconds;
}

export function handleSecondaryTransition44(state, down) {
  if (!state) return;
  if (down) {
    state.secondaryHolding=true;
    state.holdSeconds=0;
    state.deflectStance=false;
    state.deflectWindow=false;
    state.deflectSucceeded=false;
    state.fallbackSlash=false;
    return;
  }
  if (!state.secondaryHolding) return;
  state.fallbackSlash=!state.deflectSucceeded;
  state.secondaryHolding=false;
  state.deflectStance=false;
  state.deflectWindow=false;
}

export function registerDeflect44(state) {
  if (!state?.deflectWindow) return false;
  state.deflectSucceeded=true;
  gainBladeMomentum44(state,VANGUARD_IDENTITY_RULES_44.deflectGain);
  state.counterReady=true;
  state.counterSeconds=VANGUARD_IDENTITY_RULES_44.counterSeconds;
  return true;
}

export function consumeCounter44(state) {
  if (!state?.counterReady||state.blade<VANGUARD_IDENTITY_RULES_44.counterCost) return false;
  state.blade-=VANGUARD_IDENTITY_RULES_44.counterCost;
  state.counterReady=false;
  state.counterSeconds=0;
  return true;
}

const activeForGame=(game)=>Boolean(
  game?.state==='combat'&&
  game.run?.campaign42&&
  game.room?.stage42?.index===3&&
  game.player?.mech?.id==='vanguard'&&
  !game.player.dead
);

const runRecord=(game)=>{
  game.run.vanguardIdentity44||={
    primaryHits:0,saberHits:0,deflects:0,counters:0,
    comms:{deflect:false,high:false,counter:false},
  };
  return game.run.vanguardIdentity44;
};

const announceOnce=(game,key,speaker,text,tone='player')=>{
  const record=runRecord(game);
  if(record.comms[key])return;
  record.comms[key]=true;
  game.ui.showComms42?.(speaker,text,3.2,tone);
};

const segmentDistance=(ax,ay,bx,by,px,py)=>{
  const dx=bx-ax,dy=by-ay,lengthSq=dx*dx+dy*dy||1;
  const t=clamp(((px-ax)*dx+(py-ay)*dy)/lengthSq,0,1);
  return Math.hypot(px-(ax+dx*t),py-(ay+dy*t));
};

const deflectThreats=(game,state,dt)=>{
  if(!state.deflectWindow)return 0;
  const player=game.player,reach=player.radius+.72;
  let count=0;
  game.projectiles=game.projectiles.filter((shot)=>{
    if(shot.owner!=='enemy'||String(shot.type||'').startsWith('boss'))return true;
    const nx=shot.x+Math.cos(shot.angle)*shot.speed*dt;
    const ny=shot.y+Math.sin(shot.angle)*shot.speed*dt;
    if(segmentDistance(shot.x,shot.y,nx,ny,player.x,player.y)>reach+(shot.radius||0))return true;
    if(!registerDeflect44(state))return true;
    count+=1;
    shot.deflected44=true;
    game.spawnVfx({type:'vanguardDeflect44',x:shot.x,y:shot.y,color:'#ffd06a',life:.28,scale:.8});
    return false;
  });
  game.slashes=game.slashes.filter((slash)=>{
    if(slash.owner!=='enemy'||slash.deflected44)return true;
    if(Math.hypot(slash.x-player.x,slash.y-player.y)>slash.range+player.radius+.25)return true;
    if(!registerDeflect44(state))return true;
    count+=1;
    slash.deflected44=true;
    game.spawnVfx({type:'vanguardDeflect44',x:player.x,y:player.y,color:'#ffd06a',life:.28,scale:1});
    return false;
  });
  if(count){
    const record=runRecord(game);record.deflects+=count;
    announceOnce(game,'deflect','防卫军识别阵列','异常偏转样本。目标动作不属于现役序列。','enemy');
    if(state.blade>=VANGUARD_IDENTITY_RULES_44.highThreshold)announceOnce(game,'high','MA-00 / 系统','刃势阈值异常。旧身份动作链正在恢复。');
  }
  return count;
};

const ensureState=(game)=>{
  if(!game.vanguardIdentity44)game.vanguardIdentity44=createVanguardIdentityState44();
  game.input.__vanguardIdentityState44=game.vanguardIdentity44;
  runRecord(game);
  return game.vanguardIdentity44;
};

const gainForHit=(world,owner)=>{
  if(!activeForGame(world))return;
  const state=ensureState(world),record=runRecord(world);
  if(owner==='primary'){
    gainBladeMomentum44(state,VANGUARD_IDENTITY_RULES_44.primaryGain);
    record.primaryHits+=1;
  }else if(owner==='secondary'){
    gainBladeMomentum44(state,VANGUARD_IDENTITY_RULES_44.saberGain);
    record.saberHits+=1;
  }
  if(state.blade>=VANGUARD_IDENTITY_RULES_44.highThreshold){
    announceOnce(world,'high','MA-00 / 系统','刃势阈值异常。旧身份动作链正在恢复。');
  }
};

export function applyVanguardIdentity44({Game,PlayerMech,InputRouter,Enemy}) {
  if(Game.__vanguardIdentity44Applied)return;
  Game.__vanguardIdentity44Applied=true;

  const setSourceHeld=InputRouter.prototype.setSourceHeld;
  InputRouter.prototype.setSourceHeld=function setIdentitySource44(action,source,value,alsoPress=false){
    const before=Boolean(this.held[action]);
    const result=setSourceHeld.call(this,action,source,value,alsoPress);
    const after=Boolean(this.held[action]);
    if(action==='secondary'&&before!==after){
      this.__vanguardIdentityEvents44||=[];
      this.__vanguardIdentityEvents44.push({down:after});
    }
    return result;
  };

  const clear=InputRouter.prototype.clear;
  InputRouter.prototype.clear=function clearIdentityInput44(){
    const result=clear.call(this);
    this.__vanguardIdentityEvents44=[];
    clearVanguardIdentityInput44(this.__vanguardIdentityState44);
    return result;
  };

  const firePrimary=PlayerMech.prototype.firePrimary;
  PlayerMech.prototype.firePrimary=function fireVanguardCounter44(world){
    const state=activeForGame(world)?ensureState(world):null;
    if(state&&consumeCounter44(state)){
      const rig=computeMechRig(this,world.time);
      const damage=this.stats.primaryDamage*VANGUARD_IDENTITY_RULES_44.counterDamageMultiplier*(this.overdriveTimer>0?1.25:1);
      world.spawnProjectile({
        owner:'player',x:rig.muzzle.x,y:rig.muzzle.y,angle:this.aim,
        speed:this.stats.projectileSpeed*1.12,damage,color:'#ffd06a',life:1.55,radius:.19,
        pierce:Math.max(VANGUARD_IDENTITY_RULES_44.counterPierce,this.stats.effects.primaryPierce||0),
        ricochet:0,type:'vanguard-counter44',identityHit44:'primary',source:{x:this.x,y:this.y,identityHit44:'primary'},
      });
      this.primaryKick=1.35;
      world.spawnVfx({type:'vanguardCounterMuzzle44',x:rig.muzzle.x,y:rig.muzzle.y,angle:this.aim,color:'#ffd06a',life:.22,scale:1.25});
      world.audio.play('beam');
      const record=runRecord(world);record.counters+=1;
      announceOnce(world,'counter','MA-00','动作样本匹配。反击射击序列已确认。');
      return;
    }
    const before=world.projectiles.length;
    const result=firePrimary.call(this,world);
    if(activeForGame(world))for(const shot of world.projectiles.slice(before)){
      shot.identityHit44='primary';
      if(shot.source&&typeof shot.source==='object')shot.source.identityHit44='primary';
    }
    return result;
  };

  const executeSlash=PlayerMech.prototype.executeSlash;
  PlayerMech.prototype.executeSlash=function executeIdentitySlash44(world,...args){
    const before=world.slashes.length,result=executeSlash.call(this,world,...args);
    if(activeForGame(world))for(const slash of world.slashes.slice(before))slash.identityHit44='secondary';
    return result;
  };

  const receiveHit=Enemy.prototype.receiveHit;
  Enemy.prototype.receiveHit=function receiveIdentityHit44(world,hit){
    const result=receiveHit.call(this,world,hit);
    if(result.applied){
      if(hit.owner==='secondary'&&hit.type==='saber')gainForHit(world,'secondary');
      else if(hit.source?.identityHit44==='primary')gainForHit(world,'primary');
    }
    return result;
  };

  const hitFacility=Game.prototype.hitFacility42;
  if(hitFacility)Game.prototype.hitFacility42=function hitIdentityFacility44(target,damage,source){
    const result=hitFacility.call(this,target,damage,source);
    if(result&&source?.identityHit44)gainForHit(this,source.identityHit44);
    return result;
  };

  const startStage=Game.prototype.startCampaignStage42;
  Game.prototype.startCampaignStage42=function startIdentityStage44(...args){
    clearVanguardIdentityInput44(this.vanguardIdentity44);
    this.vanguardIdentity44=null;
    if(this.input)this.input.__vanguardIdentityState44=null;
    return startStage.apply(this,args);
  };

  const beforeCombatDamageResolution=Game.prototype.beforeCombatDamageResolution;
  Game.prototype.beforeCombatDamageResolution=function beforeVanguardDamageResolution44(dt){
    beforeCombatDamageResolution?.call(this,dt);
    if(activeForGame(this))deflectThreats(this,ensureState(this),dt);
  };

  const updateCombat=Game.prototype.updateCombat;
  Game.prototype.updateCombat=function updateVanguardIdentity44(dt){
    if(!activeForGame(this)){
      clearVanguardIdentityInput44(this.vanguardIdentity44);
      if(this.input?.__vanguardIdentityEvents44)this.input.__vanguardIdentityEvents44.length=0;
      return updateCombat.call(this,dt);
    }
    const state=ensureState(this),events=this.input.__vanguardIdentityEvents44||[];
    for(const event of events.splice(0))handleSecondaryTransition44(state,event.down);
    this.input.pressed.secondary=false;
    tickVanguardIdentity44(state,dt);
    if(state.fallbackSlash){
      state.fallbackSlash=false;
      this.input.press('secondary');
    }
    const result=updateCombat.call(this,dt);
    if(this.player?.dead||this.state!=='combat')clearVanguardIdentityInput44(state);
    return result;
  };
}
