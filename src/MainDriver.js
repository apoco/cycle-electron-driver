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
      platformInfo: {
        get isAeroGlassEnabled() { return app.isAeroGlassEnabled(); }
      },
      paths: setupPathSources(app, state$),
      events: setupEventSources(app, extraLaunch$),
      get badgeLabel$() {
        return Observable
          .just(app.dock.getBadge())
          .concat(state$.flatMap(({ dock: { badgeLabel$ = Observable.empty() } = {} } = {}) => badgeLabel$));
      }
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
    .concat(subscribeToQuits(app, state.quit$))
    .concat(subscribeToExits(app, state.exit$))
    .concat(subscribeToPreventedEvents(state.preventedEvent$))
    .concat(subscribeToCertTrustOverrides(state.trustedCert$))
    .concat(subscribeToClientCertSelections(state.clientCertSelection$))
    .concat(subscribeToLogins(state.login$))
    .concat(subscribeToPathUpdates(app, state.pathUpdates))
    .concat(subscribeToRecentDocChanges(app, state.recentDocs))
    .concat(subscribeToUserTaskChanges(app, state.userTask$))
    .concat(subscribeToNTMLSettingChanges(app, state.ntlmAllowedOverride$))
    .concat(subscribeToAppUserModelIdChanges(app, state.appUserModelId$))
    .concat(subscribeToNewChromiumParams(app, state.newChromiumParam$))
    .concat(subscribeToDockSinks(app, state.dock));
}

function subscribeToQuits(app, quit$) {
  return quit$ && quit$.forEach(() => app.quit());
}

function subscribeToExits(app, exit$) {
  return exit$ && exit$
    .map(val => isNaN(val) ? 0 : val)
    .forEach(code => app.exit(code));
}

function subscribeToPreventedEvents(preventedEvent$) {
  return preventedEvent$ && preventedEvent$
    .forEach(e => e.preventDefault());
}

function subscribeToCertTrustOverrides(trustedCert$) {
  return trustedCert$ && trustedCert$
    .forEach(e => {
      e.preventDefault();
      e.callback(true);
    });
}

function subscribeToClientCertSelections(clientCertSelection$) {
  return clientCertSelection$ && clientCertSelection$
    .forEach(({ prompt, cert }) => {
      prompt.preventDefault();
      prompt.callback(cert);
    });
}

function subscribeToLogins(login$) {
  return login$ && login$.forEach(({ prompt, username, password }) => {
    prompt.preventDefault();
    prompt.callback(username, password);
  });
}

function subscribeToPathUpdates(app, pathUpdates) {
  if (!pathUpdates) {
    return null;
  }

  return pathNames.map(name => {
    const prop = `${name}$`;
    return pathUpdates[prop] && pathUpdates[prop].forEach(value => app.setPath(name, value));
  });
}

function subscribeToRecentDocChanges(app, recentDocs) {
  if (!recentDocs) {
    return null;
  }

  return [
    recentDocs.add$ && recentDocs.add$.forEach(path => app.addRecentDocument(path)),
    recentDocs.clear$ && recentDocs.clear$.forEach(() => app.clearRecentDocuments())
  ];
}

function subscribeToUserTaskChanges(app, userTask$) {
  return userTask$ && userTask$.forEach(tasks => app.setUserTasks(tasks));
}

function subscribeToNTMLSettingChanges(app, override$) {
  return override$ && override$.forEach(enabled => app.allowNTLMCredentialsForAllDomains(enabled));
}

function subscribeToAppUserModelIdChanges(app, id$) {
  return id$ && id$.forEach(id => app.setAppUserModelId(id));
}

function subscribeToNewChromiumParams(app, param$) {
  return param$ && param$.forEach(({ switches = [], args = [] } = {}) => {
    switches.forEach(obj => {
      const applyArgs = [obj.switch];
      if ('value' in obj) {
        applyArgs.push(obj.value);
      }
      app.appendSwitch.apply(app, applyArgs);
    });

    args.forEach(arg => app.appendArgument(arg));
  });
}

function subscribeToDockSinks(app, dock) {
  if (!dock) {
    return null;
  }

  return subscribeToDockBounceSinks(app, dock.bounce)
    .concat(subscribeToDockBadgeLabels(app, dock.badgeLabel$))
    .concat(subscribeToDockVisibility(app, dock.visibility$))
    .concat(subscribeToDockMenus(app, dock.menu$))
    .concat(subscribeToDockIcons(app, dock.icon$));
}

function subscribeToDockBounceSinks(app, bounce) {
  if (!bounce) {
    return [];
  }

  const nativeIds = {};

  return [
    bounce.start$ && bounce.start$.forEach(({ id, type = 'informational' } = {}) => {
      nativeIds[id] = app.dock.bounce(type);
    }),
    bounce.cancel$ && bounce.cancel$.forEach(id => {
      const nativeId = nativeIds[id];
      if (nativeId) {
        app.dock.cancelBounce(nativeId);
      }
      delete nativeIds[id];
    })
  ];
}

function subscribeToDockBadgeLabels(app, badgeLabel$) {
  return badgeLabel$ && badgeLabel$.forEach(label => app.dock.setBadge(label));
}

function subscribeToDockVisibility(app, visibility$) {
  if (!visibility$) {
    return [];
  }

  return [
    visibility$.filter(value => value === false).forEach(() => app.dock.hide()),
    visibility$.filter(value => value === true).forEach(() => app.dock.show())
  ];
}

function subscribeToDockMenus(app, menu$) {
  return menu$ && menu$.forEach(menu => app.dock.setMenu(menu));
}

function subscribeToDockIcons(app, icon$) {
  return icon$ && icon$.forEach(icon => app.dock.setIcon(icon));
}
