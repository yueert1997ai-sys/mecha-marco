import * as THREE from 'three';

const MODEL_VERSION='4.1.0-webgl-hard-surface';
const geometries=new Map();

const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const hex=(value)=>new THREE.Color(value||'#ffffff');

function plateGeometry(width,length,depth,taper=.72,bevel=.08,tip=0){
  const key=[width,length,depth,taper,bevel,tip].join(':');
  if(geometries.has(key))return geometries.get(key);
  const shape=new THREE.Shape();
  shape.moveTo(-width*.5,-length*.5);
  shape.lineTo(width*.5,-length*.5);
  shape.lineTo(width*taper*.5+tip,length*.5);
  shape.lineTo(-width*taper*.5+tip,length*.5);
  shape.closePath();
  const geometry=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:Math.min(bevel,width*.16,length*.12),bevelThickness:Math.min(bevel,depth*.35)});
  geometry.center();
  geometry.computeVertexNormals();
  geometries.set(key,geometry);
  return geometry;
}

function makeMaterial(color,{metalness=.72,roughness=.32,emissive='#000000',emissiveIntensity=0}={}){
  return new THREE.MeshStandardMaterial({color:hex(color),metalness,roughness,emissive:hex(emissive),emissiveIntensity});
}

function makeBasic(color,opacity=1){
  return new THREE.MeshBasicMaterial({color:hex(color),transparent:opacity<1,opacity,blending:THREE.AdditiveBlending,depthWrite:false});
}

function addPlate(parent,materials,options){
  const {name='plate',width=.5,length=.8,depth=.2,taper=.72,bevel=.06,tip=0,x=0,y=0,z=0,rotation=0,material='armor',edge=true}=options;
  const mesh=new THREE.Mesh(plateGeometry(width,length,depth,taper,bevel,tip),materials[material]);
  mesh.name=name;
  mesh.position.set(x,y,z);
  mesh.rotation.z=rotation;
  mesh.castShadow=false;
  mesh.receiveShadow=false;
  parent.add(mesh);
  if(edge){
    const lines=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry,28),new THREE.LineBasicMaterial({color:materials.edgeColor,transparent:true,opacity:.5,depthWrite:false}));
    lines.renderOrder=3;
    mesh.add(lines);
  }
  return mesh;
}

function addJoint(parent,materials,{x=0,y=0,z=0,radius=.18,material='frame'}={}){
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius*.9,.18,10,1,false),materials[material]);
  mesh.rotation.x=Math.PI*.5;
  mesh.position.set(x,y,z);
  parent.add(mesh);
  return mesh;
}

function addGlow(parent,materials,{x=0,y=0,z=.18,width=.12,length=.32,rotation=0,colorKey='glow'}={}){
  const mesh=new THREE.Mesh(plateGeometry(width,length,.05,.62,.015),materials[colorKey]);
  mesh.position.set(x,y,z);
  mesh.rotation.z=rotation;
  mesh.renderOrder=5;
  parent.add(mesh);
  return mesh;
}

const designs={
  vanguard:{id:'vanguard',chest:1.18,shoulder:.76,leg:.38,scale:1.05,armor:'#e9eef4',armor2:'#8998aa',frame:'#111923',metal:'#39485b',trim:'#72e8ff',accent:'#c93e50',glow:'#7df5ff',weapon:'rifle'},
  bulwark:{id:'bulwark',chest:1.52,shoulder:1.02,leg:.52,scale:1.12,armor:'#d8ddd8',armor2:'#737b86',frame:'#151a21',metal:'#495360',trim:'#d6ba72',accent:'#d36231',glow:'#ffbd68',weapon:'cannon'},
  starwing:{id:'starwing',chest:.96,shoulder:.66,leg:.32,scale:.98,armor:'#edf3f7',armor2:'#8494a8',frame:'#111426',metal:'#343951',trim:'#8cf4ff',accent:'#9765de',glow:'#c2fbff',weapon:'twin'},
};

function enemyDesign(actor){
  const role=actor.boss?'boss':actor.def?.role||'soldier';
  const map={
    melee:{id:'raider',chest:1.0,shoulder:.78,leg:.4,scale:.92,weapon:'blade'},
    eliteMelee:{id:'elite-raider',chest:1.22,shoulder:.92,leg:.47,scale:1.06,weapon:'blade'},
    sniper:{id:'lancer',chest:.88,shoulder:.64,leg:.34,scale:.9,weapon:'sniper'},
    artillery:{id:'siege',chest:1.28,shoulder:.96,leg:.48,scale:1.0,weapon:'artillery'},
    tank:{id:'tank',chest:1.42,shoulder:1.02,leg:.54,scale:1.05,weapon:'shield'},
    boss:{id:'overlord',chest:1.75,shoulder:1.2,leg:.58,scale:1.24,weapon:'boss'},
    soldier:{id:'soldier',chest:.96,shoulder:.7,leg:.36,scale:.9,weapon:'rifle'},
  };
  const base=map[role]||map.soldier,color=actor.def?.color||'#ff5d73';
  return {...base,armor:actor.elite?'#713744':'#59303a',armor2:actor.boss?'#8d4957':'#40232c',frame:'#170d13',metal:'#4a2832',trim:'#ffc3b9',accent:color,glow:color};
}

function createMaterials(design){
  const materials={
    armor:makeMaterial(design.armor,{metalness:.76,roughness:.26}),
    armor2:makeMaterial(design.armor2,{metalness:.68,roughness:.34}),
    frame:makeMaterial(design.frame,{metalness:.88,roughness:.3}),
    metal:makeMaterial(design.metal,{metalness:.93,roughness:.22}),
    trim:makeMaterial(design.trim,{metalness:.62,roughness:.25,emissive:design.trim,emissiveIntensity:.08}),
    accent:makeMaterial(design.accent,{metalness:.58,roughness:.3,emissive:design.accent,emissiveIntensity:.06}),
    glow:makeBasic(design.glow,.92),
    whiteGlow:makeBasic('#ffffff',.95),
    edgeColor:hex(design.trim),
  };
  return materials;
}

function buildHead(root,materials,design,parts){
  const head=new THREE.Group();
  head.position.set(0,1.48,.28);
  root.add(head);
  addPlate(head,materials,{name:'head-shell',width:.48,length:.55,depth:.32,taper:.62,bevel:.07,y:0,material:'armor'});
  addPlate(head,materials,{name:'face-mask',width:.34,length:.26,depth:.12,taper:.5,bevel:.035,y:.24,z:.11,material:'frame'});
  addGlow(head,materials,{y:.29,z:.2,width:.27,length:.07});
  addPlate(head,materials,{name:'crest',width:.08,length:.62,depth:.09,taper:.3,bevel:.025,y:.24,z:.18,material:'trim',edge:false});
  if(['vanguard','starwing','lancer'].includes(design.id)){
    addPlate(head,materials,{name:'antenna-l',width:.065,length:.48,depth:.055,taper:.2,bevel:.012,x:-.17,y:.34,z:.18,rotation:.46,material:'trim',edge:false});
    addPlate(head,materials,{name:'antenna-r',width:.065,length:.48,depth:.055,taper:.2,bevel:.012,x:.17,y:.34,z:.18,rotation:-.46,material:'trim',edge:false});
  }
  parts.head=head;
}

function buildTorso(root,materials,design,parts){
  const torso=new THREE.Group();
  torso.position.set(0,.25,.18);
  root.add(torso);
  addPlate(torso,materials,{name:'chest-main',width:design.chest,length:1.25,depth:.42,taper:.64,bevel:.11,y:.18,material:'armor'});
  addPlate(torso,materials,{name:'chest-inner',width:design.chest*.6,length:.72,depth:.22,taper:.48,bevel:.06,y:.38,z:.28,material:'armor2'});
  addPlate(torso,materials,{name:'abdomen',width:design.chest*.42,length:.58,depth:.3,taper:.74,bevel:.07,y:-.62,z:-.03,material:'frame'});
  addPlate(torso,materials,{name:'waist',width:design.chest*.65,length:.38,depth:.32,taper:.84,bevel:.06,y:-.94,z:-.04,material:'metal'});
  addGlow(torso,materials,{y:.48,z:.48,width:.18,length:.28,colorKey:'glow'});
  addPlate(torso,materials,{name:'chest-accent-l',width:.12,length:.58,depth:.07,taper:.4,bevel:.02,x:-design.chest*.24,y:.34,z:.48,rotation:.14,material:'accent',edge:false});
  addPlate(torso,materials,{name:'chest-accent-r',width:.12,length:.58,depth:.07,taper:.4,bevel:.02,x:design.chest*.24,y:.34,z:.48,rotation:-.14,material:'accent',edge:false});
  for(const side of[-1,1])addPlate(torso,materials,{name:`skirt-${side}`,width:design.chest*.34,length:.68,depth:.2,taper:.64,bevel:.05,x:side*design.chest*.25,y:-1.16,z:.02,rotation:side*.08,material:'armor2'});
  parts.torso=torso;
}

function buildBackpack(root,materials,design,parts){
  const backpack=new THREE.Group();
  backpack.position.set(0,-.42,-.18);
  root.add(backpack);
  addPlate(backpack,materials,{name:'backpack-core',width:design.chest*.72,length:.76,depth:.34,taper:.82,bevel:.08,y:-.2,material:'frame'});
  const thrusters=[];
  for(const side of[-1,1]){
    addPlate(backpack,materials,{name:`thruster-housing-${side}`,width:.32,length:.86,depth:.32,taper:.55,bevel:.07,x:side*design.chest*.36,y:-.62,z:.02,rotation:side*.05,material:'metal'});
    const glow=addGlow(backpack,materials,{x:side*design.chest*.36,y:-1.02,z:.05,width:.17,length:.42,colorKey:'glow'});
    thrusters.push(glow);
  }
  if(design.id==='starwing'){
    for(const side of[-1,1]){
      addPlate(backpack,materials,{name:`wing-main-${side}`,width:.42,length:2.1,depth:.16,taper:.22,bevel:.045,x:side*1.05,y:-.48,z:.04,rotation:side*.63,material:'armor2'});
      addPlate(backpack,materials,{name:`wing-edge-${side}`,width:.12,length:1.75,depth:.08,taper:.12,bevel:.02,x:side*1.48,y:-.72,z:.16,rotation:side*.72,material:'trim',edge:false});
      addGlow(backpack,materials,{x:side*1.42,y:-1.1,z:.2,width:.1,length:.65,rotation:side*.72,colorKey:'glow'});
    }
  }
  if(['bulwark','siege','overlord','tank'].includes(design.id)){
    for(const side of[-1,1])addPlate(backpack,materials,{name:`reactor-${side}`,width:.5,length:1.05,depth:.48,taper:.62,bevel:.09,x:side*.72,y:-.42,z:.02,material:'armor2'});
  }
  parts.thrusters=thrusters;
  parts.backpack=backpack;
}

function buildLeg(root,materials,design,side,parts){
  const hip=new THREE.Group();
  hip.position.set(side*design.chest*.28,-.72,.06);
  root.add(hip);
  addJoint(hip,materials,{radius:.19,material:'frame'});
  const upper=new THREE.Group();upper.position.set(0,-.48,0);hip.add(upper);
  addPlate(upper,materials,{name:`thigh-${side}`,width:design.leg,length:1.0,depth:.34,taper:.7,bevel:.07,material:'armor2'});
  const knee=new THREE.Group();knee.position.set(0,-.55,0);upper.add(knee);
  addJoint(knee,materials,{radius:.17,material:'metal'});
  addPlate(knee,materials,{name:`knee-guard-${side}`,width:design.leg*.86,length:.42,depth:.2,taper:.42,bevel:.045,y:.06,z:.22,material:'accent'});
  const lower=new THREE.Group();lower.position.set(0,-.48,0);knee.add(lower);
  addPlate(lower,materials,{name:`calf-${side}`,width:design.leg*1.12,length:1.02,depth:.4,taper:.62,bevel:.08,material:'armor'});
  addPlate(lower,materials,{name:`shin-${side}`,width:design.leg*.46,length:.64,depth:.1,taper:.28,bevel:.025,y:.06,z:.31,material:'trim',edge:false});
  addPlate(lower,materials,{name:`foot-${side}`,width:design.leg*1.16,length:.58,depth:.24,taper:.42,bevel:.05,y:-.68,z:-.04,material:'frame'});
  parts.legs.push({hip,upper,knee,lower,side});
}

function buildArm(root,materials,design,side,parts){
  const shoulder=new THREE.Group();
  shoulder.position.set(side*(design.chest*.54+.25),.42,.12);
  root.add(shoulder);
  addJoint(shoulder,materials,{radius:.19,material:'frame'});
  addPlate(shoulder,materials,{name:`shoulder-armor-${side}`,width:design.shoulder,length:.62,depth:.38,taper:.5,bevel:.08,x:side*.08,y:.02,z:.12,rotation:-side*.1,material:'armor'});
  const upper=new THREE.Group();upper.position.set(side*.07,-.48,-.04);shoulder.add(upper);
  addPlate(upper,materials,{name:`upper-arm-${side}`,width:.3,length:.82,depth:.28,taper:.76,bevel:.055,material:'frame'});
  const elbow=new THREE.Group();elbow.position.set(0,-.46,0);upper.add(elbow);
  addJoint(elbow,materials,{radius:.15,material:'metal'});
  const forearm=new THREE.Group();forearm.position.set(0,-.4,0);elbow.add(forearm);
  addPlate(forearm,materials,{name:`forearm-${side}`,width:.38,length:.78,depth:.32,taper:.55,bevel:.065,material:'armor2'});
  addPlate(forearm,materials,{name:`forearm-trim-${side}`,width:.12,length:.48,depth:.08,taper:.25,bevel:.02,y:.04,z:.25,material:'trim',edge:false});
  parts.arms.push({shoulder,upper,elbow,forearm,side});
  return forearm;
}

function buildRifle(parent,materials,design,parts){
  const weapon=new THREE.Group();
  weapon.position.set(0,.56,.05);
  parent.add(weapon);
  const heavy=['cannon','sniper','artillery','boss'].includes(design.weapon);
  addPlate(weapon,materials,{name:'weapon-body',width:heavy?.38:.26,length:heavy?1.85:1.45,depth:heavy?.34:.25,taper:.56,bevel:.055,y:.55,material:'frame'});
  addPlate(weapon,materials,{name:'weapon-casing',width:heavy?.48:.33,length:heavy?.72:.58,depth:.2,taper:.65,bevel:.045,y:.18,z:.25,material:'armor2'});
  addPlate(weapon,materials,{name:'weapon-barrel',width:heavy?.16:.1,length:heavy?1.35:1.05,depth:heavy?.16:.11,taper:.9,bevel:.025,y:1.5,z:.02,material:'metal',edge:false});
  addGlow(weapon,materials,{y:2.18,z:.05,width:heavy?.15:.1,length:.16,colorKey:'whiteGlow'});
  addGlow(weapon,materials,{y:.28,z:.36,width:.1,length:.36,colorKey:'glow'});
  parts.weapon=weapon;
}

function buildSaber(parent,materials,parts){
  const saber=new THREE.Group();
  saber.position.set(0,.55,.05);
  parent.add(saber);
  addPlate(saber,materials,{name:'saber-hilt',width:.16,length:.58,depth:.16,taper:.82,bevel:.03,y:.1,material:'metal'});
  const blade=addPlate(saber,materials,{name:'saber-blade',width:.13,length:1.65,depth:.08,taper:.28,bevel:.025,y:1.18,z:.05,material:'glow',edge:false});
  blade.visible=false;
  parts.saber=saber;
  parts.saberBlade=blade;
}

function buildShield(parent,materials,parts){
  const shield=new THREE.Group();shield.position.set(.22,.15,.16);parent.add(shield);
  addPlate(shield,materials,{name:'shield',width:1.0,length:1.45,depth:.22,taper:.46,bevel:.1,y:.1,material:'armor'});
  addPlate(shield,materials,{name:'shield-core',width:.48,length:.74,depth:.12,taper:.36,bevel:.05,y:.18,z:.24,material:'accent'});
  parts.shield=shield;
}

function buildModel(design){
  const root=new THREE.Group();
  root.name=`mech-${design.id}`;
  const materials=createMaterials(design);
  const parts={materials:[],legs:[],arms:[],thrusters:[],head:null,torso:null,weapon:null,saber:null,saberBlade:null};
  for(const key of['armor','armor2','frame','metal','trim','accent'])parts.materials.push(materials[key]);
  buildBackpack(root,materials,design,parts);
  buildLeg(root,materials,design,-1,parts);
  buildLeg(root,materials,design,1,parts);
  buildTorso(root,materials,design,parts);
  const left=buildArm(root,materials,design,-1,parts);
  const right=buildArm(root,materials,design,1,parts);
  buildHead(root,materials,design,parts);
  if(['blade'].includes(design.weapon)){buildSaber(right,materials,parts);buildSaber(left,materials,parts)}
  else buildRifle(right,materials,design,parts);
  if(['vanguard','bulwark','starwing','shield','tank'].includes(design.id)||design.weapon==='shield')buildSaber(left,materials,parts);
  if(design.weapon==='shield')buildShield(left,materials,parts);
  if(design.weapon==='artillery'||design.weapon==='boss'){
    for(const side of[-1,1]){
      const pod=new THREE.Group();pod.position.set(side*.82,-.1,.2);root.add(pod);
      addPlate(pod,materials,{name:`shoulder-cannon-${side}`,width:.34,length:1.4,depth:.34,taper:.66,bevel:.06,y:.55,material:'metal'});
      addGlow(pod,materials,{y:1.27,z:.04,width:.13,length:.16,colorKey:'whiteGlow'});
    }
  }
  root.scale.setScalar(design.scale||1);
  root.userData={design,parts};
  return root;
}

function setHitFlash(parts,amount){
  for(const material of parts.materials){
    material.emissive.setRGB(amount,amount,amount);
    material.emissiveIntensity=amount*.9;
  }
}

function animateModel(root,actor,time){
  const {parts}=root.userData;
  const speed=clamp(actor.speed01||0),phase=time*8+(actor.id||0)*.31,stride=Math.sin(phase)*speed;
  parts.legs.forEach((leg)=>{
    leg.hip.rotation.z=stride*.23*leg.side;
    leg.knee.rotation.z=Math.max(0,-stride*leg.side)*.18;
  });
  parts.arms.forEach((arm)=>{
    arm.shoulder.rotation.z=-stride*.1*arm.side;
  });
  if(parts.weapon){
    parts.weapon.position.y=.56-(actor.primaryKick||0)*.17;
    parts.weapon.rotation.z=(actor.primarySpreadVisual||0)*3;
  }
  const saber=actor.saberPhase||0;
  if(parts.saber){
    parts.saberBlade.visible=saber>0;
    parts.saber.rotation.z=saber>0?(saber-.5)*2.7:0;
    parts.saber.scale.y=saber>0?.9+Math.sin(saber*Math.PI)*.15:1;
  }
  if(parts.thrusters.length){
    const power=actor.dashTimer>0?1.9:actor.overdriveTimer>0?1.45:.45+speed*.8;
    parts.thrusters.forEach((thruster,index)=>{
      thruster.visible=power>.5;
      thruster.scale.y=power*(1+Math.sin(time*20+index)*.08);
      thruster.material.opacity=clamp(.35+power*.35);
    });
  }
  root.position.z=(actor.y||0)*.001;
  root.scale.z=1;
  setHitFlash(parts,actor.hitStun>0?.65:0);
}

export class Mech3DRenderer{
  constructor(canvas,worldRenderer){
    this.canvas=canvas;
    this.worldRenderer=worldRenderer;
    this.renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'high-performance',premultipliedAlpha:false});
    this.renderer.setClearColor(0x000000,0);
    this.renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.7));
    this.renderer.outputEncoding=THREE.sRGBEncoding;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.2;
    this.scene=new THREE.Scene();
    this.camera=new THREE.OrthographicCamera(-1,1,1,-1,.1,300);
    this.camera.position.set(0,0,100);
    this.camera.lookAt(0,0,0);
    this.scene.add(new THREE.HemisphereLight(0xd8ecff,0x101522,1.75));
    const key=new THREE.DirectionalLight(0xffffff,2.4);key.position.set(-5,8,12);this.scene.add(key);
    const rim=new THREE.DirectionalLight(0x66dfff,1.6);rim.position.set(8,-6,9);this.scene.add(rim);
    const warm=new THREE.DirectionalLight(0xff8f67,.75);warm.position.set(-7,-6,5);this.scene.add(warm);
    this.actors=new Map();
    this.resize();
    addEventListener('resize',()=>this.resize());
  }
  resize(){
    const width=Math.max(1,this.canvas.clientWidth||innerWidth),height=Math.max(1,this.canvas.clientHeight||innerHeight);
    this.renderer.setSize(width,height,false);
    this.camera.left=-width*.5;this.camera.right=width*.5;this.camera.top=height*.5;this.camera.bottom=-height*.5;this.camera.updateProjectionMatrix();
  }
  getDesign(actor,isPlayer){return isPlayer?designs[actor.mech?.id]||designs.vanguard:enemyDesign(actor)}
  ensureActor(actor,isPlayer){
    const id=actor.id||'player';
    const design=this.getDesign(actor,isPlayer),existing=this.actors.get(id);
    if(existing&&existing.designId===design.id)return existing;
    if(existing){this.scene.remove(existing.root);this.actors.delete(id)}
    const root=buildModel(design);this.scene.add(root);
    const entry={root,designId:design.id,isPlayer};this.actors.set(id,entry);return entry;
  }
  render(world){
    const width=this.canvas.clientWidth||innerWidth,height=this.canvas.clientHeight||innerHeight;
    if(this.renderer.domElement.width===0||Math.abs(this.camera.right-this.camera.left-width)>1)this.resize();
    const live=[];
    for(const enemy of world.enemies.filter((item)=>!item.dead))live.push([enemy,false]);
    if(world.player&&!world.player.dead)live.push([world.player,true]);
    const ids=new Set();
    for(const [actor,isPlayer] of live){
      const id=actor.id||'player';ids.add(id);
      const entry=this.ensureActor(actor,isPlayer),screen=this.worldRenderer.worldToScreen(actor.x,actor.y),dpr=this.worldRenderer.dpr||1;
      entry.root.visible=true;
      entry.root.position.x=screen.x/dpr-width*.5;
      entry.root.position.y=height*.5-screen.y/dpr;
      entry.root.rotation.z=-(actor.yaw??actor.aim??0)-Math.PI*.5;
      const spawn=clamp(1-(actor.spawn||0)*1.7),baseScale=(isPlayer?27:actor.boss?31:actor.elite?27:23)*spawn;
      entry.root.scale.setScalar(baseScale*(entry.root.userData.design.scale||1));
      animateModel(entry.root,actor,world.time||0);
    }
    for(const [id,entry] of this.actors){if(!ids.has(id)){this.scene.remove(entry.root);this.actors.delete(id)}}
    this.renderer.render(this.scene,this.camera);
  }
  dispose(){this.renderer.dispose();this.actors.clear()}
}

export async function createMech3DRenderer(canvas,worldRenderer){
  const instance=new Mech3DRenderer(canvas,worldRenderer);
  globalThis.__MECHA_3D_VERSION__=MODEL_VERSION;
  return instance;
}
