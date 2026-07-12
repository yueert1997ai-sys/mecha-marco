import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { ORBITAL_GRAVEYARD_STAGES_42, getCampaignStage42 } from '../src/data/regionOrbitalGraveyard42.js';
import { DIRECTIVES_43, FRAME_KITS_43 } from '../src/data/frontlineDepth43.js';
import { buyKit43, kitUnlockState43, nextUnlock43, selectKit43, toggleDirective43 } from '../src/meta/frontlineProgress43.js';
import { recordRun, sanitizeProfile } from '../src/meta/profile.js';
import { buildDoctrineProfile416 } from '../src/run/doctrine416.js';
import { installModule43, MODULE_CAPACITY_43, rollModuleChoices } from '../src/run/rewardResolver.js';
import { MODULES, MODULE_BY_ID } from '../src/data/modules.js';
import { installTransformModules416 } from '../src/data/transformModules416.js';

test('v6 saves migrate to horizontal progression without losing fleet data',()=>{
  const profile=sanitizeProfile({version:6,permanent:19,runs:4,archiveFragments:['legacy']});
  assert.equal(profile.version,7);assert.equal(profile.permanent,19);assert.equal(profile.runs,4);
  assert.deepEqual(profile.unlockedKits.sort(),['bulwark-standard','starwing-standard','vanguard-standard']);
  assert.deepEqual(profile.archiveFragments,['legacy']);assert.deepEqual(profile.selectedDirectives,[]);
});

test('fleet data and frame mastery certify side-grade kits while directives cap at three',()=>{
  let profile=sanitizeProfile({permanent:20,mechMastery:{vanguard:8},unlockedDirectives:DIRECTIVES_43.slice(0,4).map((item)=>item.id)});
  const kit=FRAME_KITS_43.vanguard[1],bought=buyKit43(profile,kit.id);assert.equal(bought.ok,true);assert.equal(bought.profile.permanent,12);
  profile=selectKit43(bought.profile,'vanguard',kit.id);assert.equal(profile.selectedKits.vanguard,kit.id);
  for(const directive of DIRECTIVES_43.slice(0,4))profile=toggleDirective43(profile,directive.id);
  assert.equal(profile.selectedDirectives.length,3);
});

test('kit certification blocks currency-only unlocks but preserves earned licenses',()=>{
  const kit=FRAME_KITS_43.vanguard[1],rookie=sanitizeProfile({permanent:99,mechMastery:{vanguard:0}}),blocked=buyKit43(rookie,kit.id);
  assert.equal(blocked.ok,false);assert.equal(blocked.reason,'mastery');assert.equal(kitUnlockState43(rookie,'vanguard',kit).masteryRemaining,8);
  const veteran=sanitizeProfile({...rookie,unlockedKits:[...rookie.unlockedKits,kit.id]});assert.equal(selectKit43(veteran,'vanguard',kit.id).selectedKits.vanguard,kit.id);
});

test('explicit mastery receipt is the single source of truth for profile progression',()=>{
  const profile=sanitizeProfile({mechMastery:{vanguard:3}});
  const recorded=recordRun(profile,{mechId:'vanguard',stageReached:12,victory:true,masteryEarned:18});
  assert.equal(recorded.mechMastery.vanguard,21);
});

test('next certification goal follows the currently selected frame',()=>{
  const profile=sanitizeProfile({selectedMech:'starwing',mechMastery:{starwing:4}}),next=nextUnlock43(profile);
  assert.equal(next.mechId,'starwing');assert.equal(next.masteryRemaining,4);
});

test('every frame kit starts with a distinct action-changing module',()=>{
  const kits=Object.values(FRAME_KITS_43).flat();
  assert.equal(kits.length,9);assert.equal(new Set(kits.map((kit)=>kit.starterModule)).size,9);
  for(const kit of kits){const module=MODULE_BY_ID.get(kit.starterModule);assert.ok(module,`${kit.id} starter exists`);assert.ok(Object.keys(module.effects||{}).length>0)}
});

test('all twelve stages have real arena profiles and varied mission verbs',()=>{
  assert.equal(ORBITAL_GRAVEYARD_STAGES_42.length,12);
  assert.ok(ORBITAL_GRAVEYARD_STAGES_42.every((stage)=>stage.spatial.widthProfile.length>=4));
  const shapes=new Set(ORBITAL_GRAVEYARD_STAGES_42.map((stage)=>stage.spatial.shape));
  const missionTypes=new Set(ORBITAL_GRAVEYARD_STAGES_42.map((stage)=>stage.spatial.mission?.type||'eliminate'));
  assert.equal(shapes.size,12);assert.ok(missionTypes.size>=7);
  assert.ok(missionTypes.has('defense'));assert.ok(missionTypes.has('pursuit'));assert.ok(missionTypes.has('capture'));assert.ok(missionTypes.has('command'));
  assert.equal(ORBITAL_GRAVEYARD_STAGES_42[5].spatial.mission.points.length,3);assert.equal(ORBITAL_GRAVEYARD_STAGES_42[10].spatial.optional.type,'decapitate');
});

test('route consequences persist beyond the immediately following stage',()=>{
  const arsenal={routeFlags:{dock:'arsenal'},routeConsequences:{breach:'left'}};
  assert.equal(getCampaignStage42(1,arsenal).waves[0][0],'drone');
  assert.equal(getCampaignStage42(5,arsenal).waves[1][0],'eliteCannon');
  assert.equal(getCampaignStage42(6,arsenal).waves[1][0],'eliteCannon');
  const archive={routeFlags:{tomb:'archive'},routeConsequences:{inspector:'escaped'}};
  assert.equal(getCampaignStage42(10,archive).waves[0][0],'eliteBlade');
  assert.ok(getCampaignStage42(11,archive).waves[0].includes('eliteCannon'));
});

test('module capacity forces replacement instead of unlimited stacking',()=>{
  const standards=MODULES.filter((module)=>module.slot!=='Core').slice(0,MODULE_CAPACITY_43.standard);
  const run={modules:[...standards]};const candidate=MODULES.find((module)=>module.slot!=='Core'&&!run.modules.includes(module));
  const blocked=installModule43(run,candidate);assert.equal(blocked.needsReplacement,true);assert.equal(run.modules.length,MODULE_CAPACITY_43.standard);
  const replaced=installModule43(run,candidate,standards[0].id);assert.equal(replaced.installed,true);assert.equal(replaced.removed.id,standards[0].id);assert.equal(run.modules.length,MODULE_CAPACITY_43.standard);
});

test('doctrine commitment has two and four module breakpoints',()=>{
  const aurora=MODULES.filter((module)=>['beam','wave','overdrive','nova'].some((tag)=>module.tags?.includes(tag))).slice(0,4);
  const tierOne=buildDoctrineProfile416(aurora.slice(0,2));const tierTwo=buildDoctrineProfile416(aurora);
  assert.equal(tierOne.auroraResonance,true);assert.equal(tierOne.auroraMastery,false);assert.equal(tierTwo.auroraMastery,true);
});

test('one thousand deterministic rewards keep normal choices inside the visible slot',()=>{
  for(let seed=0;seed<1000;seed+=1){const choices=rollModuleChoices({mechTags:['beam','saber'],modules:[],focusDoctrine:seed%2?'aurora':'eclipse'},'mobility',seed,3);assert.ok(choices.length>=2);assert.ok(choices.every((module)=>module.slot==='Dash'))}
});

test('earned duo protocols surface at core transformation nodes',()=>{
  installTransformModules416();
  const choices=rollModuleChoices({mechTags:['missile','mark'],modules:[],focusDoctrine:'bastion'},'transform',43,3);
  assert.equal(choices[0].id,'duo_missile_mark');assert.ok(choices.slice(1).every((module)=>module.slot==='Core'));
});

test('runtime wires mission state, boss preparation and horizontal-growth UI',async()=>{
  const [runtime,ui,renderer,combat]=await Promise.all([readFile(new URL('../src/run/frontlineDepth43.js',import.meta.url),'utf8'),readFile(new URL('../src/ui/frontlineDepth43.js',import.meta.url),'utf8'),readFile(new URL('../src/render/frontlineDepth43.js',import.meta.url),'utf8'),readFile(new URL('../src/combat/rogueTransform416.js',import.meta.url),'utf8')]);
  for(const token of['mission.type===\'defense\'','mission.type===\'pursuit\'','bossPrep.scanDisabled','bossPrep.artilleryDisabled','bossPrep.commandBroken','routeConsequences'])assert.match(runtime,new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')));
  assert.match(ui,/舰队整备/);assert.match(ui,/showModuleReplacement43/);assert.match(ui,/showTacticalReceipt43/);assert.match(ui,/战线因果回执/);assert.match(renderer,/drawBoundary/);assert.match(renderer,/drawMassLandmark/);assert.match(combat,/damaged\?1:3/);assert.match(combat,/modulePrice=damaged\?45:35/);
});
