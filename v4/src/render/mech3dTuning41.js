export function tuneMech3DRenderer(instance){
  if(!instance||instance.__cameraTuned)return instance;
  instance.__cameraTuned=true;
  instance.renderer.toneMappingExposure=.76;
  for(const light of instance.scene.children){
    if(light.isHemisphereLight)light.intensity=.82;
    else if(light.isDirectionalLight){
      const color=light.color.getHex();
      light.intensity=color===0xffffff?1.25:color===0x66dfff?.78:.38;
    }
  }

  const originalEnsure=instance.ensure.bind(instance);
  instance.ensure=function ensureTuned(actor,isPlayer){
    const entry=originalEnsure(actor,isPlayer);
    if(!entry.root.userData.cameraTuned){
      entry.root.userData.cameraTuned=true;
      entry.root.rotation.order='ZXY';
      entry.root.rotation.x=1.03;
      entry.root.traverse((node)=>{
        if(!node.isMesh||!node.material)return;
        const materials=Array.isArray(node.material)?node.material:[node.material];
        for(const material of materials){
          if(material.isMeshStandardMaterial){
            material.roughness=Math.max(.34,material.roughness||0);
            material.metalness=Math.min(.72,material.metalness||0);
          }
        }
      });
    }
    return entry;
  };

  const originalRender=instance.render.bind(instance);
  const draw=instance.renderer.render.bind(instance.renderer);
  instance.render=function renderTuned(world){
    const liveDraw=instance.renderer.render;
    instance.renderer.render=()=>{};
    try{originalRender(world)}finally{instance.renderer.render=liveDraw}
    for(const entry of instance.actors.values()){
      const player=entry.root.userData.design.id==='vanguard'||entry.root.userData.design.id==='bulwark'||entry.root.userData.design.id==='starwing';
      entry.root.scale.multiplyScalar(player?.58:.54);
    }
    draw(instance.scene,instance.camera);
  };
  return instance;
}
