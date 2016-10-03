import signal from './signal';

export default function signalRaw(handler, parentHandler) {
  return signal(handler, parentHandler, true);
}
