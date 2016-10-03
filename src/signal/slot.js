export default class Slot {
  constructor(listener, priority = 100, raw = false, once = false) {
    this.listener = listener;
    this.priority = priority;
    this.raw = raw;
    this.once = once;
    this.active = true;
    this.deleted = false;
  }
  execute(args) {
    if (!this.active) return args;
    if (this.once) this.deleted = true;
    if (this.raw) return this.listener(args);
    return this.listener.apply(null, args);
  }
  delete() {
    this.deleted = true;
  }
}
