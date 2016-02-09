import { Observable } from 'rx';

const eventShortcuts = {
  willFinishLaunching$: 'will-finish-launching',
  ready$: 'ready',
  beforeAllWindowClose$: 'before-quit',
  allWindowsClose$: 'window-all-closed',
  beforeExit$: 'will-quit'
};

export default function AppDriver(app) {
  return ({ exit$, preventedEvent$, trustedCert$ } = {}) => {

    exit$ && exit$
      .map(val => isNaN(val) ? 0 : val)
      .forEach(code => app.exit(code));

    preventedEvent$ && preventedEvent$
      .forEach(e => e.preventDefault());

    trustedCert$ && trustedCert$
      .forEach(e => {
        e.preventDefault();
        e.callback(true);
      });

    const events = eventName => Observable.fromEvent(app, eventName);
    events.activation$ = Observable
      .fromEvent(app, 'activate', (e, hasVisibleWindows) => Object.assign(e, { hasVisibleWindows }));
    events.fileOpen$ = Observable
      .fromEvent(app, 'open-file', (e, path) => Object.assign(e, { path }));
    events.urlOpen$ = Observable
      .fromEvent(app, 'open-url', (e, url) => Object.assign(e, { url }));
    events.windowBlur$ = Observable
      .fromEvent(app, 'browser-window-blur', (e, window) => Object.assign(e, { window }));
    events.exit$ = Observable
      .fromEvent(app, 'quit', (e, exitCode) => Object.assign(e, { exitCode }));
    Object.keys(eventShortcuts).forEach(key => {
      events[key] = events(eventShortcuts[key]);
    });

    return { events }
  };
}
