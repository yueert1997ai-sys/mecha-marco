import { spawn } from 'node:child_process';
import { existsSync, createReadStream } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const required=process.env.REQUIRE_BROWSER_SMOKE==='1';
const port=18743;
const url=`http://127.0.0.1:${port}/?smoke=1`;
const candidates=[process.env.CHROME_PATH,process.env.CHROMIUM_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser',
].filter(Boolean);
const chrome=candidates.find(existsSync);
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer((request,response)=>{
  const pathname=decodeURIComponent(new URL(request.url,'http://localhost').pathname);
  const relative=pathname==='/'?'index.html':pathname.replace(/^\/+/, '');
  const file=path.resolve(root,relative);
  if(!file.startsWith(root)||!existsSync(file)){response.writeHead(404);response.end('Not found');return}
  response.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
  createReadStream(file).pipe(response);
});

const runChrome=(name,width,height,screen='base')=>new Promise((resolve,reject)=>{
  const target=`${url}&screen=${encodeURIComponent(screen)}`;
  const args=['--headless=new','--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage','--disable-background-networking','--disable-component-update','--no-first-run','--touch-events=enabled','--force-device-scale-factor=1',`--window-size=${width+16},${height+95}`,'--virtual-time-budget=2500','--dump-dom',target];
  const child=spawn(chrome,args,{stdio:['ignore','pipe','pipe']});let stdout='',stderr='';
  child.stdout.on('data',(chunk)=>stdout+=chunk);child.stderr.on('data',(chunk)=>stderr+=chunk);
  const timer=setTimeout(()=>{child.kill();reject(new Error(`${name} timed out`))},18000);
  child.on('error',reject);child.on('close',(code)=>{clearTimeout(timer);const checks={ready:stdout.includes('data-smoke-ready="true"'),fit:stdout.includes('data-page-fit="pass"'),critical:stdout.includes('data-critical-inside="pass"'),panel:stdout.includes('data-panel-contained="pass"'),control:stdout.includes('data-panel-control="pass"'),canvas:stdout.includes('data-canvas-sync="pass"'),objective:stdout.includes('data-objective-visible="pass"'),layers:stdout.includes('data-combat-layers="pass"'),screen:stdout.includes(`data-smoke-screen="${screen}"`),base:screen!=='base'||stdout.includes('开始出击'),campaign:stdout.includes('data-campaign-mode="continuous-12-stage"'),flow:screen!=='campaign'||stdout.includes('data-campaign-flow="pass"'),loadError:stdout.includes('游戏脚本加载失败')};const ok=code===0&&Object.entries(checks).every(([key,value])=>key==='loadError'?!value:value);if(!ok)return reject(new Error(`${name} failed (code=${code}, stdout=${stdout.length}, checks=${JSON.stringify(checks)})\n${stdout.match(/<html[^>]*>/)?.[0]||''}\n${stderr.slice(-1200)}`));console.log(`${name}: ${width}x${height} ${screen} viewport, controls and canvas passed`);resolve()});
});

if(!chrome){
  const message='Chrome/Chromium not found; set CHROME_PATH.';
  if(required)throw new Error(message);
  console.warn(`${message} Browser smoke skipped.`);
}else{
  await new Promise((resolve)=>server.listen(port,'127.0.0.1',resolve));
  try{
    for(const [width,height] of [[956,440],[844,390],[932,430],[896,414],[852,393]]){
      await runChrome('Mobile landscape smoke',width,height,'base');
      await runChrome('Mobile combat objective smoke',width,height,'combat');
    }
    for(const screen of['settings','armory','reward','shop','event','pause','result','branch','boss'])await runChrome('Mobile overlay smoke',844,390,screen);
    await runChrome('Accelerated twelve-stage browser flow',844,390,'campaign');
  }finally{await new Promise((resolve)=>server.close(resolve))}
}
