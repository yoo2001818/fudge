// If priority doesn't matter, we can just make the container a signal
function delegateSignal(parent, resolve) {
  return {
    add(listener, priority, once) {
      for (let key in parent._children) {
        let obj = resolve(parent._children[key]);
        obj.add(listener, priority, once);
      }
    },
    remove(listener) {
      for (let key in parent._children) {
        let obj = resolve(parent._children[key]);
        obj.remove(listener);
      }
    },
    on(listener, priority) {
      for (let key in parent._children) {
        let obj = resolve(parent._children[key]);
        obj.on(listener, priority);
      }
    },
    once(listener, priority) {
      for (let key in parent._children) {
        let obj = resolve(parent._children[key]);
        obj.once(listener, priority);
      }
    }
  };
}

export default class SignalContainer {
  constructor(children) {
    // Contains multiple signals, while providing 'root' object for it.
    this._children = children;
    this.rebuildChildren();
    this.root = delegateSignal(this, obj => obj);
    this.root.pre = delegateSignal(this, obj => obj.pre);
    this.root.post = delegateSignal(this, obj => obj.post);
  }
  rebuildChildren() {
    for (let key in this._children) {
      this[key] = this._children[key];
    }
  }
}
