export const ENEMY_TYPES = {
  grunt: {
    id:'grunt', name:'裂隙步枪兵', hp:48, speed:3.4, radius:.58, range:7.4,
    damage:10, attackCooldown:1.35, projectileSpeed:9.5, color:'#ff5d73', role:'ranged', score:10,
  },
  striker: {
    id:'striker', name:'刃蜂突击机', hp:62, speed:4.8, radius:.62, range:1.6,
    damage:18, attackCooldown:1.55, color:'#ff9a57', role:'melee', score:14,
  },
  sniper: {
    id:'sniper', name:'天线狙击机', hp:44, speed:2.7, radius:.56, range:12,
    damage:24, attackCooldown:2.8, projectileSpeed:15, color:'#f04cff', role:'sniper', score:18,
  },
  shield: {
    id:'shield', name:'壁垒护卫机', hp:110, speed:2.8, radius:.78, range:4.2,
    damage:15, attackCooldown:1.9, color:'#ffca55', role:'tank', score:22, armor:.28,
  },
  artillery: {
    id:'artillery', name:'轨道迫击炮', hp:76, speed:2.2, radius:.7, range:10,
    damage:22, attackCooldown:2.5, color:'#72b8ff', role:'artillery', score:24,
  },
  drone: {
    id:'drone', name:'微型蜂群', hp:28, speed:5.4, radius:.4, range:4.7,
    damage:7, attackCooldown:.92, projectileSpeed:10, color:'#76fff0', role:'swarm', score:8,
  },
  eliteBlade: {
    id:'eliteBlade', name:'赤刃执行官', hp:240, speed:4.5, radius:.88, range:2.1,
    damage:30, attackCooldown:1.7, color:'#ff334e', role:'eliteMelee', score:65, elite:true, armor:.12,
  },
  eliteCannon: {
    id:'eliteCannon', name:'重炮监察官', hp:270, speed:2.7, radius:.95, range:9,
    damage:32, attackCooldown:2.25, projectileSpeed:12, color:'#ff7a2f', role:'eliteRanged', score:70, elite:true, armor:.16,
  },
  boss: {
    id:'boss', name:'守墓者·阿尔法', hp:1200, speed:3.2, radius:1.45, range:8.5,
    damage:32, attackCooldown:1.75, projectileSpeed:12, color:'#ff2c78', role:'boss', score:300, boss:true, armor:.2,
  },
};

export const ROOM_TEMPLATES = [
  { id:'open_crossfire', name:'破碎中轴', layout:'open', tags:['ranged'], waves:[['grunt','grunt','drone'],['grunt','sniper','drone','drone']] },
  { id:'close_quarters', name:'废舰近舱', layout:'pillars', tags:['melee'], waves:[['striker','striker','drone'],['striker','shield','drone']] },
  { id:'sniper_lane', name:'狙击回廊', layout:'lane', tags:['ranged','hazard'], waves:[['sniper','grunt','grunt'],['sniper','artillery','drone']] },
  { id:'reactor_ring', name:'反应堆环', layout:'ring', tags:['hazard'], waves:[['shield','grunt','drone'],['artillery','striker','striker']] },
  { id:'swarm_nest', name:'无人机巢区', layout:'islands', tags:['swarm'], waves:[['drone','drone','drone','drone','drone'],['drone','drone','striker','grunt']] },
  { id:'heavy_gate', name:'装甲闸门', layout:'gate', tags:['tank'], waves:[['shield','grunt','grunt'],['shield','shield','striker']] },
  { id:'elite_blade', name:'赤刃试炼场', layout:'arena', tags:['elite','melee'], elite:true, waves:[['eliteBlade','striker','striker']] },
  { id:'elite_cannon', name:'重炮封锁区', layout:'arena', tags:['elite','ranged'], elite:true, waves:[['eliteCannon','grunt','drone','drone']] },
  { id:'boss_alpha', name:'轨道墓场核心', layout:'boss', tags:['boss'], boss:true, waves:[['boss']] },
];

export const EVENT_DEFS = [
  {
    id:'wrecked_pilot',
    name:'失联驾驶员',
    body:'一台损毁的友军机体仍在发送加密求救信号。救援会暴露你的坐标。',
    choices:[
      { id:'rescue', label:'执行救援', result:'获得永久资源，但下一战出现精英增援。', permanent:3, nextElite:true },
      { id:'salvage', label:'拆解武装', result:'获得 45 战术核心。', credits:45 },
    ],
  },
  {
    id:'unstable_core',
    name:'不稳定能源核',
    body:'残骸中悬浮着一枚仍在运作的实验能源核。它能强化系统，也可能灼毁装甲。',
    choices:[
      { id:'integrate', label:'强行接入', result:'获得随机稀有模块，损失 18% 当前耐久。', rareModule:true, hpCostPct:.18 },
      { id:'vent', label:'安全泄压', result:'恢复 22% 最大耐久。', healPct:.22 },
    ],
  },
];

export const REWARD_TYPES = {
  weapon: { id:'weapon', name:'武器协议', icon:'◇', slots:['Primary','Secondary'], color:'#69e9ff' },
  mobility: { id:'mobility', name:'推进协议', icon:'»', slots:['Dash'], color:'#9b82ff' },
  ordnance: { id:'ordnance', name:'重火力协议', icon:'✦', slots:['Ordnance'], color:'#ff9e55' },
  overdrive: { id:'overdrive', name:'超限协议', icon:'⚡', slots:['Overdrive'], color:'#ff5fd3' },
  defense: { id:'defense', name:'防御协议', icon:'⬡', slots:['Passive'], color:'#ffd86a' },
  credits: { id:'credits', name:'战术核心', icon:'●', slots:[], color:'#7cff9a' },
  repair: { id:'repair', name:'维修', icon:'✚', slots:[], color:'#75ffde' },
  permanent: { id:'permanent', name:'舰队数据', icon:'◆', slots:[], color:'#ffffff' },
};
