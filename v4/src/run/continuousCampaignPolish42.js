export function applyContinuousCampaignPolish42(Game){
  if(Game.__continuousCampaignPolish42)return;
  Game.__continuousCampaignPolish42=true;
  const startStage=Game.prototype.startCampaignStage42;
  Game.prototype.startCampaignStage42=function startCampaignStagePolished42(index,first=false){
    const pendingElite=Boolean(this.run?.nextElite);
    const result=startStage.call(this,index,first);
    if(pendingElite&&!this.room?.boss){
      const elite=index%2===0?'eliteBlade':'eliteCannon';
      this.room.waves[0]=[elite,...this.room.waves[0]];
      this.room.stage42.waves=this.room.waves;
      this.room.elite=true;
      this.run.nextElite=false;
      this.ui.showComms42?.('战术官·洛岚','敌方强制协议引来了监察官增援。保持移动。',3.5,'ally');
    }
    if(index===3){
      setTimeout(()=>{
        if(this.run?.campaign42&&this.run.stageIndex===3)this.ui.showComms42?.('联合防卫军系统','识别对象：MA-00。身份状态：已处决。错误：对象仍在活动。',4.6,'enemy');
      },3300);
    }
    return result;
  };
}
