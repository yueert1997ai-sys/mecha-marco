import * as THREE from 'three';

const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const liteGeometry={
  torso:new THREE.BoxGeometry(1,1.18,.44),
  chest:new THREE.BoxGeometry(.72,.42,.18),
  head:new THREE.BoxGeometry(.4,.38,.34),
  limb:new THREE.BoxGeometry(.24,.82,.26),
  shoulder:new THREE.BoxGeometry(.48,.3,.32),
  weapon:new THREE.BoxGeometry(.18,1.35,.18),
  blade:new THREE.BoxGeometry(.12,1.18,.08),
  sensor:new THREE.PlaneGeometry(.23,.055),
};

function addMechanicalDetails(entry){
  const root=entry.root;
  if(root.userData.detail42)return;
  root.userData.detail42=true;
  const parts=root.userData.parts;
  const design=root.userData.design;
  if(!parts||!design)return;
  const frame=(parts.materials?.[2]||new THREE.MeshStandardMaterial({color:0x111927})).clone();
  const accent=(parts.materials?.[5]||frame).clone();
  frame.roughness=.72;frame.metalness=.32;frame.flatShading=true;
  accent.roughness=.62;accent.metalness=.34;accent.flatShading=true;
  const edge=new THREE.LineBasicMaterial({color:0x0b111c,transparent:true,opacity:.86,depthWrite:false});
  const detail=(parent,geometry,material,x,y,z,rz=0)=>{
    const mesh=new THREE.Mesh(geometry,material);
    mesh.position.set(x,y,z);mesh.rotation.z=rz;parent.add(mesh);
    const lines=new THREE.LineSegments(new THREE.EdgesGeometry(geometry,25),edge.clone());
    lines.renderOrder=8;mesh.add(lines);return mesh;
  };
  if(parts.torso){
    const ventGeometry=new THREE.BoxGeometry(.15,.4,.09);
    for(const side of[-1,1])detail(parts.torso,ventGeometry,frame.clone(),side*design.chest*.24,.42,.53,-side*.16);
    detail(parts.torso,new THREE.BoxGeometry(design.chest*.34,.13,.08),accent.clone(),0,.7,.52,0);
  }
  if(parts.head){
    detail(parts.head,new THREE.BoxGeometry(.14,.13,.13),frame.clone(),0,-.23,.18,0);
    const sensor=detail(parts.head,new THREE.BoxGeometry(.055,.24,.055),accent.clone(),0,.43,.22,0);
    sensor.rotation.x=.08;
  }
  for(const arm of parts.arms||[]){
    detail(arm.shoulder,new THREE.BoxGeometry(.18,.38,.1),frame.clone(),arm.side*.08,.13,.34,-arm.side*.12);
  }
}

function buildTargetReticle(scene){
  const material=new THREE.MeshBasicMaterial({color:0x84f5ff,transparent:true,opacity:.8,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending});
  const ring=new THREE.Mesh(new THREE.RingGeometry(.76,1,20),material);
  ring.visible=false;ring.position.z=85;scene.add(ring);return ring;
}

function selectTarget(world){
  const player=world.player;
  if(!player||player.dead)return null;
  let best=null,bestScore=Infinity;
  for(const enemy of world.enemies||[]){
    if(enemy.dead)continue;
    const dx=enemy.x-player.x,dy=enemy.y-player.y,dist=Math.hypot(dx,dy);
    if(dist>15)continue;
    const delta=Math.abs(angleDelta(Math.atan2(dy,dx),player.aim||0));
    const score=dist*(1+delta*1.25)-(enemy.boss?3:enemy.elite?1.2:0);
    if(score<bestScore){best=enemy;bestScore=score}
  }
  return best;
}

function liteEnemyDesign(actor){
  const role=actor.def?.role||'soldier';
  const shape={
    melee:{width:1.02,weapon:'blade'},
    sniper:{width:.82,weapon:'sniper'},
    artillery:{width:1.22,weapon:'cannon'},
    tank:{width:1.34,weapon:'shield'},
    soldier:{width:.94,weapon:'rifle'},
  }[role]||{width:.94,weapon:'rifle'};
  return {id:`lite-${role}`,scale:.94,...shape};
}

function buildLiteEnemy(actor){
  const design=liteEnemyDesign(actor);
  const color=new THREE.Color(actor.def?.color||'#ff5d73');
  const armor=new THREE.MeshStandardMaterial({color:new THREE.Color('#5a303b'),metalness:.28,roughness:.72,flatShading:true,emissive:new THREE.Color('#000000')});
  const frame=new THREE.MeshStandardMaterial({color:new THREE.Color('#171018'),metalness:.42,roughness:.68,flatShading:true,emissive:new THREE.Color('#000000')});
  const accent=new THREE.MeshStandardMaterial({color,metalness:.2,roughness:.62,flatShading:true,emissive:new THREE.Color('#000000')});
  const glow=new THREE.MeshBasicMaterial({color,transparent:true,opacity:.9,depthWrite:false,blending:THREE.AdditiveBlending});
  const root=new THREE.Group();
  root.name=`mech-${design.id}`;
  const torso=new THREE.Group();torso.position.set(0,.1,.14);root.add(torso);
  const torsoMesh=new THREE.Mesh(liteGeometry.torso,armor);torsoMesh.scale.x=design.width;torso.add(torsoMesh);
  const chest=new THREE.Mesh(liteGeometry.chest,accent);chest.position.set(0,.24,.31);chest.scale.x=design.width;torso.add(chest);
  const head=new THREE.Group();head.position.set(0,.92,.25);root.add(head);
  head.add(new THREE.Mesh(liteGeometry.head,armor));
  const sensor=new THREE.Mesh(liteGeometry.sensor,glow);sensor.position.set(0,.16,.2);head.add(sensor);
  for(const side of[-1,1]){
    const shoulder=new THREE.Mesh(liteGeometry.shoulder,armor);shoulder.position.set(side*(.62*design.width),.38,.12);root.add(shoulder);
    const leg=new THREE.Mesh(liteGeometry.limb,frame);leg.position.set(side*.25,-.78,.02);root.add(leg);
  }
  const weapon=new THREE.Group();weapon.position.set(.62*design.width,.3,.08);root.add(weapon);
  const weaponGeometry=design.weapon==='blade'?liteGeometry.blade:liteGeometry.weapon;
  const weaponMesh=new THREE.Mesh(weaponGeometry,design.weapon==='blade'?glow:frame);weaponMesh.position.set(0,.45,0);weapon.add(weaponMesh);
  if(design.weapon==='cannon')weaponMesh.scale.y=1.35;
  if(design.weapon==='sniper')weaponMesh.scale.y=1.48;
  if(design.weapon==='shield'){weaponMesh.scale.set(2.4,.7,1.5);weaponMesh.position.set(-1.05,-.05,.1)}
  root.scale.setScalar(design.scale);
  root.userData={
    design,
    parts:{materials:[armor,frame,accent],legs:[],arms:[],thrusters:[],head,torso,weapon,saber:null,saberBlade:null},
    liteEnemy:true,
  };
  return root;
}

export function tuneMech3DRenderer(instance){
  if(!instance||instance.__cameraTuned)return instance;
  instance.__cameraTuned=true;
  const coarse=matchMedia('(pointer:coarse)').matches||navigator.maxTouchPoints>0;
  instance.renderer.setPixelRatio(Math.min(devicePixelRatio||1,coarse?.9:1.5));
  instance.resize();
  instance.renderer.toneMappingExposure=.68;
  for(const light of instance.scene.children){
    if(light.isHemisphereLight)light.intensity=.68;
    else if(light.isDirectionalLight){
      const color=light.color.getHex();
      light.intensity=color===0xffffff?1.05:color===0x66dfff?.58:.24;
    }
  }

  const shadowMaterial=new THREE.MeshBasicMaterial({color:0x02050b,transparent:true,opacity:.38,depthWrite:false});
  const shadowGeometry=new THREE.CircleGeometry(1,18);
  const healthGeometry=new THREE.PlaneGeometry(1,1);
  const shadows=new Set();
  const bars=new Set();
  const reticle=buildTargetReticle(instance.scene);
  const ensureName=typeof instance.ensureActor==='function'?'ensureActor':'ensure';
  const originalEnsure=instance[ensureName].bind(instance);
  instance[ensureName]=function ensureTuned(actor,isPlayer){
    let entry;
    if(!isPlayer&&!actor.elite&&!actor.boss){
      const id=actor.id||'enemy';
      const design=liteEnemyDesign(actor);
      const existing=instance.actors.get(id);
      if(existing&&existing.designId===design.id)entry=existing;
      else{
        if(existing){instance.scene.remove(existing.root);instance.actors.delete(id)}
        const root=buildLiteEnemy(actor);instance.scene.add(root);
        entry={root,designId:design.id,isPlayer:false};instance.actors.set(id,entry);
      }
    }else entry=originalEnsure(actor,isPlayer);
    entry.actorRef=actor;
    entry.isPlayer=isPlayer;
    if(!entry.root.userData.cameraTuned){
      entry.root.userData.cameraTuned=true;
      entry.root.rotation.order='ZXY';
      entry.root.rotation.x=isPlayer?.48:.54;
      entry.root.rotation.y=-.12;
      entry.root.traverse((node)=>{
        if(!node.material)return;
        const materials=Array.isArray(node.material)?node.material:[node.material];
        for(const material of materials){
          if(material.isMeshStandardMaterial){
            material.roughness=Math.max(.58,material.roughness||0);
            material.metalness=Math.min(.48,material.metalness||0);
            material.color.multiplyScalar(.9);
            material.flatShading=true;
            material.needsUpdate=true;
          }else if(material.isLineBasicMaterial){
            const keyEdges=new Set(['head-shell','chest-main','shoulder-armor--1','shoulder-armor-1','calf--1','calf-1','weapon-body','wing-main--1','wing-main-1','reactor--1','reactor-1']);
            if(!keyEdges.has(node.parent?.name))node.visible=false;
            else{material.color.set(0x0a111c);material.opacity=.9}
          }
        }
      });
      if(isPlayer||actor.elite||actor.boss)addMechanicalDetails(entry);
      const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial.clone());
      shadow.renderOrder=-5;shadow.position.z=-30;instance.scene.add(shadow);
      entry.contactShadow=shadow;shadows.add(shadow);
    }
    if(!isPlayer&&!entry.healthBar){
      const group=new THREE.Group();
      const fillColor=actor.boss?0xff3e8b:actor.elite?0xff9f48:0xff6175;
      let background=null;
      if(actor.elite||actor.boss){
        background=new THREE.Mesh(healthGeometry,new THREE.MeshBasicMaterial({color:0x040914,transparent:true,opacity:.86,depthTest:false,depthWrite:false}));
        background.renderOrder=20;group.add(background);
      }
      const fill=new THREE.Mesh(healthGeometry,new THREE.MeshBasicMaterial({color:fillColor,transparent:true,opacity:.96,depthTest:false,depthWrite:false}));
      fill.renderOrder=21;fill.position.z=.2;group.add(fill);
      group.position.z=45;instance.scene.add(group);
      entry.healthBar={group,background,fill};bars.add(group);
    }
    return entry;
  };

  const originalRender=instance.render.bind(instance);
  const draw=instance.renderer.render.bind(instance.renderer);
  instance.render=function renderTuned(world){
    const liveDraw=instance.renderer.render;
    instance.renderer.render=()=>{};
    try{originalRender(world)}finally{instance.renderer.render=liveDraw}
    const liveShadows=new Set();
    const liveBars=new Set();
    for(const entry of instance.actors.values()){
      const actor=entry.actorRef;
      const designId=entry.root.userData.design.id;
      const player=['vanguard','bulwark','starwing'].includes(designId);
      entry.root.scale.multiplyScalar(player?.75:entry.root.userData.liteEnemy?.72:.63);
      if(actor){
        const speed=clamp(Math.hypot(actor.vx||0,actor.vy||0)/Math.max(1,actor.stats?.moveSpeed||actor.def?.speed||6));
        const moveAngle=speed>.02?Math.atan2(actor.vy||0,actor.vx||0):(actor.aim||0);
        const relative=angleDelta(moveAngle,actor.aim||0);
        const side=Math.sin(relative)*speed;
        const forward=Math.cos(relative)*speed;
        const dash=actor.dashTimer>0?1:0;
        entry.root.rotation.x=(player?.48:.54)+forward*.06+dash*.08;
        entry.root.rotation.y=-.12-side*.14;
        const parts=entry.root.userData.parts;
        if(parts?.torso)parts.torso.rotation.z=-side*.05;
        if(parts?.head)parts.head.rotation.z=side*.04;
        for(const arm of parts?.arms||[]){
          const recoil=actor.primaryKick||0;
          if(arm.side>0)arm.shoulder.rotation.z+=-.12-recoil*.08;
          else if((actor.saberPhase||0)>0)arm.shoulder.rotation.z+=(actor.saberPhase-.5)*1.45;
          else arm.shoulder.rotation.z+=.08;
        }
      }
      if(entry.contactShadow){
        entry.contactShadow.position.x=entry.root.position.x;
        entry.contactShadow.position.y=entry.root.position.y-10;
        entry.contactShadow.scale.set(player?39:entry.root.userData.liteEnemy?26:31,player?14:10,1);
        entry.contactShadow.material.opacity=player?.34:.25;
        liveShadows.add(entry.contactShadow);
      }
      if(entry.healthBar&&actor){
        const ratio=clamp(actor.hp/Math.max(1,actor.maxHp));
        const width=actor.boss?72:actor.elite?48:34;
        const height=actor.boss?5:actor.elite?3.5:2.8;
        const group=entry.healthBar.group;
        group.visible=!actor.dead;
        group.position.x=entry.root.position.x;
        group.position.y=entry.root.position.y+(actor.boss?54:actor.elite?40:31);
        group.scale.set(width,height,1);
        entry.healthBar.fill.scale.x=ratio;
        entry.healthBar.fill.position.x=-(1-ratio)*.5;
        liveBars.add(group);
      }
    }

    const target=selectTarget(world);
    if(target&&world.player){
      const screen=instance.worldRenderer.worldToScreen(target.x,target.y);
      const width=instance.canvas.clientWidth||innerWidth,height=instance.canvas.clientHeight||innerHeight,dpr=instance.worldRenderer.dpr||1;
      reticle.visible=true;
      reticle.position.x=screen.x/dpr-width*.5;
      reticle.position.y=height*.5-screen.y/dpr;
      const size=target.boss?34:target.elite?29:24;
      reticle.scale.setScalar(size*(1+Math.sin((world.time||0)*6)*.035));
      reticle.rotation.z=(world.time||0)*.45;
      reticle.material.opacity=.68+.18*Math.sin((world.time||0)*7);
    }else reticle.visible=false;

    for(const shadow of [...shadows]){
      if(liveShadows.has(shadow))continue;
      instance.scene.remove(shadow);shadow.material.dispose();shadows.delete(shadow);
    }
    for(const bar of [...bars]){
      if(liveBars.has(bar))continue;
      instance.scene.remove(bar);for(const child of bar.children)child.material.dispose();bars.delete(bar);
    }
    draw(instance.scene,instance.camera);
  };
  return instance;
}
