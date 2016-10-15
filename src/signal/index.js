import Slot from './slot';

/**
 * A simple signal broadcasting class.
 */
export default class Signal {
  constructor(chained = false) {
    this._listeners = [];
    this._dirty = false;
    this.chained = chained;
  }
  add(listener, priority = 100, raw = false, once = false) {
    this._listeners.push(new Slot(listener, priority, raw, once));
    this._dirty = true;
  }
  remove(listener) {
    let index = this._listeners.findIndex(obj => obj.listener === listener);
    if (index === -1) return;
    this._listeners.splice(index, 1);
  }
  _sort() {
    if (!this._dirty) return;
    this._listeners.sort((a, b) => a.priority - b.priority);
    this._dirty = false;
  }
  _dispatch(args) {
    this._sort();
    let currentArgs = args;
    for (let i = 0; i < this._listeners.length; ++i) {
      if (this.chained && currentArgs == null) return currentArgs;
      let listener = this._listeners[i];
      currentArgs = listener.execute(this.chained ? currentArgs : args);
      if (listener.deleted) {
        this._listeners.splice(i, 1);
        --i;
      }
    }
    return currentArgs;
  }
  dispatch(...args) {
    return this._dispatch(args);
  }
  addRaw(listener, priority) {
    this.add(listener, priority, true);
  }
  on(listener, priority, raw) {
    this.add(listener, priority, raw);
  }
  once(listener, priority, raw) {
    this.once(listener, priority, raw, true);
  }
  emit(...args) {
    return this._dispatch(args);
  }
  isEmpty() {
    return this._listeners.length === 0;
  }
}
