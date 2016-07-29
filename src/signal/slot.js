export default class Slot {
  constructor(listener, priority = 100, once = false) {
    this.listener = listener;
    this.priority = priority;
    this.once = once;
    this.active = true;
    this.deleted = false;
  }
  execute(args) {
    if (!this.active) return args;
    if (this.once) this.deleted = true;
    return this.listener.apply(null, args);
  }
  delete() {
    this.deleted = true;
  }
}
