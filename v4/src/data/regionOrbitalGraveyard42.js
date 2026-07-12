export const CAMPAIGN_STAGE_SPACING_42 = 14;

const stage=(index,data)=>({
  index,
  code:`OG-${String(index+1).padStart(2,'0')}`,
  centerY:-index*CAMPAIGN_STAGE_SPACING_42,
  ...data,
});

export const ORBITAL_GRAVEYARD_STAGES_42 = [
  stage(0,{id:'blockade-lane',name:'封锁航道',layout:'gate',landmark:'barricade',objective:'撕开外层炮塔封锁',reward:'weapon',theme:{top:'#182739',bottom:'#0b1422',line:'#71869a',accent:'#b36a69'},waves:[['grunt','grunt','drone'],['grunt','striker','drone','drone']],intro:{speaker:'舰长·零',text:'外层封锁就在前方。文浩马，撕开它。'},clear:'外层炮塔失去响应。航道开放。'}),
  stage(1,{id:'debris-rain',name:'残骸雨带',layout:'islands',landmark:'wrecks',objective:'穿过坠落舰骸与交叉火力',reward:'mobility',hazard:'debris',theme:{top:'#24303a',bottom:'#101720',line:'#82909b',accent:'#8ba4b0'},waves:[['drone','drone','grunt'],['sniper','grunt','striker','drone']],intro:{speaker:'战术官·洛岚',text:'残骸轨迹不稳定。不要停在同一条轴线上。'},enemyComms:'目标动作与旧档案重合。请求重新识别。'}),
  stage(2,{id:'broken-dock',name:'断裂船坞',layout:'pillars',landmark:'dock',objective:'夺取船坞主闸控制权',reward:'credits',theme:{top:'#1e3438',bottom:'#0d1b20',line:'#6d9b9b',accent:'#b9825d'},waves:[['striker','striker','grunt'],['shield','grunt','artillery']],intro:{speaker:'舰长·零',text:'船坞之后有两条旧航线。清场后再决定。'},branches:[
    {id:'arsenal',label:'军械库航线',detail:'敌人更多，下一段保证重火力协议。',highRisk:true,color:'#b78968'},
    {id:'data',label:'数据侧路',detail:'扫描强度更高，获得旧档案碎片。',highRisk:false,color:'#7698a8'},
  ]}),
  stage(3,{id:'identity-array',name:'身份识别阵列',layout:'lane',landmark:'scanner',objective:'摧毁三座识别节点',reward:'ordnance',hazard:'scan',theme:{top:'#d4dde0',bottom:'#52636b',line:'#dcecf0',accent:'#8ea9b5'},waves:[['sniper','grunt','grunt'],['artillery','shield','drone']],intro:{speaker:'战术官·洛岚',text:'识别阵列正在读取你的神经特征。'},enemyComms:'识别对象：MA-00。身份状态：已处决。'}),
  stage(4,{id:'repair-scaffold',name:'封锁维修栈桥',layout:'open',landmark:'scaffold',objective:'守住接驳口直到补给舰靠拢',reward:'repair',theme:{top:'#293036',bottom:'#11171d',line:'#8c969b',accent:'#b49469'},waves:[['grunt','drone','drone'],['striker','shield','grunt']],intro:{speaker:'整备长·伊芙',text:'我会接管栈桥。你负责让周围安静。'},post:'shop'}),
  stage(5,{id:'hero-memorial',name:'英雄纪念舰列',layout:'ring',landmark:'memorial',objective:'穿过被封存的旧舰队阵列',reward:'transform',theme:{top:'#d7d9d5',bottom:'#565b62',line:'#e6dfc8',accent:'#c1a970'},waves:[['grunt','shield','drone'],['sniper','striker','striker']],intro:{speaker:'整备长·伊芙',text:'别看那些碑文。至少现在别看。'},enemyComms:'致终结七年战争的无名王牌。'}),
  stage(6,{id:'seal-power-belt',name:'封印输能带',layout:'ring',landmark:'seal',objective:'摧毁三座封印供能塔',reward:'overdrive',hazard:'seal',theme:{top:'#2c171d',bottom:'#0d080b',line:'#81505a',accent:'#b96373'},waves:[['artillery','shield','grunt'],['artillery','striker','drone','drone']],intro:{speaker:'舰长·零',text:'这些能源塔只是军用设施。摧毁它们。'},enemyComms:'封印维持率下降。重复，封印对象正在接近。'}),
  stage(7,{id:'inspector-hunt',name:'监察官追猎',layout:'lane',landmark:'pursuit',objective:'追上并击破撤退中的监察官',reward:'defense',theme:{top:'#2a2438',bottom:'#0e0b16',line:'#877aa0',accent:'#a27c9c'},waves:[['eliteCannon','grunt','drone'],['eliteBlade','striker']],intro:{speaker:'战术官·洛岚',text:'目标正在撤退。它似乎不是在逃离你，而是在确认你。'},post:'surrender'}),
  stage(8,{id:'tomb-fork',name:'墓碑岔道',layout:'islands',landmark:'tombs',objective:'突破墓碑群中的伏击',reward:'permanent',theme:{top:'#1c2433',bottom:'#070b12',line:'#68778e',accent:'#8e829e'},waves:[['sniper','drone','drone'],['shield','striker','artillery']],intro:{speaker:'舰长·零',text:'走维护线。旧档案库不在任务范围内。'},branches:[
    {id:'maintenance',label:'维护线',detail:'敌军较少，并恢复部分耐久。',highRisk:false,color:'#758b91'},
    {id:'archive',label:'旧档案库',detail:'高风险精英增援，恢复一段 MA-00 档案。',highRisk:true,color:'#9885a9'},
  ]}),
  stage(9,{id:'core-outer-ring',name:'核心外环',layout:'gate',landmark:'core-ring',objective:'摧毁移动闸门与核心外环防线',reward:'transform',hazard:'artillery',theme:{top:'#28161c',bottom:'#080609',line:'#76505a',accent:'#b44b5e'},waves:[['shield','shield','artillery'],['eliteCannon','grunt','drone','drone']],intro:{speaker:'舰长·零',text:'核心防线超出本次授权。建议撤退。'},playerReply:'撤退命令取消。舰队继续跟进。'}),
  stage(10,{id:'guardian-forecourt',name:'守墓者前庭',layout:'arena',landmark:'forecourt',objective:'击破最后一批直属守备队',reward:'defense',theme:{top:'#d6d7d3',bottom:'#34363b',line:'#d8d2c7',accent:'#9d4d59'},waves:[['eliteBlade','shield','striker'],['eliteCannon','sniper','grunt']],intro:{speaker:'联合防卫军广播',text:'封印对象正在接近核心。所有守备单位解除限制。'}}),
  stage(11,{id:'graveyard-core',name:'轨道墓场核心',layout:'boss',landmark:'grave-core',objective:'击败守墓者·阿尔法',reward:'permanent',boss:true,theme:{top:'#d8d9d4',bottom:'#111216',line:'#eee8dc',accent:'#b23f58'},waves:[['boss']],intro:{speaker:'守墓者·阿尔法',text:'未登记机体。停止推进，接受身份核验。'},enemyComms:'识别错误……MA-00 已经死亡。'}),
];

export const STAGE_SPATIAL_42={
  'blockade-lane':{space:'fortified-channel',floor:'armor-lanes',obstacles:[[-4.8,-1.6,1],[-4.8,1.6,1],[4.8,-1.6,1],[4.8,1.6,1]]},
  'debris-rain':{space:'broken-islands',floor:'drift-shadows',obstacles:[[-4,0,1.28],[0,-2.55,.92],[3.8,.65,1.12]]},
  'broken-dock':{space:'dock-corridors',floor:'rail-grid',obstacles:[[-4,-2,1.05],[4,-2,1.05],[-4,2,1.05],[4,2,1.05]]},
  'identity-array':{space:'scanner-lane',floor:'scan-bands',obstacles:[[-3.6,-1.5,.8],[-3.6,1.5,.8],[3.6,-1.5,.8],[3.6,1.5,.8]],mission:{type:'destroy',label:'识别节点',targets:[[-5,-1.1,70],[0,-1.1,70],[5,-1.1,70]]}},
  'repair-scaffold':{space:'defense-apron',floor:'service-chevrons',obstacles:[[-6,-2,.72],[6,-2,.72]]},
  'hero-memorial':{space:'memorial-ring',floor:'honor-rays',obstacles:[[-4.25,0,.66],[0,-3.05,.66],[4.25,0,.66],[0,3.05,.66]]},
  'seal-power-belt':{space:'power-ring',floor:'conduit-arcs',obstacles:[[-4.25,0,.7],[4.25,0,.7]],mission:{type:'destroy',label:'封印供能塔',targets:[[-3.6,-1.9,90],[0,2.55,90],[3.6,-1.9,90]]}},
  'inspector-hunt':{space:'pursuit-lane',floor:'pursuit-vectors',obstacles:[[-3.6,-1.5,.8],[3.6,1.5,.8]]},
  'tomb-fork':{space:'tomb-maze',floor:'grave-slabs',obstacles:[[-4,0,1.28],[0,-2.55,.92],[3.8,.65,1.12]]},
  'core-outer-ring':{space:'moving-gate',floor:'core-orbits',obstacles:[[-4.8,1.6,1],[4.8,1.6,1]],mission:{type:'destroy',label:'移动闸门执行器',targets:[[-4,-2.8,110],[4,-2.8,110]]}},
  'guardian-forecourt':{space:'execution-court',floor:'command-sigil',obstacles:[[-5.2,-2.7,.7],[5.2,-2.7,.7],[-5.2,2.7,.7],[5.2,2.7,.7]]},
  'graveyard-core':{space:'boss-sanctum',floor:'sealed-void',obstacles:[[-5.2,0,.55],[5.2,0,.55]]},
};

for(const item of ORBITAL_GRAVEYARD_STAGES_42)item.spatial=STAGE_SPATIAL_42[item.id];

export function getStageMissionTargets42(stage){
  return (stage?.spatial?.mission?.targets||[]).map(([x,y,hp],index)=>({
    id:`${stage.id}-facility-${index}`,x,y:stage.centerY+y,radius:.62,maxHp:hp,hp,label:stage.spatial.mission.label,dead:false,
  }));
}

export const BOSS_DIALOGUE_42={
  2:{speaker:'守墓者·阿尔法',text:'这个动作……不可能。封印对象仍在墓场之内。'},
  3:{speaker:'守墓者·阿尔法',text:'断刃舰队不该重新服从你。他们不该把你带回来。'},
  death:{speaker:'守墓者·阿尔法',text:'我们守的，从来不是这座基地。'},
};

export const CAMPAIGN_EVENTS_42={
  surrender:{
    id:'surrendered-executor',name:'投降的执行官',
    body:'重伤的监察官关闭武器，机体单膝降落。通讯中只剩一句：“最高指挥官……我不知道他们真的把您带回来了。”随后强制协议重新接管了武器。',
    choices:[
      {id:'accept',label:'切断强制协议',result:'获得封锁情报。下一段出现额外增援。',surrender:'accept',nextElite:true,permanent:2},
      {id:'dismantle',label:'在重启前拆解',result:'获得稀有模块。伊芙记录了你的处决习惯。',surrender:'dismantle',rareModule:true},
    ],
  },
  archive:{
    id:'ma00-archive',name:'旧式识别阵列',
    body:'废弃阵列自动亮起：驾驶权限——最高；识别对象——MA-00；身份状态——已处决；错误——当前对象仍在活动。',
    choices:[
      {id:'read',label:'强制读取',result:'损失 12% 当前耐久，获得旧档案碎片。',hpCostPct:.12,archive:'ma00-recognition',recognition:1},
      {id:'destroy',label:'摧毁阵列',result:'获得 45 战术核心。编号仍残留在你的短期记忆中。',credits:45,recognition:1},
    ],
  },
};

export function getCampaignStage42(index,run={}){
  const source=ORBITAL_GRAVEYARD_STAGES_42[index]||ORBITAL_GRAVEYARD_STAGES_42.at(-1);
  const stage={...source,waves:source.waves.map((wave)=>[...wave]),theme:{...source.theme},spatial:{...source.spatial,obstacles:(source.spatial?.obstacles||[]).map((item)=>[...item]),mission:source.spatial?.mission?{...source.spatial.mission,targets:source.spatial.mission.targets.map((item)=>[...item])}:null}};
  if(index===3&&run.routeFlags?.dock==='arsenal'){
    stage.reward='ordnance';
    stage.waves[1]=['artillery','shield','striker','drone'];
    stage.objective='强行突破军械库火力封锁';
  }
  if(index===3&&run.routeFlags?.dock==='data'){
    stage.reward='permanent';
    stage.archiveOnClear='dock-data-fragment';
  }
  if(index===9&&run.routeFlags?.tomb==='archive'){
    stage.waves[0]=['eliteBlade','sniper','drone'];
    stage.archiveOnClear='ma00-command-fragment';
    stage.hazard='scan';
  }
  if(index===9&&run.routeFlags?.tomb==='maintenance'){
    stage.healOnStart=.18;
  }
  return stage;
}

export const CAMPAIGN_LENGTH_42=ORBITAL_GRAVEYARD_STAGES_42.length;
