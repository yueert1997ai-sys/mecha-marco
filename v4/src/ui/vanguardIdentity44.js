import { VANGUARD_IDENTITY_RULES_44 } from '../combat/vanguardIdentity44.js';

const STYLE_ID='vanguard-identity44-style';

export function vanguardCounterHudState44(state={}){
  const blade=Math.max(0,Number(state.blade)||0),cost=VANGUARD_IDENTITY_RULES_44.counterCost;
  const ready=Boolean(state.counterReady&&blade>=cost);
  if(ready)return{ready,text:'反击射击 READY'};
  if(state.counterReady)return{ready,text:`反击锁定 · 刃势 ${Math.round(blade)}/${cost}`};
  if(state.deflectWindow)return{ready,text:'偏转窗口'};
  if(state.deflectStance)return{ready,text:'偏转姿态'};
  return{ready,text:'军刀轻触斩击 · 短蓄偏转'};
}

const css=`
.vanguard-identity44{position:fixed;z-index:16;right:calc(max(12px,var(--safe-right)) + 44px);top:calc(max(8px,var(--safe-top)) + 48px);width:min(210px,23vw);display:none;gap:5px;padding:8px 10px;border:1px solid rgba(222,169,76,.22);border-radius:11px;background:linear-gradient(180deg,rgba(13,10,25,.76),rgba(5,5,13,.88));box-shadow:0 10px 28px rgba(0,0,0,.28);backdrop-filter:blur(10px);pointer-events:none}
.vanguard-identity44.show{display:grid}.vanguard-identity44 header{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#9c91aa;font:700 8px/1 system-ui;letter-spacing:.12em}.vanguard-identity44 header strong{color:#d9b969;font-size:9px}.vanguard-blade44{height:4px;border-radius:99px;overflow:hidden;background:rgba(255,255,255,.07)}.vanguard-blade44 i{display:block;width:0;height:100%;background:linear-gradient(90deg,#6f597f,#d29a43,#ffe09a);box-shadow:0 0 10px rgba(255,196,91,.46);transition:width .08s linear}.vanguard-identity44.high .vanguard-blade44{box-shadow:0 0 0 1px rgba(255,199,93,.24),0 0 14px rgba(218,153,54,.18)}.vanguard-status44{min-height:11px;color:#8d8498;font:700 8px/1.2 system-ui;letter-spacing:.08em}.vanguard-identity44.counter .vanguard-status44{color:#ffd57a;text-shadow:0 0 10px rgba(255,182,64,.55)}
@media (orientation:landscape) and (max-width:900px){.vanguard-identity44{right:calc(max(8px,var(--safe-right)) + 42px);top:calc(max(5px,var(--safe-top)) + 42px);width:min(176px,21vw);padding:6px 8px}.vanguard-identity44 header{font-size:7px}.vanguard-identity44 header strong{font-size:8px}}
`;

export function applyVanguardIdentityUI44(AppUI){
  if(AppUI.__vanguardIdentityUI44)return;
  AppUI.__vanguardIdentityUI44=true;
  if(typeof document!=='undefined'&&!document.getElementById(STYLE_ID)){
    const style=document.createElement('style');style.id=STYLE_ID;style.textContent=css;document.head.append(style);
  }
  const updateHud=AppUI.prototype.updateHud;
  AppUI.prototype.updateHud=function updateVanguardIdentityHud44(game){
    updateHud.call(this,game);
    let hud=document.getElementById('vanguard-identity44');
    if(!hud){
      hud=document.createElement('section');hud.id='vanguard-identity44';hud.className='vanguard-identity44';hud.innerHTML='<header><span>VANGUARD / 刃势</span><strong>0</strong></header><div class="vanguard-blade44"><i></i></div><div class="vanguard-status44">军刀轻触斩击 · 短蓄偏转</div>';this.root.append(hud);
    }
    const active=game.state==='combat'&&game.room?.stage42?.index===3&&game.player?.mech?.id==='vanguard';
    hud.classList.toggle('show',active);
    if(!active)return;
    const state=game.vanguardIdentity44||{blade:0};
    hud.querySelector('header strong').textContent=String(Math.round(state.blade));
    hud.querySelector('.vanguard-blade44 i').style.width=`${Math.max(0,Math.min(100,state.blade))}%`;
    hud.classList.toggle('high',state.blade>=60);
    const counterHud=vanguardCounterHudState44(state);
    hud.classList.toggle('counter',counterHud.ready);
    const status=hud.querySelector('.vanguard-status44');
    status.textContent=counterHud.text;
  };
}
