import test from 'node:test';
import assert from 'node:assert/strict';
import { InputRouter } from '../src/input/inputRouter.js';

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  add(value) {
    this.values.add(value);
  }

  remove(value) {
    this.values.delete(value);
  }

  contains(value) {
    return this.values.has(value);
  }
}

class FakeTarget {
  constructor(action = null) {
    this.dataset = action ? { action } : {};
    this.classList = new FakeClassList();
    this.style = {};
    this.listeners = new Map();
    this.capturedPointers = new Set();
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) || [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  dispatch(type, properties = {}) {
    const event = {
      type,
      button: 0,
      pointerId: 0,
      clientX: 0,
      clientY: 0,
      defaultPrevented: false,
      preventDefault() {
        this.defaultPrevented = true;
      },
      ...properties,
    };
    for (const listener of this.listeners.get(type) || []) listener(event);
    return event;
  }

  setPointerCapture(pointerId) {
    this.capturedPointers.add(pointerId);
  }

  hasPointerCapture(pointerId) {
    return this.capturedPointers.has(pointerId);
  }

  releasePointerCapture(pointerId) {
    this.capturedPointers.delete(pointerId);
  }

  getBoundingClientRect() {
    return { left:0, top:0, width:100, height:100 };
  }
}

const makeStick = (kind) => {
  const stick = new FakeTarget();
  const knob = new FakeTarget();
  stick.dataset = { stick:kind };
  stick.knob = knob;
  stick.querySelector = (selector) => selector === '.stick-knob' ? knob : null;
  return stick;
};

const withInputEnvironment = async (actions, run, stickKinds = []) => {
  const globalEvents = new FakeTarget();
  const originalDescriptors = new Map();
  const installGlobal = (name, value) => {
    originalDescriptors.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, { value, configurable:true, writable:true });
  };

  installGlobal('addEventListener', globalEvents.addEventListener.bind(globalEvents));
  installGlobal('matchMedia', () => ({ matches:true }));
  installGlobal('navigator', { maxTouchPoints:5 });

  const canvas = new FakeTarget();
  const buttons = Object.fromEntries(actions.map((action) => [action, new FakeTarget(action)]));
  const sticks = Object.fromEntries(stickKinds.map((kind) => [kind, makeStick(kind)]));
  const touchRoot = {
    querySelectorAll(selector) {
      if (selector === '[data-stick]') return Object.values(sticks);
      if (selector === '.stick-knob') return Object.values(sticks).map((stick) => stick.knob);
      if (selector === '[data-action]') return Object.values(buttons);
      if (selector === '.active') return Object.values(buttons).filter((button) => button.classList.contains('active'));
      return [];
    },
  };

  try {
    await run({ router:new InputRouter(canvas, touchRoot), buttons, sticks, globalEvents });
  } finally {
    for (const [name, descriptor] of originalDescriptors) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else delete globalThis[name];
    }
  }
};

test('clear releases an action button so a new pointer can press it', async () => {
  await withInputEnvironment(['secondary'], ({ router, buttons }) => {
    const button = buttons.secondary;
    button.dispatch('pointerdown', { pointerId:11 });
    assert.equal(router.held.secondary, true);
    assert.equal(button.hasPointerCapture(11), true);

    router.clear();
    assert.equal(router.held.secondary, false);
    assert.equal(button.classList.contains('active'), false);
    assert.equal(button.hasPointerCapture(11), false);

    button.dispatch('pointerdown', { pointerId:12 });
    assert.equal(router.held.secondary, true);
    assert.equal(router.pressed.secondary, true);
    assert.equal(button.hasPointerCapture(12), true);
  });
});

test('pointercancel and lostpointercapture fully release an action button', async () => {
  await withInputEnvironment(['dash'], ({ router, buttons }) => {
    const button = buttons.dash;
    button.dispatch('pointerdown', { pointerId:21 });
    button.dispatch('pointercancel', { pointerId:21 });
    assert.equal(router.held.dash, false);
    assert.equal(button.classList.contains('active'), false);
    assert.equal(button.hasPointerCapture(21), false);

    button.dispatch('pointerdown', { pointerId:22 });
    button.dispatch('lostpointercapture', { pointerId:22 });
    assert.equal(router.held.dash, false);
    assert.equal(button.classList.contains('active'), false);
    assert.equal(button.hasPointerCapture(22), false);

    button.dispatch('pointerdown', { pointerId:23 });
    assert.equal(router.held.dash, true);
  });
});

test('four concurrent action pointers remain independent and clear together', async () => {
  const actions = ['secondary','dash','ordnance','overdrive'];
  await withInputEnvironment(actions, ({ router, buttons }) => {
    actions.forEach((action, index) => buttons[action].dispatch('pointerdown', { pointerId:31 + index }));

    for (const action of actions) {
      assert.equal(router.held[action], true, `${action} should be held`);
      assert.equal(buttons[action].classList.contains('active'), true);
    }
    assert.equal(router.actionPointers.size, 4);

    router.clear();

    for (const action of actions) {
      assert.equal(router.held[action], false, `${action} should be released`);
      assert.equal(buttons[action].classList.contains('active'), false);
      assert.equal(buttons[action].capturedPointers.size, 0);
    }
    assert.equal(router.actionPointers.size, 0);
  });
});

test('direct held state cannot release another input source', async () => {
  await withInputEnvironment(['secondary'], ({ router }) => {
    router.setSourceHeld('secondary', 'touch:secondary', true, true);
    router.setHeld('secondary', false);
    assert.equal(router.held.secondary, true);

    router.setHeld('secondary', true, true);
    router.setSourceHeld('secondary', 'touch:secondary', false);
    assert.equal(router.held.secondary, true);

    router.setHeld('secondary', false);
    assert.equal(router.held.secondary, false);
  });
});

test('move stick lostpointercapture releases capture and accepts a new pointer', async () => {
  await withInputEnvironment([], ({ router, sticks }) => {
    const move = sticks.move;
    move.dispatch('pointerdown', { pointerId:41, clientX:100, clientY:50 });
    assert.equal(move.hasPointerCapture(41), true);
    assert.equal(router.move.x, 1);

    move.dispatch('lostpointercapture', { pointerId:41 });
    assert.equal(move.hasPointerCapture(41), false);
    assert.equal(router.touch.move.pointerId, null);
    assert.deepEqual(router.move, {x:0,y:0});
    assert.equal(move.knob.style.transform, 'translate(0,0)');

    move.dispatch('pointerdown', { pointerId:42, clientX:0, clientY:50 });
    assert.equal(router.touch.move.pointerId, 42);
    assert.equal(move.hasPointerCapture(42), true);
    assert.equal(router.move.x, -1);
  }, ['move']);
});

test('aim stick lostpointercapture releases primary held state and accepts a new pointer', async () => {
  await withInputEnvironment([], ({ router, sticks }) => {
    const aim = sticks.aim;
    aim.dispatch('pointerdown', { pointerId:51, clientX:100, clientY:50 });
    assert.equal(aim.hasPointerCapture(51), true);
    assert.equal(router.held.primary, true);

    aim.dispatch('lostpointercapture', { pointerId:51 });
    assert.equal(aim.hasPointerCapture(51), false);
    assert.equal(router.touch.aim.pointerId, null);
    assert.equal(router.held.primary, false);
    assert.equal(aim.knob.style.transform, 'translate(0,0)');

    aim.dispatch('pointerdown', { pointerId:52, clientX:0, clientY:50 });
    assert.equal(router.touch.aim.pointerId, 52);
    assert.equal(aim.hasPointerCapture(52), true);
    assert.equal(router.held.primary, true);
    aim.dispatch('pointerup', { pointerId:52 });
    assert.equal(router.held.primary, false);
  }, ['aim']);
});

test('viewport clear releases both stick captures and permits fresh move and aim pointers', async () => {
  await withInputEnvironment([], ({ router, sticks, globalEvents }) => {
    sticks.move.dispatch('pointerdown', { pointerId:61, clientX:100, clientY:50 });
    sticks.aim.dispatch('pointerdown', { pointerId:62, clientX:100, clientY:50 });
    assert.equal(sticks.move.hasPointerCapture(61), true);
    assert.equal(sticks.aim.hasPointerCapture(62), true);
    assert.equal(router.held.primary, true);

    globalEvents.dispatch('mecha-viewport-change');
    assert.equal(sticks.move.hasPointerCapture(61), false);
    assert.equal(sticks.aim.hasPointerCapture(62), false);
    assert.equal(router.touch.move.pointerId, null);
    assert.equal(router.touch.aim.pointerId, null);
    assert.deepEqual(router.move, {x:0,y:0});
    assert.equal(router.held.primary, false);

    sticks.move.dispatch('pointerdown', { pointerId:63, clientX:0, clientY:50 });
    sticks.aim.dispatch('pointerdown', { pointerId:64, clientX:0, clientY:50 });
    assert.equal(router.touch.move.pointerId, 63);
    assert.equal(router.touch.aim.pointerId, 64);
    assert.equal(sticks.move.hasPointerCapture(63), true);
    assert.equal(sticks.aim.hasPointerCapture(64), true);
    assert.equal(router.held.primary, true);
  }, ['move','aim']);
});
