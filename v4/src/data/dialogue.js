export const BASE_DIALOGUE = [
  { id:'first_return', priority:100, once:true, when:(p,r)=>p.runs===1, speaker:'整备长 伊芙', text:'第一次返航。机体还能修，驾驶员的判断更值得保留。下一次，先看清门牌再决定路线。' },
  { id:'death_sniper', priority:80, cooldown:2, when:(p,r)=>r?.deathCause==='sniper', speaker:'战术官 洛岚', text:'狙击束有三段预警：瞄准线、聚能声、发射闪光。别在第三段才开始移动。' },
  { id:'boss_seen', priority:75, once:true, when:(p,r)=>r?.reachedBoss&&!r?.victory, speaker:'舰长 零', text:'你已经看见守墓者了。它会在半血后封锁外圈，下一次把推进留给那一段。' },
  { id:'boss_clear', priority:120, once:true, when:(p,r)=>r?.victory, speaker:'舰长 零', text:'轨道墓场的防线被撕开了。记录不是终点，它只是下一片战区的坐标。' },
  { id:'low_hp', priority:60, cooldown:3, when:(p,r)=>r?.lowHpClear, speaker:'整备长 伊芙', text:'低耐久通关能证明你的操作，也能证明装甲预算不够。两件事都记下了。' },
  { id:'saber_run', priority:50, cooldown:2, when:(p,r)=>r?.secondaryKills>=8, speaker:'战术官 洛岚', text:'这次大部分目标死在军刀下。你的近战链已经成形，下一次可以主动找推进和格挡协议。' },
  { id:'default', priority:1, cooldown:1, when:()=>true, speaker:'整备长 伊芙', text:'战报已经归档。换一台机体、换一条路线，战役会给出不同答案。' },
];
