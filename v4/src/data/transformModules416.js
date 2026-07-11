import { MODULES, MODULE_BY_ID } from './modules.js';
import { REWARD_TYPES } from './encounters.js';

export const TRANSFORM_MODULES_416 = [
  { id:'core_lance_cycle_416', name:'轨道枪式·五连贯穿', slot:'Core', rarity:'transform', family:'aurora', tags:['beam','pierce','transform'], desc:'每第 5 次主射击额外发射一束大型贯穿轨道炮。', effects:{ primaryLanceCycle:5 } },
  { id:'core_rear_arc_416', name:'逆向火控·回身齐射', slot:'Core', rarity:'transform', family:'eclipse', tags:['beam','transform'], desc:'每第 3 次主射击会向机体后方补射一轮牵制光束。', effects:{ primaryRearCycle:3 } },
  { id:'core_saber_tempest_416', name:'军刀式·环形刃暴', slot:'Core', rarity:'transform', family:'aurora', tags:['saber','wave','transform'], desc:'军刀命中帧同时向四周释放环形刃波。', effects:{ saberTempest:true } },
  { id:'core_phase_blink_416', name:'推进式·相位跃迁', slot:'Core', rarity:'transform', family:'eclipse', tags:['dash','impact','transform'], desc:'推进改为瞬间跃迁，并在起点和终点各触发一次冲击。', effects:{ phaseBlink:true } },
  { id:'core_sentry_ordnance_416', name:'挂载式·蜂巢哨戒', slot:'Core', rarity:'transform', family:'bastion', tags:['missile','drone','transform'], desc:'重火力不再发射导弹，改为部署一台持续射击的哨戒单元。', effects:{ ordnanceSentry:true } },
  { id:'core_wingmen_overdrive_416', name:'超限式·双翼僚机', slot:'Core', rarity:'transform', family:'eclipse', tags:['overdrive','drone','transform'], desc:'超限期间两台僚机同步复制每一轮主射击。', effects:{ overdriveWingmen:true } },
  { id:'core_last_stand_416', name:'防御式·拒绝停机', slot:'Core', rarity:'transform', family:'bastion', tags:['armor','guard','transform'], desc:'每个房间首次受到致命伤时保留 1 点耐久，并立即进入短暂超限。', effects:{ lastStandProtocol:true } },
];

export function installTransformModules416(){
  if(REWARD_TYPES.transform)return;
  REWARD_TYPES.transform={ id:'transform', name:'核心改造', icon:'⬢', slots:['Core'], color:'#a9c6d5' };
  for(const module of TRANSFORM_MODULES_416){
    if(!MODULE_BY_ID.has(module.id)){
      MODULES.push(module);
      MODULE_BY_ID.set(module.id,module);
    }
  }
}
