const countTagged=(modules,tags)=>modules.reduce((total,module)=>total+((module.tags||module.requires||[]).some((tag)=>tags.includes(tag))?1:0),0);
const tier=(count)=>count>=4?3:count>=2?2:count>=1?1:0;

export function buildLoadoutVisual(modules=[]){
  const slotCounts=Object.create(null);
  for(const module of modules)slotCounts[module.slot]=(slotCounts[module.slot]||0)+1;
  const beam=tier(countTagged(modules,['beam','pierce','ricochet','multishot','burst']));
  const saber=tier(countTagged(modules,['saber','wave','guard','combo','mark']));
  const mobility=tier(countTagged(modules,['dash','decoy','impact','reload']));
  const ordnance=tier(countTagged(modules,['missile','cluster','lock','gravity','drone']));
  const defense=tier(countTagged(modules,['armor','repair','guard']));
  const overdrive=tier(countTagged(modules,['overdrive','nova']));
  const droneCount=countTagged(modules,['drone']);
  const rareCount=modules.filter((module)=>module.rarity==='rare').length;
  const duoCount=modules.filter((module)=>module.rarity==='duo').length;
  const labels=[];
  if(beam)labels.push(`主武装 Lv.${beam}`);
  if(saber)labels.push(`近战框架 Lv.${saber}`);
  if(mobility)labels.push(`推进翼组 Lv.${mobility}`);
  if(ordnance)labels.push(`火力挂架 Lv.${ordnance}`);
  if(defense)labels.push(`护甲覆层 Lv.${defense}`);
  if(overdrive)labels.push(`超限核心 Lv.${overdrive}`);
  if(duoCount)labels.push(`组合协议 ×${duoCount}`);
  return {
    moduleCount:modules.length,rareCount,duoCount,slotCounts,
    beamTier:beam,saberTier:saber,mobilityTier:mobility,ordnanceTier:ordnance,defenseTier:defense,overdriveTier:overdrive,
    droneBits:Math.min(3,droneCount+(modules.some((module)=>module.id==='duo_drone_beam')?1:0)),
    shoulderArmor:defense,missilePods:ordnance,wingFins:mobility,emitterLevel:beam,saberHalo:saber,
    thrusterLevel:Math.max(mobility,overdrive),glowLevel:Math.max(beam,overdrive,duoCount?2:0),
    shieldLevel:Math.max(defense,modules.some((module)=>module.id==='duo_armor_guard')?2:0),labels,
  };
}

export function getModuleVisualHint(module){
  const tags=module.tags||module.requires||[];
  if(module.slot==='Primary')return '枪身、炮口与能量通道同步改装';
  if(module.slot==='Secondary')return '军刀基座、腕甲与刃光同步改装';
  if(module.slot==='Dash')return '推进喷口、翼片与尾焰同步改装';
  if(module.slot==='Ordnance')return '背包、肩部挂舱与浮游单元同步改装';
  if(module.slot==='Overdrive')return '超限核心、能量环与辉光同步改装';
  if(tags.includes('armor')||tags.includes('repair')||tags.includes('guard'))return '肩甲、防御板与装甲覆层同步改装';
  return '机体结构与战术挂载同步升级';
}
