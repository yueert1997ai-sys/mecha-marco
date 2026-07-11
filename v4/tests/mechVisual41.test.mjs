import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MECH_VISUAL_41, PLAYER_VISUALS, getVisualDesign } from '../src/render/mechDesigns41.js';
import { project } from '../src/render/mechMeshPrimitives41.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(file)=>readFile(path.join(root,file),'utf8');

test('all three selectable mechs have dedicated redesigned silhouettes',()=>{
  assert.equal(MECH_VISUAL_41.version,'4.1.0-full-redesign');
  assert.deepEqual(MECH_VISUAL_41.playerDesigns,['vanguard','bulwark','starwing']);
  assert.equal(new Set(Object.values(PLAYER_VISUALS).map((x)=>x.silhouette)).size,3);
  assert.ok(PLAYER_VISUALS.bulwark.body.chest>PLAYER_VISUALS.vanguard.body.chest);
  assert.ok(PLAYER_VISUALS.starwing.body.chest<PLAYER_VISUALS.vanguard.body.chest);
});

test('new player designs use neutral armor with restrained accent channels',()=>{
  for(const design of Object.values(PLAYER_VISUALS)){
    assert.match(design.colors.armor,/^#[0-9a-f]{6}$/i);
    assert.match(design.colors.frame,/^#[0-9a-f]{6}$/i);
    assert.notEqual(design.colors.armor,design.colors.accent);
    assert.notEqual(design.colors.frame,design.colors.glow);
  }
});

test('enemy roles resolve to distinct armored silhouettes',()=>{
  const melee=getVisualDesign({def:{role:'melee',color:'#f00'}},false);
  const sniper=getVisualDesign({def:{role:'sniper',color:'#f00'}},false);
  const boss=getVisualDesign({boss:true,def:{role:'boss',color:'#f00'}},false);
  assert.notEqual(melee.silhouette,sniper.silhouette);
  assert.equal(boss.silhouette,'overlord');
  assert.ok(boss.body.chest>melee.body.chest);
});

test('projected armor points stay finite when optional coordinates are omitted',()=>{
  const renderer={scale:40,worldToScreen:(x,y)=>({x:x*40+400,y:y*30+200})};
  const actor={x:0,y:0,yaw:0};
  const value=project(renderer,actor,{f:.5,z:1.5},{back:0,side:0,bob:0},1.2);
  assert.ok(Number.isFinite(value.x));
  assert.ok(Number.isFinite(value.y));
  assert.ok(Number.isFinite(value.d));
});

test('runtime activates projected armor meshes, hardpoints and redesigned previews',async()=>{
  const main=await read('src/main.js');
  const visual=await read('src/render/mechVisual41.js');
  const primitive=await read('src/render/mechMeshPrimitives41.js');
  const preview=await read('src/ui/mechPreview41.js');
  assert.match(main,/applyMechVisual41\(Renderer\)/);
  assert.match(main,/applyMechPreview41\(AppUI\)/);
  assert.match(visual,/computeMechRig/);
  assert.match(visual,/Renderer\.prototype\.drawMech/);
  assert.match(primitive,/faces=\[/);
  assert.match(primitive,/panelColor/);
  assert.match(primitive,/const ps=finite\(p\.s\)/);
  assert.match(preview,/V4\.1 FULL MECH REDESIGN/);
  assert.match(preview,/mech-preview41/);
});
