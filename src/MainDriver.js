import { Observable } from 'rx';

const eventShortcuts = {
  allWindowsClosed$: 'window-all-closed',
  beforeQuit$: 'before-quit',
  ready$: 'ready',
  willFinishLaunching$: 'will-finish-launching',
  willQuit$: 'will-quit'
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
    events.quit$ = Observable.fromEvent(app, 'quit', (e, exitCode) => Object.assign({ exitCode }, e));
    events.fileOpen$ = Observable.fromEvent(app, 'open-file', (e, path) => Object.assign({ path }, e));
    events.urlOpen$ = Observable.fromEvent(app, 'open-url', (e, url) => Object.assign({ url }, e));
    Object.keys(eventShortcuts).forEach(key => {
      events[key] = events(eventShortcuts[key]);
    });

    return { events }
  };
}
