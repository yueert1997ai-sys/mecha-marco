import { clamp } from '../core/math.js';
import { ORBITAL_GRAVEYARD_STAGES_42 } from '../data/regionOrbitalGraveyard42.js';

const rounded=(ctx,x,y,w,h,r)=>{
  const q=Math.min(r,w*.5,h*.5);
  ctx.beginPath();ctx.moveTo(x+q,y);ctx.lineTo(x+w-q,y);ctx.quadraticCurveTo(x+w,y,x+w,y+q);ctx.lineTo(x+w,y+h-q);ctx.quadraticCurveTo(x+w,y+h,x+w-q,y+h);ctx.lineTo(x+q,y+h);ctx.quadraticCurveTo(x,y+h,x,y+q);ctx.lineTo(x,y+q);ctx.quadraticCurveTo(x,y,x+q,y);ctx.closePath();
};

const structureMap={
  open:[],
  gate:[[-4.8,-1.6,1],[-4.8,1.6,1],[4.8,-1.6,1],[4.8,1.6,1]],
  pillars:[[-4,-2,1.05],[4,-2,1.05],[-4,2,1.05],[4,2,1.05]],
  lane:[[-3.6,-1.5,.8],[-3.6,1.5,.8],[3.6,-1.5,.8],[3.6,1.5,.8]],
  ring:Array.from({length:8},(_,i)=>{const a=i/8*Math.PI*2;return[Math.cos(a)*4.25,Math.sin(a)*3.05,.66]}),
  islands:[[-4,0,1.28],[0,-2.55,.92],[3.8,.65,1.12]],
  arena:[[-5.2,-2.7,.7],[5.2,-2.7,.7],[-5.2,2.7,.7],[5.2,2.7,.7]],
  boss:Array.from({length:6},(_,i)=>{const a=i/6*Math.PI*2;return[Math.cos(a)*5.2,Math.sin(a)*3.5,.55]}),
};

const drawOctagon=(ctx,x,y,r,fill,stroke,lineWidth)=>{
  ctx.beginPath();
  for(let i=0;i<8;i+=1){const a=-Math.PI*.5+i/8*Math.PI*2;const px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}
  ctx.closePath();ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle=stroke;ctx.lineWidth=lineWidth;ctx.stroke();
};

function drawStagePattern(renderer,stage,time=0){
  const ctx=renderer.ctx,d=renderer.dpr,s=renderer.scale,cy=stage.centerY,at=(x,y)=>renderer.worldToScreen(x,cy+y),kind=stage.spatial?.floor;
  ctx.save();ctx.globalAlpha=.22;ctx.strokeStyle=stage.theme.line;ctx.fillStyle=stage.theme.accent;ctx.lineWidth=1.2*d;
  if(kind==='armor-lanes'||kind==='rail-grid'||kind==='pursuit-vectors')for(const x of[-6,-3,0,3,6]){const a=at(x,-5),b=at(x,5);ctx.lineWidth=(x===0?3:1)*d;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  if(kind==='drift-shadows')for(let i=0;i<9;i+=1){const p=at(-7+(i*3.1)%14,-4+(i*1.9)%8);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(i*.7+time*.04);ctx.fillRect(-18*d,-3*d,36*d,6*d);ctx.restore()}
  if(kind==='scan-bands')for(let i=0;i<4;i+=1){const y=-4+((time*.8+i*2.4)%8);const a=at(-8,y),b=at(8,y);ctx.globalAlpha=.12+i*.035;ctx.lineWidth=(5+i)*d;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  if(kind==='service-chevrons')for(let y=-4;y<=4;y+=1.35)for(const x of[-5.8,5.8]){const p=at(x,y);ctx.beginPath();ctx.moveTo(p.x-12*d,p.y-8*d);ctx.lineTo(p.x,p.y);ctx.lineTo(p.x-12*d,p.y+8*d);ctx.stroke()}
  if(kind==='honor-rays'||kind==='command-sigil'){const p=at(0,0);for(let i=0;i<12;i+=1){const a=i/12*Math.PI*2;ctx.beginPath();ctx.moveTo(p.x+Math.cos(a)*28*d,p.y+Math.sin(a)*28*d);ctx.lineTo(p.x+Math.cos(a)*5.2*s,p.y+Math.sin(a)*4.4*s);ctx.stroke()}}
  if(kind==='conduit-arcs'||kind==='core-orbits'||kind==='sealed-void'){const p=at(0,0);for(let i=1;i<=4;i+=1){ctx.lineWidth=(i===4?3:1)*d;ctx.beginPath();ctx.ellipse(p.x,p.y,i*1.2*s,i*.86*s,0,0,Math.PI*2);ctx.stroke()}}
  if(kind==='grave-slabs')for(let x=-7;x<=7;x+=2)for(let y=-4;y<=4;y+=2){const p=at(x+(Math.abs(y)%4?1:0),y);ctx.strokeRect(p.x-.72*s,p.y-.58*s,1.44*s,1.16*s)}
  if(kind==='pursuit-vectors')for(let y=-4;y<=3;y+=2){const p=at(0,y);ctx.beginPath();ctx.moveTo(p.x-22*d,p.y+10*d);ctx.lineTo(p.x,p.y-10*d);ctx.lineTo(p.x+22*d,p.y+10*d);ctx.stroke()}
  ctx.restore();
}

function drawFacilities(renderer,world,stage){
  const facilities=world.facilities42||[];if(!facilities.length)return;const ctx=renderer.ctx,d=renderer.dpr;
  for(const target of facilities){const p=renderer.worldToScreen(target.x,target.y),ratio=Math.max(0,target.hp/target.maxHp);ctx.save();ctx.globalAlpha=target.dead?.22:1;ctx.translate(p.x,p.y);ctx.shadowBlur=target.dead?0:18*d;ctx.shadowColor=stage.theme.accent;drawOctagon(ctx,0,0,26*d,'rgba(8,15,24,.9)',stage.theme.accent,2*d);ctx.fillStyle=stage.theme.accent;ctx.fillRect(-17*d,-4*d,34*d*ratio,8*d);ctx.strokeStyle='rgba(255,255,255,.5)';ctx.strokeRect(-17*d,-4*d,34*d,8*d);if(target.dead){ctx.strokeStyle='rgba(255,255,255,.32)';ctx.beginPath();ctx.moveTo(-18*d,-18*d);ctx.lineTo(18*d,18*d);ctx.moveTo(18*d,-18*d);ctx.lineTo(-18*d,18*d);ctx.stroke()}ctx.restore()}
}

function drawLandmark(renderer,stage){
  const ctx=renderer.ctx,s=renderer.scale,d=renderer.dpr,cy=stage.centerY;
  const at=(x,y)=>renderer.worldToScreen(x,cy+y);
  ctx.save();ctx.globalAlpha=.72;
  const accent=stage.theme.accent;
  if(stage.landmark==='wrecks'){
    for(const [x,y,a] of[[-5,-2,.24],[3.8,.5,-.42],[-1.2,2.8,.12]]){const p=at(x,y);ctx.save();ctx.translate(p.x,p.y);ctx.rotate(a);ctx.fillStyle='rgba(117,132,143,.34)';ctx.strokeStyle='rgba(182,197,204,.24)';ctx.lineWidth=1*d;ctx.beginPath();ctx.moveTo(-1.2*s,-.18*s);ctx.lineTo(.75*s,-.42*s);ctx.lineTo(1.35*s,.08*s);ctx.lineTo(.42*s,.3*s);ctx.lineTo(-.9*s,.22*s);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
  }
  if(stage.landmark==='scanner'){
    for(const x of[-5,0,5]){const p=at(x,-1.1);ctx.strokeStyle=accent;ctx.lineWidth=2*d;ctx.beginPath();ctx.arc(p.x,p.y,22*d,0,Math.PI*2);ctx.stroke();ctx.fillStyle='rgba(227,242,244,.22)';ctx.fillRect(p.x-4*d,p.y-24*d,8*d,48*d)}
  }
  if(stage.landmark==='memorial'){
    const p=at(0,0);ctx.fillStyle='rgba(236,230,207,.18)';ctx.strokeStyle='rgba(237,222,175,.48)';ctx.lineWidth=1.2*d;ctx.beginPath();ctx.moveTo(p.x,p.y-78*d);ctx.lineTo(p.x+24*d,p.y+42*d);ctx.lineTo(p.x-24*d,p.y+42*d);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='rgba(248,239,208,.5)';ctx.font=`${12*d}px system-ui`;ctx.textAlign='center';ctx.fillText('终结七年战争的无名王牌',p.x,p.y+66*d);
  }
  if(stage.landmark==='seal'||stage.landmark==='grave-core'||stage.landmark==='core-ring'){
    const p=at(0,0);for(let i=0;i<3;i+=1){ctx.strokeStyle=`rgba(176,70,91,${.3-i*.06})`;ctx.lineWidth=(2-i*.35)*d;ctx.beginPath();ctx.arc(p.x,p.y,(58+i*28)*d,0,Math.PI*2);ctx.stroke()}
  }
  if(stage.landmark==='tombs'){
    for(const [x,y] of[[-5,-2],[-2,1.9],[2.2,-1.2],[5,2.1]]){const p=at(x,y);ctx.fillStyle='rgba(112,123,142,.25)';ctx.strokeStyle='rgba(174,182,198,.22)';ctx.fillRect(p.x-10*d,p.y-28*d,20*d,56*d);ctx.strokeRect(p.x-10*d,p.y-28*d,20*d,56*d)}
  }
  if(stage.landmark==='dock'||stage.landmark==='scaffold'){
    for(const side of[-1,1]){const p=at(side*6,0);ctx.strokeStyle='rgba(163,180,183,.3)';ctx.lineWidth=5*d;ctx.beginPath();ctx.moveTo(p.x,p.y-4.8*s);ctx.lineTo(p.x,p.y+4.8*s);ctx.stroke();for(let y=-4;y<=4;y+=2){const q=at(side*6,y);ctx.fillStyle='rgba(190,166,120,.25)';ctx.fillRect(q.x-18*d,q.y-4*d,36*d,8*d)}}
  }
  if(stage.landmark==='barricade'||stage.landmark==='forecourt'||stage.landmark==='pursuit'){
    const p=at(0,-4.7);ctx.fillStyle='rgba(143,61,72,.2)';ctx.strokeStyle='rgba(197,104,112,.42)';ctx.lineWidth=2*d;ctx.fillRect(p.x-4.8*s,p.y-10*d,9.6*s,20*d);ctx.strokeRect(p.x-4.8*s,p.y-10*d,9.6*s,20*d);
  }
  ctx.restore();
}

function drawSector(renderer,stage,currentIndex,exitOpen,world){
  const ctx=renderer.ctx,d=renderer.dpr,b={left:-9,right:9,top:stage.centerY-6,bottom:stage.centerY+6};
  const tl=renderer.worldToScreen(b.left,b.top),br=renderer.worldToScreen(b.right,b.bottom);const x=tl.x,y=tl.y,w=br.x-tl.x,h=br.y-tl.y;
  if(y>renderer.height+120*d||y+h<-120*d)return;
  ctx.save();rounded(ctx,x,y,w,h,20*d);ctx.shadowBlur=stage.index===currentIndex?26*d:8*d;ctx.shadowColor=stage.theme.accent;const floor=ctx.createLinearGradient(x,y,x+w,y+h);floor.addColorStop(0,stage.theme.top);floor.addColorStop(1,stage.theme.bottom);ctx.fillStyle=floor;ctx.fill();ctx.shadowBlur=0;ctx.save();rounded(ctx,x,y,w,h,20*d);ctx.clip();ctx.globalAlpha=.15;ctx.strokeStyle=stage.theme.line;ctx.lineWidth=.7*d;for(let gx=-8;gx<=8;gx+=1){const a=renderer.worldToScreen(gx,b.top),c=renderer.worldToScreen(gx,b.bottom);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(c.x,c.y);ctx.stroke()}for(let gy=Math.ceil(b.top);gy<=b.bottom;gy+=1){const a=renderer.worldToScreen(b.left,gy),c=renderer.worldToScreen(b.right,gy);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(c.x,c.y);ctx.stroke()}ctx.restore();rounded(ctx,x,y,w,h,20*d);ctx.strokeStyle=stage.index===currentIndex?stage.theme.line:'rgba(146,162,176,.14)';ctx.lineWidth=(stage.index===currentIndex?1.8:.8)*d;ctx.stroke();ctx.restore();

  drawStagePattern(renderer,stage,world.time);
  drawLandmark(renderer,stage);
  if(stage.index===currentIndex)drawFacilities(renderer,world,stage);
  for(const [sx,sy,r] of(structureMap[stage.layout]||[])){
    const p=renderer.worldToScreen(sx,stage.centerY+sy),radius=r*renderer.scale;ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='rgba(0,0,0,.34)';ctx.beginPath();ctx.ellipse(radius*.1,radius*.15,radius*.95,radius*.64,0,0,Math.PI*2);ctx.fill();const body=ctx.createRadialGradient(-radius*.3,-radius*.3,2,0,0,radius);body.addColorStop(0,'rgba(170,184,191,.72)');body.addColorStop(.45,'rgba(54,68,80,.92)');body.addColorStop(1,'rgba(10,16,24,.98)');drawOctagon(ctx,0,0,radius,body,stage.theme.line,1*d);ctx.restore();
  }

  const label=renderer.worldToScreen(-8.2,stage.centerY+5.15);ctx.save();ctx.fillStyle='rgba(226,234,239,.55)';ctx.font=`700 ${10*d}px system-ui`;ctx.textAlign='left';ctx.fillText(`${stage.code}  ${stage.name}`,label.x,label.y);ctx.restore();

  if(stage.index<ORBITAL_GRAVEYARD_STAGES_42.length-1){
    const gate=renderer.worldToScreen(0,stage.centerY-5.75);ctx.save();ctx.strokeStyle=stage.index===currentIndex&&exitOpen?'rgba(125,216,205,.9)':'rgba(181,74,87,.7)';ctx.lineWidth=4*d;ctx.beginPath();ctx.moveTo(gate.x-3.4*renderer.scale,gate.y);ctx.lineTo(gate.x+3.4*renderer.scale,gate.y);ctx.stroke();if(stage.index===currentIndex&&exitOpen){ctx.fillStyle='rgba(160,230,218,.8)';ctx.font=`700 ${11*d}px system-ui`;ctx.textAlign='center';ctx.fillText('闸门开放 · 向北推进',gate.x,gate.y-10*d)}ctx.restore();
  }
}

export function applyContinuousCampaignRenderer42(Renderer){
  if(Renderer.__continuousCampaign42)return;
  Renderer.__continuousCampaign42=true;
  const previousBegin=Renderer.prototype.begin;
  const previousArena=Renderer.prototype.drawArena;

  Renderer.prototype.begin=function beginContinuous42(world){
    if(!world.run?.campaign42)return previousBegin.call(this,world);
    const stage=world.room?.stage42||ORBITAL_GRAVEYARD_STAGES_42[world.run.stageIndex||0];
    const ctx=this.ctx;ctx.setTransform(1,0,0,1,0,0);const bg=ctx.createRadialGradient(this.width*.5,this.height*.46,0,this.width*.5,this.height*.5,Math.max(this.width,this.height)*.72);bg.addColorStop(0,stage.theme.top);bg.addColorStop(.6,'#070b12');bg.addColorStop(1,'#010307');ctx.fillStyle=bg;ctx.fillRect(0,0,this.width,this.height);this.drawStars(world.time);
    const player=world.player&&!world.player.dead?world.player:null;const target=player||{x:0,y:stage.centerY};const desiredX=clamp(target.x*.08,-1.15,1.15);const desiredY=target.y-1.05;const follow=player?.dashTimer>0?.19:.13;this.camera.x+=(desiredX-this.camera.x)*follow;this.camera.y+=(desiredY-this.camera.y)*follow;this.camera.shake*=.82;const now=performance.now();this._viewShakeX=Math.sin(now*.09)*this.camera.shake;this._viewShakeY=Math.cos(now*.11)*this.camera.shake;this.drawArena(world);
  };

  Renderer.prototype.drawArena=function drawContinuousArena42(world){
    if(!world.run?.campaign42)return previousArena.call(this,world);
    const current=world.run.stageIndex||0;
    for(let i=Math.max(0,current-1);i<=Math.min(ORBITAL_GRAVEYARD_STAGES_42.length-1,current+1);i+=1){
      const stage=(i===current&&world.room?.stage42)||ORBITAL_GRAVEYARD_STAGES_42[i];
      drawSector(this,stage,current,Boolean(world.run.exitOpen),world);
      if(i<ORBITAL_GRAVEYARD_STAGES_42.length-1){const next=ORBITAL_GRAVEYARD_STAGES_42[i+1];const a=this.worldToScreen(-3.4,stage.centerY-6),b=this.worldToScreen(3.4,next.centerY+6);const ctx=this.ctx;ctx.save();const g=ctx.createLinearGradient(a.x,a.y,b.x,b.y);g.addColorStop(0,'rgba(69,83,96,.7)');g.addColorStop(.5,'rgba(25,32,42,.9)');g.addColorStop(1,'rgba(69,83,96,.7)');const rx=Math.min(a.x,b.x),ry=Math.min(a.y,b.y),rw=Math.abs(b.x-a.x),rh=Math.abs(b.y-a.y);ctx.fillStyle=g;ctx.fillRect(rx,ry,rw,rh);ctx.strokeStyle='rgba(128,148,163,.2)';ctx.strokeRect(rx,ry,rw,rh);ctx.restore()}
    }
  };
}
