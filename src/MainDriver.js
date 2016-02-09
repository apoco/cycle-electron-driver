import { Observable } from 'rx';

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

    return {
      events: setupEventSources(app)
    }
  };
}

const eventShortcuts = {
  willFinishLaunching$: 'will-finish-launching',
  ready$: 'ready',
  beforeAllWindowClose$: 'before-quit',
  allWindowsClose$: 'window-all-closed',
  beforeExit$: 'will-quit'
};

function setupEventSources(app) {
  const events = eventName => Observable.fromEvent(app, eventName);

  Object.assign(events, {
    activation$: Observable
      .fromEvent(app, 'activate', (e, hasVisibleWindows) => Object.assign(e, {hasVisibleWindows})),
    fileOpen$: Observable
      .fromEvent(app, 'open-file', (e, path) => Object.assign(e, {path})),
    urlOpen$: Observable
      .fromEvent(app, 'open-url', (e, url) => Object.assign(e, {url})),
    certError$: Observable
      .fromEvent(app, 'certificate-error', (e, webContents, url, error, certificate) => {
        return Object.assign(e, { webContents, url, error, certificate })
      }),
    windowOpen$: Observable
      .fromEvent(app, 'browser-window-created', (e, window) => Object.assign(e, {window})),
    windowFocus$: Observable
      .fromEvent(app, 'browser-window-focus', (e, window) => Object.assign(e, {window})),
    windowBlur$: Observable
      .fromEvent(app, 'browser-window-blur', (e, window) => Object.assign(e, {window})),
    exit$: Observable
      .fromEvent(app, 'quit', (e, exitCode) => Object.assign(e, {exitCode}))
  });

  Object.keys(eventShortcuts).forEach(key => {
    events[key] = events(eventShortcuts[key]);
  });

  return events;
}
