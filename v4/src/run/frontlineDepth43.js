import { clamp, distance } from '../core/math.js';
import { directiveRewardMultiplier43, getFrameKit43 } from '../data/frontlineDepth43.js';
import { MODULE_BY_ID } from '../data/modules.js';
import { installModule43, moduleCapacityFull43, moduleGroup43 } from './rewardResolver.js';

const alive=(items=[])=>items.filter((item)=>!item.dead);
const stageOffset=(game)=>game.room?.stage42?.centerY||0;

function widthAt(stage,worldY){
  const profile=stage?.spatial?.widthProfile;if(!profile?.length)return 8.7;
  const y=worldY-stage.centerY;
  const sorted=[...profile].sort((a,b)=>a[0]-b[0]);
  if(y<=sorted[0][0])return sorted[0][1];if(y>=sorted.at(-1)[0])return sorted.at(-1)[1];
  for(let i=1;i<sorted.length;i+=1){const a=sorted[i-1],b=sorted[i];if(y<=b[0]){const t=(y-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t}}
  return 8.7;
}

function createMission(game,stage){
  const def=stage.spatial?.mission||{type:stage.boss?'boss':'eliminate',label:stage.objective};
  const points=(def.points||[]).map(([x,y])=>({x,y:stage.centerY+y}));
  return{...def,points,pointIndex:0,state:'active',progress:0,max:points.length?(def.perPoint||1.15):(def.duration||1),hp:def.hp||0,maxHp:def.hp||0,startedAt:game.time,complete:false,failed:false,targetId:null,commandIds:[],escaped:false,outcomeAnnounced:false};
}

function addArchive(game,id){if(id&&!game.run.archiveNodes.includes(id))game.run.archiveNodes.push(id)}
function finishOptional(game,id,text){
  if(game.run.optionalObjectives.includes(id))return;
  game.run.optionalObjectives.push(id);game.run.intel=Math.min(5,game.run.intel+1);addArchive(game,id);game.ui.notify(`${text} · 情报 ⬡+1`,1.8);
}
function finishArchive(game,id,text){if(game.run.archiveNodes.includes(id))return;addArchive(game,id);game.ui.notify(`${text} · 档案已记录`,1.7)}

export function applyFrontlineDepth43({Game,Enemy}){
  if(Game.__frontlineDepth43)return;Game.__frontlineDepth43=true;

  const enemyUpdate=Enemy.prototype.update;
  Enemy.prototype.update=function updateSquadRole43(dt,world){
    enemyUpdate.call(this,dt,world);if(this.dead||!world.run?.campaign42)return;
    if(this.squadRole43==='protector'){const protectedUnit=world.enemies.find((enemy)=>!enemy.dead&&(enemy.commander43||enemy.inspector43));if(protectedUnit&&distance(this,protectedUnit)>2.2)this.moveToward(protectedUnit,.72)}
    if(this.squadRole43==='flanker'&&world.player&&!world.player.dead){const side=this.id%2?1:-1,target={x:world.player.x+side*3.4,y:world.player.y-.6};if(distance(this,target)>1.4)this.moveToward(target,.6)}
    if(this.commander43){for(const ally of world.enemies){if(ally===this||ally.dead||distance(this,ally)>4.2)continue;ally.attackCooldown=Math.max(0,ally.attackCooldown-dt*.12)}}
  };

  const startRun=Game.prototype.startRun;
  Game.prototype.startRun=function startDepthRun43(){
    const result=startRun.call(this);const kit=getFrameKit43(this.selectedMech,this.profile.selectedKits?.[this.selectedMech]);
    this.run.kitId=kit?.id;this.run.focusDoctrine=kit?.family||'aurora';this.run.mechTags=[...new Set([...(this.run.mechTags||[]),...(kit?.startTags||[])])];
    const starter=MODULE_BY_ID.get(kit?.starterModule);if(starter){this.run.modules.push(starter);this.run.kitModuleId=starter.id;this.player.refreshBuild(this.run.modules,true)}
    this.run.intel=0;this.run.optionalObjectives=[];this.run.archiveNodes=[];this.run.routeConsequences={};this.run.bossPrep={};this.run.directives=[...(this.profile.selectedDirectives||[])];this.run.moduleSalvage=0;
    return result;
  };

  const startStage=Game.prototype.startCampaignStage42;
  Game.prototype.startCampaignStage42=function startDepthStage43(index,first=false){
    this.run.directives||=[...(this.profile.selectedDirectives||[])];this.run.optionalObjectives||=[];this.run.archiveNodes||=[];this.run.routeConsequences||={};this.run.bossPrep||={};this.run.intel??=0;
    const result=startStage.call(this,index,first);const stage=this.room.stage42;this.run.mission43=createMission(this,stage);this.run.stageStartedAt43=this.time;
    if(this.run.nextElite){stage.waves[0]=['eliteBlade',...stage.waves[0]];this.run.nextElite=false}
    if(this.run.directives.includes('elite-command')&&[7,10].includes(index))stage.waves[0]=['eliteCannon',...stage.waves[0]];
    if(this.run.directives.includes('no-field-repair'))this.player.stats.effects.roomHealPct=0;
    if(stage.spatial?.mission?.type==='defense'){const mission=this.run.mission43;mission.x=stage.spatial.mission.x;mission.y=stage.centerY+stage.spatial.mission.y}
    if(stage.spatial?.mission?.type==='pursuit'){
      const inspector=new Enemy('eliteCannon',0,stage.centerY-2.7,stage.spatial.mission.hpScale||1.2);inspector.inspector43=true;inspector.name='监察官·赫因';this.enemies.push(inspector);this.run.mission43.targetId=inspector.id;
    }
    if(stage.spatial?.mission?.type==='command'){
      const count=stage.spatial.mission.count||2;
      for(let i=0;i<count;i+=1){const unit=new Enemy(i%2?'eliteCannon':'eliteBlade',(i?1:-1)*3.7,stage.centerY-1.8+i*2.5,1);unit.commander43=true;unit.name=i?'压制指挥机':'截击指挥机';this.enemies.push(unit);this.run.mission43.commandIds.push(unit.id)}
    }
    if(index===9&&this.run.intel>0)this.ui.notify('靠近南侧战术端口可消耗 ⬡1 关闭重炮',2.6);
    return result;
  };

  const spawnNextWave=Game.prototype.spawnNextWave;
  Game.prototype.spawnNextWave=function spawnDepthWave43(){
    const before=this.enemies.length,result=spawnNextWave.call(this);if(!this.run?.campaign42)return result;
    const spawned=this.enemies.slice(before);
    for(const enemy of spawned){if(enemy.def.role==='tank')enemy.squadRole43='protector';else if(['melee','eliteMelee'].includes(enemy.def.role))enemy.squadRole43='flanker';else if(enemy.elite)enemy.squadRole43='commander'}
    if(this.run.directives.includes('shield-network')){const armored=spawned.find((enemy)=>enemy.def.role==='tank'||enemy.elite)||spawned[0];if(armored){armored.armor=Math.min(.55,(armored.armor||0)+.18);armored.shielded43=true}}
    if(this.run.directives.includes('rapid-reinforcement'))this.waveDelay=Math.min(this.waveDelay,.2);
    return result;
  };

  const spawnPositions=Game.prototype.spawnPositions;
  Game.prototype.spawnPositions=function spawnFromStageAnchors43(count,rng){
    if(!this.run?.campaign42)return spawnPositions.call(this,count,rng);
    const stage=this.room?.stage42,cy=stage?.centerY||0,profile=stage?.spatial?.widthProfile||[[5,7]];
    const anchors=profile.map(([y,w],index)=>({x:(index%2?1:-1)*(w-1.1),y:cy+y*.72}));
    return Array.from({length:count},(_,index)=>{const base=anchors[index%anchors.length];return{x:base.x+(rng()-.5)*1.2,y:base.y+(rng()-.5)*1.1}});
  };

  const hitFacility=Game.prototype.hitFacility42;
  Game.prototype.hitFacility42=function hitDepthFacility43(target,damage,source){
    const wasDead=target?.dead;const result=hitFacility.call(this,target,damage,source);
    if(!wasDead&&target?.dead&&this.run?.campaign42){
      const stage=this.room.stage42;
      if(stage.index===0&&this.facilities42.filter((item)=>item.dead).length===1){const side=target.x<0?'left':'right';this.run.routeConsequences.breach=side;addArchive(this,`breach-${side}`);this.ui.notify(`${side==='left'?'左翼':'右翼'}突破口已形成`,1.5)}
      if(stage.index===6&&this.facilities42.every((item)=>item.dead)&&this.time-this.run.stageStartedAt43<=22){finishOptional(this,'seal-overload','供能塔连锁过载');this.run.bossPrep.sealDisabled=true}
    }
    return result;
  };

  const completeRoom=Game.prototype.completeCombatRoom;
  Game.prototype.completeCombatRoom=function completeDepthRoom43(){
    if(this.run?.campaign42&&this.run.mission43&&!this.run.mission43.complete&&!this.room?.boss){this.room.clear=false;this.roomClearTimer=0;return}
    return completeRoom.call(this);
  };

  const resolveReward=Game.prototype.resolveCampaignReward42;
  Game.prototype.resolveCampaignReward42=function resolveDepthReward43(stage){
    if(stage.reward==='permanent'){const amount=stage.index===8?2:3;this.run.permanentEarned+=amount;this.ui.notify(`回收舰队数据 ◆${amount}`);return this.openStageExit42()}
    return resolveReward.call(this,stage);
  };

  Game.prototype.installRunModule43=function installRunModule43(module,replaceId=null){
    const result=installModule43(this.run,module,replaceId);if(result.installed){this.player.refreshBuild(this.run.modules,true);if(result.removed){this.run.credits+=15;this.run.moduleSalvage+=1}}
    return result;
  };

  const updateCombat=Game.prototype.updateCombat;
  Game.prototype.updateCombat=function updateDepthCombat43(dt){
    updateCombat.call(this,dt);if(this.state!=='combat'||!this.run?.campaign42||this.run.exitOpen||!this.room?.stage42)return;
    const stage=this.room.stage42,mission=this.run.mission43;if(!mission)return;
    if(this.run.directives.includes('hazard-overload'))this._campaignHazardTimer42=Math.max(0,this._campaignHazardTimer42-dt*.65);
    const bossEnemy=this.enemies.find((enemy)=>enemy.boss&&!enemy.dead);if(bossEnemy?.phase===3&&this.run.directives.includes('core-frenzy'))bossEnemy.attackCooldown=Math.max(0,bossEnemy.attackCooldown-dt*.4);
    if(bossEnemy){
      const phaseChanged=this.run.bossPhase43!==undefined&&this.run.bossPhase43!==bossEnemy.phase;this.run.bossPhaseTime43=(this.run.bossPhase43===bossEnemy.phase?(this.run.bossPhaseTime43||0)+dt:0);this.run.bossPhase43=bossEnemy.phase;
      if(phaseChanged&&bossEnemy.phase>=2&&!this.run.bossPrep.commandBroken){this.run.bossSupportPhases43||=[];if(!this.run.bossSupportPhases43.includes(bossEnemy.phase)){const support=new Enemy(bossEnemy.phase===2?'eliteBlade':'eliteCannon',bossEnemy.phase%2?4.8:-4.8,stage.centerY+1.8,1);support.name='核心指挥链增援';support.squadRole43='protector';this.enemies.push(support);this.run.bossSupportPhases43.push(bossEnemy.phase);this.ui.showTacticalReceipt43?.('指挥链仍在线',`PHASE ${bossEnemy.phase} 敌方精英增援抵达`,'danger')}}
      this.run.bossHazardTimer43=(this.run.bossHazardTimer43||1.8)-dt;
      if(this.run.bossHazardTimer43<=0){
        if(bossEnemy.phase===1&&!this.run.bossPrep.scanDisabled){for(const offset of[-2.4,0,2.4])this.spawnHazard({x:clamp(this.player.x+offset,-6.5,6.5),y:this.player.y-.8,radius:.62,delay:.82,damage:18,owner:bossEnemy})}
        if(bossEnemy.phase===2&&!this.run.bossPrep.artilleryDisabled){for(const offset of[-1.5,1.5])this.spawnHazard({x:clamp(this.player.x+offset,-6.5,6.5),y:this.player.y,radius:1.05,delay:.72,damage:23,owner:bossEnemy})}
        this.run.bossHazardTimer43=bossEnemy.phase===3?2.1:3.2;
      }
      if(bossEnemy.phase===3){const shrink=Math.max(4.15,6.8-(this.run.bossPhaseTime43||0)*.08);this.player.x=clamp(this.player.x,-shrink,shrink);bossEnemy.x=clamp(bossEnemy.x,-shrink,shrink)}
    }
    const half=Math.max(2.8,widthAt(stage,this.player.y)-this.player.radius);this.player.x=clamp(this.player.x,-half,half);
    for(const enemy of this.enemies){const w=Math.max(2.8,widthAt(stage,enemy.y)-enemy.radius);enemy.x=clamp(enemy.x,-w,w)}

    const living=alive(this.enemies),wavesDone=this.room.waveIndex+1>=this.room.waves.length&&living.length===0&&this.waveDelay<=0;
    if(mission.type==='destroy')mission.complete=alive(this.facilities42).length===0&&wavesDone;
    else if(mission.type==='capture'){
      if(mission.points.length){const point=mission.points[mission.pointIndex];if(point){mission.progress=distance(this.player,point)<1.55?Math.min(mission.max,mission.progress+dt):Math.max(0,mission.progress-dt*.45);if(mission.progress>=mission.max){mission.pointIndex+=1;mission.progress=0;this.ui.showTacticalReceipt43?.(`纪念序列 ${mission.pointIndex} / ${mission.points.length}`,mission.pointIndex===mission.points.length?'旧舰队权限链已恢复':'下一座纪念碑同步开放','success');if(mission.pointIndex===mission.points.length)finishArchive(this,'memorial-sequence','纪念舰列识别完成')}}mission.complete=mission.pointIndex>=mission.points.length&&wavesDone}
      else{const point={x:mission.x||0,y:stage.centerY+(mission.y||-3.3)};mission.progress=distance(this.player,point)<1.55?Math.min(mission.max,mission.progress+dt):Math.max(0,mission.progress-dt*.45);mission.complete=mission.progress>=mission.max&&wavesDone}
    }else if(mission.type==='defense'){
      const nearby=living.filter((enemy)=>distance(enemy,{x:mission.x,y:mission.y})<2.35).length;if(nearby)mission.hp=Math.max(0,mission.hp-nearby*7.5*dt);
      mission.progress=Math.min(mission.max,mission.progress+dt);if(mission.hp<=0){mission.failed=true;mission.complete=wavesDone;this.run.routeConsequences.supply='lost';if(!mission.outcomeAnnounced){mission.outcomeAnnounced=true;this.ui.showTacticalReceipt43?.('补给舰失联','应急商店仅剩一条挂架 · 维修取消','danger');this.ui.showComms42?.('整备长·伊芙','接驳舰失压。能抢回多少算多少，维修舱保不住了。',3.2,'enemy')}}
      else if(mission.progress>=mission.max&&wavesDone){mission.complete=true;const perfect=mission.hp/mission.maxHp>.72;this.run.routeConsequences.supply=perfect?'perfect':'secured';if(!mission.outcomeAnnounced){mission.outcomeAnnounced=true;this.ui.showTacticalReceipt43?.(perfect?'补给舰完整接驳':'补给舰受损接驳',perfect?'获得完整商店与 18% 战地维修':'商店维持 · 无额外维修','success')}if(perfect){finishOptional(this,'supply-perfect','补给舰完整接驳');this.player.hp=Math.min(this.player.maxHp,this.player.hp+this.player.maxHp*.18)}}
    }else if(mission.type==='pursuit'){
      const target=this.enemies.find((enemy)=>enemy.id===mission.targetId),escapeTime=mission.escapeTime||24;mission.progress=Math.min(escapeTime,mission.progress+dt);
      if(target&&!target.dead){const escapeLine=(this.bounds?.top??stage.centerY-6)+(target.radius||.6)+.08,escapeTimedOut=mission.progress>=escapeTime;target.vy-=dt*(.55+mission.progress*.012);if(target.y<=escapeLine||escapeTimedOut){target.dead=true;mission.escaped=true;this.run.routeConsequences.inspector='escaped';this.run.nextElite=true;if(!mission.outcomeAnnounced){mission.outcomeAnnounced=true;this.ui.showTacticalReceipt43?.('监察官逃脱','下一段追加精英 · 核心护卫恢复','danger')}}}
      if(!target||target.dead){mission.complete=wavesDone;if(!mission.escaped){this.run.routeConsequences.inspector='captured';finishOptional(this,'inspector-captured','监察官已瘫痪');if(!mission.outcomeAnnounced){mission.outcomeAnnounced=true;this.ui.showTacticalReceipt43?.('监察官已捕获','核心护卫情报已截获','success')}}if(mission.complete)stage.post=mission.escaped?null:'surrender'}
    }else if(mission.type==='command'){const commandersDead=mission.commandIds.every((id)=>!this.enemies.some((enemy)=>enemy.id===id&&!enemy.dead));mission.complete=commandersDead&&wavesDone;if(commandersDead&&stage.index===10&&!mission.outcomeAnnounced){mission.outcomeAnnounced=true;const quick=this.time-mission.startedAt<=(stage.spatial.optional?.duration||18);this.run.routeConsequences.command=quick?'broken':'online';this.run.bossPrep.commandBroken=quick;if(quick)finishOptional(this,'forecourt-command','前庭指挥链已切断');this.ui.showTacticalReceipt43?.(quick?'指挥链斩首成功':'指挥链完成转移',quick?'Boss 阶段不再呼叫精英增援':'Boss 阶段将恢复精英增援',quick?'success':'danger')}}
    else mission.complete=wavesDone;

    const optional=stage.spatial?.optional;
    if(optional?.type==='salvage'&&!this.run.optionalObjectives.includes('wreck-salvage')){const p={x:optional.x,y:stage.centerY+optional.y};this.run.salvageProgress43=distance(this.player,p)<1.35?(this.run.salvageProgress43||0)+dt:0;if(this.run.salvageProgress43>=optional.duration)finishOptional(this,'wreck-salvage','舰骸黑匣子已回收')}
    if(optional?.type==='spoof'&&!this.run.optionalObjectives.includes('array-spoof')){const remaining=alive(this.facilities42);if(remaining.length===1&&Math.abs(remaining[0].x)<.1&&this.run.intel>=optional.intelCost){this.run.intel-=optional.intelCost;remaining[0].dead=true;finishOptional(this,'array-spoof','识别阵列已欺骗');this.run.bossPrep.scanDisabled=true}}
    if(optional?.type==='sabotage'&&!this.run.optionalObjectives.includes('outer-sabotage')){const port={x:0,y:stage.centerY+3.5};this.run.sabotageProgress43=distance(this.player,port)<1.35?(this.run.sabotageProgress43||0)+dt:0;if(this.run.sabotageProgress43>=1.8&&this.run.intel>=optional.intelCost){this.run.intel-=optional.intelCost;finishOptional(this,'outer-sabotage','核心重炮已关闭');this.run.bossPrep.artilleryDisabled=true}}
    if(mission.complete&&!this.room.clear&&!this.room.resolved42){this.room.clear=true;this.roomClearTimer=.55}
  };

  const finishRun=Game.prototype.finishRun;
  Game.prototype.finishRun=function finishDepthRun43(victory){
    if(this.state==='result'||this._finishing42)return;
    if(this.run?.campaign42){const base=Math.min(8,(this.run.optionalObjectives?.length||0)+Math.floor((this.run.stageIndex||0)/4)+(victory?3:0));this.run.permanentEarned+=Math.round(base*directiveRewardMultiplier43(this.run.directives));if(victory&&!this.run.bossPrep.scanDisabled&&!this.run.bossPrep.artilleryDisabled)addArchive(this,'warden-unsealed')}
    return finishRun.call(this,victory);
  };
}
