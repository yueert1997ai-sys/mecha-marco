import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OG04_SCENE_ROLES_44B,
  computeScenePlacement44b,
  loadSceneAssets44b,
  tierAllowsSceneLayer44b,
  validateSceneManifest44b,
} from '../src/render/painterlyScene44b.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(await readFile(path.join(root,'assets/scenes/og04/scene.json'),'utf8'));

test('OG-04 manifest owns the six ordered, independently configurable planes',()=>{
  assert.equal(validateSceneManifest44b(manifest),manifest);
  assert.deepEqual(manifest.layers.map((layer)=>layer.role),OG04_SCENE_ROLES_44B);
  for(const layer of manifest.layers){
    assert.equal(layer.anchor.length,2);
    assert.equal(layer.parallax.length,2);
    assert.ok(['cover','contain'].includes(layer.fit));
    assert.equal(typeof layer.scale,'number');
    assert.equal(typeof layer.opacity,'number');
    assert.ok(layer.fallback.type);
  }
  assert.deepEqual(manifest.safeCrop.protectedArea,[.16,.12,.84,.88]);
});

test('cover and contain placement preserve crop safety and independent parallax',()=>{
  const base={anchor:[.5,.5],scale:1.04,parallax:[.02,.01]};
  const cover=computeScenePlacement44b({...base,fit:'cover'},{width:1600,height:900},{width:844,height:390},{x:1,y:-1},{focus:[.5,.5]});
  assert.ok(cover.width>=844&&cover.height>=390);
  assert.ok(cover.x<=0&&cover.x+cover.width>=844);
  assert.ok(cover.y<=0&&cover.y+cover.height>=390);
  const shifted=computeScenePlacement44b({...base,fit:'cover'},{width:1600,height:900},{width:844,height:390},{x:0,y:0},{focus:[.5,.5]});
  assert.notEqual(cover.x,shifted.x);
  assert.notEqual(cover.y,shifted.y);
  const contain=computeScenePlacement44b({...base,fit:'contain',scale:1,parallax:[0,0]},{width:1600,height:900},{width:844,height:390});
  assert.ok(contain.width<=844&&contain.height<=390);
});

test('low tier keeps only background, far, and gameplay while higher tiers add depth planes',()=>{
  const visible=(tier)=>manifest.layers.filter((layer)=>tierAllowsSceneLayer44b(tier,layer.minTier)).map((layer)=>layer.role);
  assert.deepEqual(visible('low'),['background','far','playfield']);
  assert.deepEqual(visible('medium'),['background','far','mid','playfield','atmosphere']);
  assert.deepEqual(visible('high'),OG04_SCENE_ROLES_44B);
});

test('one missing image degrades that plane without rejecting the scene',async()=>{
  const imageFactory=()=>{
    const image={naturalWidth:1792,naturalHeight:828};
    Object.defineProperty(image,'src',{set(value){queueMicrotask(()=>value.endsWith('/far.webp')?image.onerror():image.onload())}});
    return image;
  };
  const result=await loadSceneAssets44b('https://example.test/assets/scenes/og04/scene.json',{
    fetchImpl:async()=>({ok:true,json:async()=>structuredClone(manifest)}),imageFactory,
  });
  assert.equal(result.status,'degraded');
  assert.deepEqual(result.failures.map((item)=>item.role),['far']);
  assert.equal(result.images.has('far'),false);
  assert.equal(result.images.size,4);
});

test('4.4B adds no Game.updateCombat wrapper and main wiring stays minimal',async()=>{
  const source=await readFile(path.join(root,'src/render/painterlyScene44b.js'),'utf8');
  const main=await readFile(path.join(root,'src/main.js'),'utf8');
  assert.doesNotMatch(source,/Game\.prototype\.updateCombat\s*=/);
  assert.match(main,/applyPainterlyScene44b\(Renderer\)/);
});
