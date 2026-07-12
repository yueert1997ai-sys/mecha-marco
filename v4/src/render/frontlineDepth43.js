const point=(renderer,stage,x,y)=>renderer.worldToScreen(x,stage.centerY+y);

function drawBoundary(renderer,stage){
  const ctx=renderer.ctx,d=renderer.dpr,profile=stage.spatial?.widthProfile;if(!profile?.length)return;
  const sorted=[...profile].sort((a,b)=>b[0]-a[0]);
  ctx.save();ctx.strokeStyle=stage.theme.line;ctx.lineWidth=2.6*d;ctx.shadowBlur=12*d;ctx.shadowColor=stage.theme.accent;
  for(const side of[-1,1]){ctx.beginPath();sorted.forEach(([y,w],i)=>{const p=point(renderer,stage,side*w,y);if(i)ctx.lineTo(p.x,p.y);else ctx.moveTo(p.x,p.y)});ctx.stroke()}
  ctx.shadowBlur=0;ctx.globalAlpha=.25;ctx.lineWidth=.8*d;
  for(const [y,w] of sorted){const a=point(renderer,stage,-w,y),b=point(renderer,stage,w,y);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
  ctx.restore();
}

function drawMassLandmark(renderer,stage,time){
  const ctx=renderer.ctx,d=renderer.dpr,s=renderer.scale,kind=stage.spatial?.shape,p=point(renderer,stage,0,0);ctx.save();ctx.globalAlpha=.32;ctx.fillStyle=stage.theme.accent;ctx.strokeStyle=stage.theme.line;ctx.lineWidth=1.3*d;
  if(kind==='breach'){for(const side of[-1,1]){const q=point(renderer,stage,side*8,-2);ctx.save();ctx.translate(q.x,q.y);ctx.fillRect(-1.5*s,-4.8*s,3*s,9.6*s);for(let i=-3;i<=3;i+=2){ctx.beginPath();ctx.moveTo(-1.7*s,i*s);ctx.lineTo(1.7*s,(i+.8)*s);ctx.stroke()}ctx.restore()}}
  if(kind==='islands'){for(let i=0;i<5;i+=1){const q=point(renderer,stage,-7+i*3.5,-4+(i%3)*3.2);ctx.save();ctx.translate(q.x,q.y);ctx.rotate(time*.03+i);ctx.fillRect(-1.8*s,-.22*s,3.6*s,.44*s);ctx.restore()}}
  if(kind==='fork'){ctx.lineWidth=7*d;for(const side of[-1,1]){const a=point(renderer,stage,0,1),b=point(renderer,stage,side*6,-5);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}}
  if(kind==='scanner'){const sweep=((time*.7)%1)*Math.PI*2;ctx.globalAlpha=.14;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.arc(p.x,p.y,6*s,sweep-.25,sweep+.25);ctx.closePath();ctx.fill()}
  if(kind==='apron'){const q=point(renderer,stage,0,-5.3);ctx.fillRect(q.x-4.8*s,q.y-.65*s,9.6*s,1.3*s);ctx.globalAlpha=.12;ctx.fillRect(q.x-2.4*s,q.y-4*s,4.8*s,8*s)}
  if(kind==='memorial'){for(let i=0;i<7;i+=1){const a=i/7*Math.PI*2,q=point(renderer,stage,Math.cos(a)*6.6,Math.sin(a)*4.8);ctx.save();ctx.translate(q.x,q.y);ctx.rotate(a);ctx.fillRect(-.32*s,-1.6*s,.64*s,3.2*s);ctx.restore()}}
  if(kind==='ring'||kind==='iris'||kind==='sanctum'){for(let i=1;i<=3;i+=1){ctx.beginPath();ctx.ellipse(p.x,p.y,(2+i*1.5)*s,(1.4+i)*s,time*.02*(i%2?1:-1),0,Math.PI*2);ctx.stroke()}}
  if(kind==='chase'){for(let y=-4;y<=4;y+=2){const q=point(renderer,stage,0,y-((time*1.8)%2));ctx.beginPath();ctx.moveTo(q.x-18*d,q.y+10*d);ctx.lineTo(q.x,q.y-10*d);ctx.lineTo(q.x+18*d,q.y+10*d);ctx.stroke()}}
  if(kind==='maze'){for(const [x,y] of[[-6,-3],[-2,2],[2,-2],[6,2]]){const q=point(renderer,stage,x,y);ctx.fillRect(q.x-.5*s,q.y-1.5*s,1*s,3*s)}}
  if(kind==='court'){const q=point(renderer,stage,0,-4.8);ctx.fillRect(q.x-5.5*s,q.y-.45*s,11*s,.9*s);for(const side of[-1,1])ctx.fillRect(q.x+side*5.2*s,q.y-3*s,.65*s,6*s)}
  ctx.restore();
}

function drawMission(renderer,world,stage){
  const mission=world.run?.mission43,optional=stage.spatial?.optional;if(!mission)return;const ctx=renderer.ctx,d=renderer.dpr,s=renderer.scale;ctx.save();
  const marker=(x,y,color,label,progress=0)=>{const p=renderer.worldToScreen(x,y);ctx.strokeStyle=color;ctx.fillStyle='rgba(5,11,18,.78)';ctx.lineWidth=2*d;ctx.beginPath();ctx.arc(p.x,p.y,28*d,0,Math.PI*2);ctx.fill();ctx.stroke();if(progress>0){ctx.beginPath();ctx.arc(p.x,p.y,34*d,-Math.PI*.5,-Math.PI*.5+Math.PI*2*progress);ctx.stroke()}ctx.fillStyle=color;ctx.font=`700 ${9*d}px system-ui`;ctx.textAlign='center';ctx.fillText(label,p.x,p.y+4*d)};
  if(mission.type==='capture'&&mission.points?.length)mission.points.forEach((item,index)=>marker(item.x,item.y,index<mission.pointIndex?'#b9a174':index===mission.pointIndex?stage.theme.line:'#596873',index<mission.pointIndex?'已同步':`序列 ${index+1}`,index===mission.pointIndex?mission.progress/mission.max:0));
  else if(mission.type==='capture')marker(mission.x||0,stage.centerY+(mission.y||-3.3),stage.theme.line,mission.label,mission.progress/mission.max);
  if(mission.type==='defense')marker(mission.x,mission.y,mission.failed?'#b54f63':'#b9a174','补给舰',mission.hp/mission.maxHp);
  if(optional?.type==='salvage'&&!world.run.optionalObjectives.includes('wreck-salvage'))marker(optional.x,stage.centerY+optional.y,'#b9a174','黑匣子',(world.run.salvageProgress43||0)/optional.duration);
  if(optional?.type==='sabotage'&&!world.run.optionalObjectives.includes('outer-sabotage'))marker(0,stage.centerY+3.5,'#78aebb','战术端口',(world.run.sabotageProgress43||0)/1.8);
  const boss=world.enemies.find((enemy)=>enemy.boss&&!enemy.dead);if(boss){const p=renderer.worldToScreen(0,stage.centerY);ctx.globalAlpha=.18+.04*boss.phase;ctx.strokeStyle=stage.theme.accent;ctx.lineWidth=(2+boss.phase)*d;ctx.beginPath();ctx.arc(p.x,p.y,(5.8-boss.phase*.65)*s,0,Math.PI*2);ctx.stroke()}
  ctx.restore();
}

export function applyFrontlineRenderer43(Renderer){
  if(Renderer.__frontlineRenderer43)return;Renderer.__frontlineRenderer43=true;
  const drawArena=Renderer.prototype.drawArena;
  Renderer.prototype.drawArena=function drawFrontlineArena43(world){drawArena.call(this,world);if(!world.run?.campaign42)return;const stage=world.room?.stage42;if(!stage)return;drawBoundary(this,stage);drawMassLandmark(this,stage,world.time);drawMission(this,world,stage)};
}
