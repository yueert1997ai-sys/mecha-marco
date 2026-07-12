import test from 'node:test';
import assert from 'node:assert/strict';
import { ORBITAL_GRAVEYARD_STAGES_42, CAMPAIGN_LENGTH_42, getCampaignStage42, getStageMissionTargets42 } from '../src/data/regionOrbitalGraveyard42.js';
import { calculateRestorationEarned42, restorationStage42, identityMatch42 } from '../src/meta/restoration42.js';

test('orbital graveyard is a twelve-stage continuous campaign',()=>{
  assert.equal(CAMPAIGN_LENGTH_42,12);
  assert.equal(ORBITAL_GRAVEYARD_STAGES_42[0].name,'封锁航道');
  assert.equal(ORBITAL_GRAVEYARD_STAGES_42.at(-1).boss,true);
  assert.ok(ORBITAL_GRAVEYARD_STAGES_42.every((stage,index)=>stage.centerY===-index*14));
  assert.ok(ORBITAL_GRAVEYARD_STAGES_42.filter((stage)=>stage.branches).length>=2);
});

test('all sectors define distinct spatial identities and facility objectives alter play',()=>{
  assert.equal(new Set(ORBITAL_GRAVEYARD_STAGES_42.map((stage)=>stage.spatial.space)).size,12);
  assert.equal(new Set(ORBITAL_GRAVEYARD_STAGES_42.map((stage)=>stage.spatial.floor)).size,12);
  assert.ok(ORBITAL_GRAVEYARD_STAGES_42.every((stage)=>Array.isArray(stage.spatial.obstacles)));
  assert.equal(getStageMissionTargets42(ORBITAL_GRAVEYARD_STAGES_42[3]).length,3);
  assert.equal(getStageMissionTargets42(ORBITAL_GRAVEYARD_STAGES_42[6]).length,3);
  assert.equal(getStageMissionTargets42(ORBITAL_GRAVEYARD_STAGES_42[9]).length,2);
});

test('critical route choices alter later stage content',()=>{
  const arsenal=getCampaignStage42(3,{routeFlags:{dock:'arsenal'}});
  const data=getCampaignStage42(3,{routeFlags:{dock:'data'}});
  const archive=getCampaignStage42(9,{routeFlags:{tomb:'archive'}});
  assert.equal(arsenal.reward,'ordnance');
  assert.equal(data.reward,'permanent');
  assert.equal(archive.archiveOnClear,'ma00-command-fragment');
});

test('restoration progression reads campaign behaviour rather than deaths alone',()=>{
  const earned=calculateRestorationEarned42({reachedBoss:true,highRiskChoices:2,recognitionCount:1,secondaryKills:12,archiveFragments:['a'],lowHpClear:true},true);
  assert.ok(earned>=20);
  assert.equal(restorationStage42(35),2);
  assert.ok(identityMatch42({restorationScore:20},earned)>20);
});
