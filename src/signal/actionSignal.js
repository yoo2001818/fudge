import ParentSignal from './parentSignal';

/**
 * A signal class with multiple phases.
 * @extends Signal
 */
export default class ActionSignal extends ParentSignal {
  constructor(handler, parent, raw) {
    super(false, parent && parent.dispatch);
    // Phase: pre -> emit -> handler -> post
    this._handler = handler;
    this._raw = raw;
    this.pre = new ParentSignal(true, parent && parent.pre);
    this.post = new ParentSignal(false, parent && parent.post);
  }
  _dispatch(args) {
    // Pre phase
    let newArgs = this.pre._dispatch(args);
    if (newArgs == null) return;
    // Emit phase
    super._dispatch(newArgs);
    // Handler phase
    let result;
    if (this._raw) {
      result = this._handler(newArgs);
    } else {
      result = this._handler.apply(null, newArgs);
    }
    // Post phase
    let postArgs = [].concat(newArgs);
    postArgs.push(result);
    this.post._dispatch(postArgs);
    return result;
  }
}
