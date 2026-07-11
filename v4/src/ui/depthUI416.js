import { saveProfile } from '../meta/profile.js';
import { getPaintVariants416, getPaintVariant416, DEFAULT_MECH_PAINTS_416 } from '../data/paintVariants416.js';
import { getModuleDoctrine416, buildDoctrineProfile416 } from '../run/doctrine416.js';
import { REWARD_TYPES } from '../data/encounters.js';
import { getModuleVisualHint } from '../meta/loadoutProfile.js';
import { length, normalize } from '../core/math.js';

const DEFAULT_TUNING_416={aimSensitivity:1,moveSensitivity:1,aimDeadZone:.065,vibration:true};
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const rarityLabel=(module)=>module.rarity==='transform'?'核心改造':module.rarity==='duo'?'组合协议':module.rarity==='rare'?'稀有协议':'标准协议';
const renderRange=(id,label,value,min,max,step,suffix='')=>`<label class="setting-row416" for="${id}"><span><strong>${label}</strong><small>${suffix}</small></span><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"><b data-value-for="${id}">${Number(value).toFixed(2)}</b></label>`;

function normalizeSettings(settings={}){
  return {
    ...settings,
    aimSensitivity:clamp(Number(settings.aimSensitivity??DEFAULT_TUNING_416.aimSensitivity),.6,1.8),
    moveSensitivity:clamp(Number(settings.moveSensitivity??DEFAULT_TUNING_416.moveSensitivity),.75,1.35),
    aimDeadZone:clamp(Number(settings.aimDeadZone??DEFAULT_TUNING_416.aimDeadZone),.02,.16),
    vibration:settings.vibration!==false,
  };
}

function renderPaintSelector(profile,mechId){
  const selected=profile.mechPaints?.[mechId]||DEFAULT_MECH_PAINTS_416[mechId];
  const buttons=getPaintVariants416(mechId).map((paint)=>`<button class="paint-swatch416 ${paint.id===selected?'selected':''}" data-paint416="${paint.id}" title="${paint.name}" style="--p1:${paint.palette.primary};--p2:${paint.palette.secondary};--p3:${paint.palette.accent};--pg:${paint.palette.glow}"><i></i><span>${paint.name}</span></button>`).join('');
  return `<section class="paint-selector416"><div><span class="eyebrow">FRAME LIVERY</span><strong>机体涂装</strong><small>颜色会同步到战斗模型、枪口、刃光与推进特效</small></div><div class="paint-swatches416">${buttons}</div></section>`;
}

function attachBaseControls(game){
  const panel=game.ui.panel;
  const screen=panel.querySelector('.base-screen');
  if(!screen)return;
  const mechId=game.selectedMech;
  const start=panel.querySelector('#start-run');
  start?.insertAdjacentHTML('beforebegin',renderPaintSelector(game.profile,mechId));
  start?.insertAdjacentHTML('afterend','<button class="settings-launch416" id="open-settings416">设置 / 灵敏度</button>');

  for(const card of panel.querySelectorAll('[data-mech]')){
    const paintId=game.profile.mechPaints?.[card.dataset.mech]||DEFAULT_MECH_PAINTS_416[card.dataset.mech];
    const paint=getPaintVariant416(card.dataset.mech,paintId);
    const emblem=card.querySelector('.mech-emblem');
    emblem?.style.setProperty('--accent',paint.palette.glow);
    emblem?.style.setProperty('--secondary',paint.palette.secondary);
  }

  panel.querySelector('#open-settings416')?.addEventListener('click',()=>game.openSettings416('base'));
  panel.querySelectorAll('[data-paint416]').forEach((button)=>button.addEventListener('click',()=>{
    game.profile.mechPaints={...DEFAULT_MECH_PAINTS_416,...(game.profile.mechPaints||{}),[mechId]:button.dataset.paint416};
    saveProfile(game.profile);
    game.audio.play('select');
    game.showBase();
  }));
}

function attachPauseSettings(game){
  const panel=game.ui.panel;
  const retire=panel.querySelector('#retire');
  if(!retire||panel.querySelector('#open-settings416'))return;
  retire.insertAdjacentHTML('beforebegin','<button class="settings-launch416" id="open-settings416">设置 / 灵敏度</button>');
  panel.querySelector('#open-settings416')?.addEventListener('click',()=>game.openSettings416('paused'));
}

export function applyDepthUI416({AppUI,Game,InputRouter,PlayerMech}){
  if(AppUI.__depthUI416)return;
  AppUI.__depthUI416=true;

  InputRouter.prototype.setTuning416=function setTuning416(settings){
    this.tuning416=normalizeSettings(settings);
  };
  InputRouter.prototype.bindStick=function bindTunedStick416(element,kind){
    const knob=element.querySelector('.stick-knob');
    const state={pointerId:null,center:{x:0,y:0},value:{x:0,y:0}};
    const curve=(value,deadZone,exponent,sensitivity)=>{
      const magnitude=Math.min(1,length(value));
      if(magnitude<=deadZone)return{x:0,y:0};
      const direction=normalize(value);
      const normalized=(magnitude-deadZone)/Math.max(.001,1-deadZone);
      const curved=Math.min(1,Math.pow(normalized,exponent)*sensitivity);
      return{x:direction.x*curved,y:direction.y*curved};
    };
    const update=(event)=>{
      const rect=element.getBoundingClientRect();
      state.center={x:rect.left+rect.width/2,y:rect.top+rect.height/2};
      const dx=event.clientX-state.center.x,dy=event.clientY-state.center.y;
      const max=Math.max(30,rect.width*.4),magnitude=Math.hypot(dx,dy)||1,visualScale=Math.min(1,max/magnitude);
      knob.style.transform=`translate(${dx*visualScale}px,${dy*visualScale}px)`;
      const raw={x:clamp(dx/max,-1,1),y:clamp(dy/max,-1,1)};
      state.value=length(raw)>1?normalize(raw):raw;
      const tuning=this.tuning416||DEFAULT_TUNING_416;
      const output=kind==='move'
        ?curve(state.value,.1,1.08,tuning.moveSensitivity||1)
        :curve(state.value,tuning.aimDeadZone??.065,1.02,tuning.aimSensitivity||1);
      if(kind==='move')this.move=output;
      else{if(length(output)>.02)this.aim=output;this.setHeld('primary',length(output)>.18,true)}
    };
    element.addEventListener('pointerdown',(event)=>{if(!this.enabled||state.pointerId!==null)return;state.pointerId=event.pointerId;element.setPointerCapture(event.pointerId);update(event);event.preventDefault()},{passive:false});
    element.addEventListener('pointermove',(event)=>{if(event.pointerId!==state.pointerId)return;update(event);event.preventDefault()},{passive:false});
    const end=(event)=>{if(event.pointerId!==state.pointerId)return;state.pointerId=null;state.value={x:0,y:0};knob.style.transform='translate(0,0)';if(kind==='move')this.move={x:0,y:0};else this.setHeld('primary',false);event.preventDefault()};
    element.addEventListener('pointerup',end,{passive:false});
    element.addEventListener('pointercancel',end,{passive:false});
    this.touch[kind]=state;
  };
  const snapshot=InputRouter.prototype.snapshot;
  InputRouter.prototype.snapshot=function snapshot416(){
    const out=snapshot.call(this);
    const tuning=this.tuning416||DEFAULT_TUNING_416;
    out.aimSensitivity=tuning.aimSensitivity||1;
    out.moveSensitivity=tuning.moveSensitivity||1;
    out.aimDeadZone=tuning.aimDeadZone??.065;
    return out;
  };

  const updateMech=PlayerMech.prototype.update;
  PlayerMech.prototype.update=function updateWithSensitivity416(dt,input,world){
    const originalTurn=this.stats.turnSpeed;
    this.stats.turnSpeed=originalTurn*(input.aimSensitivity||1);
    try{return updateMech.call(this,dt,input,world)}finally{this.stats.turnSpeed=originalTurn}
  };

  AppUI.prototype.showSettings416=function showSettings416(settings,onChange,onBack){
    const current=normalizeSettings(settings);
    this.showPanel(`<section class="settings-screen416"><div class="settings-head416"><div><span class="eyebrow">CONTROL CALIBRATION</span><h2>操作设置</h2><p>数值会立即写入触控摇杆，不需要重新开始出击。</p></div><button id="settings-back416">返回</button></div><div class="settings-grid416">${renderRange('aim-sensitivity416','瞄准灵敏度',current.aimSensitivity,.6,1.8,.05,'控制机体跟随右摇杆转向的速度')}${renderRange('move-sensitivity416','移动响应',current.moveSensitivity,.75,1.35,.05,'控制左摇杆达到满速所需的推杆距离')}${renderRange('aim-deadzone416','瞄准死区',current.aimDeadZone,.02,.16,.005,'数值越低，轻微推杆越容易触发瞄准')}<label class="setting-toggle416"><span><strong>震动反馈</strong><small>受到攻击、推进和超限时触发</small></span><input id="vibration416" type="checkbox" ${current.vibration?'checked':''}><i></i></label></div><div class="settings-preset416"><button data-preset416="precision">精准</button><button data-preset416="balanced" class="selected">均衡</button><button data-preset416="fast">快速</button></div></section>`,'settings-panel416');

    const collect=()=>normalizeSettings({...current,
      aimSensitivity:Number(this.panel.querySelector('#aim-sensitivity416')?.value||1),
      moveSensitivity:Number(this.panel.querySelector('#move-sensitivity416')?.value||1),
      aimDeadZone:Number(this.panel.querySelector('#aim-deadzone416')?.value||.065),
      vibration:Boolean(this.panel.querySelector('#vibration416')?.checked),
    });
    const refreshValues=()=>{
      for(const input of this.panel.querySelectorAll('input[type="range"]')){
        const label=this.panel.querySelector(`[data-value-for="${input.id}"]`);
        if(label)label.textContent=Number(input.value).toFixed(input.id==='aim-deadzone416'?3:2);
      }
    };
    const emit=()=>{refreshValues();onChange(collect())};
    this.panel.querySelectorAll('input').forEach((input)=>input.addEventListener('input',emit));
    this.panel.querySelector('#settings-back416')?.addEventListener('click',onBack);
    const presets={precision:{aimSensitivity:.82,moveSensitivity:.92,aimDeadZone:.085},balanced:{aimSensitivity:1,moveSensitivity:1,aimDeadZone:.065},fast:{aimSensitivity:1.35,moveSensitivity:1.16,aimDeadZone:.04}};
    this.panel.querySelectorAll('[data-preset416]').forEach((button)=>button.addEventListener('click',()=>{
      const preset=presets[button.dataset.preset416];
      this.panel.querySelector('#aim-sensitivity416').value=String(preset.aimSensitivity);
      this.panel.querySelector('#move-sensitivity416').value=String(preset.moveSensitivity);
      this.panel.querySelector('#aim-deadzone416').value=String(preset.aimDeadZone);
      this.panel.querySelectorAll('[data-preset416]').forEach((item)=>item.classList.toggle('selected',item===button));
      emit();
    }));
    refreshValues();
  };

  const reward=AppUI.prototype.showReward;
  AppUI.prototype.showReward=function showReward416(modules,rewardType,onChoose){
    if(rewardType!=='transform'){
      reward.call(this,modules,rewardType,onChoose);
      for(const card of this.panel.querySelectorAll('[data-index]')){
        const module=modules[Number(card.dataset.index)];
        const doctrine=getModuleDoctrine416(module);
        card.dataset.doctrine=doctrine.id;
        card.insertAdjacentHTML('afterbegin',`<span class="doctrine-badge416" style="--doctrine:${doctrine.color}">${doctrine.short}</span>`);
      }
      return;
    }
    const info=REWARD_TYPES.transform;
    const cards=modules.map((module,index)=>{
      const doctrine=getModuleDoctrine416(module);
      return `<button class="module-card transform" data-index="${index}" data-doctrine="${doctrine.id}"><span class="doctrine-badge416" style="--doctrine:${doctrine.color}">${doctrine.short}</span><span class="rarity">${rarityLabel(module)}</span><strong>${module.name}</strong><em>${module.slot}</em><p>${module.desc}</p><small class="module-visual-hint">${getModuleVisualHint(module)}</small><div class="transform-note416">会改变动作形态，而非单纯提高数值</div></button>`;
    }).join('');
    this.showPanel(`<section class="choice-screen transform-screen416"><span class="eyebrow" style="color:${info.color}">${info.icon} ${info.name}</span><h2>选择一次机体动作改造</h2><p class="choice-subtitle">类似武器形态改造：改变射击、军刀、推进或挂载的实际工作方式。</p><div class="module-grid">${cards}</div></section>`,'choice-panel transform-panel416');
    this.panel.querySelectorAll('[data-index]').forEach((button)=>button.addEventListener('click',()=>onChoose(Number(button.dataset.index))));
  };

  const showShop=AppUI.prototype.showShop;
  AppUI.prototype.showShop=function showShop416(...args){
    showShop.apply(this,args);
    const run=args[0];
    const coreCount=(run?.modules||[]).filter((module)=>module.slot==='Core').length;
    const slots=this.panel.querySelector('.loadout-chip-row.compact');
    if(slots)slots.insertAdjacentHTML('beforeend',`<span class="core-count416">核心改造 ${coreCount}</span>`);
  };

  const updateHud=AppUI.prototype.updateHud;
  AppUI.prototype.updateHud=function updateHud416(game){
    updateHud.call(this,game);
    const doctrine=buildDoctrineProfile416(game.run?.modules||[]);
    this.hud.dataset.doctrine=doctrine.dominant;
    this.moduleStrip.title=`当前主导协议：${doctrine.dominantDoctrine.name}`;
  };

  const showBase=Game.prototype.showBase;
  Game.prototype.showBase=function showBase416(){
    this.input.setTuning416(this.profile.settings);
    const result=showBase.call(this);
    attachBaseControls(this);
    return result;
  };

  const startRun=Game.prototype.startRun;
  Game.prototype.startRun=function startRunPaint416(){
    const result=startRun.call(this);
    const paintId=this.profile.mechPaints?.[this.selectedMech]||DEFAULT_MECH_PAINTS_416[this.selectedMech];
    const paint=getPaintVariant416(this.selectedMech,paintId);
    if(this.player)this.player.mech={...this.player.mech,paintId:paint.id,palette:{...paint.palette}};
    return result;
  };

  const pause=Game.prototype.pause;
  Game.prototype.pause=function pause416(){
    const result=pause.call(this);
    if(this.state==='paused')attachPauseSettings(this);
    return result;
  };

  Game.prototype.openSettings416=function openSettings416(returnMode='base'){
    this.input.setEnabled(false);
    this.ui.setCombatVisible(false);
    this.ui.showSettings416(this.profile.settings,(settings)=>{
      this.profile.settings={...this.profile.settings,...settings};
      this.vibrate=settings.vibration;
      this.input.setTuning416(settings);
      saveProfile(this.profile);
    },()=>{
      if(returnMode==='paused'){
        this.ui.showPause(()=>this.resume(),()=>this.finishRun(false));
        attachPauseSettings(this);
      }else this.showBase();
    });
  };
}
