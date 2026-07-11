import * as THREE from 'three';
import { buildLoadoutVisual } from '../meta/loadoutProfile.js';

const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const mat=(color,{metalness=.55,roughness=.5,opacity=1,emissive=0x000000}={})=>new THREE.MeshStandardMaterial({color,metalness,roughness,transparent:opacity<1,opacity,emissive});
const glow=(color,opacity=.82)=>new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending});

function mesh(parent,geometry,material,{x=0,y=0,z=0,rz=0,name='upgrade'}={}){
  const item=new THREE.Mesh(geometry,material);
  item.name=name;item.position.set(x,y,z);item.rotation.z=rz;parent.add(item);return item;
}

function install(entry){
  const root=entry.root;
  if(root.userData.loadout415)return root.userData.loadout415;
  const design=root.userData.design||{};
  const materials=root.userData.parts?.materials||[];
  const armor=(materials[0]||mat(0xc7d2dd)).clone();
  const armor2=(materials[1]||mat(0x78899a)).clone();
  const frame=(materials[2]||mat(0x121a24)).clone();
  const metal=(materials[3]||mat(0x3b4858)).clone();
  const trim=(materials[4]||mat(0x8fdff1)).clone();
  const accent=(materials[5]||mat(0xb85d62)).clone();
  for(const material of[armor,armor2,frame,metal,trim,accent]){material.flatShading=true;material.roughness=Math.max(.5,material.roughness||0);material.metalness=Math.min(.62,material.metalness||0)}
  const glowColor=design.glow||'#8defff';
  const glowMat=glow(new THREE.Color(glowColor),.82);
  const warmGlow=glow(0xffd59d,.8);
  const rig=new THREE.Group();rig.name='loadout-visual-415';root.add(rig);

  const shoulder=new THREE.Group();rig.add(shoulder);
  for(const side of[-1,1]){
    mesh(shoulder,box(.48,.7,.18),armor,{x:side*(design.chest*.56+.38),y:.43,z:.48,rz:-side*.1,name:`upgrade-shoulder-${side}`});
    mesh(shoulder,box(.13,.48,.07),trim,{x:side*(design.chest*.56+.38),y:.48,z:.61,rz:-side*.1,name:`upgrade-shoulder-trim-${side}`});
  }

  const pods=new THREE.Group();rig.add(pods);
  for(const side of[-1,1]){
    const pod=new THREE.Group();pod.position.set(side*(design.chest*.45+.48),-.48,.38);pods.add(pod);
    mesh(pod,box(.42,.82,.3),metal,{name:`upgrade-pod-${side}`});
    for(let index=0;index<3;index+=1)mesh(pod,box(.09,.12,.08),warmGlow,{x:(index-1)*.12,y:.38,z:.05,name:`upgrade-pod-light-${side}-${index}`});
  }

  const fins=new THREE.Group();rig.add(fins);
  for(const side of[-1,1]){
    mesh(fins,box(.2,1.68,.11),armor2,{x:side*(design.chest*.6+.55),y:-.72,z:.16,rz:side*.5,name:`upgrade-fin-${side}`});
    mesh(fins,box(.055,1.2,.06),glowMat,{x:side*(design.chest*.78+.63),y:-.86,z:.23,rz:side*.5,name:`upgrade-fin-glow-${side}`});
  }

  const emitters=new THREE.Group();rig.add(emitters);
  for(const side of[-1,1]){
    mesh(emitters,box(.11,.58,.07),glowMat,{x:side*design.chest*.25,y:.52,z:.62,rz:-side*.13,name:`upgrade-emitter-${side}`});
  }
  mesh(emitters,new THREE.TorusGeometry(.25,.035,6,24),glowMat,{x:0,y:.48,z:.62,name:'upgrade-core-ring'});

  const saber=new THREE.Group();rig.add(saber);
  mesh(saber,new THREE.TorusGeometry(.22,.055,6,20),glowMat,{x:-design.chest*.72,y:.26,z:.32,name:'upgrade-saber-halo'});
  mesh(saber,box(.2,.65,.14),accent,{x:-design.chest*.74,y:.18,z:.22,rz:.05,name:'upgrade-saber-brace'});

  const shield=new THREE.Group();rig.add(shield);
  mesh(shield,box(.6,1.0,.15),armor,{x:-design.chest*.83,y:.1,z:.32,rz:.08,name:'upgrade-shield'});
  mesh(shield,box(.16,.7,.07),trim,{x:-design.chest*.83,y:.12,z:.42,rz:.08,name:'upgrade-shield-trim'});

  const core=new THREE.Group();rig.add(core);
  const coreRing=mesh(core,new THREE.TorusGeometry(.42,.045,8,28),glowMat,{x:0,y:.28,z:.74,name:'upgrade-overdrive-ring'});
  const coreRing2=mesh(core,new THREE.TorusGeometry(.58,.025,6,32),glowMat,{x:0,y:.28,z:.7,name:'upgrade-overdrive-ring-outer'});

  const drones=new THREE.Group();rig.add(drones);
  const droneMeshes=[];
  for(let index=0;index<3;index+=1){
    const drone=new THREE.Group();drones.add(drone);
    mesh(drone,box(.16,.36,.1),trim,{name:`upgrade-drone-${index}`});
    mesh(drone,box(.055,.16,.05),glowMat,{y:.16,z:.08,name:`upgrade-drone-glow-${index}`});
    droneMeshes.push(drone);
  }

  const duo=new THREE.Group();rig.add(duo);
  for(const side of[-1,1])mesh(duo,box(.1,.72,.08),warmGlow,{x:side*.24,y:.76,z:.75,rz:-side*.34,name:`upgrade-duo-${side}`});

  const all=[shoulder,pods,fins,emitters,saber,shield,core,drones,duo];
  for(const group of all)group.visible=false;
  const state={rig,shoulder,pods,fins,emitters,saber,shield,core,coreRing,coreRing2,drones,droneMeshes,duo,lastKey:'',profile:null};
  root.userData.loadout415=state;
  return state;
}

function sync(entry,actor,time=0){
  const state=install(entry);
  const profile=actor.visualLoadout||buildLoadoutVisual(actor.modules||[]);
  state.profile=profile;
  state.shoulder.visible=profile.shoulderArmor>0;
  state.pods.visible=profile.missilePods>0;
  state.fins.visible=profile.wingFins>0;
  state.emitters.visible=profile.emitterLevel>0;
  state.saber.visible=profile.saberHalo>0;
  state.shield.visible=profile.shieldLevel>0;
  state.core.visible=profile.overdriveTier>0||profile.duoCount>0;
  state.drones.visible=profile.droneBits>0;
  state.duo.visible=profile.duoCount>0;

  state.shoulder.scale.setScalar(1+(profile.shoulderArmor-1)*.16);
  state.pods.scale.set(1+(profile.missilePods-1)*.12,1+(profile.missilePods-1)*.16,1);
  state.fins.scale.set(1,1+(profile.wingFins-1)*.18,1);
  state.emitters.scale.set(1,1+(profile.emitterLevel-1)*.18,1);
  state.saber.scale.setScalar(1+(profile.saberHalo-1)*.14);
  state.shield.scale.set(1+(profile.shieldLevel-1)*.2,1+(profile.shieldLevel-1)*.08,1);
  const pulse=1+Math.sin(time*4.5)*(.025+.012*profile.glowLevel);
  state.coreRing.scale.setScalar(pulse);
  state.coreRing2.scale.setScalar(1+Math.sin(time*3.2+1.4)*.035);
  state.core.rotation.z=time*(.18+.06*profile.overdriveTier);
  state.duo.rotation.z=Math.sin(time*2.2)*.04;
  state.droneMeshes.forEach((drone,index)=>{
    drone.visible=index<profile.droneBits;
    const angle=time*(.7+.08*profile.droneBits)+index/Math.max(1,profile.droneBits)*Math.PI*2;
    drone.position.set(Math.cos(angle)*(1.05+.08*profile.droneBits),Math.sin(angle)*(.78+.05*profile.droneBits),.68+Math.sin(angle*1.7)*.08);
    drone.rotation.z=-angle+.15;
  });
  state.pods.rotation.z=Math.sin(time*1.7)*.008;
  state.fins.rotation.z=Math.sin(time*1.3)*.012;
  state.rig.visible=profile.moduleCount>0;
  state.lastKey=[profile.moduleCount,profile.beamTier,profile.saberTier,profile.mobilityTier,profile.ordnanceTier,profile.defenseTier,profile.overdriveTier,profile.duoCount].join(':');
}

export function enhanceLoadoutVisual415(instance){
  if(!instance||instance.__loadoutVisual415)return instance;
  instance.__loadoutVisual415=true;
  const ensureName=typeof instance.ensureActor==='function'?'ensureActor':'ensure';
  const previousEnsure=instance[ensureName].bind(instance);
  instance[ensureName]=function ensureLoadout(actor,isPlayer){
    const entry=previousEnsure(actor,isPlayer);
    if(isPlayer){entry.actorRef=actor;install(entry)}
    return entry;
  };
  const previousRender=instance.render.bind(instance);
  instance.render=function renderLoadout(world){
    if(world.player&&!world.player.dead){
      const entry=instance[ensureName](world.player,true);
      sync(entry,world.player,world.time||performance.now()/1000);
    }
    return previousRender(world);
  };
  return instance;
}
