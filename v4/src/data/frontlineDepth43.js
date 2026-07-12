export const FRONTLINE_VERSION_43='4.3.0-frontline-depth';

export const FRAME_KITS_43={
  vanguard:[
    {id:'vanguard-standard',name:'断刃标准式',detail:'以光刃共振开局，射击与军刀互相强化。',cost:0,family:'aurora',starterModule:'duo_beam_saber',startTags:['beam','saber']},
    {id:'vanguard-lancer',name:'贯阵枪骑式',detail:'以相位穿透开局，主炮优先形成纵向击穿。',cost:8,family:'aurora',starterModule:'primary_pierce_1',startTags:['beam','pierce','dash']},
    {id:'vanguard-duelist',name:'近卫决斗式',detail:'以斩击偏转开局，贴身格挡换取反击窗口。',cost:8,family:'eclipse',starterModule:'secondary_guard_1',startTags:['saber','mark','guard']},
  ],
  bulwark:[
    {id:'bulwark-standard',name:'断岳标准式',detail:'以惯性稳定器开局，正面承压时不易失位。',cost:0,family:'bastion',starterModule:'defense_stagger_1',startTags:['armor','missile']},
    {id:'bulwark-siege',name:'攻城封锁式',detail:'以分裂弹仓开局，用集束爆炸控制区域。',cost:8,family:'bastion',starterModule:'ordnance_cluster_1',startTags:['missile','cluster','gravity']},
    {id:'bulwark-counter',name:'不落反击式',detail:'以绝对防线开局，军刀格挡可反射投射物。',cost:8,family:'bastion',starterModule:'duo_armor_guard',startTags:['armor','guard','impact']},
  ],
  starwing:[
    {id:'starwing-standard',name:'星翼标准式',detail:'以星翼齐射开局，浮游刃同步复制主射击。',cost:0,family:'eclipse',starterModule:'duo_drone_beam',startTags:['beam','drone']},
    {id:'starwing-swarm',name:'群星蜂群式',detail:'以多目标火控开局，挂载同步锁定三名敌人。',cost:8,family:'eclipse',starterModule:'ordnance_lock_1',startTags:['drone','lock','multishot']},
    {id:'starwing-phantom',name:'蚀影幻袭式',detail:'以残像诱导开局，推进后留下诱饵吸引火力。',cost:8,family:'eclipse',starterModule:'dash_afterimage_1',startTags:['dash','decoy','mark']},
  ],
};

export const DIRECTIVES_43=[
  {id:'rapid-reinforcement',name:'高速增援',detail:'每段第二批敌军提前抵达。',rewardMul:.2},
  {id:'no-field-repair',name:'禁止战后维修',detail:'普通清场修复失效。',rewardMul:.2},
  {id:'shield-network',name:'护盾网络',detail:'每批首个重装单位获得额外装甲。',rewardMul:.25},
  {id:'hazard-overload',name:'环境过载',detail:'环境危险频率提高。',rewardMul:.25},
  {id:'elite-command',name:'精英指挥链',detail:'第 8 与第 11 段增加指挥精英。',rewardMul:.3},
  {id:'core-frenzy',name:'核心狂暴',detail:'守墓者第三阶段攻击节奏加快。',rewardMul:.35},
];

export const ARCHIVE_NODES_43=[
  ['breach-left','从左翼撕开封锁'],['breach-right','从右翼撕开封锁'],['wreck-salvage','回收残骸雨带黑匣子'],
  ['array-spoof','欺骗身份识别阵列'],['supply-perfect','完整保护补给舰'],['memorial-sequence','恢复纪念舰列序列'],
  ['seal-overload','过载封印输能塔'],['inspector-captured','瘫痪并俘获监察官'],['archive-route','进入旧档案库'],
  ['outer-sabotage','关闭核心外环重炮'],['forecourt-command','击破前庭指挥链'],['warden-unsealed','在核心能力未关闭时获胜'],
].map(([id,name])=>({id,name}));

export const DEFAULT_KITS_43={vanguard:'vanguard-standard',bulwark:'bulwark-standard',starwing:'starwing-standard'};

export const getFrameKit43=(mechId,kitId)=>FRAME_KITS_43[mechId]?.find((kit)=>kit.id===kitId)||FRAME_KITS_43[mechId]?.[0];

export function directiveRewardMultiplier43(ids=[]){
  return 1+DIRECTIVES_43.filter((item)=>ids.includes(item.id)).reduce((sum,item)=>sum+item.rewardMul,0);
}
