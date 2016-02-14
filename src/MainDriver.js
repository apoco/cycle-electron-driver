import { Observable } from 'rx';

export default function AppDriver(app) {
  return state$ => {

    let subscriptions = [];

    state$.forEach(state => {
      subscriptions.filter(Boolean).forEach(s => s.dispose());
      subscriptions = setupSinkSubscriptions(app, state);
    });

    return {
      getAppPath: app.getAppPath.bind(app),
      events: setupEventSources(app)
    }
  };
}

const eventShortcuts = {
  willFinishLaunching$: 'will-finish-launching',
  ready$: 'ready',
  beforeAllWindowClose$: 'before-quit',
  allWindowsClose$: 'window-all-closed',
  beforeExit$: 'will-quit',
  gpuProcessCrash$: 'gpu-process-crashed'
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
    loginPrompt$: Observable
      .fromEvent(app, 'login', (e, webContents, request, authInfo, callback) => {
        return Object.assign(e, { webContents, request, authInfo, callback });
      }),
    certError$: Observable
      .fromEvent(app, 'certificate-error', (e, webContents, url, error, certificate, callback) => {
        return Object.assign(e, { webContents, url, error, certificate, callback })
      }),
    clientCertPrompt$: Observable
      .fromEvent(app, 'select-client-certificate', (e, webContents, url, certificateList, callback) => {
        return Object.assign(e, { webContents, url, certificateList, callback })
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

function setupSinkSubscriptions(app, state) {
  return []
    .concat(setupQuitSubscriptions(app, state.quit$))
    .concat(setupExitSubscriptions(app, state.exit$))
    .concat(setupPreventedEventSubscriptions(state.preventedEvent$))
    .concat(setupTrustedCertSubscriptions(state.trustedCert$))
    .concat(setupClientCertSelectionSubscriptions(state.clientCertSelection$))
    .concat(setupLoginSubscriptions(state.login$));
}

function setupQuitSubscriptions(app, quit$) {
  return quit$ && quit$.forEach(() => app.quit());
}

function setupExitSubscriptions(app, exit$) {
  return exit$ && exit$
    .map(val => isNaN(val) ? 0 : val)
    .forEach(code => app.exit(code));
}

function setupPreventedEventSubscriptions(preventedEvent$) {
  return preventedEvent$ && preventedEvent$
    .forEach(e => e.preventDefault());
}

function setupTrustedCertSubscriptions(trustedCert$) {
  return trustedCert$ && trustedCert$
    .forEach(e => {
      e.preventDefault();
      e.callback(true);
    });
}

function setupClientCertSelectionSubscriptions(clientCertSelection$) {
  return clientCertSelection$ && clientCertSelection$
    .forEach(({ prompt, cert }) => {
      prompt.preventDefault();
      prompt.callback(cert);
    });
}

function setupLoginSubscriptions(login$) {
  return login$ && login$.forEach(({ prompt, username, password }) => {
    prompt.preventDefault();
    prompt.callback(username, password);
  });
}