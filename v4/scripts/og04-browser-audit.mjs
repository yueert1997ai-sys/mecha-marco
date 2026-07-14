import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const artifacts=path.join(root,'docs','qa-artifacts');
const chromeCandidates=[process.env.CHROME_PATH,process.env.CHROMIUM_PATH,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean);
const chrome=chromeCandidates.find(existsSync);
if(!chrome)throw new Error('Chrome/Chromium required for OG-04 browser audit');

const debugPort=19244,temp=mkdtempSync(path.join(root,'.og04-browser-'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
  const file=path.resolve(root,relative);
  if(!file.startsWith(root)||!existsSync(file)){response.writeHead(404);response.end('Not found');return}
  response.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});createReadStream(file).pipe(response);
});

const delay=(ms)=>new Promise((resolve)=>setTimeout(resolve,ms));
const waitForDebugger=async()=>{
  for(let attempt=0;attempt<80;attempt+=1){
    try{const pages=await fetch(`http://127.0.0.1:${debugPort}/json/list`).then((response)=>response.json());const page=pages.find((item)=>item.type==='page'&&item.url==='about:blank')||pages.find((item)=>item.type==='page'&&!item.url.startsWith('chrome-extension://'));if(page?.webSocketDebuggerUrl)return page.webSocketDebuggerUrl}catch{}
    await delay(100);
  }
  throw new Error('Chrome DevTools endpoint did not become ready');
};

class Cdp {
  constructor(url){this.socket=new WebSocket(url);this.id=0;this.pending=new Map();this.socket.onmessage=(event)=>{const message=JSON.parse(event.data);if(!message.id)return;const pending=this.pending.get(message.id);if(!pending)return;this.pending.delete(message.id);if(message.error)pending.reject(new Error(message.error.message));else pending.resolve(message.result)};}
  ready(){return new Promise((resolve,reject)=>{this.socket.onopen=resolve;this.socket.onerror=reject});}
  call(method,params={}){const id=++this.id;this.socket.send(JSON.stringify({id,method,params}));return new Promise((resolve,reject)=>this.pending.set(id,{resolve,reject}));}
  close(){this.socket.close();}
}

const evaluate=async(cdp,expression)=>{
  const result=await cdp.call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(result.exceptionDetails)throw new Error(result.exceptionDetails.text||'Runtime evaluation failed');
  return result.result.value;
};

const capture=async(cdp,name)=>{
  const result=await cdp.call('Page.captureScreenshot',{format:'png',fromSurface:true,captureBeyondViewport:false});
  const bytes=Buffer.from(result.data,'base64');
  if(!bytes.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])))throw new Error(`${name} is not PNG`);
  if(bytes.readUInt32BE(16)!==844||bytes.readUInt32BE(20)!==390)throw new Error(`${name} is not 844x390`);
  writeFileSync(path.join(artifacts,name),bytes);
};

await new Promise((resolve)=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const child=spawn(chrome,['--headless=new','--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--no-first-run','--hide-scrollbars',`--remote-debugging-port=${debugPort}`,`--user-data-dir=${temp}`,'--window-size=844,390','about:blank'],{stdio:'ignore'});
try{
  const cdp=new Cdp(await waitForDebugger());await cdp.ready();await cdp.call('Page.enable');await cdp.call('Runtime.enable');await cdp.call('Emulation.setDeviceMetricsOverride',{width:844,height:390,deviceScaleFactor:1,mobile:true,screenWidth:844,screenHeight:390});
  await cdp.call('Page.navigate',{url:`http://127.0.0.1:${port}/?smoke=1&screen=base`});
  for(let attempt=0;attempt<80;attempt+=1){
    if(await evaluate(cdp,"Boolean(globalThis.__MECHA_MARCO__?.game&&document.documentElement.dataset.smokeReady==='true')"))break;
    if(attempt===79){const detail=await evaluate(cdp,"({url:location.href,ready:document.readyState,html:document.documentElement.outerHTML.slice(0,500),runtime:Boolean(globalThis.__MECHA_MARCO__)})");throw new Error(`Game runtime did not become ready: ${JSON.stringify(detail)}`)}
    await delay(100);
  }
  await evaluate(cdp,`(()=>{const game=__MECHA_MARCO__.game;game.selectedMech='vanguard';game.startRun();game.startCampaignStage42(3,false);game.enemies.length=0;game.waveDelay=999;game.renderer.camera.x=0;game.renderer.camera.y=game.room.stage42.centerY-1.05;game.og04VisualMode44='legacy';game.updateCombat(.016);game.ui.updateHud(game);game.render();__MECHA_MARCO__.mech3dRenderer()?.render(game);return true})()`);
  await delay(2300);
  await evaluate(cdp,`(()=>{const game=__MECHA_MARCO__.game;game.render();__MECHA_MARCO__.mech3dRenderer()?.render(game);return true})()`);
  await capture(cdp,'4.4A-og04-before-844x390.png');
  await evaluate(cdp,`(()=>{const game=__MECHA_MARCO__.game;game.og04VisualMode44='identity';game.vanguardIdentity44.blade=72;game.vanguardIdentity44.counterReady=true;game.vanguardIdentity44.counterSeconds=3;const states=['intact','active','heavy-damage'];game.facilities42.forEach((item,index)=>{item.dead=false;item.hp=index===2?item.maxHp*.28:item.maxHp;item.visualState44=states[index]});game.ui.updateHud(game);game.render();__MECHA_MARCO__.mech3dRenderer()?.render(game);return true})()`);
  await capture(cdp,'4.4A-og04-after-844x390.png');
  for(const state of['intact','active','heavy-damage','destroyed']){
    await evaluate(cdp,`(()=>{const game=__MECHA_MARCO__.game,target=game.facilities42[1];game.facilities42.forEach((item,index)=>{item.dead=index!==1;item.hp=item.dead?0:item.maxHp;delete item.visualState44});target.dead=${state==='destroyed'};target.hp=${state==='destroyed'?0:`target.maxHp*${state==='heavy-damage'?'.28':'1'}`};target.visualState44='${state}';game.render();__MECHA_MARCO__.mech3dRenderer()?.render(game);return true})()`);
    await capture(cdp,`4.4A-og04-facility-${state}-844x390.png`);
  }
  const audit=await evaluate(cdp,`(()=>{const game=__MECHA_MARCO__.game;game.facilities42.forEach((item)=>{item.dead=false;item.hp=item.maxHp;delete item.visualState44});game.input.clear();game.vanguardIdentity44.blade=35;game.vanguardIdentity44.counterReady=false;game.input.setSourceHeld('secondary','qa:hold',true,true);game.updateCombat(.18);game.projectiles.push({owner:'enemy',type:'enemyBeam',x:game.player.x+.35,y:game.player.y,angle:0,speed:0,damage:12,radius:.12,life:1,hitIds:new Set()});game.updateCombat(.01);game.input.setSourceHeld('secondary','qa:hold',false);game.updateCombat(.01);const deflected=game.projectiles.every((item)=>item.owner!=='enemy'),bladeAfterDeflect=game.vanguardIdentity44.blade;game.player.firePrimary(game);const counter=game.projectiles.find((item)=>item.type==='vanguard-counter44');game.ui.updateHud(game);game.render();__MECHA_MARCO__.mech3dRenderer()?.render(game);const hud=document.getElementById('vanguard-identity44')?.getBoundingClientRect(),objective=document.getElementById('campaign-objective42')?.getBoundingClientRect(),inside=hud&&hud.left>=0&&hud.top>=0&&hud.right<=innerWidth&&hud.bottom<=innerHeight,separate=!hud||!objective||hud.right<=objective.left||objective.right<=hud.left||hud.bottom<=objective.top||objective.bottom<=hud.top;return{width:innerWidth,height:innerHeight,inside,separate,visible:document.getElementById('vanguard-identity44')?.classList.contains('show'),identityLoop:{deflected,bladeAfterDeflect,counterType:counter?.type,counterPierce:counter?.pierce,bladeAfterCounter:game.vanguardIdentity44.blade}}})()`);
  assertAudit(audit);
  cdp.close();
  console.log(`OG-04 browser audit: ${audit.width}x${audit.height}, HUD and six PNG captures passed`);
}finally{
  child.kill();await Promise.race([new Promise((resolve)=>child.once('close',resolve)),delay(1500)]);await new Promise((resolve)=>server.close(resolve));
  try{rmSync(temp,{recursive:true,force:true,maxRetries:4,retryDelay:150})}catch{}
}

function assertAudit(audit){
  const loop=audit.identityLoop||{};
  if(audit.width!==844||audit.height!==390||!audit.inside||!audit.separate||!audit.visible||!loop.deflected||loop.bladeAfterDeflect!==63||loop.counterType!=='vanguard-counter44'||loop.counterPierce<3||loop.bladeAfterCounter!==28)throw new Error(`OG-04 HUD/identity audit failed: ${JSON.stringify(audit)}`);
  mkdirSync(artifacts,{recursive:true});
}
