import ActionSignal from '../signal/actionSignal';
// Wraps the handler to mark it as a signal
export default function signal(handler, parentHandler) {
  return {
    [Symbol.for('exec')]: (name, engine, actions, signals, parent) => {
      let parentSignal;
      if (parent && parentHandler) {
        parentSignal = {
          pre: parent.pre.dispatch.bind(parent.pre),
          post: parentHandler(parent.post.dispatch.bind(parent.post)),
          dispatch: parentHandler(parent.dispatch.bind(parent))
        };
      }
      let signal = new ActionSignal(handler.bind(engine), parentSignal);
      signals[name] = signal;
      return signal.dispatch.bind(signal);
    }
  };
}
