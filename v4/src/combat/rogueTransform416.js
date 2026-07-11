import { computeMechRig } from './hardpointRig.js';
import { clamp, seededRng, shuffle } from '../core/math.js';
import { MODULES } from '../data/modules.js';
import { buildDoctrineProfile416 } from '../run/doctrine416.js';

const pulse=(world,x,y,color,type='protocolPulse',scale=1)=>world.spawnVfx({type,x,y,color,life:.5,scale});

export function applyRogueTransform416({PlayerMech,Game}){
  if(PlayerMech.__rogueTransform416)return;
  PlayerMech.__rogueTransform416=true;

  const reset=PlayerMech.prototype.resetForRoom;
  PlayerMech.prototype.resetForRoom=function resetTransformState(...args){
    this.__lastStandUsed416=false;
    this.__lanceCounter416=0;
    this.__rearCounter416=0;
    this.__doctrineCounter416=0;
    this.__bastionPulseCooldown416=0;
    return reset.apply(this,args);
  };

  const firePrimary=PlayerMech.prototype.firePrimary;
  PlayerMech.prototype.firePrimary=function firePrimary416(world){
    firePrimary.call(this,world);
    const effects=this.stats.effects||{};
    const rig=computeMechRig(this,world.time);
    const doctrine=buildDoctrineProfile416(this.modules||[]);
    this.__lanceCounter416=(this.__lanceCounter416||0)+1;
    this.__rearCounter416=(this.__rearCounter416||0)+1;
    this.__doctrineCounter416=(this.__doctrineCounter416||0)+1;

    if(effects.primaryLanceCycle&&this.__lanceCounter416%effects.primaryLanceCycle===0){
      world.spawnProjectile({owner:'player',x:rig.muzzle.x,y:rig.muzzle.y,angle:this.aim,speed:this.stats.projectileSpeed*1.18,damage:this.stats.primaryDamage*2.5,color:this.mech.palette.trim,life:1.45,radius:.3,pierce:6,ricochet:0,type:'rail-lance',source:{x:this.x,y:this.y}});
      pulse(world,rig.muzzle.x,rig.muzzle.y,this.mech.palette.trim,'railCharge',1.4);
      world.audio.play('beam');
    }

    if(effects.primaryRearCycle&&this.__rearCounter416%effects.primaryRearCycle===0){
      world.spawnProjectile({owner:'player',x:this.x,y:this.y,angle:this.aim+Math.PI,speed:this.stats.projectileSpeed*.9,damage:this.stats.primaryDamage*.72,color:this.mech.palette.accent,life:.9,radius:.16,pierce:1,ricochet:0,type:'rear-beam',source:{x:this.x,y:this.y}});
    }

    if(doctrine.auroraResonance&&this.__doctrineCounter416%4===0){
      for(const offset of[-.16,.16])world.spawnProjectile({owner:'player',x:rig.muzzle.x,y:rig.muzzle.y,angle:this.aim+offset,speed:this.stats.projectileSpeed*.96,damage:this.stats.primaryDamage*.48,color:this.mech.palette.glow,life:1.0,radius:.11,pierce:0,ricochet:0,type:'aurora-resonance',source:{x:this.x,y:this.y}});
    }

    if(effects.overdriveWingmen&&this.overdriveTimer>0){
      const sideX=-Math.sin(this.aim),sideY=Math.cos(this.aim);
      for(const side of[-1,1])world.spawnProjectile({owner:'player',x:this.x+sideX*side*.74,y:this.y+sideY*side*.74,angle:this.aim+side*.055,speed:this.stats.projectileSpeed,damage:this.stats.primaryDamage*.58,color:this.mech.palette.glow,life:1.1,radius:.12,pierce:0,ricochet:0,type:'wingman-copy',source:{x:this.x,y:this.y}});
    }
  };

  const executeSlash=PlayerMech.prototype.executeSlash;
  PlayerMech.prototype.executeSlash=function executeSlash416(world,reverse){
    executeSlash.call(this,world,reverse);
    if(!this.stats.effects?.saberTempest)return;
    for(let index=0;index<8;index+=1){
      const angle=index/8*Math.PI*2+(reverse?.18:0);
      world.spawnProjectile({owner:'player',x:this.x,y:this.y,angle,speed:8.8,damage:this.stats.secondaryDamage*.3,color:this.mech.palette.glow,life:.58,radius:.2,pierce:1,ricochet:0,type:'saber-tempest',source:{x:this.x,y:this.y}});
    }
    pulse(world,this.x,this.y,this.mech.palette.glow,'saberTempest',1.8);
  };

  const updateDash=PlayerMech.prototype.updateDash;
  PlayerMech.prototype.updateDash=function updateDash416(dt,input,world){
    const before=this.dashTimer;
    const start={x:this.x,y:this.y};
    updateDash.call(this,dt,input,world);
    const started=before<=0&&this.dashTimer>0;
    const doctrine=buildDoctrineProfile416(this.modules||[]);
    if(!started)return;

    if(this.stats.effects?.phaseBlink){
      const distance=this.stats.dashSpeed*this.stats.dashDuration*1.18;
      const destination={
        x:clamp(start.x+this.dashVector.x*distance,world.bounds.left+this.radius,world.bounds.right-this.radius),
        y:clamp(start.y+this.dashVector.y*distance,world.bounds.top+this.radius,world.bounds.bottom-this.radius),
      };
      world.damageEnemiesInCircle(start,1.25,24,{type:'phase-start',stagger:.24,knockback:2.6});
      this.x=destination.x;this.y=destination.y;this.vx=0;this.vy=0;this.dashTimer=0;this.invulnerable=Math.max(this.invulnerable,.38);
      world.damageEnemiesInCircle(this,1.4,32,{type:'phase-end',stagger:.34,knockback:3.8});
      pulse(world,start.x,start.y,this.mech.palette.accent,'phaseBlink',1.2);
      pulse(world,this.x,this.y,this.mech.palette.glow,'phaseBlink',1.6);
    }

    if(doctrine.bastionResonance)world.damageEnemiesInCircle(this,1.05,14,{type:'bastion-resonance',stagger:.22,knockback:2.2});
    if(doctrine.eclipseResonance){
      world.spawnDecoy({x:start.x,y:start.y,life:1.7});
      const target=world.getNearestEnemies(this,1,9)[0];
      if(target)world.spawnProjectile({owner:'player',x:start.x,y:start.y,angle:Math.atan2(target.y-start.y,target.x-start.x),speed:13,damage:this.stats.primaryDamage*.75,color:this.mech.palette.accent,life:.8,radius:.14,pierce:0,ricochet:1,type:'eclipse-seeker',source:start});
    }
  };

  const updateOrdnance=PlayerMech.prototype.updateOrdnance;
  PlayerMech.prototype.updateOrdnance=function updateOrdnance416(world){
    const before=world.missiles.length;
    updateOrdnance.call(this,world);
    const added=world.missiles.length-before;
    if(added<=0)return;
    for(const missile of world.missiles.slice(before))missile.color=this.mech.palette.accent;
    if(!this.stats.effects?.ordnanceSentry)return;
    world.missiles.splice(before,added);
    world.protocolSentries416||=[];
    world.protocolSentries416.push({x:this.x,y:this.y,life:5.8,cooldown:.12,color:this.mech.palette.glow,damage:this.stats.ordnanceDamage*.48});
    world.spawnDecoy({x:this.x,y:this.y,life:5.8});
    pulse(world,this.x,this.y,this.mech.palette.glow,'sentryDeploy',1.5);
  };

  const takeDamage=PlayerMech.prototype.takeDamage;
  PlayerMech.prototype.takeDamage=function takeDamage416(world,damage,source,type='enemy'){
    const result=takeDamage.call(this,world,damage,source,type);
    const doctrine=buildDoctrineProfile416(this.modules||[]);
    if(doctrine.bastionResonance&&result>0&&this.__bastionPulseCooldown416<=0){
      world.damageEnemiesInCircle(this,1.15,10,{type:'bastion-counter',stagger:.14,knockback:1.5});
      this.__bastionPulseCooldown416=1.6;
    }
    if(this.dead&&this.stats.effects?.lastStandProtocol&&!this.__lastStandUsed416){
      this.__lastStandUsed416=true;this.dead=false;this.hp=1;this.invulnerable=1.15;this.overdriveTimer=Math.max(this.overdriveTimer,3.2);
      pulse(world,this.x,this.y,this.mech.palette.glow,'lastStand',2.1);
      world.ui?.notify?.('拒绝停机协议启动',1.8);
    }
    return result;
  };

  const clearRoom=Game.prototype.clearRoomObjects;
  Game.prototype.clearRoomObjects=function clearTransformEntities(){
    const result=clearRoom.call(this);
    this.protocolSentries416=[];
    return result;
  };

  const clearHostile=Game.prototype.clearHostileObjects;
  Game.prototype.clearHostileObjects=function clearTransformHostiles(){
    const result=clearHostile.call(this);
    this.protocolSentries416=[];
    return result;
  };

  const updateCombat=Game.prototype.updateCombat;
  Game.prototype.updateCombat=function updateCombat416(dt){
    if(this.player)this.player.__bastionPulseCooldown416=Math.max(0,(this.player.__bastionPulseCooldown416||0)-dt);
    updateCombat.call(this,dt);
    if(this.state!=='combat')return;
    this.protocolSentries416||=[];
    for(const sentry of this.protocolSentries416){
      sentry.life-=dt;sentry.cooldown-=dt;
      if(sentry.cooldown<=0){
        const target=this.getNearestEnemies(sentry,1,12)[0];
        if(target){
          this.spawnProjectile({owner:'player',x:sentry.x,y:sentry.y,angle:Math.atan2(target.y-sentry.y,target.x-sentry.x),speed:14,damage:sentry.damage,color:sentry.color,life:1,radius:.14,pierce:0,ricochet:0,type:'sentry-shot',source:{x:sentry.x,y:sentry.y}});
          this.spawnVfx({type:'muzzle',x:sentry.x,y:sentry.y,angle:0,color:sentry.color,life:.12});
        }
        sentry.cooldown=.42;
      }
    }
    this.protocolSentries416=this.protocolSentries416.filter((sentry)=>sentry.life>0);
  };

  const startRun=Game.prototype.startRun;
  Game.prototype.startRun=function startRun416(){
    const result=startRun.call(this);
    for(const depth of[1,5]){
      const node=this.run?.graph?.nodes?.[depth];
      const choice=node?.choices?.find((item)=>item.type==='combat');
      if(choice)choice.reward='transform';
    }
    return result;
  };

  Game.prototype.showShop=function showShop416(){
    this.state='shop';this.input.setEnabled(false);this.ui.setCombatVisible(false);
    const inventory=shuffle(MODULES.filter((module)=>module.slot!=='Core'&&!this.run.modules.some((owned)=>owned.id===module.id)),seededRng(this.run.seed+this.run.depth*19)).slice(0,3);
    const render=()=>this.ui.showShop(this.run,inventory,(index)=>{
      if(this.run.credits<35)return;
      const [module]=inventory.splice(index,1);if(!module)return;
      this.run.credits-=35;this.run.modules.push(module);this.player.refreshBuild(this.run.modules,true);this.audio.play('select');render();
    },()=>{
      if(this.run.credits<25)return;this.run.credits-=25;this.player.hp=Math.min(this.player.maxHp,this.player.hp+this.player.maxHp*.28);this.audio.play('select');render();
    },()=>this.advanceDepth());
    render();
  };
}
