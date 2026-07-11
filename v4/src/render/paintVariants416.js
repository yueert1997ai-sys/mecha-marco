import * as THREE from 'three';

const setColor=(material,value,emissive=false)=>{
  if(!material||!value)return;
  if(material.color)material.color.set(value);
  if(material.emissive&&material.isMeshStandardMaterial){
    material.emissive.set(emissive?value:'#000000');
    material.emissiveIntensity=emissive?.1:0;
  }
  material.needsUpdate=true;
};

function applyPaint(entry,actor){
  const palette=actor.mech?.palette;
  const paintId=actor.mech?.paintId||'default';
  if(!palette||entry.root.userData.paint416===paintId)return;
  entry.root.userData.paint416=paintId;
  const parts=entry.root.userData.parts||{};
  const materials=parts.materials||[];
  setColor(materials[0],palette.primary);
  setColor(materials[1],palette.secondary);
  setColor(materials[2],palette.dark);
  setColor(materials[3],palette.dark);
  setColor(materials[4],palette.trim,true);
  setColor(materials[5],palette.accent,true);

  entry.root.traverse((node)=>{
    if(!node.material)return;
    const list=Array.isArray(node.material)?node.material:[node.material];
    const name=node.name||'';
    for(const material of list){
      if(material.isMeshBasicMaterial){
        setColor(material,name.includes('pod-light')?'#e0b27a':palette.glow);
        continue;
      }
      if(name.includes('trim')||name.includes('emitter')||name.includes('drone'))setColor(material,palette.trim,true);
      else if(name.includes('accent')||name.includes('saber-brace')||name.includes('core-ring'))setColor(material,palette.accent,true);
      else if(name.includes('pod')||name.includes('backpack')||name.includes('fin'))setColor(material,palette.secondary);
      else if(name.includes('shield')||name.includes('shoulder'))setColor(material,palette.primary);
    }
  });
  entry.root.userData.paintPalette416={...palette};
}

export function enhancePaintVariants416(instance){
  if(!instance||instance.__paintVariants416)return instance;
  instance.__paintVariants416=true;
  const ensureName=typeof instance.ensureActor==='function'?'ensureActor':'ensure';
  const ensure=instance[ensureName].bind(instance);
  instance[ensureName]=function ensurePainted(actor,isPlayer){
    const entry=ensure(actor,isPlayer);
    if(isPlayer)applyPaint(entry,actor);
    return entry;
  };
  const render=instance.render.bind(instance);
  instance.render=function renderPainted(world){
    if(world.player&&!world.player.dead){
      const entry=instance[ensureName](world.player,true);
      applyPaint(entry,world.player);
    }
    return render(world);
  };
  return instance;
}
