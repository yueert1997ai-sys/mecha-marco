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
