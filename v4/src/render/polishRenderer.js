const clamp01 = (value) => Math.max(0, Math.min(1, value));

const roomAccent = {
  open: '#53c8ff',
  pillars: '#6fe6ff',
  lane: '#7b93ff',
  ring: '#b26dff',
  islands: '#5fe0bf',
  gate: '#ffb75e',
};

function drawLine(ctx, a, b, width, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

export function applyRendererPolish(Renderer) {
  if (Renderer.__v4PolishApplied) return;
  Renderer.__v4PolishApplied = true;

  const originalResize = Renderer.prototype.resize;
  Renderer.prototype.resize = function resizeWithExpandedView() {
    originalResize.call(this);
    const coarse = matchMedia('(pointer:coarse)').matches;
    this.scale *= coarse ? .84 : .9;
  };

  const originalArena = Renderer.prototype.drawArena;
  Renderer.prototype.drawArena = function drawArenaWithRoomIdentity(world) {
    originalArena.call(this, world);
    const ctx = this.ctx;
    const bounds = world.bounds;
    const layout = world.room?.layout || 'open';
    const accent = roomAccent[layout] || roomAccent.open;
    const center = this.worldToScreen(0, 0);
    const tl = this.worldToScreen(bounds.left, bounds.top);
    const br = this.worldToScreen(bounds.right, bounds.bottom);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';

    if (layout === 'ring') {
      ctx.translate(center.x, center.y);
      ctx.scale(1, .82);
      ctx.strokeStyle = accent;
      ctx.globalAlpha = .22;
      ctx.lineWidth = 5 * this.dpr;
      ctx.setLineDash([18 * this.dpr, 11 * this.dpr]);
      ctx.beginPath();
      ctx.arc(0, 0, 4.5 * this.scale, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (layout === 'lane') {
      for (const y of [-1.7, 1.7]) {
        const a = this.worldToScreen(bounds.left + .8, y);
        const b = this.worldToScreen(bounds.right - .8, y);
        drawLine(ctx, a, b, 4 * this.dpr, accent, .18);
        drawLine(ctx, a, b, 1.2 * this.dpr, '#d9f7ff', .24);
      }
    } else if (layout === 'pillars') {
      const verticalA = this.worldToScreen(0, bounds.top + .8);
      const verticalB = this.worldToScreen(0, bounds.bottom - .8);
      const horizontalA = this.worldToScreen(bounds.left + .8, 0);
      const horizontalB = this.worldToScreen(bounds.right - .8, 0);
      drawLine(ctx, verticalA, verticalB, 2.5 * this.dpr, accent, .14);
      drawLine(ctx, horizontalA, horizontalB, 2.5 * this.dpr, accent, .14);
    } else if (layout === 'islands') {
      for (const [x, y, radius] of [[-4,0,1.7],[0,-2.6,1.3],[3.8,.6,1.55]]) {
        const p = this.worldToScreen(x, y);
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * this.scale);
        glow.addColorStop(0, 'rgba(95,224,191,.16)');
        glow.addColorStop(1, 'rgba(95,224,191,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * this.scale, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (layout === 'gate') {
      for (const x of [bounds.left + 1.25, bounds.right - 1.25]) {
        const a = this.worldToScreen(x, -3.4);
        const b = this.worldToScreen(x, 3.4);
        drawLine(ctx, a, b, 9 * this.dpr, accent, .12);
        drawLine(ctx, a, b, 2 * this.dpr, '#fff0cf', .28);
      }
    } else {
      ctx.translate(center.x, center.y);
      ctx.scale(1, .82);
      ctx.globalAlpha = .14;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3 * this.dpr;
      ctx.beginPath();
      ctx.arc(0, 0, 2.4 * this.scale, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();

    ctx.save();
    const edge = ctx.createLinearGradient(tl.x, tl.y, br.x, br.y);
    edge.addColorStop(0, 'rgba(91,213,255,.06)');
    edge.addColorStop(.5, 'rgba(255,255,255,0)');
    edge.addColorStop(1, 'rgba(120,82,255,.08)');
    ctx.fillStyle = edge;
    ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    ctx.restore();
  };

  const originalMech = Renderer.prototype.drawMech;
  Renderer.prototype.drawMech = function drawReadableMech(actor, isPlayer, time) {
    const ctx = this.ctx;
    ctx.save();
    const hit = actor.hitStun > 0;
    if (hit) {
      ctx.filter = 'brightness(2.35) saturate(.25) contrast(1.12)';
    } else if (isPlayer) {
      ctx.filter = 'brightness(1.18) saturate(1.18) contrast(1.06) drop-shadow(0 0 7px rgba(98,224,255,.24))';
    } else {
      ctx.filter = actor.boss
        ? 'brightness(1.17) saturate(1.25) contrast(1.08) drop-shadow(0 0 8px rgba(255,93,115,.2))'
        : 'brightness(1.12) saturate(1.16) contrast(1.05)';
    }
    originalMech.call(this, actor, isPlayer, time);
    ctx.restore();

    if (hit) {
      const p = this.worldToScreen(actor.x, actor.y);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = .42;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.4 * this.dpr;
      ctx.beginPath();
      ctx.arc(p.x, p.y, (actor.boss ? 48 : 30) * this.dpr, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  };

  const originalProjectiles = Renderer.prototype.drawProjectiles;
  Renderer.prototype.drawProjectiles = function drawSharperProjectiles(world) {
    originalProjectiles.call(this, world);
    const ctx = this.ctx;
    for (const shot of world.projectiles) {
      const head = this.worldToScreen(shot.x, shot.y);
      const tail = this.worldToScreen(
        shot.x - Math.cos(shot.angle) * .82,
        shot.y - Math.sin(shot.angle) * .82,
      );
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = shot.owner === 'player' ? .62 : .48;
      ctx.strokeStyle = shot.color || '#fff';
      ctx.lineCap = 'round';
      ctx.lineWidth = (shot.type === 'sniper' ? 3.8 : 2.4) * this.dpr;
      ctx.beginPath();
      ctx.moveTo(tail.x, tail.y);
      ctx.lineTo(head.x, head.y);
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(head.x, head.y, (shot.type === 'sniper' ? 3.4 : 2.2) * this.dpr, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  };

  const originalMissiles = Renderer.prototype.drawMissiles;
  Renderer.prototype.drawMissiles = function drawReadableMissiles(world) {
    originalMissiles.call(this, world);
    const ctx = this.ctx;
    for (const missile of world.missiles) {
      const p = this.worldToScreen(missile.x, missile.y);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(missile.angle);
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = '#fff2d6';
      ctx.beginPath();
      ctx.moveTo(8 * this.dpr, 0);
      ctx.lineTo(-5 * this.dpr, -3.4 * this.dpr);
      ctx.lineTo(-3 * this.dpr, 0);
      ctx.lineTo(-5 * this.dpr, 3.4 * this.dpr);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  };

  const originalSlashes = Renderer.prototype.drawSlashes;
  Renderer.prototype.drawSlashes = function drawLayeredSlashes(world) {
    originalSlashes.call(this, world);
    const ctx = this.ctx;
    for (const slash of world.slashes) {
      const life = clamp01(slash.life / slash.maxLife);
      const p = this.worldToScreen(slash.x, slash.y);
      const radius = slash.range * this.scale;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(1, .82);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = '#ffffff';
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i += 1) {
        ctx.globalAlpha = (.22 - i * .055) * life;
        ctx.lineWidth = (3.2 - i * .7) * this.dpr;
        const offset = .08 + i * .07;
        ctx.beginPath();
        ctx.arc(0, 0, radius * (1 + i * .035), slash.angle - 1.18 - offset, slash.angle + 1.18 - offset);
        ctx.stroke();
      }
      ctx.restore();
    }
  };

  const originalVfx = Renderer.prototype.drawVfx;
  Renderer.prototype.drawVfx = function drawImpactLayers(world) {
    originalVfx.call(this, world);
    const ctx = this.ctx;
    for (const effect of world.vfx) {
      const progress = 1 - clamp01(effect.life / effect.maxLife);
      const alpha = 1 - progress;
      const p = this.worldToScreen(effect.x, effect.y);
      const scale = (effect.scale || 1) * this.scale;
      if (!['enemyHit', 'playerHit', 'explosion', 'impactRing', 'muzzle'].includes(effect.type)) continue;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(effect.angle || 0);
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = effect.color || '#ffffff';
      ctx.lineCap = 'round';

      if (effect.type === 'muzzle') {
        ctx.globalAlpha = alpha * .72;
        ctx.lineWidth = 2.2 * this.dpr;
        for (const offset of [-.13, .13]) {
          ctx.beginPath();
          ctx.moveTo(-scale * .08, offset * scale);
          ctx.lineTo(-scale * (.55 + progress * .25), offset * scale * .35);
          ctx.stroke();
        }
      } else {
        ctx.globalAlpha = alpha * .48;
        ctx.lineWidth = Math.max(1, 3.5 * this.dpr * alpha);
        ctx.beginPath();
        ctx.arc(0, 0, scale * (.16 + progress * .72), 0, Math.PI * 2);
        ctx.stroke();
        if (effect.type === 'enemyHit' || effect.type === 'playerHit' || effect.type === 'impactRing') {
          for (let i = 0; i < 4; i += 1) {
            const angle = i * Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(Math.cos(angle) * scale * .12, Math.sin(angle) * scale * .12);
            ctx.lineTo(Math.cos(angle) * scale * (.45 + progress * .35), Math.sin(angle) * scale * (.45 + progress * .35));
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }
  };
}
