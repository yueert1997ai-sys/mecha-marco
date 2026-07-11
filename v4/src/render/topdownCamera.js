import { clamp } from '../core/math.js';

const VIEW = Object.freeze({
  centerY:0.56,
  arenaPadding:18,
});

const roundedRect = (ctx,x,y,w,h,r) => {
  const radius=Math.min(r,w*.5,h*.5);
  ctx.beginPath();
  ctx.moveTo(x+radius,y);
  ctx.lineTo(x+w-radius,y);
  ctx.quadraticCurveTo(x+w,y,x+w,y+radius);
  ctx.lineTo(x+w,y+h-radius);
  ctx.quadraticCurveTo(x+w,y+h,x+w-radius,y+h);
  ctx.lineTo(x+radius,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-radius);
  ctx.lineTo(x,y+radius);
  ctx.quadraticCurveTo(x,y,x+radius,y);
  ctx.closePath();
};

const layoutStructures = (layout) => {
  const items=[];
  if(layout==='pillars') items.push([-4,-2,1.05],[4,-2,1.05],[-4,2,1.05],[4,2,1.05]);
  if(layout==='lane') items.push([-3.6,-1.5,.8],[-3.6,1.5,.8],[3.6,-1.5,.8],[3.6,1.5,.8]);
  if(layout==='ring') for(let i=0;i<8;i+=1){const a=i/8*Math.PI*2;items.push([Math.cos(a)*4.25,Math.sin(a)*3.05,.66]);}
  if(layout==='islands') items.push([-4,0,1.28],[0,-2.55,.92],[3.8,.65,1.12]);
  if(layout==='gate') items.push([-4.8,-1.6,1],[-4.8,1.6,1],[4.8,-1.6,1],[4.8,1.6,1]);
  return items;
};

export function applyTopDownCamera(Renderer) {
  if (Renderer.__topDownApplied) return;
  Renderer.__topDownApplied = true;

  const previousResize=Renderer.prototype.resize;
  Renderer.prototype.resize=function resizeTopDown(){
    previousResize.call(this);
    this.scale=Math.min(this.width/23.8,this.height/14.7);
  };

  Renderer.prototype.worldToScreen=function worldToScreenTopDown(x,y){
    const shakeX=this._viewShakeX||0;
    const shakeY=this._viewShakeY||0;
    return {
      x:this.width*.5+(x-this.camera.x)*this.scale+shakeX,
      y:this.height*VIEW.centerY+(y-this.camera.y)*this.scale+shakeY,
    };
  };

  Renderer.prototype.screenToWorld=function screenToWorldTopDown(x,y){
    return {
      x:(x*this.dpr-this.width*.5-(this._viewShakeX||0))/this.scale+this.camera.x,
      y:(y*this.dpr-this.height*VIEW.centerY-(this._viewShakeY||0))/this.scale+this.camera.y,
    };
  };

  Renderer.prototype.begin=function beginTopDown(world){
    const ctx=this.ctx;
    ctx.setTransform(1,0,0,1,0,0);
    const backdrop=ctx.createRadialGradient(this.width*.5,this.height*.5,0,this.width*.5,this.height*.5,Math.max(this.width,this.height)*.68);
    backdrop.addColorStop(0,'#101d35');
    backdrop.addColorStop(.58,'#071326');
    backdrop.addColorStop(1,'#02050b');
    ctx.fillStyle=backdrop;
    ctx.fillRect(0,0,this.width,this.height);
    this.drawStars(world.time);

    const player=world.player&&!world.player.dead?world.player:null;
    const target=player||{x:0,y:0};
    const desiredX=clamp(target.x*.12,-.9,.9);
    const desiredY=clamp(target.y*.12,-.72,.72);
    const follow=player?.dashTimer>0?.17:.11;
    this.camera.x+=(desiredX-this.camera.x)*follow;
    this.camera.y+=(desiredY-this.camera.y)*follow;
    this.camera.shake*=.82;
    const now=performance.now();
    this._viewShakeX=Math.sin(now*.09)*this.camera.shake;
    this._viewShakeY=Math.cos(now*.11)*this.camera.shake;
    this.drawArena(world);
  };

  Renderer.prototype.drawArena=function drawArenaTopDown(world){
    const ctx=this.ctx;
    const bounds=world.bounds;
    const tl=this.worldToScreen(bounds.left,bounds.top);
    const br=this.worldToScreen(bounds.right,bounds.bottom);
    const x=tl.x,y=tl.y,w=br.x-tl.x,h=br.y-tl.y;

    ctx.save();
    roundedRect(ctx,x,y,w,h,22*this.dpr);
    ctx.shadowBlur=28*this.dpr;
    ctx.shadowColor='rgba(64,181,255,.32)';
    const floor=ctx.createLinearGradient(x,y,x+w,y+h);
    floor.addColorStop(0,'#17324b');
    floor.addColorStop(.52,'#1a3852');
    floor.addColorStop(1,'#0b2035');
    ctx.fillStyle=floor;
    ctx.fill();
    ctx.shadowBlur=0;

    ctx.save();
    roundedRect(ctx,x,y,w,h,22*this.dpr);
    ctx.clip();
    ctx.globalAlpha=.22;
    ctx.strokeStyle='#91dcff';
    ctx.lineWidth=.7*this.dpr;
    for(let gx=Math.ceil(bounds.left);gx<=bounds.right;gx+=1){
      const a=this.worldToScreen(gx,bounds.top),b=this.worldToScreen(gx,bounds.bottom);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    for(let gy=Math.ceil(bounds.top);gy<=bounds.bottom;gy+=1){
      const a=this.worldToScreen(bounds.left,gy),b=this.worldToScreen(bounds.right,gy);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    const vignette=ctx.createRadialGradient(x+w*.5,y+h*.5,Math.min(w,h)*.08,x+w*.5,y+h*.5,Math.max(w,h)*.72);
    vignette.addColorStop(0,'rgba(115,206,255,.05)');
    vignette.addColorStop(1,'rgba(0,4,13,.34)');
    ctx.fillStyle=vignette;
    ctx.fillRect(x,y,w,h);
    ctx.restore();

    roundedRect(ctx,x,y,w,h,22*this.dpr);
    ctx.strokeStyle='#62c8fa';
    ctx.lineWidth=2.2*this.dpr;
    ctx.stroke();
    ctx.strokeStyle='rgba(210,246,255,.34)';
    ctx.lineWidth=.8*this.dpr;
    roundedRect(ctx,x+2*this.dpr,y+2*this.dpr,w-4*this.dpr,h-4*this.dpr,20*this.dpr);
    ctx.stroke();
    ctx.restore();

    this.drawLayout(world.room?.layout||'open',bounds);
  };

  Renderer.prototype.drawLayout=function drawLayoutTopDown(layout){
    const ctx=this.ctx;
    for(const [x,y,r] of layoutStructures(layout)){
      const p=this.worldToScreen(x,y);
      const radius=r*this.scale;
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.fillStyle='rgba(0,0,0,.34)';
      ctx.beginPath();ctx.ellipse(radius*.12,radius*.16,radius*.96,radius*.62,0,0,Math.PI*2);ctx.fill();
      const body=ctx.createRadialGradient(-radius*.32,-radius*.34,2,0,0,radius);
      body.addColorStop(0,'#6f8ca7');
      body.addColorStop(.42,'#2e4a64');
      body.addColorStop(1,'#0a1727');
      ctx.fillStyle=body;
      ctx.strokeStyle='#65c6f3';
      ctx.lineWidth=1.15*this.dpr;
      ctx.beginPath();
      for(let i=0;i<8;i+=1){
        const a=-Math.PI*.5+i/8*Math.PI*2;
        const px=Math.cos(a)*radius,py=Math.sin(a)*radius;
        if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.closePath();ctx.fill();ctx.stroke();
      ctx.fillStyle='rgba(159,226,255,.16)';
      ctx.beginPath();ctx.arc(-radius*.2,-radius*.2,radius*.42,0,Math.PI*2);ctx.fill();
      ctx.restore();
    }
  };
}
