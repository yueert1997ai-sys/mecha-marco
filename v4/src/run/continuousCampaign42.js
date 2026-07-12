import { clamp, seededRng, shuffle } from '../core/math.js';
import { MODULES } from '../data/modules.js';
import { rollModuleChoices } from './rewardResolver.js';
import { recordRun, saveProfile } from '../meta/profile.js';
import { BOSS_DIALOGUE_42, CAMPAIGN_EVENTS_42, CAMPAIGN_LENGTH_42, getCampaignStage42, getStageMissionTargets42 } from '../data/regionOrbitalGraveyard42.js';
import { calculateRestorationEarned42, identityMatch42, commandAuthority42 } from '../meta/restoration42.js';

const lockedBounds=(stage)=>({left:-9,right:9,top:stage.centerY-6,bottom:stage.centerY+6});
const travelBounds=(stage)=>({left:-9,right:9,top:stage.centerY-8.8,bottom:stage.centerY+6});
const pushFromCircle=(actor,obstacle,centerY)=>{
  if(actor.dead)return;
  const ox=obstacle[0],oy=centerY+obstacle[1],radius=obstacle[2]+actor.radius+.12;
  const dx=actor.x-ox,dy=actor.y-oy,dist=Math.hypot(dx,dy);
  if(dist>=radius)return;
  const nx=dist>.001?dx/dist:(actor.id||0)%2?1:-1,ny=dist>.001?dy/dist:0;
  actor.x=ox+nx*radius;actor.y=oy+ny*radius;
  const inward=actor.vx*nx+actor.vy*ny;
  if(inward<0){actor.vx-=inward*nx;actor.vy-=inward*ny}
  if(actor.machine){const side=(actor.id||0)%2?1:-1;actor.vx+=-ny*side*.8;actor.vy+=nx*side*.8}
};

const applyEventChoice=(game,event,choice)=>{
  game.run.events.push(`${event.id}:${choice.id}`);
  if(choice.permanent)game.run.permanentEarned+=choice.permanent;
  if(choice.credits)game.run.credits+=choice.credits;
  if(choice.nextElite)game.run.nextElite=true;
  if(choice.healPct)game.player.hp=Math.min(game.player.maxHp,game.player.hp+game.player.maxHp*choice.healPct);
  if(choice.hpCostPct)game.player.hp=Math.max(1,game.player.hp-game.player.hp*choice.hpCostPct);
  if(choice.recognition)game.run.recognitionCount+=(choice.recognition||0);
  if(choice.archive&&!game.run.archiveFragments.includes(choice.archive))game.run.archiveFragments.push(choice.archive);
  if(choice.surrender==='accept')game.run.surrenderAccepted+=1;
  if(choice.surrender==='dismantle')game.run.surrenderRejected+=1;
  if(choice.rareModule){
    const rare=shuffle(MODULES.filter((module)=>module.rarity==='rare'&&!game.run.modules.some((owned)=>owned.id===module.id)),seededRng(game.run.seed+game.run.stageIndex*97))[0];
    if(rare){const result=game.installRunModule43?.(rare);if(!result||result.installed)game.ui.notify(`${rare.name} 已接入`,1.7);return{module:rare,result}}
  }
  return null;
};

export function applyContinuousCampaign42({Game}){
  if(Game.__continuousCampaign42)return;
  Game.__continuousCampaign42=true;

  const bindEvents=Game.prototype.bindEvents;
  Game.prototype.bindEvents=function bindCampaignEvents42(){
    bindEvents.call(this);
    this.bus.on('bossPhase',({phase})=>{
      if(!this.run?.campaign42)return;
      const line=BOSS_DIALOGUE_42[phase];
      if(line)this.ui.showComms42?.(line.speaker,line.text,4.2,'enemy');
    });
  };

  const startRun=Game.prototype.startRun;
  Game.prototype.startRun=function startContinuousRun42(){
    const result=startRun.call(this);
    this.run.campaign42=true;
    this.run.stageIndex=0;
    this.run.depth=0;
    this.run.routeFlags={};
    this.run.exitOpen=false;
    this.run.pendingExitStage42=null;
    this.run.highRiskChoices=0;
    this.run.recognitionCount=0;
    this.run.archiveFragments=[];
    this.run.surrenderAccepted=0;
    this.run.surrenderRejected=0;
    this.run.primaryKills=0;
    this.run.ordnanceKills=0;
    this.run.visitedStages=[];
    this.startCampaignStage42(0,true);
    return result;
  };

  Game.prototype.startCampaignStage42=function startCampaignStage42(index,first=false){
    const stage=getCampaignStage42(index,this.run);
    this.state='combat';
    this.run.stageIndex=index;
    this.run.depth=index;
    this.run.exitOpen=false;
    this.run.pendingExitStage42=null;
    this.run.visitedStages.push(stage.id);
    this.input.clear();
    this.input.setEnabled(true);
    this.ui.hidePanel();
    this.ui.setCombatVisible(true);
    this.clearRoomObjects();
    this.room={...stage,stage42:stage,reward:stage.reward,elite:stage.waves.some((wave)=>wave.some((id)=>id.startsWith('elite'))),boss:Boolean(stage.boss),waveIndex:-1,clear:false,resolved42:false,exitOpen:false};
    this.facilities42=getStageMissionTargets42(stage);
    this.bounds=lockedBounds(stage);
    if(first)this.player.resetForRoom({x:0,y:stage.centerY+4.55});
    else{
      this.player.x=clamp(this.player.x,-6.8,6.8);
      this.player.y=stage.centerY+5.25;
      this.player.vx=0;this.player.vy=0;this.player.invulnerable=Math.max(this.player.invulnerable,.72);
    }
    if(stage.healOnStart)this.player.hp=Math.min(this.player.maxHp,this.player.hp+this.player.maxHp*stage.healOnStart);
    this.player.refreshBuild(this.run.modules,true);
    this.waveDelay=.58;
    this._campaignHazardTimer42=1.7;
    if(stage.boss)this.run.reachedBoss=true;
    if(index===3){this.run.recognitionCount+=1;this.ui.showComms42?.('联合防卫军系统','识别对象：MA-00。身份状态：已处决。',4.4,'enemy')}
    this.ui.showStageBanner42?.(stage);
    this.ui.showComms42?.(stage.intro.speaker,stage.intro.text,3.7,stage.intro.speaker.includes('守墓者')||stage.intro.speaker.includes('防卫军')?'enemy':'ally');
    if(stage.enemyComms)setTimeout(()=>{if(this.run?.campaign42&&this.run.stageIndex===index)this.ui.showComms42?.('敌方通讯',stage.enemyComms,3.8,'enemy')},2600);
    if(stage.playerReply)setTimeout(()=>{if(this.run?.campaign42&&this.run.stageIndex===index)this.ui.showComms42?.('文浩马',stage.playerReply,3.4,'player')},2800);
  };

  const spawnPositions=Game.prototype.spawnPositions;
  Game.prototype.spawnPositions=function spawnCampaignPositions42(count,rng){
    const result=spawnPositions.call(this,count,rng);
    if(this.run?.campaign42){const cy=this.room?.stage42?.centerY||0;for(const point of result)point.y+=cy}
    return result;
  };

  const registerKill=Game.prototype.registerKill;
  Game.prototype.registerKill=function registerCampaignKill42(enemy,source){
    registerKill.call(this,enemy,source);
    if(!this.run?.campaign42)return;
    if(source==='primary'||source==='beam'||source==='rail-lance')this.run.primaryKills+=1;
    if(source==='ordnance'||source==='missile'||source==='sentry-shot')this.run.ordnanceKills+=1;
  };

  Game.prototype.resolveStageGeometry42=function resolveStageGeometry42(){
    const stage=this.room?.stage42;if(!stage)return;
    const obstacles=stage.spatial?.obstacles||[];
    for(const obstacle of obstacles){pushFromCircle(this.player,obstacle,stage.centerY);for(const enemy of this.enemies)pushFromCircle(enemy,obstacle,stage.centerY)}
  };

  Game.prototype.hitFacility42=function hitFacility42(target,damage,source){
    if(!target||target.dead)return false;
    target.hp=Math.max(0,target.hp-damage);this.spawnVfx({type:'enemyHit',x:target.x,y:target.y,color:this.room.stage42.theme.accent,life:.2,scale:.7});
    if(target.hp<=0){target.dead=true;this.spawnVfx({type:'explosion',x:target.x,y:target.y,color:this.room.stage42.theme.accent,life:.72,scale:1.35});this.audio.play('enemyHit');const left=this.facilities42.filter((item)=>!item.dead).length;this.ui.notify(left?`${target.label} 已摧毁 · 剩余 ${left}`:`${target.label} 全部离线`,1.4)}
    return true;
  };

  const updateProjectiles=Game.prototype.updateProjectiles;
  Game.prototype.updateProjectiles=function updateCampaignFacilities42(dt){
    updateProjectiles.call(this,dt);
    if(!this.run?.campaign42||!this.facilities42?.length)return;
    for(const shot of this.projectiles){if(shot.owner!=='player'||shot.life<=0)continue;const target=this.facilities42.find((item)=>!item.dead&&Math.hypot(item.x-shot.x,item.y-shot.y)<item.radius+(shot.radius||.12));if(target&&this.hitFacility42(target,shot.damage,shot)){shot.life=0}}
    this.projectiles=this.projectiles.filter((shot)=>shot.life>0);
  };

  const updateSlashes=Game.prototype.updateSlashes;
  Game.prototype.updateSlashes=function updateCampaignFacilitySlashes42(dt){
    updateSlashes.call(this,dt);
    if(!this.run?.campaign42||!this.facilities42?.length)return;
    for(const slash of this.slashes){if(slash.owner!=='player')continue;for(const target of this.facilities42){if(target.dead||slash.hitIds.has(target.id)||Math.hypot(target.x-slash.x,target.y-slash.y)>slash.range+target.radius)continue;slash.hitIds.add(target.id);this.hitFacility42(target,slash.damage,slash)}}
  };

  Game.prototype.openStageExit42=function openStageExit42(){
    if(!this.run?.campaign42||!this.room?.stage42)return;
    this.state='combat';this.input.clear();this.input.setEnabled(true);this.ui.hidePanel();this.ui.setCombatVisible(true);
    this.run.exitOpen=true;this.run.pendingExitStage42=null;this.room.exitOpen=true;this.room.clear=false;this.bounds=travelBounds(this.room.stage42);this.player.invulnerable=Math.max(this.player.invulnerable,.4);
    this.ui.notify('闸门开放 · 向北持续推进',2.2);
    if(this.room.stage42.clear)this.ui.showComms42?.('战区系统',this.room.stage42.clear,2.8,'system');
  };

  Game.prototype.resolveCampaignReward42=function resolveCampaignReward42(stage){
    const reward=stage.reward;
    if(reward==='credits'){this.run.credits+=42;this.ui.notify('回收战术核心 ●42');return this.openStageExit42()}
    if(reward==='permanent'){this.run.permanentEarned+=3;this.ui.notify('回收舰队数据 ◆3');return this.openStageExit42()}
    if(reward==='repair'){this.player.hp=Math.min(this.player.maxHp,this.player.hp+this.player.maxHp*.3);this.ui.notify('装甲维修完成');return this.openStageExit42()}
    const choices=rollModuleChoices(this.run,reward,this.run.seed+stage.index*211).slice(0,3);
    this.state='reward';this.input.setEnabled(false);this.ui.setCombatVisible(false);
    this.ui.showFieldReward42(choices,reward,(index)=>{
      const module=choices[index]||choices[0];
      if(!module)return this.openStageExit42();
      const install=(replaceId=null)=>{const result=this.installRunModule43?.(module,replaceId);if(!result){this.run.modules.push(module);this.player.refreshBuild(this.run.modules,true)}if(!result||result.installed){this.audio.play('select');this.ui.notify(`${module.name} 已安装`,1.5);this.openStageExit42()}return result};
      const result=install();
      if(result?.needsReplacement)this.ui.showModuleReplacement43(this.run,module,(replaceId)=>install(replaceId),()=>this.openStageExit42());
    });
  };

  Game.prototype.showCampaignEvent42=function showCampaignEvent42(event){
    this.state='event';this.input.setEnabled(false);this.ui.setCombatVisible(false);
    this.ui.showCampaignEvent42(event,(index)=>{
      const choice=event.choices[index]||event.choices[0],outcome=applyEventChoice(this,event,choice);const finish=()=>{this.audio.play('select');this.openStageExit42()};
      if(outcome?.result?.needsReplacement)return this.ui.showModuleReplacement43(this.run,outcome.module,(replaceId)=>{const replaced=this.installRunModule43(outcome.module,replaceId);if(replaced.installed)this.ui.notify(`${outcome.module.name} 已接入`,1.7);finish()},finish);
      finish();
    });
  };

  Game.prototype.completeCombatRoom=function completeContinuousStage42(){
    if(!this.run?.campaign42)return;
    if(this.room?.resolved42)return;
    const stage=this.room.stage42;this.room.resolved42=true;this.room.clear=false;this.run.roomsCleared+=1;
    if(this.player.hp/this.player.maxHp<.15)this.run.lowHpClear=true;
    const healPct=this.player.stats.effects.roomHealPct||0;if(healPct)this.player.hp=Math.min(this.player.maxHp,this.player.hp+this.player.maxHp*healPct);
    if(stage.archiveOnClear&&!this.run.archiveFragments.includes(stage.archiveOnClear)){this.run.archiveFragments.push(stage.archiveOnClear);this.run.recognitionCount+=1}
    if(stage.boss)return this.finishRun(true);
    this.run.pendingExitStage42=stage.index;
    if(stage.branches){
      this.state='route';this.input.setEnabled(false);this.ui.setCombatVisible(false);
      this.ui.showCampaignBranch42(stage,stage.branches,(index)=>{
        const branch=stage.branches[index]||stage.branches[0];
        if(stage.index===2)this.run.routeFlags.dock=branch.id;
        if(stage.index===8)this.run.routeFlags.tomb=branch.id;
        if(branch.highRisk)this.run.highRiskChoices+=1;
        if(stage.index===8&&branch.id==='maintenance')this.player.hp=Math.min(this.player.maxHp,this.player.hp+this.player.maxHp*.18);
        if(stage.index===8&&branch.id==='archive'){this.run.archiveFragments.push('ma00-archive-route');this.run.recognitionCount+=1;if(!this.run.archiveNodes.includes('archive-route'))this.run.archiveNodes.push('archive-route')}
        this.audio.play('select');this.openStageExit42();
      });
      return;
    }
    if(stage.post==='shop')return this.showShop();
    if(stage.post==='surrender')return this.showCampaignEvent42(CAMPAIGN_EVENTS_42.surrender);
    this.resolveCampaignReward42(stage);
  };

  const advanceDepth=Game.prototype.advanceDepth;
  Game.prototype.advanceDepth=function advanceCampaign42(){
    if(this.run?.campaign42&&this.run.pendingExitStage42!==null)return this.openStageExit42();
    return advanceDepth.call(this);
  };

  const updateCombat=Game.prototype.updateCombat;
  Game.prototype.updateCombat=function updateContinuousCombat42(dt){
    if(!this.run?.campaign42)return updateCombat.call(this,dt);
    if(this.run.exitOpen){
      const input=this.input.update((x,y)=>this.renderer.screenToWorld(x,y),this.player);
      if(input.pressed.pause)return this.pause();
      this.player.update(dt,input,this);this.updateProjectiles(dt);this.updateMissiles(dt);this.updateSlashes(dt);this.updateHazards(dt);
      const stage=this.room.stage42;
      if(this.player.y<=stage.centerY-7.75){
        const next=this.run.stageIndex+1;
        if(next>=CAMPAIGN_LENGTH_42)return this.finishRun(true);
        document.documentElement.dataset.stageTransition='true';setTimeout(()=>delete document.documentElement.dataset.stageTransition,360);
        this.startCampaignStage42(next,false);
      }
      return;
    }
    updateCombat.call(this,dt);
    if(this.state!=='combat'||this.run.exitOpen||this.room?.resolved42)return;
    this.resolveStageGeometry42();
    const missionLeft=this.facilities42?.some((item)=>!item.dead);
    if(missionLeft){this.room.clear=false;this.roomClearTimer=0}
    const stage=this.room?.stage42;if(!stage?.hazard)return;
    this._campaignHazardTimer42-=dt;
    if(this._campaignHazardTimer42>0)return;
    const px=this.player.x,py=this.player.y;
    if(stage.hazard==='debris')for(const offset of[-1.5,1.2])this.spawnHazard({x:clamp(px+offset,-7.5,7.5),y:clamp(py-1.4+Math.abs(offset)*.4,stage.centerY-4.8,stage.centerY+4.8),radius:.72,delay:.82,damage:18,owner:{x:px,y:py}});
    if(stage.hazard==='scan')for(const offset of[-3,0,3])this.spawnHazard({x:clamp(px+offset,-7.5,7.5),y:py-.6,radius:.58,delay:.72,damage:16,owner:{x:px,y:py}});
    if(stage.hazard==='seal')for(let i=0;i<4;i+=1){const a=i/4*Math.PI*2;this.spawnHazard({x:px+Math.cos(a)*2.2,y:py+Math.sin(a)*2.2,radius:.68,delay:.92,damage:20,owner:{x:px,y:py}})}
    if(stage.hazard==='artillery')for(const offset of[-1.4,1.4])this.spawnHazard({x:clamp(px+offset,-7.5,7.5),y:clamp(py-.8,stage.centerY-4.8,stage.centerY+4.8),radius:.95,delay:.75,damage:24,owner:{x:px,y:py}});
    this._campaignHazardTimer42=stage.hazard==='scan'?2.6:3.3;
  };

  const pause=Game.prototype.pause;
  Game.prototype.pause=function pauseCampaign42(){
    if(this.state==='combat')return pause.call(this);
  };

  Game.prototype.finishRun=function finishContinuousRun42(victory){
    if(this.state==='result'||this._finishing42)return;
    const finalize=()=>{
      this._finishing42=false;this.state='result';this.input.setEnabled(false);this.clearHostileObjects();
      const restorationEarned=calculateRestorationEarned42(this.run,victory);
      const report={victory,depth:(this.run.stageIndex||0)+1,stageReached:(this.run.stageIndex||0)+1,roomsCleared:this.run.roomsCleared,kills:this.run.kills,primaryKills:this.run.primaryKills,secondaryKills:this.run.secondaryKills,ordnanceKills:this.run.ordnanceKills,permanentEarned:this.run.permanentEarned+(victory?5:0),deathCause:this.run.deathCause,reachedBoss:this.run.reachedBoss,bossKilled:victory?'warden_alpha':null,lowHpClear:this.run.lowHpClear,mechId:this.selectedMech,modules:this.run.modules.map((module)=>module.id),events:this.run.events,highRiskChoices:this.run.highRiskChoices,recognitionCount:this.run.recognitionCount,archiveFragments:this.run.archiveFragments,archiveNodes:this.run.archiveNodes||[],optionalObjectives:this.run.optionalObjectives||[],intel:this.run.intel||0,directives:this.run.directives||[],kitId:this.run.kitId,routeConsequences:this.run.routeConsequences||{},surrenderAccepted:this.run.surrenderAccepted,surrenderRejected:this.run.surrenderRejected,restorationEarned,identityMatch:identityMatch42(this.profile,restorationEarned),commandAuthority:commandAuthority42(this.profile,victory)};
      this.profile=recordRun(this.profile,report);saveProfile(this.profile);this.ui.showResult(report,()=>this.showBase());
    };
    if(victory){this._finishing42=true;this.state='ending';this.input.setEnabled(false);this.ui.setCombatVisible(false);this.clearHostileObjects();const line=BOSS_DIALOGUE_42.death;this.ui.showComms42?.(line.speaker,line.text,3.4,'enemy');setTimeout(finalize,1450)}else finalize();
  };
}
