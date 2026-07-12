import { ARCHIVE_NODES_43, DIRECTIVES_43, FRAME_KITS_43, getFrameKit43 } from '../data/frontlineDepth43.js';
import { buyKit43, nextUnlock43, selectKit43, toggleDirective43 } from '../meta/frontlineProgress43.js';
import { saveProfile } from '../meta/profile.js';
import { buildDoctrineProfile416, DOCTRINES_416 } from '../run/doctrine416.js';
import { moduleGroup43 } from '../run/rewardResolver.js';

const escape=(value)=>String(value??'').replace(/[&<>"]/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

export function applyFrontlineUI43({AppUI,Game}){
  if(AppUI.__frontlineUI43)return;AppUI.__frontlineUI43=true;
  const showBase=AppUI.prototype.showBase;
  AppUI.prototype.showBase=function showDepthBase43(profile,mechs,dialogue,selectedMech,...rest){
    showBase.call(this,profile,mechs,dialogue,selectedMech,...rest);this.profile43=profile;
    const next=nextUnlock43(profile),kit=getFrameKit43(selectedMech,profile.selectedKits?.[selectedMech]);
    const unlockText=next.type==='kit'?`下一许可「${escape(next.name)}」还差 ◆${next.remaining}`:next.type==='directive'?`下一次通关许可「${escape(next.name)}」`:'当前军备许可已全部解锁';
    this.panel.querySelector('.campaign-brief42')?.insertAdjacentHTML('afterend',`<button id="open-armory43" class="frontline-order43"><span>FLEET ARMORY</span><strong>舰队整备 · ${escape(kit?.name)}</strong><small>${unlockText} · 作战指令 ${profile.selectedDirectives.length}/3</small><i></i></button>`);
  };

  AppUI.prototype.showArmory43=function showArmory43(profile,selectedMech,handlers){
    const kits=FRAME_KITS_43[selectedMech]||[],next=nextUnlock43(profile);
    const kitCards=kits.map((kit)=>{const unlocked=profile.unlockedKits.includes(kit.id),selected=profile.selectedKits[selectedMech]===kit.id;return `<button class="armory-kit43 ${selected?'selected':''}" data-kit43="${kit.id}" ${!unlocked&&profile.permanent<kit.cost?'disabled':''}><span>${selected?'当前套件':unlocked?'已获许可':`解锁 ◆${kit.cost}`}</span><strong>${escape(kit.name)}</strong><p>${escape(kit.detail)}</p><small>${kit.startTags.join(' · ')}</small></button>`}).join('');
    const directives=DIRECTIVES_43.map((item)=>{const unlocked=profile.unlockedDirectives.includes(item.id),selected=profile.selectedDirectives.includes(item.id);return `<button class="directive-card43 ${selected?'selected':''}" data-directive43="${item.id}" ${unlocked?'':'disabled'}><span>${selected?'已挂载':unlocked?'可用':'首通后依次解锁'}</span><strong>${escape(item.name)}</strong><p>${escape(item.detail)}</p><small>舰队数据收益 +${Math.round(item.rewardMul*100)}%</small></button>`}).join('');
    const archives=ARCHIVE_NODES_43.map((node,index)=>`<div class="archive-node43 ${profile.archiveNodes.includes(node.id)?'unlocked':''}"><i>${String(index+1).padStart(2,'0')}</i><span>${profile.archiveNodes.includes(node.id)?escape(node.name):'封存记录'}</span></div>`).join('');
    const armoryHint=next.type==='kit'?`距离 ${escape(next.name)} 还差 ◆${next.remaining}`:next.type==='directive'?`下一次通关解锁 ${escape(next.name)}`:'军备许可已齐备';
    this.showPanel(`<section class="armory-screen43"><header><div><span class="eyebrow">FLEET ARMORY · HORIZONTAL PROGRESSION</span><h2>舰队整备</h2><p>舰队数据只解锁战术侧向选择，不购买永久攻击与耐久。</p></div><button id="armory-back43">返回基地</button></header><div class="armory-balance43"><span>可用舰队数据</span><strong>◆ ${profile.permanent}</strong><small>${armoryHint}</small></div><h3>当前机体套件</h3><div class="armory-kits43">${kitCards}</div><h3>战区指令 <small>最多挂载 3 个</small></h3><div class="directive-grid43">${directives}</div><h3>MA-00 档案 <small>${profile.archiveNodes.length} / ${ARCHIVE_NODES_43.length}</small></h3><div class="archive-grid43">${archives}</div></section>`,'armory-panel43');
    this.panel.querySelector('#armory-back43')?.addEventListener('click',handlers.back);
    this.panel.querySelectorAll('[data-kit43]').forEach((button)=>button.addEventListener('click',()=>handlers.kit(button.dataset.kit43)));
    this.panel.querySelectorAll('[data-directive43]').forEach((button)=>button.addEventListener('click',()=>handlers.directive(button.dataset.directive43)));
  };

  AppUI.prototype.showModuleReplacement43=function showModuleReplacement43(run,module,onReplace,onCancel){
    const group=moduleGroup43(module),owned=run.modules.filter((item)=>moduleGroup43(item)===group);
    const cards=owned.map((item)=>`<button class="replace-module43" data-replace43="${item.id}"><span>替换并拆解为 ●15</span><strong>${escape(item.name)}</strong><p>${escape(item.desc)}</p></button>`).join('');
    this.showPanel(`<section class="replacement-screen43"><span class="eyebrow">LOADOUT CAPACITY</span><h2>${group==='core'?'核心槽已满':'标准模块槽已满'}</h2><p>安装「${escape(module.name)}」需要替换一个现有模块。容量限制让每次选择真正形成取舍。</p><div>${cards}</div><button id="cancel-replace43">保留当前构筑</button></section>`,'replacement-panel43');
    this.panel.querySelectorAll('[data-replace43]').forEach((button)=>button.addEventListener('click',()=>onReplace(button.dataset.replace43)));
    this.panel.querySelector('#cancel-replace43')?.addEventListener('click',onCancel);
  };

  const updateHud=AppUI.prototype.updateHud;
  AppUI.prototype.updateHud=function updateDepthHud43(game){
    updateHud.call(this,game);if(!game.run?.campaign42)return;
    const doctrine=buildDoctrineProfile416(game.run.modules||[]),count=doctrine.counts[doctrine.dominant]||0,next=doctrine.nextThreshold;
    this.creditsLabel.textContent=`● ${game.run.credits}　⬡ ${game.run.intel}　◆ ${game.run.permanentEarned}`;
    this.moduleStrip.title=`${DOCTRINES_416[doctrine.dominant].name} ${count}${next?` / ${next}`:' · 完全共鸣'}`;
    const objective=document.getElementById('campaign-objective42'),mission=game.run.mission43;
    if(objective&&mission&&!mission.complete){
      if(mission.type==='defense')objective.textContent=`${mission.label} · ${Math.ceil(mission.progress)}/${mission.max}s · ${Math.ceil(mission.hp)}耐久`;
      else if(mission.type==='capture')objective.textContent=`${mission.label} · ${Math.floor(mission.progress/mission.max*100)}%`;
      else if(mission.type==='pursuit')objective.textContent=mission.escaped?'目标已逃脱':`${mission.label} · 撤离倒计时 ${Math.max(0,Math.ceil(mission.escapeTime-mission.progress))}s`;
      else objective.textContent=mission.label||objective.textContent;
    }
  };

  const showResult=AppUI.prototype.showResult;
  AppUI.prototype.showResult=function showDepthResult43(report,onReturn){
    showResult.call(this,report,onReturn);const result=this.panel.querySelector('.result-screen');if(!result)return;
    result.querySelector('.anomaly-report42')?.insertAdjacentHTML('beforebegin',`<section class="depth-report43"><div><span>战术机会</span><strong>${report.optionalObjectives?.length||0}</strong></div><div><span>回收情报</span><strong>⬡ ${report.intel||0}</strong></div><div><span>套件熟练</span><strong>+${Math.max(1,report.stageReached||report.depth||1)}</strong></div><div><span>战区指令</span><strong>${report.directives?.length||0} 项</strong></div></section>`);
  };

  const gameShowBase=Game.prototype.showBase;
  Game.prototype.showBase=function showDepthBaseBindings43(){const result=gameShowBase.call(this);this.ui.panel.querySelector('#open-armory43')?.addEventListener('click',()=>this.openArmory43());return result};
  Game.prototype.openArmory43=function openArmory43(){
    this.state='armory';this.input.setEnabled(false);this.ui.setCombatVisible(false);
    const render=()=>this.ui.showArmory43(this.profile,this.selectedMech,{back:()=>this.showBase(),kit:(kitId)=>{if(this.profile.unlockedKits.includes(kitId))this.profile=selectKit43(this.profile,this.selectedMech,kitId);else{const bought=buyKit43(this.profile,kitId);this.profile=bought.profile;if(bought.ok)this.profile=selectKit43(this.profile,this.selectedMech,kitId)}saveProfile(this.profile);render()},directive:(id)=>{this.profile=toggleDirective43(this.profile,id);saveProfile(this.profile);render()}});
    render();
  };
}
