import Signal from './index';

export default class ParentSignal extends Signal {
  constructor(chained, parent) {
    super(chained);
    this._parent = parent;
  }
  dispatch() {
    if (this.chained) {
      let args = super.dispatch.apply(this, arguments);
      if (this._parent) return this._parent.apply(this._parent, args);
      return args;
    } else {
      super.dispatch.apply(this, arguments);
      if (this._parent) this._parent.apply(this._parent, arguments);
    }
  }
}
