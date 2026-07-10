// ---- src/data/mechs.js ----
export const MECHS = {
  vanguard: {
    id: 'vanguard',
    name: '断刃·先锋型',
    title: '近远切换 / 高速取消',
    description: '稳定光束步枪与宽幅军刀。推进冷却短，适合主动贴近后快速拉开。',
    palette: { primary: '#f4f7ff', secondary: '#2e7bff', accent: '#ff425f', trim: '#ffd35a', glow: '#7cf5ff', dark: '#17243d' },
    stats: { maxHp: 120, moveSpeed: 6.8, turnSpeed: 12, primaryDamage: 18, primaryRate: 0.18, projectileSpeed: 18, secondaryDamage: 44, dashSpeed: 17, dashDuration: 0.17, dashCooldown: 0.75, ordnanceDamage: 32, ordnanceCooldown: 5.2, overdriveNeed: 100 },
    tags: ['beam', 'saber', 'agile'],
  },
  bulwark: {
    id: 'bulwark', name: '断岳·重装型', title: '爆裂重炮 / 护盾反击', description: '火力和装甲最高。推进距离较短，但冲撞期间具备减伤和高硬直。',
    palette: { primary: '#eef1e9', secondary: '#58647a', accent: '#ff8a35', trim: '#ffd168', glow: '#ffb55e', dark: '#202632' },
    stats: { maxHp: 175, moveSpeed: 5.2, turnSpeed: 9, primaryDamage: 34, primaryRate: 0.42, projectileSpeed: 14, secondaryDamage: 62, dashSpeed: 13, dashDuration: 0.2, dashCooldown: 1.05, ordnanceDamage: 52, ordnanceCooldown: 6.2, overdriveNeed: 100 },
    tags: ['cannon', 'saber', 'armor'],
  },
  starwing: {
    id: 'starwing', name: '星翼·高机动型', title: '双联光束 / 浮游刃', description: '速度最快，可储存两段推进。浮游刃适合多目标压制和标记联动。',
    palette: { primary: '#f7fbff', secondary: '#7c54ff', accent: '#ff4fc8', trim: '#72f2ff', glow: '#b6f9ff', dark: '#211a48' },
    stats: { maxHp: 100, moveSpeed: 7.7, turnSpeed: 14, primaryDamage: 12, primaryRate: 0.11, projectileSpeed: 21, secondaryDamage: 35, dashSpeed: 19, dashDuration: 0.15, dashCooldown: 0.6, dashCharges: 2, ordnanceDamage: 25, ordnanceCooldown: 4.4, overdriveNeed: 100 },
    tags: ['beam', 'drone', 'agile'],
  },
};
export const DEFAULT_MECH_ID = 'vanguard';
export const getMech = (id) => MECHS[id] || MECHS[DEFAULT_MECH_ID];

export const MODULES = [
  { id:'primary_power_1', name:'增幅聚焦镜', slot:'Primary', rarity:'common', tags:['beam'], desc:'主射击伤害 +22%', effects:{ primaryDamageMul:1.22 } },
  { id:'primary_rate_1', name:'高速供能栓', slot:'Primary', rarity:'common', tags:['beam'], desc:'主射击间隔 -18%', effects:{ primaryRateMul:.82 } },
  { id:'primary_pierce_1', name:'相位穿透线圈', slot:'Primary', rarity:'rare', tags:['beam','pierce'], desc:'光束穿透 1 个目标，后续目标伤害 82%', effects:{ primaryPierce:1 } },
  { id:'primary_ricochet_1', name:'折射棱镜', slot:'Primary', rarity:'rare', tags:['beam','ricochet'], desc:'命中后折射到附近敌机一次', effects:{ primaryRicochet:1, primaryDamageMul:.9 } },
  { id:'primary_split_1', name:'双列发射协议', slot:'Primary', rarity:'rare', tags:['beam','multishot'], desc:'主射击变为双联，单发伤害降低', effects:{ primaryCount:2, primarySpread:.09, primaryDamageMul:.72 } },
  { id:'primary_burst_1', name:'三连点放机构', slot:'Primary', rarity:'rare', tags:['burst'], desc:'每次输入连续发射 3 发，冷却略增', effects:{ primaryBurst:3, primaryRateMul:1.28, primaryDamageMul:.7 } },
  { id:'secondary_power_1', name:'军刀过载器', slot:'Secondary', rarity:'common', tags:['saber'], desc:'近战伤害 +30%', effects:{ secondaryDamageMul:1.3 } },
  { id:'secondary_arc_1', name:'宽幅磁约束', slot:'Secondary', rarity:'common', tags:['saber'], desc:'军刀攻击范围 +24%', effects:{ secondaryRangeMul:1.24 } },
  { id:'secondary_double_1', name:'二段回旋程序', slot:'Secondary', rarity:'rare', tags:['saber','combo'], desc:'军刀追加一次反向回旋', effects:{ secondaryDouble:true, secondaryDamageMul:.82 } },
  { id:'secondary_wave_1', name:'刃波投射器', slot:'Secondary', rarity:'rare', tags:['saber','wave'], desc:'挥砍释放短程能量刃波', effects:{ secondaryWave:true } },
  { id:'secondary_guard_1', name:'斩击偏转框架', slot:'Secondary', rarity:'rare', tags:['saber','guard'], desc:'军刀启动期间受到的伤害降低 65%', effects:{ secondaryGuard:.65 } },
  { id:'secondary_mark_1', name:'破甲刻印', slot:'Secondary', rarity:'common', tags:['mark'], desc:'军刀命中使目标承伤 +18%，持续 4 秒', effects:{ secondaryMark:.18 } },
  { id:'dash_cool_1', name:'脉冲推进冷却器', slot:'Dash', rarity:'common', tags:['dash'], desc:'推进冷却 -20%', effects:{ dashCooldownMul:.8 } },
  { id:'dash_distance_1', name:'矢量喷口扩展', slot:'Dash', rarity:'common', tags:['dash'], desc:'推进距离 +22%', effects:{ dashDurationMul:1.22 } },
  { id:'dash_afterimage_1', name:'残像诱导器', slot:'Dash', rarity:'rare', tags:['dash','decoy'], desc:'推进后留下残像，吸引敌方火力 1.2 秒', effects:{ dashDecoy:true } },
  { id:'dash_shock_1', name:'超压冲击锥', slot:'Dash', rarity:'rare', tags:['dash','impact'], desc:'推进路径撞击敌机并造成硬直', effects:{ dashDamage:28 } },
  { id:'dash_reload_1', name:'动作联锁补给', slot:'Dash', rarity:'rare', tags:['dash','reload'], desc:'推进立即重置主射击冷却', effects:{ dashReload:true } },
  { id:'dash_charge_1', name:'双储能推进仓', slot:'Dash', rarity:'rare', tags:['dash'], desc:'增加 1 次推进储能', effects:{ dashCharges:1, dashCooldownMul:1.08 } },
  { id:'ordnance_power_1', name:'高爆弹头', slot:'Ordnance', rarity:'common', tags:['missile'], desc:'重火力伤害 +28%', effects:{ ordnanceDamageMul:1.28 } },
  { id:'ordnance_cool_1', name:'并行装填机', slot:'Ordnance', rarity:'common', tags:['missile'], desc:'重火力冷却 -18%', effects:{ ordnanceCooldownMul:.82 } },
  { id:'ordnance_cluster_1', name:'分裂弹仓', slot:'Ordnance', rarity:'rare', tags:['missile','cluster'], desc:'爆炸后分裂出 4 枚微型弹', effects:{ ordnanceCluster:4, ordnanceDamageMul:.88 } },
  { id:'ordnance_lock_1', name:'多目标火控', slot:'Ordnance', rarity:'rare', tags:['missile','lock'], desc:'同时锁定最多 3 个目标', effects:{ ordnanceTargets:3 } },
  { id:'ordnance_pull_1', name:'引力坍缩弹', slot:'Ordnance', rarity:'rare', tags:['gravity'], desc:'爆炸会将敌机拖向中心', effects:{ ordnancePull:4.5 } },
  { id:'ordnance_drone_1', name:'浮游刃增殖', slot:'Ordnance', rarity:'rare', tags:['drone'], desc:'额外生成 2 枚浮游刃', effects:{ ordnanceExtra:2 } },
  { id:'overdrive_gain_1', name:'战意回收器', slot:'Overdrive', rarity:'common', tags:['overdrive'], desc:'造成伤害获得的超限能量 +30%', effects:{ overdriveGainMul:1.3 } },
  { id:'overdrive_duration_1', name:'超限稳定环', slot:'Overdrive', rarity:'rare', tags:['overdrive'], desc:'超限持续时间 +35%', effects:{ overdriveDurationMul:1.35 } },
  { id:'overdrive_nova_1', name:'天穹震荡核', slot:'Overdrive', rarity:'rare', tags:['overdrive','nova'], desc:'启动超限时释放全屏冲击波', effects:{ overdriveNova:65 } },
  { id:'defense_hp_1', name:'复层装甲', slot:'Passive', rarity:'common', tags:['armor'], desc:'最大耐久 +24', effects:{ maxHpAdd:24 } },
  { id:'defense_heal_1', name:'战后纳米修复', slot:'Passive', rarity:'common', tags:['repair'], desc:'清场后恢复 10% 最大耐久', effects:{ roomHealPct:.1 } },
  { id:'defense_stagger_1', name:'惯性稳定器', slot:'Passive', rarity:'common', tags:['armor'], desc:'受到的击退和硬直降低 35%', effects:{ staggerResist:.35 } },
];
export const DUO_MODULES = [
  { id:'duo_beam_saber', name:'光刃共振', slot:'Duo', rarity:'duo', requires:['beam','saber'], desc:'主射击命中会强化下一次军刀；军刀命中会使下一轮光束分裂', effects:{ beamSaberResonance:true } },
  { id:'duo_dash_beam', name:'光迹突击', slot:'Duo', rarity:'duo', requires:['dash','beam'], desc:'推进结束时沿路径留下持续光束', effects:{ dashBeamTrail:true } },
  { id:'duo_missile_mark', name:'猎杀闭环', slot:'Duo', rarity:'duo', requires:['missile','mark'], desc:'重火力优先追踪被标记目标并必定暴击', effects:{ markedMissileCrit:true } },
  { id:'duo_armor_guard', name:'绝对防线', slot:'Duo', rarity:'duo', requires:['armor','guard'], desc:'军刀格挡期间耐久不低于 1，并反射投射物', effects:{ absoluteGuard:true } },
  { id:'duo_drone_beam', name:'星翼齐射', slot:'Duo', rarity:'duo', requires:['drone','beam'], desc:'浮游刃会同步复制主射击', effects:{ droneCopyShot:true } },
  { id:'duo_impact_cluster', name:'重力爆破链', slot:'Duo', rarity:'duo', requires:['impact','cluster'], desc:'推进撞击会触发微型集束爆炸', effects:{ dashCluster:true } },
];
export const MODULE_BY_ID = new Map([...MODULES, ...DUO_MODULES].map((m) => [m.id, m]));
export const RARITY_WEIGHT = { common: 70, rare: 25, duo: 5 };

export const ENEMY_TYPES = {
  grunt:{id:'grunt',name:'裂隙步枪兵',hp:48,speed:3.4,radius:.58,range:7.4,damage:10,attackCooldown:1.35,projectileSpeed:9.5,color:'#ff5d73',role:'ranged',score:10},
  striker:{id:'striker',name:'刃蜂突击机',hp:62,speed:4.8,radius:.62,range:1.6,damage:18,attackCooldown:1.55,color:'#ff9a57',role:'melee',score:14},
  sniper:{id:'sniper',name:'天线狙击机',hp:44,speed:2.7,radius:.56,range:12,damage:24,attackCooldown:2.8,projectileSpeed:15,color:'#f04cff',role:'sniper',score:18},
  shield:{id:'shield',name:'壁垒护卫机',hp:110,speed:2.8,radius:.78,range:4.2,damage:15,attackCooldown:1.9,color:'#ffca55',role:'tank',score:22,armor:.28},
  artillery:{id:'artillery',name:'轨道迫击炮',hp:76,speed:2.2,radius:.7,range:10,damage:22,attackCooldown:2.5,color:'#72b8ff',role:'artillery',score:24},
  drone:{id:'drone',name:'微型蜂群',hp:28,speed:5.4,radius:.4,range:4.7,damage:7,attackCooldown:.92,projectileSpeed:10,color:'#76fff0',role:'swarm',score:8},
  eliteBlade:{id:'eliteBlade',name:'赤刃执行官',hp:240,speed:4.5,radius:.88,range:2.1,damage:30,attackCooldown:1.7,color:'#ff334e',role:'eliteMelee',score:65,elite:true,armor:.12},
  eliteCannon:{id:'eliteCannon',name:'重炮监察官',hp:270,speed:2.7,radius:.95,range:9,damage:32,attackCooldown:2.25,projectileSpeed:12,color:'#ff7a2f',role:'eliteRanged',score:70,elite:true,armor:.16},
  boss:{id:'boss',name:'守墓者·阿尔法',hp:1200,speed:3.2,radius:1.45,range:8.5,damage:32,attackCooldown:1.75,projectileSpeed:12,color:'#ff2c78',role:'boss',score:300,boss:true,armor:.2},
};
export const ROOM_TEMPLATES = [
  {id:'open_crossfire',name:'破碎中轴',layout:'open',tags:['ranged'],waves:[['grunt','grunt','drone'],['grunt','sniper','drone','drone']]},
  {id:'close_quarters',name:'废舰近舱',layout:'pillars',tags:['melee'],waves:[['striker','striker','drone'],['striker','shield','drone']]},
  {id:'sniper_lane',name:'狙击回廊',layout:'lane',tags:['ranged','hazard'],waves:[['sniper','grunt','grunt'],['sniper','artillery','drone']]},
  {id:'reactor_ring',name:'反应堆环',layout:'ring',tags:['hazard'],waves:[['shield','grunt','drone'],['artillery','striker','striker']]},
  {id:'swarm_nest',name:'无人机巢区',layout:'islands',tags:['swarm'],waves:[['drone','drone','drone','drone','drone'],['drone','drone','striker','grunt']]},
  {id:'heavy_gate',name:'装甲闸门',layout:'gate',tags:['tank'],waves:[['shield','grunt','grunt'],['shield','shield','striker']]},
  {id:'elite_blade',name:'赤刃试炼场',layout:'arena',tags:['elite','melee'],elite:true,waves:[['eliteBlade','striker','striker']]},
  {id:'elite_cannon',name:'重炮封锁区',layout:'arena',tags:['elite','ranged'],elite:true,waves:[['eliteCannon','grunt','drone','drone']]},
  {id:'boss_alpha',name:'轨道墓场核心',layout:'boss',tags:['boss'],boss:true,waves:[['boss']]},
];
export const EVENT_DEFS = [
  {id:'wrecked_pilot',name:'失联驾驶员',body:'一台损毁的友军机体仍在发送加密求救信号。救援会暴露你的坐标。',choices:[{id:'rescue',label:'执行救援',result:'获得永久资源，但下一战出现精英增援。',permanent:3,nextElite:true},{id:'salvage',label:'拆解武装',result:'获得 45 战术核心。',credits:45}]},
  {id:'unstable_core',name:'不稳定能源核',body:'残骸中悬浮着一枚仍在运作的实验能源核。它能强化系统，也可能灼毁装甲。',choices:[{id:'integrate',label:'强行接入',result:'获得随机稀有模块，损失 18% 当前耐久。',rareModule:true,hpCostPct:.18},{id:'vent',label:'安全泄压',result:'恢复 22% 最大耐久。',healPct:.22}]},
];
export const REWARD_TYPES = {
  weapon:{id:'weapon',name:'武器协议',icon:'◇',slots:['Primary','Secondary'],color:'#69e9ff'}, mobility:{id:'mobility',name:'推进协议',icon:'»',slots:['Dash'],color:'#9b82ff'}, ordnance:{id:'ordnance',name:'重火力协议',icon:'✦',slots:['Ordnance'],color:'#ff9e55'}, overdrive:{id:'overdrive',name:'超限协议',icon:'⚡',slots:['Overdrive'],color:'#ff5fd3'}, defense:{id:'defense',name:'防御协议',icon:'⬡',slots:['Passive'],color:'#ffd86a'}, credits:{id:'credits',name:'战术核心',icon:'●',slots:[],color:'#7cff9a'}, repair:{id:'repair',name:'维修',icon:'✚',slots:[],color:'#75ffde'}, permanent:{id:'permanent',name:'舰队数据',icon:'◆',slots:[],color:'#ffffff'},
};
export const BASE_DIALOGUE = [
  {id:'first_return',priority:100,once:true,when:(p,r)=>p.runs===1,speaker:'整备长 伊芙',text:'第一次返航。机体还能修，驾驶员的判断更值得保留。下一次，先看清门牌再决定路线。'},
  {id:'death_sniper',priority:80,cooldown:2,when:(p,r)=>r?.deathCause==='sniper',speaker:'战术官 洛岚',text:'狙击束有三段预警：瞄准线、聚能声、发射闪光。别在第三段才开始移动。'},
  {id:'boss_seen',priority:75,once:true,when:(p,r)=>r?.reachedBoss&&!r?.victory,speaker:'舰长 零',text:'你已经看见守墓者了。它会在半血后封锁外圈，下一次把推进留给那一段。'},
  {id:'boss_clear',priority:120,once:true,when:(p,r)=>r?.victory,speaker:'舰长 零',text:'轨道墓场的防线被撕开了。记录不是终点，它只是下一片战区的坐标。'},
  {id:'low_hp',priority:60,cooldown:3,when:(p,r)=>r?.lowHpClear,speaker:'整备长 伊芙',text:'低耐久通关能证明你的操作，也能证明装甲预算不够。两件事都记下了。'},
  {id:'saber_run',priority:50,cooldown:2,when:(p,r)=>r?.secondaryKills>=8,speaker:'战术官 洛岚',text:'这次大部分目标死在军刀下。你的近战链已经成形，下一次可以主动找推进和格挡协议。'},
  {id:'default',priority:1,cooldown:1,when:()=>true,speaker:'整备长 伊芙',text:'战报已经归档。换一台机体、换一条路线，战役会给出不同答案。'},
];