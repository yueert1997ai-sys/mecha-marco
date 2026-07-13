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

const withInputEnvironment = async (actions, run) => {
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
  const touchRoot = {
    querySelectorAll(selector) {
      if (selector === '[data-stick]' || selector === '.stick-knob') return [];
      if (selector === '[data-action]') return Object.values(buttons);
      if (selector === '.active') return Object.values(buttons).filter((button) => button.classList.contains('active'));
      return [];
    },
  };

  try {
    await run({ router:new InputRouter(canvas, touchRoot), buttons, globalEvents });
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
