export class StateMachine {
  constructor(initial, table = {}) {
    this.state = initial;
    this.time = 0;
    this.table = table;
  }

  set(next, context) {
    if (next === this.state) return false;
    this.table[this.state]?.exit?.(context, next);
    const previous = this.state;
    this.state = next;
    this.time = 0;
    this.table[next]?.enter?.(context, previous);
    return true;
  }

  update(dt, context) {
    this.time += dt;
    this.table[this.state]?.update?.(context, dt, this.time);
  }

  is(...states) {
    return states.includes(this.state);
  }
}
