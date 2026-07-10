import { DUO_MODULES, MODULES } from '../data/modules.js';
import { seededRng, shuffle } from '../core/math.js';
import { REWARD_TYPES } from '../data/encounters.js';

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
  const eligibleDuo = getEligibleDuoModules(run);
  const basePool = MODULES.filter((m) => !existing.has(m.id) && (!slots.length || slots.includes(m.slot)));
  const rarePool = basePool.filter((m) => m.rarity === 'rare');
  const commonPool = basePool.filter((m) => m.rarity === 'common');
  const picks = [];

  if (eligibleDuo.length && rng() < 0.35) picks.push(shuffle(eligibleDuo, rng)[0]);
  while (picks.length < count) {
    const useRare = rng() < 0.32 && rarePool.length;
    const source = useRare ? rarePool : (commonPool.length ? commonPool : basePool);
    const candidate = shuffle(source.filter((m) => !picks.some((p) => p.id === m.id)), rng)[0];
    if (!candidate) break;
    picks.push(candidate);
  }
  return picks;
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
