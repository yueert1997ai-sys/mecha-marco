import { DIRECTIVES_43, FRAME_KITS_43, DEFAULT_KITS_43 } from '../data/frontlineDepth43.js';
import { sanitizeProfile } from './profile.js';

export function nextUnlock43(profile){
  const p=sanitizeProfile(profile);
  for(const kits of Object.values(FRAME_KITS_43)){
    const kit=kits.find((item)=>item.cost>0&&!p.unlockedKits.includes(item.id));
    if(kit)return{type:'kit',id:kit.id,name:kit.name,cost:kit.cost,remaining:Math.max(0,kit.cost-p.permanent)};
  }
  const directive=DIRECTIVES_43.find((item)=>!p.unlockedDirectives.includes(item.id));
  if(directive)return{type:'directive',id:directive.id,name:directive.name,cost:0,remaining:0};
  return{type:'archive',id:'complete',name:'完整恢复 MA-00 档案',cost:0,remaining:0};
}

export function buyKit43(profile,kitId){
  const p=sanitizeProfile(profile);
  const kit=Object.values(FRAME_KITS_43).flat().find((item)=>item.id===kitId);
  if(!kit||p.unlockedKits.includes(kitId)||p.permanent<kit.cost)return{profile:p,ok:false};
  p.permanent-=kit.cost;p.unlockedKits.push(kitId);
  return{profile:sanitizeProfile(p),ok:true};
}

export function selectKit43(profile,mechId,kitId){
  const p=sanitizeProfile(profile);
  const valid=FRAME_KITS_43[mechId]?.some((item)=>item.id===kitId)&&p.unlockedKits.includes(kitId);
  if(!valid)return p;p.selectedKits[mechId]=kitId;return sanitizeProfile(p);
}

export function toggleDirective43(profile,id){
  const p=sanitizeProfile(profile);
  if(!p.unlockedDirectives.includes(id))return p;
  const selected=new Set(p.selectedDirectives);
  if(selected.has(id))selected.delete(id);else if(selected.size<3)selected.add(id);
  p.selectedDirectives=[...selected];return sanitizeProfile(p);
}

export function repairSelectedKits43(profile){
  const p=sanitizeProfile(profile);
  for(const [mechId,fallback] of Object.entries(DEFAULT_KITS_43))if(!p.unlockedKits.includes(p.selectedKits[mechId]))p.selectedKits[mechId]=fallback;
  return p;
}
