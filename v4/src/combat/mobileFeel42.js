import { clamp, length, normalize, approachAngle } from '../core/math.js';

const curveStick = (value, deadZone, exponent = 1.08) => {
  const magnitude = Math.min(1, length(value));
  if (magnitude <= deadZone) return { x:0, y:0 };
  const direction = normalize(value);
  const normalized = (magnitude - deadZone) / Math.max(.001, 1 - deadZone);
  const curved = Math.pow(normalized, exponent);
  return { x:direction.x * curved, y:direction.y * curved };
};

export function applyMobileFeel42({ InputRouter, PlayerMech, Renderer }) {
  if (InputRouter.__mobileFeel42Applied) return;
  InputRouter.__mobileFeel42Applied = true;

  InputRouter.prototype.bindStick = function bindResponsiveStick(element, kind) {
    const knob = element.querySelector('.stick-knob');
    const state = { pointerId:null, center:{x:0,y:0}, value:{x:0,y:0} };
    const update = (event) => {
      const rect = element.getBoundingClientRect();
      state.center = { x:rect.left + rect.width / 2, y:rect.top + rect.height / 2 };
      const dx = event.clientX - state.center.x;
      const dy = event.clientY - state.center.y;
      const max = Math.max(30, rect.width * .4);
      const magnitude = Math.hypot(dx, dy) || 1;
      const visualScale = Math.min(1, max / magnitude);
      knob.style.transform = `translate(${dx * visualScale}px,${dy * visualScale}px)`;
      const raw = { x:clamp(dx / max,-1,1), y:clamp(dy / max,-1,1) };
      state.value = length(raw) > 1 ? normalize(raw) : raw;
      const output = curveStick(state.value, kind === 'move' ? .1 : .065, kind === 'move' ? 1.08 : 1.02);
      if (kind === 'move') {
        this.move = output;
      } else {
        if (length(output) > .02) this.aim = output;
        this.setHeld('primary', length(output) > .18, true);
      }
    };
    element.addEventListener('pointerdown', (event) => {
      if (!this.enabled || state.pointerId !== null) return;
      state.pointerId = event.pointerId;
      element.setPointerCapture(event.pointerId);
      update(event);
      event.preventDefault();
    }, { passive:false });
    element.addEventListener('pointermove', (event) => {
      if (event.pointerId !== state.pointerId) return;
      update(event);
      event.preventDefault();
    }, { passive:false });
    const end = (event) => {
      if (event.pointerId !== state.pointerId) return;
      state.pointerId = null;
      state.value = { x:0, y:0 };
      knob.style.transform = 'translate(0,0)';
      if (kind === 'move') this.move = { x:0, y:0 };
      else this.setHeld('primary', false);
      event.preventDefault();
    };
    element.addEventListener('pointerup', end, { passive:false });
    element.addEventListener('pointercancel', end, { passive:false });
    this.touch[kind] = state;
  };

  const resetForRoom = PlayerMech.prototype.resetForRoom;
  PlayerMech.prototype.resetForRoom = function resetInsideArena(position = { x:0, y:4.5 }) {
    return resetForRoom.call(this, { ...position, y:Math.min(position.y,3.55) });
  };

  PlayerMech.prototype.update = function updateResponsiveMech(dt, input, world) {
    if (this.dead) return;
    this.ability.tick(dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.hitStun = Math.max(0, this.hitStun - dt);
    this.markTime = Math.max(0, this.markTime - dt);
    this.primaryKick = Math.max(0, this.primaryKick - dt * 10);
    this.hitVisual.back *= Math.max(0, 1 - dt * 14);
    this.hitVisual.side *= Math.max(0, 1 - dt * 14);
    this.overdriveTimer = Math.max(0, this.overdriveTimer - dt);
    this.overdrive = clamp(this.overdrive, 0, this.stats.overdriveNeed || 100);

    if (input.pressed.primary) this.ability.request('primary');
    if (input.held.primary) this.ability.request('primary', .11);
    if (input.pressed.secondary) this.ability.request('secondary');
    if (input.pressed.dash) this.ability.request('dash');
    if (input.pressed.ordnance) this.ability.request('ordnance');
    if (input.pressed.overdrive) this.ability.request('overdrive');

    const aimLength = length(input.aim);
    if (aimLength > .055) {
      const targetAim = Math.atan2(input.aim.y, input.aim.x);
      const turnMultiplier = input.touchMode ? 1.65 : 1.18;
      this.aim = approachAngle(this.aim, targetAim, this.stats.turnSpeed * turnMultiplier * dt);
    }
    this.yaw = approachAngle(this.yaw, this.aim, this.stats.turnSpeed * (input.touchMode ? 1.32 : .96) * dt);

    this.updateDash(dt, input, world);
    this.updateSecondary(dt, world);
    this.updatePrimary(dt, world);
    this.updateOrdnance(world);
    this.updateOverdrive(world);

    if (this.dashTimer <= 0) {
      const move = length(input.move) > 1 ? normalize(input.move) : input.move;
      const moveMagnitude = length(move);
      const stunnedMultiplier = this.hitStun > 0 ? .5 : 1;
      const speedMultiplier = this.overdriveTimer > 0 ? 1.18 : 1;
      const targetVx = move.x * this.stats.moveSpeed * stunnedMultiplier * speedMultiplier;
      const targetVy = move.y * this.stats.moveSpeed * stunnedMultiplier * speedMultiplier;
      const response = moveMagnitude > .02 ? (input.touchMode ? 25 : 20) : 30;
      const acceleration = 1 - Math.exp(-dt * response);
      this.vx += (targetVx - this.vx) * acceleration;
      this.vy += (targetVy - this.vy) * acceleration;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    const bounds = world.bounds;
    this.x = clamp(this.x, bounds.left + this.radius, bounds.right - this.radius);
    this.y = clamp(this.y, bounds.top + this.radius, bounds.bottom - this.radius);
    this.speed01 = clamp(Math.hypot(this.vx, this.vy) / Math.max(1, this.stats.moveSpeed), 0, 1);
    this.rechargeDash(dt);
  };

  PlayerMech.prototype.updatePrimary = function updateBoostFire(dt, world) {
    const canFire = this.saberTimer <= 0 && this.hitStun <= 0 && this.ability.ready('primary');
    if (this.burstRemaining > 0) {
      this.burstTimer -= dt;
      if (this.burstTimer <= 0) {
        this.firePrimary(world);
        this.burstRemaining -= 1;
        this.burstTimer = .07;
      }
    }
    if (this.ability.consume('primary', canFire)) {
      const burst = this.stats.effects.primaryBurst || 1;
      this.firePrimary(world);
      this.burstRemaining = Math.max(0, burst - 1);
      this.burstTimer = .07;
      const boostPenalty = this.dashTimer > 0 ? 1.08 : 1;
      this.ability.setCooldown('primary', this.stats.primaryRate * boostPenalty * (this.overdriveTimer > 0 ? .62 : 1));
    }
  };

  const polishedResize = Renderer.prototype.resize;
  Renderer.prototype.resize = function resizeForCombatReadability() {
    polishedResize.call(this);
    this.scale = Math.min(this.width / 24.2, this.height / 15.5);
  };

  Renderer.prototype.worldToScreen = function worldToScreenWithForwardSpace(x, y) {
    const shakeX = Math.sin(performance.now() * .09) * this.camera.shake;
    const shakeY = Math.cos(performance.now() * .11) * this.camera.shake;
    return {
      x:this.width * .5 + (x - this.camera.x) * this.scale + shakeX,
      y:this.height * .58 + (y - this.camera.y) * this.scale * .76 + shakeY,
    };
  };

  Renderer.prototype.screenToWorld = function screenToWorldWithForwardSpace(x, y) {
    return {
      x:(x * this.dpr - this.width * .5) / this.scale + this.camera.x,
      y:(y * this.dpr - this.height * .58) / (this.scale * .76) + this.camera.y,
    };
  };

  Renderer.prototype.begin = function beginWithArenaCamera(world) {
    const ctx = this.ctx;
    ctx.setTransform(1,0,0,1,0,0);
    const gradient = ctx.createLinearGradient(0,0,0,this.height);
    gradient.addColorStop(0,'#06101f');
    gradient.addColorStop(.58,'#101d35');
    gradient.addColorStop(1,'#02050d');
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,this.width,this.height);

    const player = world.player && !world.player.dead ? world.player : null;
    const target = player || { x:0, y:0, aim:-Math.PI / 2, speed01:0 };
    const lookAhead = player ? .42 + (player.speed01 || 0) * .18 : 0;
    const desiredX = clamp(target.x * .08 + Math.cos(target.aim || -Math.PI / 2) * lookAhead, -.75, .75);
    const desiredY = clamp(target.y * .06 + Math.sin(target.aim || -Math.PI / 2) * lookAhead * .58, -.55, .55);
    const follow = player?.dashTimer > 0 ? .18 : .11;
    this.camera.x += (desiredX - this.camera.x) * follow;
    this.camera.y += (desiredY - this.camera.y) * follow;
    this.camera.shake *= .84;
    this.drawArena(world);
  };
}
