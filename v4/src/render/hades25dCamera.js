import { clamp } from '../core/math.js';

const VIEW = Object.freeze({
  shear:0.30,
  xLift:0.11,
  yScale:0.58,
  centerY:0.615,
  platformDepth:18,
});

const polygonPath = (ctx, points) => {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i=1;i<points.length;i+=1) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
};

const roomStructures = (layout) => {
  const structures=[];
  if(layout==='pillars') structures.push([-4,-2,1.1],[4,-2,1.1],[-4,2,1.1],[4,2,1.1]);
  if(layout==='lane') structures.push([-3.6,-1.4,.75],[-3.6,1.4,.75],[3.6,-1.4,.75],[3.6,1.4,.75]);
  if(layout==='ring') for(let i=0;i<8;i+=1){const a=i/8*Math.PI*2;structures.push([Math.cos(a)*4.4,Math.sin(a)*3.1,.62]);}
  if(layout==='islands') structures.push([-4,0,1.3],[0,-2.6,.9],[3.8,.6,1.15]);
  if(layout==='gate') structures.push([-4.8,-1.5,1],[-4.8,1.5,1],[4.8,-1.5,1],[4.8,1.5,1]);
  return structures.sort((a,b)=>a[1]-b[1]);
};

export function applyHades25DCamera(Renderer) {
  if (Renderer.__hades25dApplied) return;
  Renderer.__hades25dApplied = true;

  const previousResize = Renderer.prototype.resize;
  Renderer.prototype.resize = function resizeHades25D() {
    previousResize.call(this);
    this.scale = Math.min(this.width / 23.2, this.height / 11.6);
  };

  Renderer.prototype.worldToScreen = function worldToScreenHades25D(x,y) {
    const dx=x-this.camera.x;
    const dy=y-this.camera.y;
    const shake=this._hades25dShake||{x:0,y:0};
    return {
      x:this.width*.5+(dx-dy*VIEW.shear)*this.scale+shake.x,
      y:this.height*VIEW.centerY+(dx*VIEW.xLift+dy*VIEW.yScale)*this.scale+shake.y,
    };
  };

  Renderer.prototype.screenToWorld = function screenToWorldHades25D(x,y) {
    const shake=this._hades25dShake||{x:0,y:0};
    const sx=(x*this.dpr-this.width*.5-shake.x)/this.scale;
    const sy=(y*this.dpr-this.height*VIEW.centerY-shake.y)/this.scale;
    const determinant=VIEW.yScale+VIEW.shear*VIEW.xLift;
    const dx=(sx*VIEW.yScale+VIEW.shear*sy)/determinant;
    const dy=(sy-VIEW.xLift*sx)/determinant;
    return {x:dx+this.camera.x,y:dy+this.camera.y};
  };

  Renderer.prototype.begin = function beginHades25D(world) {
    const ctx=this.ctx;
    ctx.setTransform(1,0,0,1,0,0);
    const backdrop=ctx.createLinearGradient(0,0,0,this.height);
    backdrop.addColorStop(0,'#050b18');
    backdrop.addColorStop(.52,'#0b1730');
    backdrop.addColorStop(1,'#02050b');
    ctx.fillStyle=backdrop;
    ctx.fillRect(0,0,this.width,this.height);
    this.drawStars(world.time);

    const player=world.player&&!world.player.dead?world.player:null;
    const target=player||{x:0,y:0,aim:-Math.PI/2};
    const desiredX=clamp(target.x*.10+Math.cos(target.aim||-Math.PI/2)*.16,-.42,.42);
    const desiredY=clamp(target.y*.08+Math.sin(target.aim||-Math.PI/2)*.10,-.30,.30);
    const follow=player?.dashTimer>0?.16:.10;
    this.camera.x+=(desiredX-this.camera.x)*follow;
    this.camera.y+=(desiredY-this.camera.y)*follow;
    this.camera.shake*=.82;
    const now=performance.now();
    this._hades25dShake={
      x:Math.sin(now*.09)*this.camera.shake,
      y:Math.cos(now*.11)*this.camera.shake,
    };
    this.drawArena(world);
  };

  Renderer.prototype.drawArena = function drawArenaHades25D(world) {
    const ctx=this.ctx;
    const bounds=world.bounds;
    const tl=this.worldToScreen(bounds.left,bounds.top);
    const tr=this.worldToScreen(bounds.right,bounds.top);
    const br=this.worldToScreen(bounds.right,bounds.bottom);
    const bl=this.worldToScreen(bounds.left,bounds.bottom);
    const depth=VIEW.platformDepth*this.dpr;

    ctx.save();
    const front=[bl,br,{x:br.x,y:br.y+depth},{x:bl.x,y:bl.y+depth}];
    polygonPath(ctx,front);
    const frontGradient=ctx.createLinearGradient(0,bl.y,0,bl.y+depth);
    frontGradient.addColorStop(0,'#17324d');
    frontGradient.addColorStop(1,'#07121f');
    ctx.fillStyle=frontGradient;
    ctx.fill();

    const side=[tr,br,{x:br.x,y:br.y+depth},{x:tr.x,y:tr.y+depth}];
    polygonPath(ctx,side);
    ctx.fillStyle='#0a1c2e';
    ctx.fill();

    const top=[tl,tr,br,bl];
    polygonPath(ctx,top);
    ctx.shadowBlur=24*this.dpr;
    ctx.shadowColor='rgba(82,190,255,.34)';
    const floor=ctx.createLinearGradient(tl.x,tl.y,br.x,br.y);
    floor.addColorStop(0,'#17324b');
    floor.addColorStop(.48,'#1c3a55');
    floor.addColorStop(1,'#0d2035');
    ctx.fillStyle=floor;
    ctx.fill();
    ctx.shadowBlur=0;

    ctx.save();
    polygonPath(ctx,top);
    ctx.clip();
    ctx.globalAlpha=.24;
    ctx.strokeStyle='#8bdcff';
    ctx.lineWidth=.72*this.dpr;
    for(let x=Math.ceil(bounds.left);x<=bounds.right;x+=1){
      const a=this.worldToScreen(x,bounds.top),b=this.worldToScreen(x,bounds.bottom);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    for(let y=Math.ceil(bounds.top);y<=bounds.bottom;y+=1){
      const a=this.worldToScreen(bounds.left,y),b=this.worldToScreen(bounds.right,y);
      ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    const light=ctx.createLinearGradient(tl.x,tl.y,br.x,br.y);
    light.addColorStop(0,'rgba(120,220,255,.08)');
    light.addColorStop(.55,'rgba(80,125,210,.02)');
    light.addColorStop(1,'rgba(4,10,22,.28)');
    ctx.fillStyle=light;
    ctx.fillRect(0,0,this.width,this.height);
    ctx.restore();

    polygonPath(ctx,top);
    ctx.strokeStyle='#62c8fa';
    ctx.lineWidth=2.2*this.dpr;
    ctx.stroke();
    ctx.strokeStyle='rgba(203,244,255,.35)';
    ctx.lineWidth=.8*this.dpr;
    ctx.beginPath();ctx.moveTo(tl.x,tl.y+2*this.dpr);ctx.lineTo(tr.x,tr.y+2*this.dpr);ctx.stroke();
    ctx.restore();

    this.drawLayout(world.room?.layout||'open',bounds);
  };

  Renderer.prototype.drawLayout = function drawLayoutHades25D(layout) {
    const ctx=this.ctx;
    for(const [x,y,r] of roomStructures(layout)){
      const p=this.worldToScreen(x,y);
      const radius=r*this.scale;
      const height=Math.max(10*this.dpr,radius*.32);
      ctx.save();
      ctx.translate(p.x,p.y);
      ctx.scale(1,.48);
      ctx.fillStyle='rgba(0,0,0,.42)';
      ctx.beginPath();ctx.ellipse(radius*.12,height*.9,radius*.92,radius*.42,0,0,Math.PI*2);ctx.fill();
      ctx.restore();

      const topY=p.y-height;
      const body=ctx.createLinearGradient(p.x-radius,p.y,p.x+radius,p.y);
      body.addColorStop(0,'#12263a');
      body.addColorStop(.42,'#395873');
      body.addColorStop(1,'#0b1829');
      ctx.fillStyle=body;
      ctx.beginPath();
      ctx.moveTo(p.x-radius,p.y);
      ctx.lineTo(p.x-radius,topY);
      ctx.quadraticCurveTo(p.x,topY-radius*.22,p.x+radius,topY);
      ctx.lineTo(p.x+radius,p.y);
      ctx.quadraticCurveTo(p.x,p.y+radius*.2,p.x-radius,p.y);
      ctx.fill();

      ctx.save();
      ctx.translate(p.x,topY);
      ctx.scale(1,.46);
      const cap=ctx.createRadialGradient(-radius*.25,-radius*.22,1,0,0,radius);
      cap.addColorStop(0,'#7393ad');
      cap.addColorStop(.5,'#2a435b');
      cap.addColorStop(1,'#0c1928');
      ctx.fillStyle=cap;
      ctx.strokeStyle='#6cccf4';
      ctx.lineWidth=1.2*this.dpr;
      ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.restore();
    }
  };
}
