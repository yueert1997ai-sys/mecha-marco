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
  const shadows=new Set();
  const ensureName=typeof instance.ensureActor==='function'?'ensureActor':'ensure';
  const originalEnsure=instance[ensureName].bind(instance);
  instance[ensureName]=function ensureTuned(actor,isPlayer){
    const entry=originalEnsure(actor,isPlayer);
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
    return entry;
  };

  const originalRender=instance.render.bind(instance);
  const draw=instance.renderer.render.bind(instance.renderer);
  instance.render=function renderTuned(world){
    const liveDraw=instance.renderer.render;
    instance.renderer.render=()=>{};
    try{originalRender(world)}finally{instance.renderer.render=liveDraw}
    const liveShadows=new Set();
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
    }
    for(const shadow of [...shadows]){
      if(liveShadows.has(shadow))continue;
      instance.scene.remove(shadow);
      shadow.material.dispose();
      shadows.delete(shadow);
    }
    draw(instance.scene,instance.camera);
  };
  return instance;
}
