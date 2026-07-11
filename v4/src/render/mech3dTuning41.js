import * as THREE from 'three';

export function tuneMech3DRenderer(instance){
  if(!instance||instance.__cameraTuned)return instance;
  instance.__cameraTuned=true;
  instance.renderer.toneMappingExposure=.58;
  for(const light of instance.scene.children){
    if(light.isHemisphereLight)light.intensity=.55;
    else if(light.isDirectionalLight){
      const color=light.color.getHex();
      light.intensity=color===0xffffff?.88:color===0x66dfff?.48:.2;
    }
  }

  const shadowMaterial=new THREE.MeshBasicMaterial({color:0x02050b,transparent:true,opacity:.34,depthWrite:false});
  const shadowGeometry=new THREE.CircleGeometry(1,24);
  const healthGeometry=new THREE.PlaneGeometry(1,1);
  const shadows=new Set();
  const bars=new Set();
  const ensureName=typeof instance.ensureActor==='function'?'ensureActor':'ensure';
  const originalEnsure=instance[ensureName].bind(instance);
  instance[ensureName]=function ensureTuned(actor,isPlayer){
    const entry=originalEnsure(actor,isPlayer);
    entry.actorRef=actor;
    entry.isPlayer=isPlayer;
    if(!entry.root.userData.cameraTuned){
      entry.root.userData.cameraTuned=true;
      entry.root.rotation.order='ZXY';
      entry.root.rotation.x=.72;
      entry.root.rotation.y=-.16;
      entry.root.traverse((node)=>{
        if(!node.material)return;
        const materials=Array.isArray(node.material)?node.material:[node.material];
        for(const material of materials){
          if(material.isMeshStandardMaterial){
            material.roughness=Math.max(.48,material.roughness||0);
            material.metalness=Math.min(.58,material.metalness||0);
            material.color.multiplyScalar(.82);
          }else if(material.isLineBasicMaterial){
            material.color.set(0x101927);
            material.opacity=.74;
          }
        }
      });
      const shadow=new THREE.Mesh(shadowGeometry,shadowMaterial.clone());
      shadow.renderOrder=-5;
      shadow.position.z=-30;
      instance.scene.add(shadow);
      entry.contactShadow=shadow;
      shadows.add(shadow);
    }
    if(!isPlayer&&!entry.healthBar){
      const group=new THREE.Group();
      const background=new THREE.Mesh(healthGeometry,new THREE.MeshBasicMaterial({color:0x040914,transparent:true,opacity:.86,depthTest:false,depthWrite:false}));
      const fillColor=actor.boss?0xff3e8b:actor.elite?0xff9f48:0xff6175;
      const fill=new THREE.Mesh(healthGeometry,new THREE.MeshBasicMaterial({color:fillColor,transparent:true,opacity:.96,depthTest:false,depthWrite:false}));
      background.renderOrder=20;
      fill.renderOrder=21;
      fill.position.z=.2;
      group.add(background,fill);
      group.position.z=45;
      instance.scene.add(group);
      entry.healthBar={group,background,fill};
      bars.add(group);
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
      const designId=entry.root.userData.design.id;
      const player=['vanguard','bulwark','starwing'].includes(designId);
      const scale=player?.7:.62;
      entry.root.scale.multiplyScalar(scale);
      if(entry.contactShadow){
        entry.contactShadow.position.x=entry.root.position.x;
        entry.contactShadow.position.y=entry.root.position.y-9;
        entry.contactShadow.scale.set(player?37:30,player?14:11,1);
        entry.contactShadow.material.opacity=player?.32:.26;
        liveShadows.add(entry.contactShadow);
      }
      if(entry.healthBar&&entry.actorRef){
        const actor=entry.actorRef;
        const ratio=Math.max(0,Math.min(1,actor.hp/Math.max(1,actor.maxHp)));
        const width=actor.boss?72:actor.elite?48:38;
        const height=actor.boss?5:3.5;
        const group=entry.healthBar.group;
        group.visible=!actor.dead;
        group.position.x=entry.root.position.x;
        group.position.y=entry.root.position.y+(actor.boss?54:40);
        group.scale.set(width,height,1);
        entry.healthBar.fill.scale.x=ratio;
        entry.healthBar.fill.position.x=-(1-ratio)*.5;
        liveBars.add(group);
      }
    }
    for(const shadow of [...shadows]){
      if(liveShadows.has(shadow))continue;
      instance.scene.remove(shadow);
      shadow.material.dispose();
      shadows.delete(shadow);
    }
    for(const bar of [...bars]){
      if(liveBars.has(bar))continue;
      instance.scene.remove(bar);
      for(const child of bar.children)child.material.dispose();
      bars.delete(bar);
    }
    draw(instance.scene,instance.camera);
  };
  return instance;
}
