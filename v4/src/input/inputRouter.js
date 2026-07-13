import { clamp, length, normalize } from '../core/math.js';

const ACTIONS = ['primary','secondary','dash','ordnance','overdrive','pause'];

export class InputRouter {
  constructor(canvas, touchRoot) {
    this.canvas = canvas;
    this.touchRoot = touchRoot;
    this.keys = new Set();
    this.held = Object.fromEntries(ACTIONS.map((a) => [a,false]));
    this.pressed = Object.fromEntries(ACTIONS.map((a) => [a,false]));
    this.actionSources = Object.fromEntries(ACTIONS.map((a) => [a,new Set()]));
    this.actionPointers = new Map();
    this.actionButtonStates = new Set();
    this.move = { x:0, y:0 };
    this.aim = { x:0, y:-1 };
    this.mouse = { x:0, y:0, active:false };
    this.touch = { move:null, aim:null };
    this.touchMode = matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0;
    this.enabled = true;
    this.bind();
  }

  bind() {
    addEventListener('keydown', (event) => {
      this.keys.add(event.code);
      if (event.code === 'Escape') this.press('pause');
      if (['Space','KeyQ','KeyE'].includes(event.code)) event.preventDefault();
    }, { passive:false });
    addEventListener('keyup', (event) => this.keys.delete(event.code));
    addEventListener('blur', () => this.clear());
    addEventListener('mecha-viewport-change', () => this.clear());

    this.canvas.addEventListener('pointermove', (event) => {
      if (this.touchMode || !this.enabled) return;
      const rect = this.canvas.getBoundingClientRect();
      this.mouse.x = event.clientX - rect.left;
      this.mouse.y = event.clientY - rect.top;
      this.mouse.active = true;
    });
    this.canvas.addEventListener('pointerdown', (event) => {
      if (this.touchMode || !this.enabled) return;
      if (event.button === 0) this.setHeld('primary', true, true);
      if (event.button === 2) this.setHeld('secondary', true, true);
    });
    addEventListener('pointerup', (event) => {
      if (this.touchMode) return;
      if (event.button === 0) this.setHeld('primary', false);
      if (event.button === 2) this.setHeld('secondary', false);
    });
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault());

    if (this.touchRoot) {
      for (const stick of this.touchRoot.querySelectorAll('[data-stick]')) this.bindStick(stick, stick.dataset.stick);
      for (const button of this.touchRoot.querySelectorAll('[data-action]')) this.bindActionButton(button, button.dataset.action);
    }
  }

  bindStick(element, kind) {
    const knob = element.querySelector('.stick-knob');
    const state = { element, knob, kind, pointerId:null, center:{x:0,y:0}, value:{x:0,y:0} };
    const update = (event) => {
      const rect = element.getBoundingClientRect();
      state.center = { x:rect.left+rect.width/2, y:rect.top+rect.height/2 };
      const dx = event.clientX - state.center.x;
      const dy = event.clientY - state.center.y;
      const max = rect.width * .34;
      const mag = Math.hypot(dx,dy) || 1;
      const scale = Math.min(1, max / mag);
      const px = dx * scale;
      const py = dy * scale;
      knob.style.transform = `translate(${px}px,${py}px)`;
      state.value = { x:clamp(dx/max,-1,1), y:clamp(dy/max,-1,1) };
      if (length(state.value) > 1) state.value = normalize(state.value);
      if (kind === 'move') this.move = state.value;
      else {
        this.aim = state.value;
        if (length(state.value) > .5) this.setHeld('primary', true, true);
        else this.setHeld('primary', false);
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
      const pointerId = state.pointerId;
      state.pointerId = null;
      state.value = {x:0,y:0};
      knob.style.transform = 'translate(0,0)';
      if (kind === 'move') this.move = {x:0,y:0};
      else this.setHeld('primary', false);
      try {
        if (element.hasPointerCapture?.(pointerId)) element.releasePointerCapture(pointerId);
      } catch {}
      event.preventDefault();
    };
    element.addEventListener('pointerup', end, { passive:false });
    element.addEventListener('pointercancel', end, { passive:false });
    element.addEventListener('lostpointercapture', (event) => {
      if (state.pointerId === event.pointerId) end(event);
    }, { passive:false });
    this.touch[kind] = state;
  }

  bindActionButton(button, action) {
    const state = { button, action, pointerId:null };
    this.actionButtonStates.add(state);
    const end = (event) => {
      if (state.pointerId !== event.pointerId) return;
      state.pointerId = null;
      this.setSourceHeld(action, `button:${action}:${event.pointerId}`, false);
      this.actionPointers.delete(event.pointerId);
      button.classList.remove('active');
      try {
        if (button.hasPointerCapture?.(event.pointerId)) button.releasePointerCapture(event.pointerId);
      } catch {}
      event.preventDefault();
    };
    button.addEventListener('pointerdown', (event) => {
      if (!this.enabled || state.pointerId !== null) return;
      state.pointerId = event.pointerId;
      this.actionPointers.set(event.pointerId, action);
      try { button.setPointerCapture(event.pointerId); } catch {}
      this.setSourceHeld(action, `button:${action}:${event.pointerId}`, true, true);
      button.classList.add('active');
      event.preventDefault();
    }, { passive:false });
    button.addEventListener('pointerup', end, { passive:false });
    button.addEventListener('pointercancel', end, { passive:false });
    button.addEventListener('lostpointercapture', (event) => {
      if (state.pointerId === event.pointerId) end(event);
    }, { passive:false });
  }

  setSourceHeld(action, source, value, alsoPress = false) {
    const sources = this.actionSources[action];
    if (!sources) return;
    const wasHeld = sources.size > 0;
    if (value) sources.add(source); else sources.delete(source);
    const isHeld = sources.size > 0;
    if (isHeld && !wasHeld && alsoPress) this.pressed[action] = true;
    this.held[action] = isHeld;
  }

  setHeld(action, value, alsoPress = false) {
    this.setSourceHeld(action, `direct:${action}`, value, alsoPress);
  }

  press(action) {
    if (action in this.pressed) this.pressed[action] = true;
  }

  update(screenToWorld, player) {
    if (!this.enabled) {
      this.move = {x:0,y:0};
      return this.snapshot();
    }
    if (!this.touchMode) {
      const x = (this.keys.has('KeyD') || this.keys.has('ArrowRight') ? 1 : 0) - (this.keys.has('KeyA') || this.keys.has('ArrowLeft') ? 1 : 0);
      const y = (this.keys.has('KeyS') || this.keys.has('ArrowDown') ? 1 : 0) - (this.keys.has('KeyW') || this.keys.has('ArrowUp') ? 1 : 0);
      this.move = length({x,y}) > 1 ? normalize({x,y}) : {x,y};
      if (this.mouse.active && player) {
        const world = screenToWorld(this.mouse.x, this.mouse.y);
        this.aim = normalize({ x:world.x-player.x, y:world.y-player.y });
      }
      this.setHeld('dash', this.keys.has('Space'), this.keys.has('Space'));
      if (this.keys.has('KeyQ')) this.setHeld('ordnance', true, true); else this.setHeld('ordnance', false);
      if (this.keys.has('KeyE')) this.setHeld('overdrive', true, true); else this.setHeld('overdrive', false);
    }
    return this.snapshot();
  }

  snapshot() {
    const out = {
      move:{...this.move}, aim:{...this.aim},
      held:{...this.held}, pressed:{...this.pressed}, touchMode:this.touchMode,
    };
    for (const action of ACTIONS) this.pressed[action] = false;
    return out;
  }

  clear() {
    this.keys.clear();
    this.move = {x:0,y:0};
    for (const state of this.actionButtonStates) {
      const pointerId = state.pointerId;
      state.pointerId = null;
      if (pointerId !== null) {
        this.actionPointers.delete(pointerId);
        try {
          if (state.button.hasPointerCapture?.(pointerId)) state.button.releasePointerCapture(pointerId);
        } catch {}
      }
      state.button.classList.remove('active');
    }
    for (const action of ACTIONS) {
      this.actionSources[action].clear();
      this.held[action] = false;
      this.pressed[action] = false;
    }
    this.actionPointers.clear();
    for (const state of Object.values(this.touch)) {
      if (!state) continue;
      const pointerId = state.pointerId;
      state.pointerId = null;
      state.value = {x:0,y:0};
      if (pointerId !== null) {
        try {
          if (state.element?.hasPointerCapture?.(pointerId)) state.element.releasePointerCapture(pointerId);
        } catch {}
      }
      if (state.knob) state.knob.style.transform = 'translate(0,0)';
    }
    for (const knob of this.touchRoot?.querySelectorAll('.stick-knob') || []) knob.style.transform = 'translate(0,0)';
  }

  setEnabled(value) {
    this.enabled = Boolean(value);
    if (!this.enabled) this.clear();
  }
}
