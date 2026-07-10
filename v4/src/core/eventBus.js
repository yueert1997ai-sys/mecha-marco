export class EventBus {
  #listeners = new Map();

  on(type, fn) {
    if (!this.#listeners.has(type)) this.#listeners.set(type, new Set());
    this.#listeners.get(type).add(fn);
    return () => this.off(type, fn);
  }

  once(type, fn) {
    const off = this.on(type, (payload) => {
      off();
      fn(payload);
    });
    return off;
  }

  off(type, fn) {
    this.#listeners.get(type)?.delete(fn);
  }

  emit(type, payload) {
    for (const fn of [...(this.#listeners.get(type) || [])]) fn(payload);
  }

  clear() {
    this.#listeners.clear();
  }
}
