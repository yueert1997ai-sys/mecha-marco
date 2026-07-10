export class GameLoop {
  constructor({ update, render, fixedStep = 1 / 60, maxFrame = 0.1 }) {
    this.updateFn = update;
    this.renderFn = render;
    this.fixedStep = fixedStep;
    this.maxFrame = maxFrame;
    this.running = false;
    this.last = 0;
    this.accumulator = 0;
    this.raf = 0;
    this.boundTick = (t) => this.tick(t);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.boundTick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  tick(now) {
    if (!this.running) return;
    let frame = Math.min((now - this.last) / 1000, this.maxFrame);
    if (!Number.isFinite(frame) || frame < 0) frame = 0;
    this.last = now;
    this.accumulator += frame;
    while (this.accumulator >= this.fixedStep) {
      this.updateFn(this.fixedStep);
      this.accumulator -= this.fixedStep;
    }
    this.renderFn(this.accumulator / this.fixedStep);
    this.raf = requestAnimationFrame(this.boundTick);
  }
}
