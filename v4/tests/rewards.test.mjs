import test from 'node:test';
import assert from 'node:assert/strict';
import { MECHS } from '../src/data/mechs.js';
import { DUO_MODULES, MODULE_BY_ID } from '../src/data/modules.js';
import { buildRunStats, getEligibleDuoModules, rollModuleChoices } from '../src/run/rewardResolver.js';

test('reward choices target the visible reward slot', () => {
  const run = { mechTags:['beam','saber','agile'], modules:[] };
  const choices = rollModuleChoices(run, 'mobility', 123, 3);
  assert.ok(choices.length >= 2);
  assert.ok(choices.every((m) => m.slot === 'Dash'));
});

test('owned modules are not offered again', () => {
  const owned = MODULE_BY_ID.get('primary_power_1');
  const run = { mechTags:['beam','saber'], modules:[owned] };
  for (let seed=0;seed<20;seed+=1) {
    assert.ok(!rollModuleChoices(run,'weapon',seed,3).some((m)=>m.id===owned.id));
  }
});

test('duo module eligibility follows collected tags', () => {
  const run = { mechTags:['beam','saber'], modules:[] };
  const eligible = getEligibleDuoModules(run);
  assert.ok(eligible.some((m)=>m.id==='duo_beam_saber'));
  assert.ok(!eligible.some((m)=>m.id==='duo_missile_mark'));
});

test('module effects rebuild combat stats deterministically', () => {
  const modules = [MODULE_BY_ID.get('primary_power_1'), MODULE_BY_ID.get('dash_cool_1')];
  const stats = buildRunStats(MECHS.vanguard, modules);
  assert.ok(stats.primaryDamage > MECHS.vanguard.stats.primaryDamage);
  assert.ok(stats.dashCooldown < MECHS.vanguard.stats.dashCooldown);
});
