export function applyCampaignUIPolish42(AppUI){
  if(AppUI.__campaignUIPolish42)return;
  AppUI.__campaignUIPolish42=true;
  const showResult=AppUI.prototype.showResult;
  AppUI.prototype.showResult=function showCleanCampaignResult42(...args){
    this.toastTimer=0;
    this.toast?.classList.remove('show');
    document.getElementById('campaign-comms42')?.classList.remove('show');
    document.getElementById('stage-banner42')?.classList.remove('show');
    document.getElementById('campaign-progress42')?.classList.remove('show');
    return showResult.apply(this,args);
  };
}
