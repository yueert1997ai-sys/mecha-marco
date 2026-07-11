import { clamp } from '../core/math.js';

const signedScreenAngle = (renderer,actor) => {
  const origin=renderer.worldToScreen(actor.x,actor.y);
  const aim=actor.aim??actor.yaw??-Math.PI/2;
  const tip=renderer.worldToScreen(actor.x+Math.cos(aim),actor.y+Math.sin(aim));
  return Math.atan2(tip.x-origin.x,-(tip.y-origin.y));
};

const liveActors = (world) => [
  ...(world.enemies||[]).filter((actor)=>!actor.dead),
  ...(world.player&&!world.player.dead?[world.player]:[]),
];

export function applyHades25DMechPose(instance){
  if(!instance||instance.__hades25dPoseApplied)return instance;
  instance.__hades25dPoseApplied=true;

  const reticle=instance.scene.children.find((node)=>node.geometry?.type==='RingGeometry');
  if(reticle&&!reticle.userData.hades25dFlattened){
    reticle.geometry.scale(1,.46,1);
    reticle.userData.hades25dFlattened=true;
  }

  const previousRender=instance.render.bind(instance);
  instance.render=function renderHades25D(world){
    const saved=[];
    const debug=[];
    for(const actor of liveActors(world)){
      const screenAngle=signedScreenAngle(instance.worldRenderer,actor);
      saved.push({actor,yaw:actor.yaw,spread:actor.primarySpreadVisual});
      actor.yaw=-Math.PI/2+clamp(screenAngle*.04,-.07,.07);
      actor.primarySpreadVisual=clamp(-screenAngle/3,-.52,.52)+(actor.primarySpreadVisual||0)*.15;
      debug.push({id:actor.id||'player',screenAngle,forcedYaw:actor.yaw});
    }
    globalThis.__MECHA_HADES25D_POSE__=debug;
    try{
      return previousRender(world);
    }finally{
      for(const state of saved){
        state.actor.yaw=state.yaw;
        state.actor.primarySpreadVisual=state.spread;
      }
    }
  };
  return instance;
}
