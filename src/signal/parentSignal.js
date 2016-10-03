import Signal from './index';

export default class ParentSignal extends Signal {
  constructor(chained, parent) {
    super(chained);
    this._parent = parent;
  }
  _dispatch(args) {
    if (this.chained) {
      let newArgs = super._dispatch(args);
      if (this._parent) return this._parent(newArgs);
      return newArgs;
    } else {
      super._dispatch(args);
      if (this._parent) this._parent(args);
    }
  }
}
