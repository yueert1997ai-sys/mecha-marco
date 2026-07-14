export const OG04_IDENTITY_VISUAL_COMPONENTS_44=Object.freeze({
  id:'og04-poetic-megastructure-ruin',
  futureAssetBoundary:'procedural-components-can-map-to-glb-nodes',
  palette:{void:'#03020a',deep:'#0d0921',indigo:'#171134',objective:'#e7a943',active:'#ffd876',damaged:'#b76d36',destroyed:'#51445b'},
  ship:{side:'left',worldLength:7.2,minimumPlayerScale:5},
  pylons:[{height:1.7,angle:-.12},{height:2.25,angle:.08},{height:1.45,angle:.18}],
});

export function facilityVisualState44(facility,active=false){
  if(facility?.dead||facility?.hp<=0)return'destroyed';
  if((facility?.hp||0)/Math.max(1,facility?.maxHp||1)<=.4)return'heavy-damage';
  if(active)return'active';
  return'intact';
}

const point=(renderer,stage,x,y)=>renderer.worldToScreen(x,stage.centerY+y);

export function og04SpatialEvidence44(world){
  const stage=world?.room?.stage42,facilities=world?.facilities42||[],exitOpen=Boolean(world?.run?.exitOpen);
  if(!stage||stage.index!==3)return null;
  const destroyed=facilities.filter((item)=>item.dead||item.hp<=0).length,total=facilities.length||3;
  return{
    stageLabel:`${stage.code}  ${stage.name}`,
    missionLabel:`摧毁识别节点 · ${destroyed}/${total}`,
    gateLabel:exitOpen?'闸门开放 · 向北推进':'闸门锁定 · 摧毁全部节点',
    exitOpen,
    obstacles:(stage.spatial?.obstacles||[]).map(([x,y,r])=>({x,y:stage.centerY+y,r})),
    connector:{left:-3.4,right:3.4,nearY:stage.centerY-6,farY:stage.centerY-8},
    gate:{x:0,y:stage.centerY-5.75,halfWidth:3.4},
  };
}

function drawSpatialLayer(renderer,world,evidence){
  const ctx=renderer.ctx,d=renderer.dpr,s=renderer.scale,stage=world.room.stage42;
  const a=renderer.worldToScreen(evidence.connector.left,evidence.connector.farY),b=renderer.worldToScreen(evidence.connector.right,evidence.connector.nearY);
  ctx.save();
  const x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(b.x-a.x),h=Math.abs(b.y-a.y);
  const corridor=ctx.createLinearGradient(x,y,x,y+h);corridor.addColorStop(0,'rgba(31,28,51,.88)');corridor.addColorStop(1,'rgba(74,57,92,.72)');ctx.fillStyle=corridor;ctx.fillRect(x,y,w,h);ctx.strokeStyle='rgba(180,143,208,.34)';ctx.lineWidth=1.2*d;ctx.strokeRect(x,y,w,h);
  for(const obstacle of evidence.obstacles){
    const p=renderer.worldToScreen(obstacle.x,obstacle.y),r=obstacle.r*s;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='rgba(12,9,24,.98)';ctx.strokeStyle='rgba(179,139,203,.72)';ctx.lineWidth=1.8*d;ctx.shadowBlur=10*d;ctx.shadowColor='rgba(143,92,180,.45)';ctx.beginPath();for(let i=0;i<8;i+=1){const angle=-Math.PI*.5+i*Math.PI*.25,px=Math.cos(angle)*r,py=Math.sin(angle)*r;i?ctx.lineTo(px,py):ctx.moveTo(px,py)}ctx.closePath();ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='rgba(230,185,109,.34)';ctx.beginPath();ctx.moveTo(-r*.42,0);ctx.lineTo(r*.42,0);ctx.stroke();ctx.restore();
  }
  const label=renderer.worldToScreen(-8.2,stage.centerY+5.15);ctx.fillStyle='rgba(235,226,244,.74)';ctx.font=`700 ${10*d}px system-ui`;ctx.textAlign='left';ctx.fillText(evidence.stageLabel,label.x,label.y);
  const mission=renderer.worldToScreen(5.8,stage.centerY+4.45);ctx.fillStyle='rgba(7,5,16,.78)';ctx.strokeStyle='rgba(231,169,67,.58)';ctx.lineWidth=1*d;ctx.font=`700 ${10*d}px system-ui`;ctx.textAlign='center';const missionWidth=170*d;ctx.fillRect(mission.x-missionWidth*.5,mission.y-15*d,missionWidth,22*d);ctx.strokeRect(mission.x-missionWidth*.5,mission.y-15*d,missionWidth,22*d);ctx.fillStyle='#e7b75d';ctx.fillText(evidence.missionLabel,mission.x,mission.y);
  const gate=renderer.worldToScreen(evidence.gate.x,evidence.gate.y),half=evidence.gate.halfWidth*s;ctx.strokeStyle=evidence.exitOpen?'rgba(125,216,205,.95)':'rgba(206,82,101,.9)';ctx.shadowBlur=12*d;ctx.shadowColor=ctx.strokeStyle;ctx.lineWidth=4*d;ctx.beginPath();if(evidence.exitOpen){ctx.moveTo(gate.x-half,gate.y);ctx.lineTo(gate.x-1.55*s,gate.y);ctx.moveTo(gate.x+1.55*s,gate.y);ctx.lineTo(gate.x+half,gate.y)}else{ctx.moveTo(gate.x-half,gate.y);ctx.lineTo(gate.x+half,gate.y)}ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle=evidence.exitOpen?'rgba(160,230,218,.94)':'rgba(235,132,145,.9)';ctx.font=`700 ${10*d}px system-ui`;ctx.textAlign='right';ctx.fillText(evidence.gateLabel,gate.x-half-8*d,gate.y+3*d);
  ctx.restore();
}

function drawBrokenShip(renderer,stage){
  const ctx=renderer.ctx,s=renderer.scale,d=renderer.dpr,p=point(renderer,stage,-5.7,.3);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(-.18);ctx.fillStyle='rgba(35,27,56,.92)';ctx.strokeStyle='rgba(116,92,137,.32)';ctx.lineWidth=1.3*d;ctx.beginPath();ctx.moveTo(-3.4*s,-.72*s);ctx.lineTo(-1.7*s,-1.4*s);ctx.lineTo(.4*s,-.92*s);ctx.lineTo(2.2*s,-.26*s);ctx.lineTo(3.6*s,.18*s);ctx.lineTo(1.2*s,.58*s);ctx.lineTo(-.6*s,.3*s);ctx.lineTo(-2.7*s,1.08*s);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='rgba(2,2,8,.92)';ctx.beginPath();ctx.moveTo(-.8*s,-.76*s);ctx.lineTo(.5*s,-.54*s);ctx.lineTo(.1*s,.1*s);ctx.lineTo(-1.4*s,.34*s);ctx.closePath();ctx.fill();for(const [x,y,w] of[[-2.2,-.25,.8],[-.1,.55,.9],[1.6,-.18,.65]]){ctx.strokeStyle='rgba(218,165,79,.2)';ctx.beginPath();ctx.moveTo(x*s,y*s);ctx.lineTo((x+w)*s,(y+.12)*s);ctx.stroke()}ctx.restore();
}

function drawBrokenArcs(renderer,stage,time){
  const ctx=renderer.ctx,d=renderer.dpr,s=renderer.scale,p=point(renderer,stage,.4,-.2);ctx.save();ctx.strokeStyle='rgba(114,82,151,.24)';ctx.lineWidth=1.2*d;for(let i=0;i<4;i+=1){const r=(1.5+i*.95)*s,start=-2.65+i*.42+Math.sin(time*.12+i)*.04,end=start+1.05+i*.18;ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.68,i*.11,start,end);ctx.stroke()}ctx.strokeStyle='rgba(220,157,65,.18)';ctx.lineWidth=2*d;ctx.beginPath();ctx.arc(p.x,p.y,2.8*s,.18,1.12);ctx.stroke();ctx.restore();
}

function drawPylon(renderer,stage,target,index,state,time){
  const cfg=OG04_IDENTITY_VISUAL_COMPONENTS_44.pylons[index]||OG04_IDENTITY_VISUAL_COMPONENTS_44.pylons[0],palette=OG04_IDENTITY_VISUAL_COMPONENTS_44.palette;
  const ctx=renderer.ctx,d=renderer.dpr,s=renderer.scale,p=renderer.worldToScreen(target.x,target.y),height=cfg.height*s;
  const colors={intact:palette.objective,active:palette.active,'heavy-damage':palette.damaged,destroyed:palette.destroyed};
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(cfg.angle);ctx.globalAlpha=state==='destroyed'?.58:1;ctx.shadowBlur=state==='active'?22*d:state==='intact'?9*d:0;ctx.shadowColor=colors[state];
  if(state==='destroyed'){
    ctx.fillStyle='rgba(62,49,72,.85)';ctx.beginPath();ctx.moveTo(-.48*s,.22*s);ctx.lineTo(-.1*s,-.3*s);ctx.lineTo(.18*s,.12*s);ctx.lineTo(.62*s,.35*s);ctx.closePath();ctx.fill();ctx.strokeStyle=colors[state];ctx.lineWidth=1.2*d;ctx.beginPath();ctx.moveTo(-.55*s,.28*s);ctx.lineTo(.52*s,-.18*s);ctx.stroke();ctx.restore();return;
  }
  const width=(index===1?.42:.34)*s;ctx.fillStyle='rgba(16,12,29,.96)';ctx.strokeStyle=colors[state];ctx.lineWidth=state==='active'?2.4*d:1.5*d;ctx.beginPath();ctx.moveTo(-width,.3*s);ctx.lineTo(-width*.58,-height);ctx.lineTo(0,-height-.28*s);ctx.lineTo(width*.62,-height*.73);ctx.lineTo(width,.3*s);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle=colors[state];ctx.globalAlpha=state==='active'?.86:.52;for(let y=-height*.75;y<-.1*s;y+=.42*s)ctx.fillRect(-width*.52,y,width*1.04,2*d);
  if(state==='heavy-damage'){ctx.globalAlpha=.8;ctx.strokeStyle='#f09a4e';ctx.beginPath();ctx.moveTo(-width*.2,-height*.86);ctx.lineTo(width*.3,-height*.58);ctx.lineTo(-width*.1,-height*.32);ctx.stroke()}
  if(state==='active'){ctx.globalAlpha=.34+.1*Math.sin(time*8);ctx.strokeStyle=palette.active;ctx.lineWidth=2*d;ctx.beginPath();ctx.arc(0,-height-.2*s,(.48+.04*Math.sin(time*6))*s,.25,5.3);ctx.stroke()}
  ctx.restore();
}

function drawOg04IdentityArena(renderer,world){
  const stage=world.room.stage42,ctx=renderer.ctx,palette=OG04_IDENTITY_VISUAL_COMPONENTS_44.palette;
  const evidence=og04SpatialEvidence44(world);world.og04SpatialEvidence44=evidence;
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=palette.void;ctx.fillRect(0,0,renderer.width,renderer.height);const glow=ctx.createRadialGradient(renderer.width*.56,renderer.height*.5,0,renderer.width*.56,renderer.height*.5,renderer.width*.56);glow.addColorStop(0,'#1a1238');glow.addColorStop(.48,palette.deep);glow.addColorStop(.76,'#070511');glow.addColorStop(1,palette.void);ctx.fillStyle=glow;ctx.fillRect(0,0,renderer.width,renderer.height);ctx.restore();
  drawBrokenShip(renderer,stage);drawBrokenArcs(renderer,stage,world.time);
  const ctx2=renderer.ctx,d=renderer.dpr;ctx2.save();ctx2.strokeStyle='rgba(108,82,140,.28)';ctx2.lineWidth=1.6*d;for(const side of[-1,1]){const a=point(renderer,stage,side*7.5,4.8),b=point(renderer,stage,side*6.2,1.1),c=point(renderer,stage,side*7.7,-4.6);ctx2.beginPath();ctx2.moveTo(a.x,a.y);ctx2.lineTo(b.x,b.y);ctx2.lineTo(c.x,c.y);ctx2.stroke()}ctx2.restore();
  const alive=(world.facilities42||[]).filter((item)=>!item.dead),active=alive.length?alive[Math.floor(world.time*.65)%alive.length]:null;
  drawSpatialLayer(renderer,world,evidence);
  (world.facilities42||[]).forEach((target,index)=>drawPylon(renderer,stage,target,index,target.visualState44||facilityVisualState44(target,target===active),world.time));
}

export function applyOg04IdentityVisual44(Renderer){
  if(Renderer.__og04IdentityVisual44)return;Renderer.__og04IdentityVisual44=true;
  const drawArena=Renderer.prototype.drawArena;
  Renderer.prototype.drawArena=function drawOg04Arena44(world){drawArena.call(this,world);if(world.run?.campaign42&&world.room?.stage42?.index===3&&world.og04VisualMode44!=='legacy')drawOg04IdentityArena(this,world)};
  const drawProjectiles=Renderer.prototype.drawProjectiles;
  Renderer.prototype.drawProjectiles=function drawCounterProjectiles44(world){drawProjectiles.call(this,world);const ctx=this.ctx;for(const shot of world.projectiles.filter((item)=>item.type==='vanguard-counter44')){const p=this.worldToScreen(shot.x,shot.y),tail=this.worldToScreen(shot.x-Math.cos(shot.angle)*1.05,shot.y-Math.sin(shot.angle)*1.05);ctx.save();ctx.globalCompositeOperation='lighter';ctx.strokeStyle='#ffd879';ctx.shadowBlur=26*this.dpr;ctx.shadowColor='#f0a83d';ctx.lineWidth=10*this.dpr;ctx.beginPath();ctx.moveTo(tail.x,tail.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.strokeStyle='#fff7d1';ctx.lineWidth=3*this.dpr;ctx.stroke();ctx.restore()}};
  const drawSlashes=Renderer.prototype.drawSlashes;
  Renderer.prototype.drawSlashes=function drawDeflectStance44(world){drawSlashes.call(this,world);const state=world.vanguardIdentity44,player=world.player;if(!state?.deflectStance||!player||world.room?.stage42?.index!==3)return;const p=this.worldToScreen(player.x,player.y),ctx=this.ctx,r=1.08*this.scale;ctx.save();ctx.translate(p.x,p.y);ctx.scale(1,.82);ctx.globalCompositeOperation='lighter';ctx.strokeStyle=state.deflectWindow?'#ffe29a':'#9b77c8';ctx.shadowBlur=state.deflectWindow?24:12;ctx.shadowColor=ctx.strokeStyle;ctx.lineWidth=(state.deflectWindow?7:4)*this.dpr;ctx.beginPath();ctx.arc(0,0,r,player.aim-.88,player.aim+.88);ctx.stroke();ctx.restore()};
  const drawVfx=Renderer.prototype.drawVfx;
  Renderer.prototype.drawVfx=function drawIdentityVfx44(world){drawVfx.call(this,world);const ctx=this.ctx;for(const v of world.vfx.filter((item)=>item.type==='vanguardCounterMuzzle44'||item.type==='vanguardDeflect44')){const p=this.worldToScreen(v.x,v.y),t=1-v.life/v.maxLife,r=(.28+t*.72)*(v.scale||1)*this.scale;ctx.save();ctx.translate(p.x,p.y);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-t;ctx.strokeStyle=v.color||'#ffd06a';ctx.shadowBlur=22*this.dpr;ctx.shadowColor=v.color||'#ffd06a';ctx.lineWidth=(v.type==='vanguardDeflect44'?5:8)*this.dpr*(1-t);ctx.beginPath();ctx.arc(0,0,r,v.type==='vanguardDeflect44'?.35:-1.1,v.type==='vanguardDeflect44'?5.4:1.1);ctx.stroke();ctx.restore()}};
}
