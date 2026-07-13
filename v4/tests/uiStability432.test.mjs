import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=(relative)=>readFile(new URL(`../${relative}`,import.meta.url),'utf8');

test('reused overlay panels always open at their own top edge',async()=>{
  const elements=new Map();
  const element=(id)=>{
    if(!elements.has(id))elements.set(id,{id,className:'',innerHTML:'',scrollTop:64,scrollLeft:21});
    return elements.get(id);
  };
  globalThis.document={getElementById:element};
  const {AppUI}=await import('../src/ui/appUI.js');
  const ui=new AppUI();
  ui.showPanel('<button id="back">返回</button>','settings-panel416');
  assert.equal(ui.panel.scrollTop,0);
  assert.equal(ui.panel.scrollLeft,0);
  assert.equal(ui.panel.className,'panel settings-panel416');
});

test('short landscape keeps campaign objectives visible and separates boss notices',async()=>{
  const [iphone,campaign,frontline]=await Promise.all([read('iphone17.css'),read('campaign42.css'),read('frontline-depth43.css')]);
  assert.match(iphone,/@media \(orientation: landscape\) and \(max-width: 900px\)[\s\S]*?\.hud-top-center\s*\{[\s\S]*?display:\s*block/);
  assert.match(iphone,/\.boss-bar \{ top: calc\(52px/);
  assert.match(campaign,/@media \(orientation:landscape\) and \(max-width:1000px\)[\s\S]*?left:max\(12px/);
  assert.match(frontline,/\.tactical-receipt43\{top:calc\(88px/);
});

test('control opacity default is a valid persisted range step',async()=>{
  const [profile,tuning,css]=await Promise.all([read('src/meta/profile.js'),read('src/ui/depthUI416.js'),read('iphone17.css')]);
  assert.match(profile,/controlOpacity:\s*\.8/);
  assert.match(tuning,/controlOpacity:\.8/);
  assert.match(css,/--control-opacity:\s*\.8/);
  assert.doesNotMatch(`${profile}\n${tuning}\n${css}`,/controlOpacity:\s*\.78|--control-opacity:\s*\.78/);
});

test('render surfaces subscribe before the asynchronous WebGL import',async()=>{
  const main=await read('src/main.js');
  const listener=main.indexOf("addEventListener('mecha-viewport-change',syncRenderSurfaces)");
  const webglImport=main.indexOf("await import('./render/mech3d41.js')");
  assert.ok(listener>=0&&listener<webglImport);
  assert.match(main,/mobileViewport42\.apply\(\);[\s\S]*?await import\('\.\/render\/mech3d41\.js'\)/);
});

test('browser smoke covers five combat widths and all blocking overlay families',async()=>{
  const smoke=await read('scripts/browser-smoke.mjs');
  for(const size of['956,440','844,390','932,430','896,414','852,393'])assert.match(smoke,new RegExp(size));
  for(const screen of['settings','armory','reward','shop','event','pause','result','branch','boss'])assert.match(smoke,new RegExp(`'${screen}'`));
  assert.match(smoke,/data-objective-visible/);
  assert.match(smoke,/data-combat-layers/);
  assert.match(smoke,/data-campaign-flow/);
});
