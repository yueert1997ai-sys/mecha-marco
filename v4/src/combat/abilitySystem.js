export class AbilitySystem {
  constructor() {
    this.cooldowns = new Map();
    this.cooldownMax = new Map();
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
    const safe = Math.max(0, value);
    this.cooldowns.set(id, safe);
    this.cooldownMax.set(id, safe);
  }

  cooldown(id) { return this.cooldowns.get(id) || 0; }

  cooldownRatio(id) {
    const max = this.cooldownMax.get(id) || 0;
    return max > 0 ? Math.min(1, this.cooldown(id) / max) : 0;
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
    this.cooldownMax.clear();
    this.buffer.clear();
  }
}
