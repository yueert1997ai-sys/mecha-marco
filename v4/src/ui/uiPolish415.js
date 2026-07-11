import { REWARD_TYPES } from '../data/encounters.js';
import { buildLoadoutVisual, getModuleVisualHint } from '../meta/loadoutProfile.js';

const rarityLabel=(module)=>module.rarity==='duo'?'组合协议':module.rarity==='rare'?'稀有协议':'标准协议';
const tierClass=(value)=>`tier-${Math.max(0,Math.min(3,value||0))}`;

function renderDock(run){
  const visual=buildLoadoutVisual(run.modules||[]);
  const mechId=globalThis.__MECHA_MARCO__?.game?.selectedMech||'vanguard';
  const labels=(visual.labels.length?visual.labels:['基础框体']).map((label)=>`<span>${label}</span>`).join('');
  const slots=[['Primary','主武装'],['Secondary','军刀'],['Dash','推进'],['Ordnance','挂载'],['Overdrive','超限'],['Passive','被动'],['Duo','组合']]
    .map(([slot,label])=>`<span>${label} ${visual.slotCounts[slot]||0}</span>`).join('');
  const drones=Array.from({length:visual.droneBits},(_,index)=>`<i class="dock-drone dock-drone-${index}"></i>`).join('');
  return `<div class="loadout-dock">
    <div class="dock-preview">
      <div class="dock-grid"></div>
      <div class="dock-mech ${mechId} ${tierClass(visual.moduleCount)} ${tierClass(visual.glowLevel)}"
        data-beam="${visual.beamTier}" data-saber="${visual.saberTier}" data-mobility="${visual.mobilityTier}"
        data-ordnance="${visual.ordnanceTier}" data-defense="${visual.defenseTier}" data-overdrive="${visual.overdriveTier}">
        <span class="dock-backpack"></span><span class="dock-fin dock-fin-l"></span><span class="dock-fin dock-fin-r"></span>
        <span class="dock-pod dock-pod-l"></span><span class="dock-pod dock-pod-r"></span>
        <span class="dock-shoulder dock-shoulder-l"></span><span class="dock-shoulder dock-shoulder-r"></span>
        <span class="dock-body"></span><span class="dock-head"></span><span class="dock-gun"></span><span class="dock-saber"></span>
        <span class="dock-core"></span>${drones}
      </div>
      <small>LIVE LOADOUT PREVIEW</small>
    </div>
    <div class="dock-info">
      <div class="dock-info-head"><div><strong>机体同步改装</strong><small>购买后战斗模型立即更换挂载与特效</small></div><b>${visual.moduleCount}</b></div>
      <div class="dock-section"><label>外观演化</label><div class="loadout-chip-row">${labels}</div></div>
      <div class="dock-section"><label>安装槽位</label><div class="loadout-chip-row compact">${slots}</div></div>
      <div class="dock-progress"><span style="--level:${Math.min(100,visual.moduleCount*12+visual.rareCount*7+visual.duoCount*14)}%"></span></div>
    </div>
  </div>`;
}

export function applyUIPolish415(AppUI){
  if(AppUI.__uiPolish415)return;
  AppUI.__uiPolish415=true;

  const base=AppUI.prototype.showBase;
  AppUI.prototype.showBase=function showBase415(...args){
    base.apply(this,args);
    const eyebrow=this.panel.querySelector('.brand-block .eyebrow');
    if(eyebrow)eyebrow.textContent='MECHA MARCO · V4.1.5 VISUAL LOADOUT';
    const subtitle=this.panel.querySelector('.brand-block p');
    if(subtitle)subtitle.textContent='轨道墓场战役 / 俯视机甲肉鸽 / 可视化机体改装';
  };

  AppUI.prototype.showReward=function showReward415(modules,rewardType,onChoose){
    const reward=REWARD_TYPES[rewardType];
    const cards=modules.map((module,index)=>`<button class="module-card ${module.rarity}" data-index="${index}">
      <span class="rarity">${rarityLabel(module)}</span><strong>${module.name}</strong><em>${module.slot}</em><p>${module.desc}</p>
      <small class="module-visual-hint">${getModuleVisualHint(module)}</small>
      <div class="tag-row">${(module.tags||module.requires||[]).map((tag)=>`<span>${tag}</span>`).join('')}</div>
    </button>`).join('');
    this.showPanel(`<section class="choice-screen reward-screen"><span class="eyebrow" style="color:${reward?.color||'#b7cad8'}">${reward?.icon||'◇'} ${reward?.name||'模块奖励'}</span><h2>选择一项战术协议</h2><p class="choice-subtitle">数值、挂载、装甲与特效会同步写入当前机体。</p><div class="module-grid">${cards}</div></section>`,'choice-panel');
    this.panel.querySelectorAll('[data-index]').forEach((button)=>button.addEventListener('click',()=>onChoose(Number(button.dataset.index))));
  };

  AppUI.prototype.showShop=function showShop415(run,inventory,onBuy,onRepair,onLeave){
    const items=inventory.map((module,index)=>`<button class="shop-item ${module.rarity}" data-buy="${index}" ${run.credits<35?'disabled':''}>
      <span class="shop-slot">${module.slot}</span><strong>${module.name}</strong><p>${module.desc}</p>
      <small class="module-visual-hint">${getModuleVisualHint(module)}</small><span class="shop-price">● 35</span>
    </button>`).join('');
    this.showPanel(`<section class="choice-screen shop-screen"><div class="shop-header"><div><span class="eyebrow">SUPPLY SHIP</span><h2>军械补给舰</h2></div><strong>战术核心 ● ${run.credits}</strong></div>${renderDock(run)}<div class="shop-grid">${items||'<p class="shop-empty">本舰当前库存已清空</p>'}</div><div class="shop-actions"><button id="shop-repair" ${run.credits<25?'disabled':''}>维修 28% · ●25</button><button id="shop-leave" class="primary-cta">离开补给舰</button></div></section>`,'choice-panel shop-panel');
    this.panel.querySelectorAll('[data-buy]').forEach((button)=>button.addEventListener('click',()=>onBuy(Number(button.dataset.buy))));
    this.panel.querySelector('#shop-repair').addEventListener('click',onRepair);
    this.panel.querySelector('#shop-leave').addEventListener('click',onLeave);
  };

  const updateHud=AppUI.prototype.updateHud;
  AppUI.prototype.updateHud=function updateHud415(game){
    updateHud.call(this,game);
    const visual=game.player?.visualLoadout;
    if(!visual)return;
    this.moduleStrip.dataset.modules=String(visual.moduleCount);
    this.moduleStrip.classList.toggle('has-duo',visual.duoCount>0);
    this.hud.dataset.buildLevel=String(Math.min(3,Math.floor(visual.moduleCount/3)));
  };
}
