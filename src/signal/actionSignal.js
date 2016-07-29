import Signal from './index';

/**
 * A signal class with multiple phases.
 * @extends Signal
 */
export default class ActionSignal extends Signal {
  constructor(handler) {
    super(false);
    // Phase: pre -> emit -> handler -> post
    this._handler = handler;
    this.pre = new Signal(true);
    this.post = new Signal();
  }
  dispatch() {
    // Pre phase
    let args = this.pre.dispatch.apply(this.pre, arguments);
    // Emit phase
    super.dispatch.apply(this, args);
    // Handler phase
    let result = this._handler.apply(null, args);
    // Post phase
    this.post.dispatch.apply(this.post, args);
    return result;
  }
}
