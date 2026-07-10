import { pick, seededRng, shuffle } from '../core/math.js';
import { REWARD_TYPES, ROOM_TEMPLATES } from '../data/encounters.js';

const COMBAT_REWARDS = ['weapon','mobility','ordnance','overdrive','defense','credits','permanent'];

const chooseReward = (rng, used = []) => {
  const pool = COMBAT_REWARDS.filter((id) => !used.includes(id));
  return pick(pool.length ? pool : COMBAT_REWARDS, rng);
};

const chooseTemplate = (rng, history, elite = false) => {
  const recent = history.slice(-2);
  const pool = ROOM_TEMPLATES.filter((t) => !t.boss && Boolean(t.elite) === elite && !recent.includes(t.id));
  return pick(pool.length ? pool : ROOM_TEMPLATES.filter((t) => !t.boss && Boolean(t.elite) === elite), rng);
};

export function generateRoomGraph(seed = Date.now(), length = 10) {
  const rng = seededRng(seed);
  const nodes = [];
  let previousTemplateIds = [];

  for (let depth = 0; depth < length; depth += 1) {
    if (depth === length - 1) {
      nodes.push({ depth, choices:[{ id:`${depth}-boss`, type:'combat', boss:true, reward:'permanent', template:'boss_alpha' }] });
      continue;
    }

    if (depth === 4) {
      nodes.push({ depth, choices:[
        { id:`${depth}-shop`, type:'shop', reward:'credits' },
        { id:`${depth}-repair`, type:'repair', reward:'repair' },
      ] });
      continue;
    }

    if (depth === 7) {
      const a = chooseTemplate(rng, previousTemplateIds, true);
      const b = chooseTemplate(rng, [...previousTemplateIds, a.id], true);
      nodes.push({ depth, choices:[
        { id:`${depth}-a`, type:'combat', elite:true, reward:chooseReward(rng), template:a.id },
        { id:`${depth}-b`, type:'combat', elite:true, reward:chooseReward(rng), template:b.id },
      ] });
      previousTemplateIds.push(a.id, b.id);
      continue;
    }

    if (depth === 2 || depth === 6) {
      const combatTemplate = chooseTemplate(rng, previousTemplateIds, false);
      nodes.push({ depth, choices:shuffle([
        { id:`${depth}-event`, type:'event', reward:'permanent' },
        { id:`${depth}-combat`, type:'combat', reward:chooseReward(rng), template:combatTemplate.id },
      ], rng) });
      previousTemplateIds.push(combatTemplate.id);
      continue;
    }

    const a = chooseTemplate(rng, previousTemplateIds, false);
    const b = chooseTemplate(rng, [...previousTemplateIds, a.id], false);
    const rewardA = chooseReward(rng);
    const rewardB = chooseReward(rng, [rewardA]);
    nodes.push({ depth, choices:[
      { id:`${depth}-a`, type:'combat', reward:rewardA, template:a.id },
      { id:`${depth}-b`, type:'combat', reward:rewardB, template:b.id },
    ] });
    previousTemplateIds.push(a.id, b.id);
  }

  return { seed, length, nodes };
}

export function describeRoomChoice(choice) {
  if (choice.type === 'shop') return { name:'军械补给舰', detail:'购买模块、修理并重整构筑', icon:'▣', color:'#ffd269' };
  if (choice.type === 'repair') return { name:'紧急维修区', detail:'恢复耐久并补充一次推进储能', icon:'✚', color:'#76ffe1' };
  if (choice.type === 'event') return { name:'未知信号', detail:'一次带有代价的战场事件', icon:'?', color:'#c79aff' };
  const template = ROOM_TEMPLATES.find((t) => t.id === choice.template);
  const reward = REWARD_TYPES[choice.reward];
  return {
    name: choice.boss ? '区域首领：守墓者·阿尔法' : template?.name || '战斗房间',
    detail: `${choice.elite ? '精英战 · ' : ''}${reward?.name || '战斗奖励'}`,
    icon: choice.boss ? '☠' : reward?.icon || '◇',
    color: reward?.color || '#fff',
  };
}
