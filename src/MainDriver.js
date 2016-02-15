import { Observable, Subject } from 'rx';

import pathNames from './pathNames';

export default function AppDriver(app, opts = {}) {
  let extraLaunch$ = null;

  if (opts.isSingleInstance) {
    extraLaunch$ = new Subject();
    const shouldQuit = app.makeSingleInstance((argv, cwd) => extraLaunch$.onNext({ argv, cwd }));

    if (shouldQuit) {
      app.quit();
    }

  } else {
    extraLaunch$ = Observable.empty();
  }

  return state$ => {

    let subscriptions = [];

    state$.forEach(state => {
      subscriptions.filter(Boolean).forEach(s => s.dispose());
      subscriptions = setupSinkSubscriptions(app, state);
    });

    return {
      appInfo: {
        get name() { return app.getName() },
        get version() { return app.getVersion() },
        get locale() { return app.getLocale() }
      },
      paths: setupPathSources(app, state$),
      events: setupEventSources(app, extraLaunch$)
    }
  };
}

function setupPathSources(app, state$) {
  const paths = {
    get app$() {
      return Observable.just(app.getAppPath());
    }
  };

  pathNames.forEach(prop => {
    const observableName = `${prop}$`;
    Object.defineProperty(paths, observableName, {
      get() {
        const pathUpdates = state$
          .flatMapLatest(state => {
            return (state && state.pathUpdates && state.pathUpdates[observableName]) || Observable.empty()
          });
        return Observable.just(app.getPath(prop)).merge(pathUpdates);
      }
    });
  });
  return paths;
}

const eventShortcuts = {
  willFinishLaunching$: 'will-finish-launching',
  ready$: 'ready',
  beforeAllWindowClose$: 'before-quit',
  allWindowsClose$: 'window-all-closed',
  beforeExit$: 'will-quit',
  gpuProcessCrash$: 'gpu-process-crashed'
};

function setupEventSources(app, extraLaunch$) {
  const events = Object.assign(
    eventName => Observable.fromEvent(app, eventName),
    setupCertEventSources(app),
    setupWindowEventSources(app),
    setupLifecycleEventSources(app),
    {
      extraLaunch$,
      get fileOpen$() {
        return Observable.fromEvent(app, 'open-file', (e, path) => Object.assign(e, {path}))
      },
      get urlOpen$() {
        return Observable.fromEvent(app, 'open-url', (e, url) => Object.assign(e, {url}))
      },
      get loginPrompt$() {
        return Observable.fromEvent(app, 'login', (e, webContents, request, authInfo, callback) => {
          return Object.assign(e, {webContents, request, authInfo, callback});
        })
      }
    }
  );

  Object.keys(eventShortcuts).forEach(key => {
    events[key] = events(eventShortcuts[key]);
  });

  return events;
}

function setupLifecycleEventSources(app) {
  return {
    get activation$() {
      return Observable.fromEvent(app, 'activate', (e, hasVisibleWindows) => Object.assign(e, {hasVisibleWindows}))
    },
    get exit$() {
      return Observable.fromEvent(app, 'quit', (e, exitCode) => Object.assign(e, {exitCode}))
    }
  };
}

function setupWindowEventSources(app) {
  return {
    get windowOpen$() {
      return Observable.fromEvent(app, 'browser-window-created', (e, window) => Object.assign(e, {window}));
    },
    get windowFocus$() {
      return Observable.fromEvent(app, 'browser-window-focus', (e, window) => Object.assign(e, {window}));
    },
    get windowBlur$() {
      return Observable.fromEvent(app, 'browser-window-blur', (e, window) => Object.assign(e, {window}));
    }
  };
}

function setupCertEventSources(app) {
  return {
    get certError$() {
      return Observable.fromEvent(app, 'certificate-error', (e, webContents, url, error, certificate, callback) => {
        return Object.assign(e, {webContents, url, error, certificate, callback})
      })
    },
    get clientCertPrompt$() {
      return Observable.fromEvent(app, 'select-client-certificate', (e, webContents, url, certificateList, callback) => {
        return Object.assign(e, {webContents, url, certificateList, callback})
      })
    }
  };
}

function setupSinkSubscriptions(app, state) {
  return []
    .concat(setupQuitSubscriptions(app, state.quit$))
    .concat(setupExitSubscriptions(app, state.exit$))
    .concat(setupPreventedEventSubscriptions(state.preventedEvent$))
    .concat(setupTrustedCertSubscriptions(state.trustedCert$))
    .concat(setupClientCertSelectionSubscriptions(state.clientCertSelection$))
    .concat(setupLoginSubscriptions(state.login$))
    .concat(setupPathUpdateSubscriptions(app, state.pathUpdates))
    .concat(setupRecentDocsSubscriptions(app, state.recentDocs))
    .concat(setupUserTasksSubscriptions(app, state.userTask$))
    .concat(setupNTLMOverrideSubscriptions(app, state.ntlmAllowedOverride$));
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

function setupPathUpdateSubscriptions(app, pathUpdates) {
  if (!pathUpdates) {
    return null;
  }

  return pathNames.map(name => {
    const prop = `${name}$`;
    return pathUpdates[prop] && pathUpdates[prop].forEach(value => app.setPath(name, value));
  });
}

function setupRecentDocsSubscriptions(app, recentDocs) {
  if (!recentDocs) {
    return null;
  }

  return [
    recentDocs.add$ && recentDocs.add$.forEach(path => app.addRecentDocument(path)),
    recentDocs.clear$ && recentDocs.clear$.forEach(() => app.clearRecentDocuments())
  ];
}

function setupUserTasksSubscriptions(app, userTask$) {
  return userTask$ && userTask$.forEach(tasks => app.setUserTasks(tasks));
}

function setupNTLMOverrideSubscriptions(app, override$) {
  return override$ && override$.forEach(enabled => app.allowNTLMCredentialsForAllDomains(enabled));
}
