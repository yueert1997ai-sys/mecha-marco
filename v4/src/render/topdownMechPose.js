const installTopDownHook=(instance,entry)=>{
  if(entry.__topDownPoseInstalled)return entry;
  entry.__topDownPoseInstalled=true;

  const applyPose=()=>{
    if(entry.__topDownPosePending===false)return;
    entry.__topDownPosePending=false;
    const actor=entry.actorRef;
    if(!actor)return;

    const aim=actor.yaw??actor.aim??0;
    entry.root.rotation.order='ZXY';
    entry.root.rotation.x=.08;
    entry.root.rotation.y=0;
    entry.root.rotation.z=-aim-Math.PI*.5;
    entry.root.scale.x*=1.05;
    entry.root.scale.y*=.9;
    entry.root.updateMatrixWorld(true);

    if(entry.contactShadow){
      entry.contactShadow.position.x=entry.root.position.x;
      entry.contactShadow.position.y=entry.root.position.y;
      entry.contactShadow.scale.set(30,18,1);
      entry.contactShadow.rotation.z=entry.root.rotation.z;
      entry.contactShadow.material.opacity=.3;
      entry.contactShadow.updateMatrixWorld(true);
    }

    if(entry.healthBar){
      entry.healthBar.group.position.x=entry.root.position.x;
      entry.healthBar.group.position.y=entry.root.position.y+34;
      entry.healthBar.group.rotation.z=0;
      entry.healthBar.group.updateMatrixWorld(true);
    }
  };

  if(entry.contactShadow)entry.contactShadow.onBeforeRender=applyPose;
  let hooked=false;
  entry.root.traverse((node)=>{
    if(hooked||!node.isMesh)return;
    const materials=Array.isArray(node.material)?node.material:[node.material];
    if(materials.some((material)=>material?.transparent))return;
    node.onBeforeRender=applyPose;
    hooked=true;
  });
  return entry;
};

export function applyTopDownMechPose(instance){
  if(!instance||instance.__topDownPoseApplied)return instance;
  instance.__topDownPoseApplied=true;

  const ensureName=typeof instance.ensureActor==='function'?'ensureActor':'ensure';
  const previousEnsure=instance[ensureName].bind(instance);
  instance[ensureName]=function ensureTopDown(actor,isPlayer){
    const entry=previousEnsure(actor,isPlayer);
    entry.actorRef=actor;
    return installTopDownHook(instance,entry);
  };

  const reticle=instance.scene.children.find((node)=>node.geometry?.type==='RingGeometry');
  if(reticle){
    reticle.onBeforeRender=()=>{
      reticle.rotation.z=0;
      reticle.scale.y=reticle.scale.x;
      reticle.updateMatrixWorld(true);
    };
  }

  const previousRender=instance.render.bind(instance);
  instance.render=function renderTopDown(world){
    for(const entry of instance.actors.values())entry.__topDownPosePending=true;
    return previousRender(world);
  };
  return instance;
}
