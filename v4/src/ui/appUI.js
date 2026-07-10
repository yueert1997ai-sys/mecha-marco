import { describeRoomChoice } from '../run/roomGraph.js';
import { REWARD_TYPES } from '../data/encounters.js';

const $ = (id) => document.getElementById(id);

export class AppUI {
  constructor() {
    this.root = $('app');
    this.hud = $('hud');
    this.overlay = $('overlay');
    this.panel = $('panel');
    this.touchControls = $('touch-controls');
    this.hpFill = $('hp-fill');
    this.hpText = $('hp-text');
    this.overdriveFill = $('overdrive-fill');
    this.roomLabel = $('room-label');
    this.creditsLabel = $('credits-label');
    this.moduleStrip = $('module-strip');
    this.bossBar = $('boss-bar');
    this.bossFill = $('boss-fill');
    this.bossName = $('boss-name');
    this.toast = $('toast');
    this.toastTimer = 0;
  }

  setCombatVisible(value) {
    this.hud.classList.toggle('hidden', !value);
    this.touchControls.classList.toggle('hidden', !value);
  }

  showPanel(html, className = '') {
    this.overlay.className = `overlay show ${className}`;
    this.panel.className = `panel ${className}`;
    this.panel.innerHTML = html;
  }

  hidePanel() {
    this.overlay.className = 'overlay';
    this.panel.innerHTML = '';
  }

  showBase(profile, mechs, dialogue, selectedMech, onSelect, onStart) {
    this.setCombatVisible(false);
    const cards = Object.values(mechs).map((mech) => `
      <button class="mech-card ${mech.id===selectedMech?'selected':''}" data-mech="${mech.id}">
        <div class="mech-emblem" style="--accent:${mech.palette.glow};--secondary:${mech.palette.secondary}"><span></span></div>
        <div><strong>${mech.name}</strong><small>${mech.title}</small><p>${mech.description}</p></div>
        <div class="mech-stats"><span>耐久 ${mech.stats.maxHp}</span><span>机动 ${mech.stats.moveSpeed.toFixed(1)}</span><span>火力 ${mech.stats.primaryDamage}</span></div>
      </button>`).join('');
    this.showPanel(`
      <section class="base-screen">
        <header class="brand-block"><span class="eyebrow">MECHA MARCO · V4.0 CORE SLICE</span><h1>天穹断刃</h1><p>轨道墓场战役 / Hades 式房间选择与动作槽位构筑</p></header>
        <div class="dialogue-card"><div class="portrait-mark">M</div><div><strong>${dialogue.speaker}</strong><p>${dialogue.text}</p></div></div>
        <div class="base-meta"><span>出击 ${profile.runs}</span><span>通关 ${profile.victories}</span><span>舰队数据 ◆ ${profile.permanent}</span></div>
        <h2>选择机体</h2>
        <div class="mech-grid">${cards}</div>
        <button class="primary-cta" id="start-run">开始出击</button>
        <p class="control-note">iPhone 请横屏。左摇杆移动，右摇杆瞄准并自动射击；军刀、推进、导弹、超限为独立按钮。</p>
      </section>`, 'base-panel');
    this.panel.querySelectorAll('[data-mech]').forEach((button) => button.addEventListener('click', () => onSelect(button.dataset.mech)));
    this.panel.querySelector('#start-run').addEventListener('click', onStart);
  }

  showRoute(node, onChoose) {
    const cards = node.choices.map((choice, index) => {
      const info = describeRoomChoice(choice);
      return `<button class="route-card" data-index="${index}" style="--route:${info.color}"><span class="route-icon">${info.icon}</span><strong>${info.name}</strong><p>${info.detail}</p><small>进入前已知主要奖励</small></button>`;
    }).join('');
    this.showPanel(`<section class="choice-screen"><span class="eyebrow">ROUTE SELECT · DEPTH ${node.depth+1}</span><h2>选择下一航道</h2><div class="route-grid">${cards}</div></section>`, 'choice-panel');
    this.panel.querySelectorAll('[data-index]').forEach((button) => button.addEventListener('click', () => onChoose(Number(button.dataset.index))));
  }

  showReward(modules, rewardType, onChoose) {
    const reward = REWARD_TYPES[rewardType];
    const cards = modules.map((module, index) => `<button class="module-card ${module.rarity}" data-index="${index}"><span class="rarity">${module.rarity==='duo'?'组合协议':module.rarity==='rare'?'稀有协议':'标准协议'}</span><strong>${module.name}</strong><em>${module.slot}</em><p>${module.desc}</p><div class="tag-row">${(module.tags||module.requires||[]).map(t=>`<span>${t}</span>`).join('')}</div></button>`).join('');
    this.showPanel(`<section class="choice-screen"><span class="eyebrow" style="color:${reward?.color||'#fff'}">${reward?.icon||'◇'} ${reward?.name||'模块奖励'}</span><h2>选择一项战术协议</h2><div class="module-grid">${cards}</div></section>`, 'choice-panel');
    this.panel.querySelectorAll('[data-index]').forEach((button) => button.addEventListener('click', () => onChoose(Number(button.dataset.index))));
  }

  showShop(run, inventory, onBuy, onRepair, onLeave) {
    const items = inventory.map((m,i)=>`<button class="shop-item" data-buy="${i}" ${run.credits<35?'disabled':''}><strong>${m.name}</strong><p>${m.desc}</p><span>● 35</span></button>`).join('');
    this.showPanel(`<section class="choice-screen"><span class="eyebrow">SUPPLY SHIP</span><h2>军械补给舰</h2><p>战术核心 ● ${run.credits}</p><div class="shop-grid">${items}</div><div class="shop-actions"><button id="shop-repair" ${run.credits<25?'disabled':''}>维修 28% · ●25</button><button id="shop-leave" class="primary-cta">离开补给舰</button></div></section>`, 'choice-panel');
    this.panel.querySelectorAll('[data-buy]').forEach((button)=>button.addEventListener('click',()=>onBuy(Number(button.dataset.buy))));
    this.panel.querySelector('#shop-repair').addEventListener('click',onRepair);
    this.panel.querySelector('#shop-leave').addEventListener('click',onLeave);
  }

  showEvent(event, onChoose) {
    const choices=event.choices.map((c,i)=>`<button class="event-choice" data-index="${i}"><strong>${c.label}</strong><p>${c.result}</p></button>`).join('');
    this.showPanel(`<section class="choice-screen"><span class="eyebrow">UNKNOWN SIGNAL</span><h2>${event.name}</h2><p class="event-body">${event.body}</p><div class="event-grid">${choices}</div></section>`,'choice-panel');
    this.panel.querySelectorAll('[data-index]').forEach((button)=>button.addEventListener('click',()=>onChoose(Number(button.dataset.index))));
  }

  showResult(report, onReturn) {
    this.setCombatVisible(false);
    this.showPanel(`<section class="result-screen"><span class="eyebrow">SORTIE REPORT</span><h2>${report.victory?'战役完成':'机体回收'}</h2><div class="result-grid"><span>抵达深度<strong>${report.depth}</strong></span><span>击破<strong>${report.kills}</strong></span><span>房间<strong>${report.roomsCleared}</strong></span><span>舰队数据<strong>◆ ${report.permanentEarned}</strong></span></div><p>${report.victory?'守墓者防线已被突破。':'本次战斗标签已记录，基地对话与永久资源仍会推进。'}</p><button class="primary-cta" id="return-base">返回母舰</button></section>`,'result-panel');
    this.panel.querySelector('#return-base').addEventListener('click',onReturn);
  }

  showPause(onResume,onRetire){
    this.showPanel(`<section class="pause-screen"><span class="eyebrow">PAUSED</span><h2>战术暂停</h2><button class="primary-cta" id="resume">继续战斗</button><button class="danger-button" id="retire">结束本次出击</button></section>`,'pause-panel');
    this.panel.querySelector('#resume').addEventListener('click',onResume);
    this.panel.querySelector('#retire').addEventListener('click',onRetire);
  }

  updateHud(game) {
    const p=game.player;if(!p)return;
    this.hpFill.style.width=`${Math.max(0,p.hp/p.maxHp*100)}%`;
    this.hpText.textContent=`${Math.ceil(p.hp)} / ${p.maxHp}`;
    this.overdriveFill.style.width=`${p.overdrive/p.stats.overdriveNeed*100}%`;
    this.roomLabel.textContent=`DEPTH ${game.run.depth+1} · ${game.room?.name||'航行中'}`;
    this.creditsLabel.textContent=`● ${game.run.credits}　◆ ${game.run.permanentEarned}`;
    this.moduleStrip.innerHTML=game.run.modules.slice(-6).map(m=>`<span title="${m.name}">${m.name.slice(0,4)}</span>`).join('');
    const boss=game.enemies.find(e=>e.boss&&!e.dead);
    this.bossBar.classList.toggle('hidden',!boss);
    if(boss){this.bossFill.style.width=`${boss.hp/boss.maxHp*100}%`;this.bossName.textContent=`${boss.name} · PHASE ${boss.phase}`;}
    if(this.toastTimer>0){this.toastTimer-=1/60;if(this.toastTimer<=0)this.toast.classList.remove('show');}
  }

  notify(text, seconds=2.2){this.toast.textContent=text;this.toast.classList.add('show');this.toastTimer=seconds;}
}
