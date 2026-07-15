import { facilityVisualState44, og04SpatialEvidence44 } from './og04IdentityVisual44.js';

export const OG04_SCENE_ROLES_44B=Object.freeze(['background','far','mid','playfield','foreground','atmosphere']);
const TIER_RANK=Object.freeze({low:0,medium:1,high:2});
const PRE_ACTOR_ROLES=new Set(['background','far','mid','playfield']);
const POST_ACTOR_ROLES=new Set(['foreground','atmosphere']);

export const OG04_FALLBACK_SCENE_44B=Object.freeze({
  id:'og04-painterly-fallback-44b',schema:1,
  safeCrop:{minAspect:1.9,maxAspect:2.5,focus:[.5,.5],protectedArea:[.16,.12,.84,.88]},
  layers:[
    {id:'background',role:'background',src:null,anchor:[.5,.5],scale:1,opacity:1,parallax:[.006,.004],fit:'cover',blend:'source-over',minTier:'low',fallback:{type:'gradient',colors:['#02040e','#08172f','#0a2229']}},
    {id:'far',role:'far',src:null,anchor:[.5,.48],scale:1,opacity:.72,parallax:[.012,.009],fit:'cover',blend:'source-over',minTier:'low',fallback:{type:'wreck-silhouette',color:'#163a58',accent:'#53d8d0'}},
    {id:'mid',role:'mid',src:null,anchor:[.5,.51],scale:1,opacity:.7,parallax:[.022,.017],fit:'cover',blend:'source-over',minTier:'medium',fallback:{type:'array-silhouette',color:'#154a5b',accent:'#70efe0'}},
    {id:'playfield',role:'playfield',src:null,anchor:[.5,.5],scale:1,opacity:1,parallax:[0,0],fit:'contain',blend:'source-over',minTier:'low',fallback:{type:'og04-playfield'}},
    {id:'foreground',role:'foreground',src:null,anchor:[.5,.5],scale:1,opacity:.7,parallax:[.045,.032],fit:'cover',blend:'source-over',minTier:'high',fallback:{type:'edge-debris',color:'#01030a'}},
    {id:'atmosphere',role:'atmosphere',src:null,anchor:[.5,.5],scale:1,opacity:.4,parallax:[.032,.025],fit:'cover',blend:'source-over',minTier:'medium',fallback:{type:'edge-mist',color:'#45d7d1'}},
  ],
});

export function validateSceneManifest44b(manifest){
  if(!manifest||manifest.schema!==1||!Array.isArray(manifest.layers))throw new Error('OG-04 scene manifest schema must be 1');
  const roles=manifest.layers.map((layer)=>layer.role);
  if(roles.length!==OG04_SCENE_ROLES_44B.length||roles.some((role,index)=>role!==OG04_SCENE_ROLES_44B[index]))throw new Error(`OG-04 scene layer order must be ${OG04_SCENE_ROLES_44B.join(' > ')}`);
  for(const layer of manifest.layers){
    if(!Array.isArray(layer.anchor)||layer.anchor.length!==2||!Array.isArray(layer.parallax)||layer.parallax.length!==2)throw new Error(`OG-04 layer ${layer.id} needs two-axis anchor and parallax`);
    if(!['cover','contain'].includes(layer.fit)||!Number.isFinite(layer.scale)||!Number.isFinite(layer.opacity)||!TIER_RANK.hasOwnProperty(layer.minTier))throw new Error(`OG-04 layer ${layer.id} has invalid fit, scale, opacity, or tier`);
    if(!layer.fallback?.type)throw new Error(`OG-04 layer ${layer.id} needs a fallback`);
  }
  return manifest;
}

export function tierAllowsSceneLayer44b(tier,minTier){
  return (TIER_RANK[tier]??TIER_RANK.high)>=(TIER_RANK[minTier]??TIER_RANK.high);
}

export function computeScenePlacement44b(layer,imageSize,viewport,camera={x:0,y:0},safeCrop={focus:[.5,.5]}){
  const iw=Math.max(1,imageSize.width||1),ih=Math.max(1,imageSize.height||1),vw=Math.max(1,viewport.width||1),vh=Math.max(1,viewport.height||1);
  const fitScale=(layer.fit==='contain'?Math.min(vw/iw,vh/ih):Math.max(vw/iw,vh/ih))*Math.max(.01,layer.scale||1);
  const width=iw*fitScale,height=ih*fitScale,anchor=layer.anchor||[.5,.5],focus=safeCrop.focus||[.5,.5],parallax=layer.parallax||[0,0];
  let x=vw*focus[0]-width*anchor[0]-camera.x*vw*parallax[0];
  let y=vh*focus[1]-height*anchor[1]-camera.y*vh*parallax[1];
  if(layer.fit==='cover'){
    x=Math.min(0,Math.max(vw-width,x));
    y=Math.min(0,Math.max(vh-height,y));
  }
  return{x,y,width,height,fitScale};
}

const loadImage=(url,imageFactory)=>new Promise((resolve,reject)=>{
  const image=imageFactory();
  image.decoding='async';
  image.onload=async()=>{try{await image.decode?.();resolve(image)}catch(error){reject(error)}};
  image.onerror=()=>reject(new Error(`Unable to load scene asset: ${url}`));
  image.src=url;
});

export async function loadSceneAssets44b(manifestUrl,{fetchImpl=globalThis.fetch,imageFactory=()=>new Image()}={}){
  if(typeof fetchImpl!=='function')throw new Error('Scene manifest fetch is unavailable');
  const response=await fetchImpl(manifestUrl,{cache:'no-cache'});
  if(!response?.ok)throw new Error(`Unable to load OG-04 scene manifest: ${response?.status||'unknown'}`);
  const manifest=validateSceneManifest44b(await response.json());
  const base=new URL('.',String(manifestUrl));
  const images=new Map(),failures=[];
  await Promise.all(manifest.layers.filter((layer)=>layer.src).map(async(layer)=>{
    const url=new URL(layer.src,base).href;
    try{images.set(layer.role,await loadImage(url,imageFactory));}
    catch(error){failures.push({role:layer.role,url,message:error.message});}
  }));
  return{manifest,images,failures,status:failures.length?'degraded':'ready'};
}

export function createSceneRuntime44b(options={}){
  const state={manifest:OG04_FALLBACK_SCENE_44B,images:new Map(),failures:[],status:'loading',error:null};
  state.ready=loadSceneAssets44b(options.manifestUrl||new URL('../../assets/scenes/og04/scene.json',import.meta.url),options).then((result)=>Object.assign(state,result)).catch((error)=>{state.status='degraded';state.error=error.message;return state;});
  return state;
}

function isOg04(world){return Boolean(world?.run?.campaign42&&world?.room?.stage42?.index===3)}

function sceneTier(world,renderer){
  if(['low','medium','high'].includes(world.og04SceneQuality44b))return world.og04SceneQuality44b;
  const memory=Number(globalThis.navigator?.deviceMemory||8),coarse=globalThis.matchMedia?.('(pointer:coarse)')?.matches;
  if(memory<=2)return'low';
  if(memory<=4||coarse&&renderer.dpr>1.35)return'medium';
  return'high';
}

function drawImagePlane(renderer,world,layer,image){
  const ctx=renderer.ctx,stage=world.room.stage42;
  const placement=computeScenePlacement44b(layer,{width:image.naturalWidth||image.width,height:image.naturalHeight||image.height},{width:renderer.width,height:renderer.height},{x:renderer.camera.x,y:renderer.camera.y-stage.centerY},world.og04SceneManifest44b.safeCrop);
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=layer.opacity;ctx.globalCompositeOperation=layer.blend||'source-over';ctx.drawImage(image,placement.x,placement.y,placement.width,placement.height);ctx.restore();
}

function drawGradientFallback(renderer,layer){
  const ctx=renderer.ctx,colors=layer.fallback.colors||['#02040e','#08172f','#0a2229'];
  ctx.save();ctx.setTransform(1,0,0,1,0,0);const gradient=ctx.createRadialGradient(renderer.width*.56,renderer.height*.48,0,renderer.width*.56,renderer.height*.48,renderer.width*.72);gradient.addColorStop(0,colors[2]||colors[0]);gradient.addColorStop(.48,colors[1]||colors[0]);gradient.addColorStop(1,colors[0]);ctx.fillStyle=gradient;ctx.fillRect(0,0,renderer.width,renderer.height);ctx.restore();
}

function drawWreckFallback(renderer,layer){
  const ctx=renderer.ctx,w=renderer.width,h=renderer.height;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=layer.opacity;ctx.fillStyle=layer.fallback.color||'#163a58';ctx.beginPath();ctx.moveTo(-w*.08,h*.05);ctx.bezierCurveTo(w*.18,-h*.08,w*.48,-h*.02,w*.71,h*.2);ctx.lineTo(w*.59,h*.3);ctx.bezierCurveTo(w*.36,h*.11,w*.16,h*.18,-w*.03,h*.39);ctx.closePath();ctx.fill();ctx.strokeStyle=layer.fallback.accent||'#53d8d0';ctx.globalAlpha=.26;ctx.lineWidth=3*renderer.dpr;ctx.beginPath();ctx.moveTo(w*.04,h*.2);ctx.bezierCurveTo(w*.28,h*.03,w*.49,h*.12,w*.67,h*.22);ctx.stroke();ctx.restore();
}

function drawArrayFallback(renderer,layer){
  const ctx=renderer.ctx,w=renderer.width,h=renderer.height;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=layer.opacity;for(const [x,y,s] of[[.17,.47,.74],[.72,.31,1.05],[.86,.58,.62]]){ctx.save();ctx.translate(w*x,h*y);ctx.fillStyle=layer.fallback.color||'#154a5b';ctx.beginPath();ctx.moveTo(-22*s,44*s);ctx.lineTo(-8*s,-42*s);ctx.lineTo(15*s,-27*s);ctx.lineTo(27*s,38*s);ctx.closePath();ctx.fill();ctx.strokeStyle=layer.fallback.accent||'#70efe0';ctx.globalAlpha=.52;ctx.lineWidth=2*renderer.dpr;ctx.beginPath();ctx.moveTo(-5*s,-30*s);ctx.lineTo(9*s,22*s);ctx.stroke();ctx.restore()}ctx.restore();
}

function drawEdgeDebrisFallback(renderer,layer){
  const ctx=renderer.ctx,w=renderer.width,h=renderer.height,c=layer.fallback.color||'#01030a';
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=layer.opacity;ctx.fillStyle=c;for(const points of[[[-.03,.08],[.2,-.03],[.13,.24],[.03,.34]],[ [1.03,.05],[.8,-.02],[.9,.28],[1,.41]],[[-.04,.9],[.17,.76],[.25,1.04]],[[1.04,.86],[.83,.77],[.74,1.04]]]){ctx.beginPath();points.forEach(([x,y],index)=>index?ctx.lineTo(x*w,y*h):ctx.moveTo(x*w,y*h));ctx.closePath();ctx.fill()}ctx.restore();
}

function drawMistFallback(renderer,layer){
  const ctx=renderer.ctx,w=renderer.width,h=renderer.height;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation='screen';ctx.globalAlpha=layer.opacity*.45;for(const [x,y,r,color] of[[.1,.75,.28,layer.fallback.color||'#45d7d1'],[.9,.22,.22,'#426fb8'],[.68,.94,.27,'#b54d35']]){const g=ctx.createRadialGradient(w*x,h*y,0,w*x,h*y,w*r);g.addColorStop(0,color);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h)}ctx.restore();
}

function drawFallbackPlane(renderer,world,layer){
  const type=layer.fallback?.type;
  if(type==='gradient')drawGradientFallback(renderer,layer);
  else if(type==='wreck-silhouette')drawWreckFallback(renderer,layer);
  else if(type==='array-silhouette')drawArrayFallback(renderer,layer);
  else if(type==='edge-debris')drawEdgeDebrisFallback(renderer,layer);
  else if(type==='edge-mist')drawMistFallback(renderer,layer);
  else if(type==='og04-playfield')drawOg04Playfield44b(renderer,world);
}

function irregularRock(ctx,r,index){
  const count=7,phase=index*.71;
  ctx.beginPath();
  for(let i=0;i<count;i+=1){const angle=-Math.PI*.5+i/count*Math.PI*2,variation=.72+((i*37+index*19)%29)/100,px=Math.cos(angle)*r*variation,py=Math.sin(angle)*r*(.64+((i*11+index*7)%21)/100);i?ctx.lineTo(px,py):ctx.moveTo(px,py)}
  ctx.closePath();
}

function drawObstacle(renderer,obstacle,index){
  const ctx=renderer.ctx,p=renderer.worldToScreen(obstacle.x,obstacle.y),r=obstacle.r*renderer.scale,d=renderer.dpr;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.32+index*.49);ctx.fillStyle='rgba(0,2,9,.7)';ctx.beginPath();ctx.ellipse(r*.1,r*.24,r*1.04,r*.54,0,0,Math.PI*2);ctx.fill();const body=ctx.createLinearGradient(-r,-r,r,r);body.addColorStop(0,index%2?'#26314a':'#17233c');body.addColorStop(.48,index%2?'#0c1427':'#122538');body.addColorStop(1,'#02050d');irregularRock(ctx,r,index);ctx.fillStyle=body;ctx.fill();ctx.strokeStyle=index===2?'rgba(112,224,210,.3)':'rgba(118,137,170,.2)';ctx.lineWidth=1.1*d;ctx.stroke();ctx.strokeStyle='rgba(106,234,221,.2)';ctx.beginPath();ctx.moveTo(-r*.46,-r*.16);ctx.lineTo(r*.14,-r*.04);ctx.lineTo(r*.43,r*.25);ctx.stroke();ctx.restore();
}

function drawFacility(renderer,target,index,state,time){
  const ctx=renderer.ctx,p=renderer.worldToScreen(target.x,target.y),d=renderer.dpr,s=renderer.scale;
  const palette={intact:'#72dcd4',active:'#ffe19a','heavy-damage':'#e87b43',destroyed:'#596174'},color=palette[state],height=(1.28+index*.18)*s,width=(.32+index*.035)*s;
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate([-.12,.07,.18][index]||0);ctx.globalAlpha=state==='destroyed'?.64:1;ctx.fillStyle='rgba(1,5,13,.78)';ctx.beginPath();ctx.ellipse(0,.28*s,.72*s,.3*s,0,0,Math.PI*2);ctx.fill();
  if(state==='destroyed'){
    ctx.fillStyle='#151729';ctx.beginPath();ctx.moveTo(-.7*s,.25*s);ctx.lineTo(-.18*s,-.18*s);ctx.lineTo(.12*s,.04*s);ctx.lineTo(.64*s,.34*s);ctx.closePath();ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=1.4*d;ctx.beginPath();ctx.moveTo(-.58*s,.24*s);ctx.lineTo(.4*s,-.25*s);ctx.stroke();
  }else{
    ctx.shadowBlur=state==='active'?24*d:10*d;ctx.shadowColor=color;ctx.fillStyle=index===1?'#142038':'#101928';ctx.strokeStyle=color;ctx.lineWidth=(state==='active'?2.4:1.4)*d;ctx.beginPath();ctx.moveTo(-width,.25*s);ctx.lineTo(-width*.75,-height*.78);ctx.lineTo(-width*.12,-height);ctx.lineTo(width*.92,-height*.63);ctx.lineTo(width*.7,.22*s);ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;
    ctx.strokeStyle=color;ctx.globalAlpha=state==='heavy-damage'?.9:.46;ctx.lineWidth=2*d;ctx.beginPath();ctx.moveTo(-width*.44,-height*.67);ctx.lineTo(width*.48,-height*.52);ctx.moveTo(-width*.22,-height*.36);ctx.lineTo(width*.33,-height*.22);ctx.stroke();
    if(state==='heavy-damage'){ctx.strokeStyle='#ffd18b';ctx.globalAlpha=.9;ctx.beginPath();ctx.moveTo(-width*.1,-height*.9);ctx.lineTo(width*.3,-height*.66);ctx.lineTo(-width*.08,-height*.42);ctx.stroke()}
    if(state==='active'){ctx.globalAlpha=.48+.16*Math.sin(time*7);ctx.strokeStyle=color;ctx.lineWidth=2*d;ctx.beginPath();ctx.ellipse(0,-height*.9,.58*s,.24*s,-.2,0,Math.PI*2);ctx.stroke()}
  }
  ctx.globalAlpha=1;ctx.fillStyle='rgba(2,5,12,.84)';ctx.fillRect(-28*d,12*d,56*d,14*d);ctx.fillStyle=color;ctx.font=`700 ${8*d}px system-ui`;ctx.textAlign='center';ctx.fillText(`ID-${index+1} · ${state.toUpperCase()}`,0,22*d);ctx.restore();
}

function drawOg04Playfield44b(renderer,world){
  const evidence=og04SpatialEvidence44(world);if(!evidence)return;
  world.og04SpatialEvidence44=evidence;
  const ctx=renderer.ctx,d=renderer.dpr,s=renderer.scale,stage=world.room.stage42;
  const left=renderer.worldToScreen(-8.7,stage.centerY+4.8),right=renderer.worldToScreen(8.7,stage.centerY-4.9),center=renderer.worldToScreen(0,stage.centerY);
  ctx.save();const floor=ctx.createRadialGradient(center.x,center.y,0,center.x,center.y,8.7*s);floor.addColorStop(0,'rgba(18,45,55,.48)');floor.addColorStop(.5,'rgba(12,24,43,.34)');floor.addColorStop(1,'rgba(2,4,12,0)');ctx.fillStyle=floor;ctx.beginPath();ctx.moveTo(left.x,left.y);ctx.lineTo(right.x,right.y);ctx.lineTo(renderer.worldToScreen(7.1,stage.centerY+4.4).x,renderer.worldToScreen(7.1,stage.centerY+4.4).y);ctx.lineTo(renderer.worldToScreen(-7.7,stage.centerY-4.1).x,renderer.worldToScreen(-7.7,stage.centerY-4.1).y);ctx.closePath();ctx.fill();ctx.restore();
  evidence.obstacles.forEach((obstacle,index)=>drawObstacle(renderer,obstacle,index));
  const alive=(world.facilities42||[]).filter((item)=>!item.dead),active=alive.length?alive[Math.floor(world.time*.65)%alive.length]:null;
  (world.facilities42||[]).forEach((target,index)=>drawFacility(renderer,target,index,target.visualState44||facilityVisualState44(target,target===active),world.time));
  const label=renderer.worldToScreen(-8.2,stage.centerY+5.15);ctx.save();ctx.fillStyle='rgba(220,236,242,.75)';ctx.font=`700 ${10*d}px system-ui`;ctx.textAlign='left';ctx.fillText(evidence.stageLabel,label.x,label.y);
  const mission=renderer.worldToScreen(5.7,stage.centerY+4.55);ctx.fillStyle='rgba(1,5,13,.74)';ctx.beginPath();ctx.moveTo(mission.x-88*d,mission.y-14*d);ctx.lineTo(mission.x+74*d,mission.y-14*d);ctx.lineTo(mission.x+86*d,mission.y+8*d);ctx.lineTo(mission.x-78*d,mission.y+8*d);ctx.closePath();ctx.fill();ctx.fillStyle='#e9b760';ctx.font=`700 ${9*d}px system-ui`;ctx.textAlign='center';ctx.fillText(evidence.missionLabel,mission.x,mission.y);ctx.restore();
  const gate=renderer.worldToScreen(evidence.gate.x,evidence.gate.y),half=evidence.gate.halfWidth*s,color=evidence.exitOpen?'#75e1d2':'#e45e6d';ctx.save();ctx.strokeStyle=color;ctx.shadowBlur=12*d;ctx.shadowColor=color;ctx.lineWidth=5*d;ctx.beginPath();if(evidence.exitOpen){ctx.moveTo(gate.x-half,gate.y);ctx.lineTo(gate.x-1.5*s,gate.y);ctx.moveTo(gate.x+1.5*s,gate.y);ctx.lineTo(gate.x+half,gate.y)}else{ctx.moveTo(gate.x-half,gate.y);ctx.lineTo(gate.x+half,gate.y)}ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=color;ctx.font=`700 ${10*d}px system-ui`;ctx.textAlign='center';ctx.fillText(evidence.gateLabel,gate.x,gate.y-11*d);ctx.restore();
}

function renderRoleSet(renderer,world,runtime,roles){
  const manifest=runtime.manifest||OG04_FALLBACK_SCENE_44B,tier=sceneTier(world,renderer),forcedMissing=world.og04SceneMissing44b;
  world.og04SceneManifest44b=manifest;
  const audit=world.og04SceneAudit44b||{renderedRoles:[],fallbackRoles:[]};
  for(const layer of manifest.layers){
    if(!roles.has(layer.role)||!tierAllowsSceneLayer44b(tier,layer.minTier))continue;
    const image=forcedMissing===layer.role?null:runtime.images.get(layer.role);
    if(image){drawImagePlane(renderer,world,layer,image);if(layer.role==='playfield')drawOg04Playfield44b(renderer,world)}else{drawFallbackPlane(renderer,world,layer);if(layer.src)audit.fallbackRoles.push(layer.role)}
    audit.renderedRoles.push(layer.role);
  }
  Object.assign(audit,{manifestId:manifest.id,status:runtime.status,tier,assetFailures:runtime.failures.map((item)=>item.role),manifestError:runtime.error||null,forcedMissing:forcedMissing||null,protectedArea:manifest.safeCrop.protectedArea});
  world.og04SceneAudit44b=audit;
}

export function applyPainterlyScene44b(Renderer,options={}){
  if(Renderer.__painterlyScene44b)return Renderer.__painterlySceneRuntime44b;
  Renderer.__painterlyScene44b=true;
  const runtime=options.runtime||createSceneRuntime44b(options);
  Renderer.__painterlySceneRuntime44b=runtime;
  const drawArena=Renderer.prototype.drawArena;
  Renderer.prototype.drawArena=function drawPainterlyArena44b(world){
    if(!isOg04(world)||world.og04SceneMode44b==='legacy')return drawArena.call(this,world);
    const previousMode=world.og04VisualMode44;
    world.og04VisualMode44='legacy';
    try{drawArena.call(this,world)}finally{world.og04VisualMode44=previousMode}
    world.og04SceneAudit44b={renderedRoles:[],fallbackRoles:[]};
    renderRoleSet(this,world,runtime,PRE_ACTOR_ROLES);
  };
  const drawDamageNumbers=Renderer.prototype.drawDamageNumbers;
  Renderer.prototype.drawDamageNumbers=function drawPainterlyForeground44b(world){
    if(isOg04(world)&&world.og04SceneMode44b!=='legacy')renderRoleSet(this,world,runtime,POST_ACTOR_ROLES);
    return drawDamageNumbers.call(this,world);
  };
  return runtime;
}
