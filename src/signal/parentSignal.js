import Signal from './index';

export default class ParentSignal extends Signal {
  constructor(chained, parent) {
    super(chained);
    this._parent = parent;
  }
  _dispatch(args) {
    if (this.chained) {
      let newArgs = super._dispatch(args);
      if (this._parent && !this._parent.isEmpty()) return this._parent(newArgs);
      return newArgs;
    } else {
      super._dispatch(args);
      if (this._parent && !this._parent.isEmpty()) this._parent(args);
    }
  }
  isEmpty() {
    if (!super.isEmpty()) return false;
    if (this._parent != null) return this._parent.isEmpty();
    return true;
  }
}
