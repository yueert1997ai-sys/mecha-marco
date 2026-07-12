import { REWARD_TYPES } from '../data/encounters.js';
import { CAMPAIGN_LENGTH_42 } from '../data/regionOrbitalGraveyard42.js';
import { restorationStage42 } from '../meta/restoration42.js';

const ensurePersistent=(ui)=>{
  let comms=document.getElementById('campaign-comms42');
  if(!comms){
    comms=document.createElement('section');
    comms.id='campaign-comms42';
    comms.className='campaign-comms42';
    ui.root.append(comms);
  }
  let progress=document.getElementById('campaign-progress42');
  if(!progress){
    progress=document.createElement('div');
    progress.id='campaign-progress42';
    progress.className='campaign-progress42';
    progress.innerHTML=`<span class="campaign-sector42">轨道墓场</span><div class="campaign-dots42">${Array.from({length:CAMPAIGN_LENGTH_42},(_,index)=>`<i data-stage42="${index}"></i>`).join('')}</div><small id="campaign-objective42">持续推进</small>`;
    ui.hud.querySelector('.hud-top-center')?.append(progress);
  }
  let banner=document.getElementById('stage-banner42');
  if(!banner){
    banner=document.createElement('section');
    banner.id='stage-banner42';
    banner.className='stage-banner42';
    ui.root.append(banner);
  }
  return{comms,progress,banner};
};

const archiveMarkup=(mech,profile)=>{
  const score=profile.restorationScore||0;
  const sealed=score>=12||profile.victories>0;
  return `<div class="mech-archive42"><span>公开档案</span><p>${mech.publicArchive||mech.description}</p><span class="sealed42">${sealed?'封存档案':'封存档案 · 未解锁'}</span><p class="sealed-copy42 ${sealed?'unlocked':''}">${sealed?(mech.sealedArchive||'档案仍在恢复。'):'需要更多旧档案匹配率。'}</p></div>`;
};

export function applyCampaignUI42(AppUI){
  if(AppUI.__campaignUI42)return;
  AppUI.__campaignUI42=true;

  AppUI.prototype.showComms42=function showComms42(speaker,text,seconds=3.4,tone='ally'){
    const{comms}=ensurePersistent(this);
    clearTimeout(this._commsTimer42);
    comms.dataset.tone=tone;
    comms.innerHTML=`<span>${speaker}</span><p>${text}</p>`;
    comms.classList.add('show');
    this._commsTimer42=setTimeout(()=>comms.classList.remove('show'),Math.max(1.2,seconds)*1000);
  };

  AppUI.prototype.showStageBanner42=function showStageBanner42(stage){
    const{banner}=ensurePersistent(this);
    clearTimeout(this._stageBannerTimer42);
    banner.innerHTML=`<span>${stage.code}</span><strong>${stage.name}</strong><small>${stage.objective}</small>`;
    banner.classList.add('show');
    this._stageBannerTimer42=setTimeout(()=>banner.classList.remove('show'),2200);
  };

  AppUI.prototype.showFieldReward42=function showFieldReward42(modules,rewardType,onChoose){
    const reward=REWARD_TYPES[rewardType]||{name:'战术协议',icon:'◇',color:'#9eb7c7'};
    const cards=modules.map((module,index)=>`<button class="field-reward-card42 ${module.rarity}" data-field-reward42="${index}"><span>${module.rarity==='transform'?'核心改造':module.rarity==='duo'?'组合协议':module.rarity==='rare'?'稀有协议':module.slot}</span><strong>${module.name}</strong><p>${module.desc}</p></button>`).join('');
    this.showPanel(`<section class="field-reward42"><header><span class="eyebrow" style="color:${reward.color}">${reward.icon} ${reward.name}</span><h2>战场回收</h2><p>机体保持在当前航段，选择后闸门立即开启。</p></header><div>${cards}</div></section>`,'campaign-overlay42 field-reward-panel42');
    this.panel.querySelectorAll('[data-field-reward42]').forEach((button)=>button.addEventListener('click',()=>onChoose(Number(button.dataset.fieldReward42))));
  };

  AppUI.prototype.showCampaignBranch42=function showCampaignBranch42(stage,branches,onChoose){
    const cards=branches.map((branch,index)=>`<button class="campaign-branch-card42" data-branch42="${index}" style="--branch42:${branch.color}"><span>${branch.highRisk?'高风险航线':'稳定航线'}</span><strong>${branch.label}</strong><p>${branch.detail}</p></button>`).join('');
    this.showPanel(`<section class="campaign-branch42"><span class="eyebrow">PHYSICAL ROUTE · ${stage.code}</span><h2>前方航道分离</h2><p>这里只在关键节点中断一次，之后继续驾驶机体推进。</p><div>${cards}</div></section>`,'campaign-overlay42 campaign-branch-panel42');
    this.panel.querySelectorAll('[data-branch42]').forEach((button)=>button.addEventListener('click',()=>onChoose(Number(button.dataset.branch42))));
  };

  AppUI.prototype.showCampaignEvent42=function showCampaignEvent42(event,onChoose){
    const choices=event.choices.map((choice,index)=>`<button class="campaign-event-choice42" data-event42="${index}"><strong>${choice.label}</strong><p>${choice.result}</p></button>`).join('');
    this.showPanel(`<section class="campaign-event42"><span class="eyebrow">BATTLEFIELD SIGNAL</span><h2>${event.name}</h2><p class="campaign-event-body42">${event.body}</p><div>${choices}</div></section>`,'campaign-overlay42 campaign-event-panel42');
    this.panel.querySelectorAll('[data-event42]').forEach((button)=>button.addEventListener('click',()=>onChoose(Number(button.dataset.event42))));
  };

  const base=AppUI.prototype.showBase;
  AppUI.prototype.showBase=function showBaseCampaign42(profile,mechs,dialogue,selectedMech,...rest){
    base.call(this,profile,mechs,dialogue,selectedMech,...rest);
    const brand=this.panel.querySelector('.brand-block');
    const eyebrow=brand?.querySelector('.eyebrow');
    if(eyebrow)eyebrow.textContent='MECHA MARCO · V4.3.1 CONSEQUENCE FRONTLINE';
    const subtitle=brand?.querySelector('p');
    if(subtitle)subtitle.textContent='轨道墓场十二段战术行动 / 路线后果将进入核心决战';
    const meta=this.panel.querySelector('.base-meta');
    meta?.insertAdjacentHTML('afterend',`<section class="campaign-brief42"><div><span>当前作战目标</span><strong>轨道墓场 · 12 段连续推进</strong><p>只有关键改装点、补给与路线分岔会暂停战斗。普通航段清场后直接穿过闸门进入下一关。</p></div><div><span>人格修复</span><strong>阶段 ${restorationStage42(profile.restorationScore||0)} / 4</strong><p>旧档案匹配 ${Math.min(99,8+(profile.restorationScore||0))}% · 指挥权限 ${profile.commandAuthority||0}</p></div></section>`);
    this.panel.querySelectorAll('[data-mech]').forEach((card)=>{
      const mech=mechs[card.dataset.mech];
      card.querySelector('.mech-archive42')?.remove();
      card.insertAdjacentHTML('beforeend',archiveMarkup(mech,profile));
    });
  };

  const updateHud=AppUI.prototype.updateHud;
  AppUI.prototype.updateHud=function updateHudCampaign42(game){
    updateHud.call(this,game);
    const{progress}=ensurePersistent(this);
    const active=Boolean(game.run?.campaign42);
    progress.classList.toggle('show',active);
    if(!active)return;
    const index=game.run.stageIndex||0;
    const stage=game.room?.stage42;
    for(const dot of progress.querySelectorAll('[data-stage42]')){
      const value=Number(dot.dataset.stage42);
      dot.classList.toggle('done',value<index);
      dot.classList.toggle('active',value===index);
      dot.classList.toggle('boss',value===CAMPAIGN_LENGTH_42-1);
    }
    progress.querySelector('.campaign-sector42').textContent=`${String(index+1).padStart(2,'0')} / ${CAMPAIGN_LENGTH_42} · ${stage?.name||'轨道墓场'}`;
    const objective=progress.querySelector('#campaign-objective42');
    const facilityLeft=(game.facilities42||[]).filter((item)=>!item.dead).length;
    if(objective)objective.textContent=game.run.exitOpen?'闸门开放 · 向北持续推进':facilityLeft?`${stage?.spatial?.mission?.label||'战术设施'} · 剩余 ${facilityLeft}`:stage?.objective||'清除封锁';
    this.roomLabel.textContent=`${stage?.code||`STAGE ${index+1}`} · ${stage?.name||game.room?.name||'推进中'}`;
  };

  const showResult=AppUI.prototype.showResult;
  AppUI.prototype.showResult=function showResultCampaign42(report,onReturn){
    showResult.call(this,report,onReturn);
    const result=this.panel.querySelector('.result-screen');
    if(!result)return;
    const copy=result.querySelector('p');
    if(copy)copy.textContent=report.victory?'守墓者防线已经被摧毁。敌方在最后时刻确认：他们不是第一次面对你。':'驾驶数据已回收。母舰正在使用旧时代人格档案修复缺失部分。';
    result.querySelector('.result-grid')?.insertAdjacentHTML('afterend',`<section class="anomaly-report42"><span>异常战役字段</span><div><label>驾驶员</label><strong>WENHAO MA</strong></div><div><label>旧档案对象</label><strong>MA-00</strong></div><div><label>人格匹配率</label><strong>${Number(report.identityMatch||8.4).toFixed(1)}%</strong></div><div><label>指挥级权限</label><strong>${report.commandAuthority||0} / 5 · ${report.victory?'恢复中':'未确认'}</strong></div></section>`);
  };
}
