import ParentSignal from './parentSignal';

/**
 * A signal class with multiple phases.
 * @extends Signal
 */
export default class ActionSignal extends ParentSignal {
  constructor(handler, parent) {
    super(false, parent && parent.dispatch);
    // Phase: pre -> emit -> handler -> post
    this._handler = handler;
    this.pre = new ParentSignal(true, parent && parent.pre);
    this.post = new ParentSignal(false, parent && parent.post);
  }
  dispatch() {
    // Pre phase
    let args = this.pre.dispatch.apply(this.pre, arguments);
    if (args == null) return;
    // Emit phase
    super.dispatch.apply(this, args);
    // Handler phase
    let result = this._handler.apply(null, args);
    // Post phase
    this.post.dispatch.apply(this.post, args);
    return result;
  }
}
