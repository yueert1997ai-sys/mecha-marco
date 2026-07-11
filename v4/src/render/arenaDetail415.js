const layoutAccent={open:'#7ea5b8',pillars:'#7fa8b1',lane:'#8a95b6',ring:'#9385b2',islands:'#78a59b',gate:'#b29b7d'};
const debris={
  open:[[-5.4,-3.1,.28,.08],[-2.2,2.85,.34,-.22],[4.9,-2.45,.3,.42]],
  pillars:[[-5.15,.2,.42,.12],[0,-3.25,.36,.3],[5.15,-.1,.42,-.12]],
  lane:[[-4.55,-2.55,.3,.2],[1.55,2.62,.24,-.35],[5.2,.25,.32,.08]],
  ring:[[0,-3.62,.34,.22],[-5.25,2.05,.26,-.25],[5.3,-1.82,.3,.44]],
  islands:[[-5.4,-2.82,.28,.14],[4.72,2.72,.36,-.18],[.3,3.35,.24,.3]],
  gate:[[-2.55,-3.35,.34,.12],[2.85,3.15,.3,-.2],[0,0,.2,.42]],
};

const line=(ctx,a,b,width,color,alpha=1)=>{ctx.save();ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.restore()};

export function applyArenaDetail415(Renderer){
  if(Renderer.__arenaDetail415)return;
  Renderer.__arenaDetail415=true;
  const previous=Renderer.prototype.drawArena;
  Renderer.prototype.drawArena=function drawArena415(world){
    previous.call(this,world);
    const ctx=this.ctx,bounds=world.bounds,layout=world.room?.layout||'open',accent=layoutAccent[layout]||layoutAccent.open;
    const tl=this.worldToScreen(bounds.left,bounds.top),br=this.worldToScreen(bounds.right,bounds.bottom);
    const width=br.x-tl.x,height=br.y-tl.y,time=world.time||0;
    ctx.save();
    ctx.beginPath();ctx.roundRect(tl.x,tl.y,width,height,22*this.dpr);ctx.clip();

    ctx.globalAlpha=.08;ctx.strokeStyle='#d6e4ea';ctx.lineWidth=.8*this.dpr;
    for(let index=0;index<7;index+=1){
      const y=tl.y+height*(.12+index*.125)+Math.sin(time*.18+index)*1.5*this.dpr;
      ctx.beginPath();ctx.moveTo(tl.x+width*.04,y);ctx.lineTo(br.x-width*.04,y);ctx.stroke();
    }

    const railY=[bounds.top+.35,bounds.bottom-.35];
    for(const y of railY){
      const a=this.worldToScreen(bounds.left+.6,y),b=this.worldToScreen(bounds.right-.6,y);
      line(ctx,a,b,5*this.dpr,'rgba(5,10,18,.48)',.7);
      line(ctx,a,b,1*this.dpr,accent,.24);
      for(let marker=0;marker<10;marker+=1){
        const t=(marker+.5)/10,x=a.x+(b.x-a.x)*t;
        ctx.save();ctx.translate(x,a.y);ctx.rotate(marker%2?-.62:.62);ctx.fillStyle='rgba(205,219,223,.13)';ctx.fillRect(-5*this.dpr,-1.2*this.dpr,10*this.dpr,2.4*this.dpr);ctx.restore();
      }
    }

    for(const [x,y,size,angle] of debris[layout]||debris.open){
      const p=this.worldToScreen(x,y),px=size*this.scale;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);
      ctx.fillStyle='rgba(183,201,211,.11)';ctx.strokeStyle='rgba(126,169,191,.18)';ctx.lineWidth=.9*this.dpr;
      ctx.beginPath();ctx.roundRect(-px*.55,-px*.28,px*1.1,px*.56,3*this.dpr);ctx.fill();ctx.stroke();
      ctx.fillStyle='rgba(7,12,20,.42)';ctx.fillRect(-px*.2,-px*.08,px*.4,px*.16);
      ctx.restore();
    }

    const center=this.worldToScreen(0,0);
    ctx.save();ctx.translate(center.x,center.y);ctx.strokeStyle=accent;ctx.globalAlpha=.12;ctx.lineWidth=1*this.dpr;ctx.setLineDash([8*this.dpr,7*this.dpr]);
    ctx.beginPath();ctx.arc(0,0,Math.min(width,height)*.17,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='rgba(228,238,241,.12)';ctx.font=`${Math.max(8,10*this.dpr)}px system-ui`;ctx.textAlign='center';ctx.fillText((layout||'open').toUpperCase(),0,4*this.dpr);
    ctx.restore();

    const sweepX=tl.x+((time*.045)%1)*width;
    const sweep=ctx.createLinearGradient(sweepX-50*this.dpr,0,sweepX+50*this.dpr,0);
    sweep.addColorStop(0,'rgba(150,207,226,0)');sweep.addColorStop(.5,'rgba(150,207,226,.035)');sweep.addColorStop(1,'rgba(150,207,226,0)');
    ctx.fillStyle=sweep;ctx.fillRect(tl.x,tl.y,width,height);
    ctx.restore();
  };
}
