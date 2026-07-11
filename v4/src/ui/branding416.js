export function applyBranding416(AppUI){
  if(AppUI.__branding416)return;
  AppUI.__branding416=true;
  const showBase=AppUI.prototype.showBase;
  AppUI.prototype.showBase=function showBaseBranding416(...args){
    showBase.apply(this,args);
    const eyebrow=this.panel.querySelector('.brand-block .eyebrow');
    const subtitle=this.panel.querySelector('.brand-block p');
    if(eyebrow)eyebrow.textContent='MECHA MARCO · V4.1.6 SYSTEMS DEPTH';
    if(subtitle)subtitle.textContent='俯视机甲肉鸽 / 动作形态改造 / 三系协议共振 / 可选机体涂装';
  };
}
