import * as THREE from 'three';

const armGeometry=new THREE.BoxGeometry(.2,.72,.24);
const waistGeometry=new THREE.BoxGeometry(.62,.28,.3);
const crestGeometry=new THREE.BoxGeometry(.055,.3,.055);

function enhanceEntry(entry){
  const root=entry?.root;
  if(!root?.userData?.liteEnemy||root.userData.liteEnemyEnhanced)return entry;
  root.userData.liteEnemyEnhanced=true;
  const parts=root.userData.parts;
  const design=root.userData.design;
  const [armor,frame,accent]=parts.materials;
  armor.color.set('#884353');
  frame.color.set('#26151d');
  accent.color.offsetHSL(0,.08,.08);
  design.scale=1.06;

  const waist=new THREE.Mesh(waistGeometry,frame);
  waist.position.set(0,-.42,.02);
  root.add(waist);

  for(const side of[-1,1]){
    const shoulder=new THREE.Group();
    shoulder.position.set(side*design.width*.55,.14,.08);
    shoulder.rotation.z=-side*.12;
    const arm=new THREE.Mesh(armGeometry,frame);
    arm.position.set(side*.04,-.34,0);
    shoulder.add(arm);
    root.add(shoulder);
    parts.arms.push({shoulder,side});
  }

  const crest=new THREE.Mesh(crestGeometry,accent);
  crest.position.set(0,1.25,.24);
  root.add(crest);
  return entry;
}

export function enhanceLiteEnemies42(instance){
  if(!instance||instance.__liteEnhance42)return instance;
  instance.__liteEnhance42=true;
  const ensureName=typeof instance.ensureActor==='function'?'ensureActor':'ensure';
  const originalEnsure=instance[ensureName].bind(instance);
  instance[ensureName]=function ensureEnhanced(actor,isPlayer){
    return enhanceEntry(originalEnsure(actor,isPlayer));
  };
  return instance;
}
