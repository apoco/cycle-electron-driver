import { Observable } from 'rx';

const eventMapping = {
  willFinishLaunching$: 'will-finish-launching',
  ready$: 'ready',
  windowAllClosed$: 'window-all-closed'
};

export default function AppLifecycleDriver(app) {
  return () => {
    return Object.keys(eventMapping).reduce((obj, prop) => Object.defineProperty(obj, prop, {
      get() {
        return Observable.fromEvent(app, eventMapping[prop]);
      }
    }), {});
  };
}
