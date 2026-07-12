import { DUO_MODULES, MODULES } from '../data/modules.js';
import { seededRng, shuffle } from '../core/math.js';
import { REWARD_TYPES } from '../data/encounters.js';
import { getModuleDoctrine416 } from './doctrine416.js';

const ownedTags = (run) => new Set([
  ...(run.mechTags || []),
  ...run.modules.flatMap((m) => m.tags || []),
]);

export function getEligibleDuoModules(run) {
  const tags = ownedTags(run);
  return DUO_MODULES.filter((m) => m.requires.every((tag) => tags.has(tag)) && !run.modules.some((x) => x.id === m.id));
}

export function rollModuleChoices(run, rewardType = 'weapon', seed = Date.now(), count = 3) {
  const rng = seededRng(seed);
  const slots = REWARD_TYPES[rewardType]?.slots || [];
  const existing = new Set(run.modules.map((m) => m.id));
  // 组合协议在“核心改造”节点兑现，普通奖励仍严格匹配可见槽位。
  const eligibleDuo = rewardType==='transform' ? getEligibleDuoModules(run) : [];
  const basePool = MODULES.filter((m) => !existing.has(m.id) && (!slots.length || slots.includes(m.slot)));
  const rarePool = basePool.filter((m) => m.rarity === 'rare');
  const commonPool = basePool.filter((m) => m.rarity === 'common');
  const picks = [];

  if (eligibleDuo.length) picks.push(shuffle(eligibleDuo, rng)[0]);
  const compatible=basePool.filter((module)=>getModuleDoctrine416(module).id===(run.focusDoctrine||'aurora'));
  if(picks.length<count&&compatible.length)picks.push(shuffle(compatible,rng)[0]);
  const occupied=new Set(run.modules.filter((module)=>module.slot!=='Core').map((module)=>module.slot));
  const weak=basePool.filter((module)=>!occupied.has(module.slot)&&!picks.some((pick)=>pick.id===module.id));
  if(picks.length<count&&weak.length)picks.push(shuffle(weak,rng)[0]);
  while (picks.length < count) {
    const useRare = rng() < 0.32 && rarePool.length;
    const source = useRare ? rarePool : (commonPool.length ? commonPool : basePool);
    const candidate = shuffle(source.filter((m) => !picks.some((p) => p.id === m.id)), rng)[0];
    if (!candidate) break;
    picks.push(candidate);
  }
  return picks;
}

export const MODULE_CAPACITY_43={standard:6,core:2};
export const moduleGroup43=(module)=>module?.slot==='Core'||module?.rarity==='duo'?'core':'standard';
export function moduleGroupCount43(modules=[],group='standard'){return modules.filter((module)=>moduleGroup43(module)===group).length}
export function moduleCapacityFull43(modules=[],module){const group=moduleGroup43(module);return moduleGroupCount43(modules,group)>=MODULE_CAPACITY_43[group]}
export function installModule43(run,module,replaceId=null){
  if(!run||!module)return{installed:false,removed:null};
  let removed=null;
  if(moduleCapacityFull43(run.modules,module)){
    const group=moduleGroup43(module);
    const index=run.modules.findIndex((owned)=>owned.id===replaceId&&moduleGroup43(owned)===group);
    if(index<0)return{installed:false,removed:null,needsReplacement:true,group};
    [removed]=run.modules.splice(index,1);
  }
  run.modules.push(module);return{installed:true,removed};
}

export function applyModuleEffects(stats, module) {
  const next = structuredClone(stats);
  next.effects ||= {};
  for (const [key, value] of Object.entries(module.effects || {})) {
    if (key.endsWith('Mul')) {
      const statKey = key.slice(0, -3);
      next[statKey] = (next[statKey] ?? 1) * value;
    } else if (key.endsWith('Add')) {
      const statKey = key.slice(0, -3);
      next[statKey] = (next[statKey] ?? 0) + value;
    } else if (typeof value === 'number' && typeof next.effects[key] === 'number') {
      next.effects[key] += value;
    } else {
      next.effects[key] = value;
    }
  }
  return next;
}

export function buildRunStats(mech, modules = []) {
  let stats = { ...mech.stats, effects:{} };
  for (const module of modules) stats = applyModuleEffects(stats, module);
  stats.maxHp = Math.round(stats.maxHp);
  stats.primaryDamage = Math.round(stats.primaryDamage * 10) / 10;
  stats.secondaryDamage = Math.round(stats.secondaryDamage * 10) / 10;
  stats.ordnanceDamage = Math.round(stats.ordnanceDamage * 10) / 10;
  return stats;
}
