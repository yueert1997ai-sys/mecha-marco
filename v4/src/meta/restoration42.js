export function calculateRestorationEarned42(run={},victory=false){
  let score=0;
  if(run.deathCause)score+=2;
  score+=Math.min(4,run.highRiskChoices||0)*2;
  score+=Math.min(3,run.recognitionCount||0)*3;
  if(run.lowHpClear)score+=2;
  if((run.secondaryKills||0)>=10)score+=1;
  if(run.reachedBoss)score+=4;
  if(victory)score+=10;
  score+=Math.min(3,(run.archiveFragments||[]).length)*3;
  return score;
}

export function restorationStage42(score=0){
  if(score>=80)return 4;
  if(score>=55)return 3;
  if(score>=35)return 2;
  if(score>=15)return 1;
  return 0;
}

export function identityMatch42(profile={},earned=0){
  return Math.min(99.8,8.4+(profile.restorationScore||0)*.72+earned*.84);
}

export function commandAuthority42(profile={},victory=false){
  const base=profile.commandAuthority||0;
  return Math.min(5,Math.max(base,victory?1:0,restorationStage42(profile.restorationScore||0)-1));
}
