import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_PROFILE, loadProfile, recordRun, saveProfile } from '../src/meta/profile.js';

class MemoryStorage {
  constructor(){this.map=new Map();}
  getItem(k){return this.map.get(k)??null;}
  setItem(k,v){this.map.set(k,v);}
}

test('profile survives storage round trip', () => {
  const storage = new MemoryStorage();
  const p = { ...DEFAULT_PROFILE, permanent:7, settings:{...DEFAULT_PROFILE.settings,audio:.2} };
  saveProfile(p, storage);
  const loaded = loadProfile(storage);
  assert.equal(loaded.permanent, 7);
  assert.equal(loaded.settings.audio, .2);
});

test('failed runs still advance persistent profile', () => {
  const next = recordRun(DEFAULT_PROFILE, { victory:false, permanentEarned:3, depth:4 });
  assert.equal(next.runs, 1);
  assert.equal(next.victories, 0);
  assert.equal(next.permanent, 3);
  assert.equal(next.history.length, 1);
});
