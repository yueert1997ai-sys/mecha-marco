import test from 'node:test';
import assert from 'node:assert/strict';
import { getPaintVariant416, getPaintVariants416 } from '../src/data/paintVariants416.js';
import { buildDoctrineProfile416, getModuleDoctrine416 } from '../src/run/doctrine416.js';
import { TRANSFORM_MODULES_416 } from '../src/data/transformModules416.js';

test('paint variants provide four distinct liveries per player mech',()=>{
  for(const id of['vanguard','bulwark','starwing']){
    const variants=getPaintVariants416(id);
    assert.equal(variants.length,4);
    assert.equal(new Set(variants.map((item)=>item.palette.primary)).size,4);
    assert.ok(getPaintVariant416(id,variants[2].id));
  }
});

test('doctrine families create three-run resonance thresholds',()=>{
  const modules=[
    {tags:['beam']},{tags:['overdrive']},{tags:['pierce']},
    {tags:['armor']},{tags:['dash']},
  ];
  const profile=buildDoctrineProfile416(modules);
  assert.equal(profile.counts.aurora,3);
  assert.equal(profile.auroraResonance,true);
  assert.equal(getModuleDoctrine416({tags:['missile']}).id,'bastion');
  assert.equal(getModuleDoctrine416({tags:['drone']}).id,'eclipse');
});

test('core transformations change action behaviour instead of only multipliers',()=>{
  assert.equal(TRANSFORM_MODULES_416.length,7);
  for(const module of TRANSFORM_MODULES_416){
    assert.equal(module.slot,'Core');
    assert.equal(module.rarity,'transform');
    assert.ok(Object.keys(module.effects).some((key)=>!key.endsWith('Mul')&&!key.endsWith('Add')));
  }
});
