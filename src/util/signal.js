import ActionSignal from '../signal/actionSignal';
// Wraps the handler to mark it as a signal
export default function signal(handler) {
  return {
    exec: (name, engine, actions, signals) => {
      let signal = new ActionSignal(handler);
      signals[name] = signal;
      return signal.dispatch.bind(signal);
    }
  };
}
