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
  add(listener, priority = 100, once = false) {
    this._listeners.push(new Slot(listener, priority, once));
    this._dirty = true;
  }
  remove(listener) {
    let index = this._listeners.find(obj => obj.listener === listener);
    if (index === -1) return;
    this._listeners.splice(index, 1);
  }
  _sort() {
    if (!this._dirty) return;
    this._listeners.sort((a, b) => a.priority - b.priority);
    this._dirty = false;
  }
  dispatch(...args) {
    this._sort();
    let currentArgs = args;
    for (let i = 0; i < this._listeners.length; ++i) {
      if (this.chained && currentArgs == null) return currentArgs;
      let listener = this._listeners[i];
      currentArgs = listener.execute(this.chained ? args : currentArgs);
      if (listener.deleted) {
        this._listeners.splice(i, 1);
        --i;
      }
    }
    return currentArgs;
  }

  on(listener, priority) {
    this.add(listener, priority);
  }
  once(listener, priority) {
    this.once(listener, priority, true);
  }
  emit() {
    this.dispatch.apply(this, arguments);
  }
}
