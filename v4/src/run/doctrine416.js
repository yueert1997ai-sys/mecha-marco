export const DOCTRINES_416 = {
  aurora:{ id:'aurora', name:'曙光研究局', short:'曙光', color:'#91c9d6', detail:'光束、超限与精密能量联动' },
  bastion:{ id:'bastion', name:'壁垒铸造所', short:'壁垒', color:'#b89b78', detail:'装甲、冲击与重火力联动' },
  eclipse:{ id:'eclipse', name:'蚀影战术群', short:'蚀影', color:'#9b8eb7', detail:'推进、浮游单元与标记联动' },
};

const has=(tags, values)=>values.some((tag)=>tags.includes(tag));

export function getModuleDoctrine416(module={}){
  if(module.family&&DOCTRINES_416[module.family])return DOCTRINES_416[module.family];
  const tags=[...(module.tags||[]),...(module.requires||[])];
  if(has(tags,['beam','pierce','ricochet','multishot','burst','overdrive','nova','wave']))return DOCTRINES_416.aurora;
  if(has(tags,['armor','guard','impact','missile','cluster','repair','gravity']))return DOCTRINES_416.bastion;
  return DOCTRINES_416.eclipse;
}

export function buildDoctrineProfile416(modules=[]){
  const counts={aurora:0,bastion:0,eclipse:0};
  for(const module of modules)counts[getModuleDoctrine416(module).id]+=1;
  const dominant=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0]?.[0]||'aurora';
  return {
    counts,
    dominant,
    dominantDoctrine:DOCTRINES_416[dominant],
    tier:Math.min(2,Math.floor((counts[dominant]||0)/2)),
    nextThreshold:(counts[dominant]||0)<2?2:(counts[dominant]||0)<4?4:null,
    auroraResonance:counts.aurora>=2,
    bastionResonance:counts.bastion>=2,
    eclipseResonance:counts.eclipse>=2,
    auroraMastery:counts.aurora>=4,
    bastionMastery:counts.bastion>=4,
    eclipseMastery:counts.eclipse>=4,
  };
}
