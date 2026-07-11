import { clamp } from '../core/math.js';

const signedScreenAngle = (renderer,actor) => {
  const origin=renderer.worldToScreen(actor.x,actor.y);
  const aim=actor.aim??actor.yaw??-Math.PI/2;
  const tip=renderer.worldToScreen(actor.x+Math.cos(aim),actor.y+Math.sin(aim));
  return Math.atan2(tip.x-origin.x,-(tip.y-origin.y));
};

const installPoseHook = (instance,entry) => {
  if(entry.__hades25dPoseInstalled)return entry;
  entry.__hades25dPoseInstalled=true;
  const applyPose=()=>{
    const actor=entry.actorRef;
    const world=instance.__hades25dWorld;
    if(!actor||!world)return;
    const renderer=instance.worldRenderer;
    const width=instance.canvas.clientWidth||innerWidth;
    const height=instance.canvas.clientHeight||innerHeight;
    const dpr=renderer.dpr||1;
    const screen=renderer.worldToScreen(actor.x,actor.y);
    const groundX=screen.x/dpr-width*.5;
    const groundY=height*.5-screen.y/dpr;
    const designId=entry.root.userData.design?.id;
    const player=['vanguard','bulwark','starwing'].includes(designId);
    const lite=Boolean(entry.root.userData.liteEnemy);
    const aimAngle=signedScreenAngle(renderer,actor);
    const speed=clamp(Math.hypot(actor.vx||0,actor.vy||0)/Math.max(1,actor.stats?.moveSpeed||actor.def?.speed||6));
    const dash=actor.dashTimer>0?1:0;
    const moveSide=clamp((actor.vx||0)/Math.max(1,actor.stats?.moveSpeed||actor.def?.speed||6),-1,1);
    const lift=player?40:lite?29:34;

    entry.root.position.x=groundX;
    entry.root.position.y=groundY+lift;
    entry.root.rotation.order='ZXY';
    entry.root.rotation.x=(player?.17:.20)+speed*.012+dash*.018;
    entry.root.rotation.y=clamp(aimAngle*.28,-.42,.42);
    entry.root.rotation.z=clamp(-aimAngle*.055-moveSide*.025,-.11,.11);
    entry.root.scale.multiplyScalar(player?1.08:1.03);

    const parts=entry.root.userData.parts;
    if(parts?.torso){
      parts.torso.rotation.y=clamp(aimAngle*.12,-.18,.18);
      parts.torso.rotation.z=-moveSide*.025;
    }
    if(parts?.head){
      parts.head.rotation.y=clamp(aimAngle*.2,-.28,.28);
      parts.head.rotation.z=moveSide*.018;
    }
    if(parts?.weapon){
      parts.weapon.rotation.z=-aimAngle*.82+(actor.primarySpreadVisual||0)*2.2;
    }
    for(const arm of parts?.arms||[]){
      const recoil=actor.primaryKick||0;
      if(arm.side>0)arm.shoulder.rotation.z=-aimAngle*.24-.10-recoil*.06;
      else if((actor.saberPhase||0)>0)arm.shoulder.rotation.z+=(actor.saberPhase-.5)*1.25;
      else arm.shoulder.rotation.z=aimAngle*.05+.06;
    }

    if(entry.contactShadow){
      entry.contactShadow.position.x=groundX;
      entry.contactShadow.position.y=groundY-1;
      entry.contactShadow.scale.set(player?34:lite?24:29,player?9.5:7.5,1);
      entry.contactShadow.material.opacity=player?.36:.27;
    }
    if(entry.healthBar){
      const bar=entry.healthBar.group;
      bar.position.x=groundX;
      bar.position.y=groundY+(actor.boss?62:actor.elite?48:38);
    }
  };

  if(entry.contactShadow)entry.contactShadow.onBeforeRender=applyPose;
  else{
    let firstMesh=null;
    entry.root.traverse((node)=>{if(!firstMesh&&node.isMesh)firstMesh=node;});
    if(firstMesh)firstMesh.onBeforeRender=applyPose;
  }
  return entry;
};

export function applyHades25DMechPose(instance){
  if(!instance||instance.__hades25dPoseApplied)return instance;
  instance.__hades25dPoseApplied=true;
  const ensureName=typeof instance.ensureActor==='function'?'ensureActor':'ensure';
  const previousEnsure=instance[ensureName].bind(instance);
  instance[ensureName]=function ensureHades25D(actor,isPlayer){
    const entry=previousEnsure(actor,isPlayer);
    entry.actorRef=actor;
    return installPoseHook(instance,entry);
  };

  const reticle=instance.scene.children.find((node)=>node.geometry?.type==='RingGeometry');
  if(reticle){
    reticle.onBeforeRender=()=>{
      reticle.scale.y=reticle.scale.x*.46;
      reticle.rotation.z=0;
    };
  }

  const previousRender=instance.render.bind(instance);
  instance.render=function renderHades25D(world){
    instance.__hades25dWorld=world;
    return previousRender(world);
  };
  return instance;
}
