import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';

const eventMapping = {
  willFinishLaunching$: 'will-finish-launching',
  ready$: 'ready',
  windowAllClosed$: 'window-all-closed',
  beforeQuit$: 'before-quit',
  willQuit$: 'will-quit'
};

export default function AppLifecycleDriver(app) {
  return cfg$ => {

    const source = Object.keys(eventMapping).reduce((obj, prop) => Object.defineProperty(obj, prop, {
      get() {
        return fromEvent(app, eventMapping[prop])
      }
    }), {});

    Object.defineProperty(source, 'quit$', {
      get() {
        return fromEvent(app, 'quit')
          .map(([ev, exitCode]) => Object.assign(ev, { exitCode }));
      }
    });

    let subscriptions = [];
    cfg$
      .startWith({})
      .addListener({
        next: ({ state = 'started', exitCode, isQuittingEnabled = true, isAutoExitEnabled = true } = {}) => {
          subscriptions.filter(Boolean).forEach(s => s.dispose());
          subscriptions = [
            !isQuittingEnabled && source.beforeQuit$.addListener({
              next: e => e.preventDefault()
            }),
            !isAutoExitEnabled && source.willQuit$.addListener({
              next: e => e.preventDefault()
            })
          ];

          if (state === 'quitting') {
            app.quit();
          } else if (state === 'exiting') {
            app.exit(exitCode);
          }
        }
      });

    return source;
  };
}
