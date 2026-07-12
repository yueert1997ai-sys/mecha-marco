import { DIRECTIVES_43, FRAME_KITS_43, DEFAULT_KITS_43 } from '../data/frontlineDepth43.js';
import { sanitizeProfile } from './profile.js';

const kitState=(profile,mechId,kit)=>{const mastery=profile.mechMastery[mechId]||0;return{mastery,masteryRemaining:Math.max(0,(kit.masteryReq||0)-mastery),dataRemaining:Math.max(0,kit.cost-profile.permanent)}};

export function kitUnlockState43(profile,mechId,kit){
  const p=sanitizeProfile(profile);return kitState(p,mechId,kit);
}

export function nextUnlock43(profile,preferredMech){
  const p=sanitizeProfile(profile);
  const first=preferredMech||p.selectedMech;const order=[first,...Object.keys(FRAME_KITS_43).filter((id)=>id!==first)];
  for(const mechId of order){const kits=FRAME_KITS_43[mechId]||[];
    const kit=kits.find((item)=>item.cost>0&&!p.unlockedKits.includes(item.id));
    if(kit)return{type:'kit',id:kit.id,name:kit.name,mechId,cost:kit.cost,...kitState(p,mechId,kit)};
  }
  const directive=DIRECTIVES_43.find((item)=>!p.unlockedDirectives.includes(item.id));
  if(directive)return{type:'directive',id:directive.id,name:directive.name,cost:0,remaining:0};
  return{type:'archive',id:'complete',name:'完整恢复 MA-00 档案',cost:0,remaining:0};
}

export function buyKit43(profile,kitId){
  const p=sanitizeProfile(profile);
  const entry=Object.entries(FRAME_KITS_43).flatMap(([mechId,kits])=>kits.map((kit)=>({mechId,kit}))).find((item)=>item.kit.id===kitId),kit=entry?.kit;
  if(!kit||p.unlockedKits.includes(kitId))return{profile:p,ok:false,reason:'invalid'};
  if((p.mechMastery[entry.mechId]||0)<(kit.masteryReq||0))return{profile:p,ok:false,reason:'mastery'};
  if(p.permanent<kit.cost)return{profile:p,ok:false,reason:'data'};
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
