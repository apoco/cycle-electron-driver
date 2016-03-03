import { Observable } from 'rx';

const eventMapping = {
  willFinishLaunching$: 'will-finish-launching',
  ready$: 'ready',
  windowAllClosed$: 'window-all-closed',
  beforeQuit$: 'before-quit'
};

export default function AppLifecycleDriver(app) {
  return cfg$ => {
    const source = Object.keys(eventMapping).reduce((obj, prop) => Object.defineProperty(obj, prop, {
      get() {
        return Observable.fromEvent(app, eventMapping[prop]);
      }
    }), {});

    let subscriptions = [];
    cfg$.startWith({}).forEach(({ isQuittingEnabled = true } = {}) => {
      subscriptions.filter(Boolean).forEach(s => s.dispose());
      subscriptions = [
        !isQuittingEnabled && source.beforeQuit$.forEach(e => e.preventDefault())
      ];
    });

    return source;
  };
}
