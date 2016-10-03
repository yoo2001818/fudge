import ActionSignal from '../signal/actionSignal';
// Wraps the handler to mark it as a signal
export default function signal(handler, parentHandler, raw) {
  return {
    [Symbol.for('exec')]: (name, engine, actions, signals, parent) => {
      let parentSignal;
      if (parent && parentHandler) {
        parentSignal = {
          pre: parent.pre._dispatch.bind(parent.pre),
          post: parentHandler(parent.post._dispatch.bind(parent.post)),
          dispatch: parentHandler(parent._dispatch.bind(parent))
        };
      } else {
        parentSignal = {
          pre: parent.pre._dispatch.bind(parent.pre),
          post: parent.post._dispatch.bind(parent.post),
          dispatch: parent._dispatch.bind(parent)
        };
      }
      let signal = new ActionSignal(handler.bind(engine), parentSignal, raw);
      signals[name] = signal;
      let dispatch = signal.dispatch.bind(signal);
      dispatch.raw = signal._dispatch.bind(signal);
      return dispatch;
    }
  };
}
