export class AbilitySystem {
  constructor() {
    this.cooldowns = new Map();
    this.buffer = new Map();
  }

  tick(dt) {
    for (const [key, value] of this.cooldowns) this.cooldowns.set(key, Math.max(0, value - dt));
    for (const [key, value] of this.buffer) {
      const next = value - dt;
      if (next <= 0) this.buffer.delete(key); else this.buffer.set(key, next);
    }
  }

  ready(id) {
    return (this.cooldowns.get(id) || 0) <= 0;
  }

  setCooldown(id, value) {
    this.cooldowns.set(id, Math.max(0, value));
  }

  request(id, duration = .15) {
    this.buffer.set(id, Math.max(duration, this.buffer.get(id) || 0));
  }

  consume(id, canUse = true) {
    if (!canUse || !this.buffer.has(id)) return false;
    this.buffer.delete(id);
    return true;
  }

  clear() {
    this.cooldowns.clear();
    this.buffer.clear();
  }
}
