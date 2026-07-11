import * as THREE from 'three';

const LEG_MESH=/(thigh|calf|shin|knee|foot|skirt)/i;
const PLAYER_IDS=new Set(['vanguard','bulwark','starwing']);

const taperedPlate=(width,length,depth,taper=.64)=>{
  const shape=new THREE.Shape();
  shape.moveTo(-width*.5,-length*.5);
  shape.lineTo(width*.5,-length*.5);
  shape.lineTo(width*taper*.5,length*.5);
  shape.lineTo(-width*taper*.5,length*.5);
  shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:Math.min(width,length)*.06,bevelThickness:depth*.22});
  geometry.center();
  geometry.computeVertexNormals();
  return geometry;
};

const addRearDeck=(entry)=>{
  const root=entry.root;
  if(root.userData.topDownRearDeck)return;
  root.userData.topDownRearDeck=true;
  const parts=root.userData.parts;
  const design=root.userData.design||{};
  const armor=parts?.materials?.[1]||parts?.materials?.[0];
  const frame=parts?.materials?.[2]||armor;
  const accent=parts?.materials?.[4]||parts?.materials?.[5]||armor;
  if(!armor||!frame)return;

  const deck=new THREE.Group();
  deck.name='topdown-rear-deck';
  deck.position.set(0,-.88,.16);
  root.add(deck);

  const width=Math.max(.68,(design.chest||1)*.72);
  const core=new THREE.Mesh(taperedPlate(width,.82,.22,.72),armor);
  core.name='topdown-hip-cover';
  core.position.z=.06;
  deck.add(core);

  const spine=new THREE.Mesh(taperedPlate(width*.24,.96,.12,.42),frame);
  spine.name='topdown-spine';
  spine.position.set(0,-.06,.2);
  deck.add(spine);

  for(const side of[-1,1]){
    const vent=new THREE.Mesh(taperedPlate(width*.19,.56,.09,.3),accent);
    vent.name=`topdown-rear-vent-${side}`;
    vent.position.set(side*width*.29,-.08,.24);
    vent.rotation.z=side*.1;
    deck.add(vent);
  }
};

const configureTopDownSilhouette=(entry)=>{
  if(entry.root.userData.topDownSilhouette)return;
  entry.root.userData.topDownSilhouette=true;
  const root=entry.root;
  const parts=root.userData.parts;

  for(const leg of parts?.legs||[])leg.hip.visible=false;
  root.traverse((node)=>{
    if(LEG_MESH.test(node.name||''))node.visible=false;
  });

  if(root.userData.liteEnemy){
    for(const child of root.children){
      if(child.isMesh&&child.position.y<-.42)child.visible=false;
    }
  }

  if(parts?.torso){
    parts.torso.position.y=.08;
    parts.torso.scale.set(1.06,.92,1);
  }
  if(parts?.head){
    parts.head.position.y=1.2;
    parts.head.position.z=.34;
    parts.head.scale.setScalar(.82);
  }
  if(parts?.backpack){
    parts.backpack.position.y=-.58;
    parts.backpack.scale.set(1.06,.88,1);
  }
  for(const arm of parts?.arms||[]){
    arm.shoulder.position.x*=1.06;
    arm.shoulder.position.y=.22;
    arm.shoulder.rotation.z=-arm.side*.05;
  }

  addRearDeck(entry);
};

const installTopDownHook=(instance,entry)=>{
  if(entry.__topDownPoseInstalled)return entry;
  entry.__topDownPoseInstalled=true;
  configureTopDownSilhouette(entry);

  const applyPose=()=>{
    if(entry.__topDownPosePending===false)return;
    entry.__topDownPosePending=false;
    const actor=entry.actorRef;
    if(!actor)return;

    const aim=actor.yaw??actor.aim??0;
    const designId=entry.root.userData.design?.id;
    const player=PLAYER_IDS.has(designId);
    entry.root.rotation.order='ZXY';
    entry.root.rotation.x=.025;
    entry.root.rotation.y=0;
    entry.root.rotation.z=-aim-Math.PI*.5;
    entry.root.scale.x*=player?1.12:1.08;
    entry.root.scale.y*=player?.82:.78;
    entry.root.updateMatrixWorld(true);

    const parts=entry.root.userData.parts;
    const speed=Math.min(1,Math.hypot(actor.vx||0,actor.vy||0)/Math.max(1,actor.stats?.moveSpeed||actor.def?.speed||6));
    for(const arm of parts?.arms||[]){
      const recoil=actor.primaryKick||0;
      if(arm.side>0)arm.shoulder.rotation.z=-.08-recoil*.05;
      else arm.shoulder.rotation.z=.08;
      arm.shoulder.position.y=.22-speed*.03;
    }
    if(parts?.weapon)parts.weapon.rotation.z=(actor.primarySpreadVisual||0)*2.2;

    if(entry.contactShadow){
      entry.contactShadow.position.x=entry.root.position.x;
      entry.contactShadow.position.y=entry.root.position.y-1;
      entry.contactShadow.scale.set(player?34:27,player?20:16,1);
      entry.contactShadow.rotation.z=entry.root.rotation.z;
      entry.contactShadow.material.opacity=.32;
      entry.contactShadow.updateMatrixWorld(true);
    }

    if(entry.healthBar){
      entry.healthBar.group.position.x=entry.root.position.x;
      entry.healthBar.group.position.y=entry.root.position.y+31;
      entry.healthBar.group.rotation.z=0;
      entry.healthBar.group.updateMatrixWorld(true);
    }
  };

  if(entry.contactShadow)entry.contactShadow.onBeforeRender=applyPose;
  let hooked=false;
  entry.root.traverse((node)=>{
    if(hooked||!node.isMesh||node.visible===false)return;
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
