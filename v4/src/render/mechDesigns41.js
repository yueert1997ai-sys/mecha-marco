const neutral=(armor,armor2,frame,metal,trim,accent,glow,visor)=>({armor,armor2,frame,metal,trim,accent,glow,visor});

export const PLAYER_VISUALS={
  vanguard:{id:'vanguard',silhouette:'assault',scale:.92,body:{chest:1.05,length:1.18,waist:.48,shoulder:.78,leg:.36,calf:.4,head:.34},colors:neutral('#e9eef4','#aeb8c5','#151c28','#384657','#82dfff','#d63d4f','#73efff','#a9fbff')},
  bulwark:{id:'bulwark',silhouette:'fortress',scale:1.02,body:{chest:1.42,length:1.28,waist:.62,shoulder:1.02,leg:.48,calf:.56,head:.38},colors:neutral('#d9ddd8','#858d97','#171b22','#45505d','#d7b96d','#d65e2f','#ffbd67','#ffe2a3')},
  starwing:{id:'starwing',silhouette:'interceptor',scale:.86,body:{chest:.86,length:1.08,waist:.4,shoulder:.67,leg:.31,calf:.34,head:.31},colors:neutral('#eef4f7','#9aa8b7','#141526','#343752','#91f4ff','#9a62e8','#c1f8ff','#e0ffff')},
};

const enemyShape={melee:['raider',.86],eliteMelee:['raider',1.03],sniper:['lancer',.84],artillery:['siege',.94],tank:['bulwark',1.02],boss:['overlord',1.2],default:['soldier',.84]};

export const MECH_VISUAL_41=Object.freeze({version:'4.1.0-full-redesign',playerDesigns:Object.freeze(Object.keys(PLAYER_VISUALS)),renderMode:'projected-hard-surface-mesh'});

export function getVisualDesign(actor,isPlayer=false){
  if(isPlayer)return PLAYER_VISUALS[actor?.mech?.id]||PLAYER_VISUALS.vanguard;
  const role=actor?.boss?'boss':actor?.def?.role||'default';
  const [silhouette,scale]=enemyShape[role]||enemyShape.default;
  const boss=Boolean(actor?.boss),elite=Boolean(actor?.elite),color=actor?.def?.color||'#ff5d73';
  return {id:`enemy-${silhouette}`,silhouette,scale,body:{chest:boss?1.35:elite?1.05:.88,length:boss?1.35:1.02,waist:boss ? .62 : .46,shoulder:boss ? .92 : .68,leg:boss ? .46 : .34,calf:boss ? .5 : .38,head:boss ? .4 : .31},colors:neutral(elite?'#6b3442':'#552832',boss?'#9b5360':'#6c3a46','#190e15','#4c2a34','#ffb0a7',color,color,'#ffd9d4')};
}
