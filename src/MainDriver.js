import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';

export default function AppDriver(app, opts = {}) {
  let extraLaunch$ = null;

  if (opts.isSingleInstance) {
    extraLaunch$ = xs.never();
    const shouldQuit = app.makeSingleInstance((argv, cwd) => extraLaunch$.shamefullySendNext({ argv, cwd }));

    if (shouldQuit) {
      app.quit();
    }

  } else {
    extraLaunch$ = xs.empty();
  }

  return state$ => {

    let subscriptions = [];

    state$.addListener({
      next: state => {
        subscriptions.filter(Boolean).forEach(s => s.dispose());
        subscriptions = setupSinkSubscriptions(app, state);
      }
    });

    return {
      platformInfo: {
        get isAeroGlassEnabled() { return app.isAeroGlassEnabled(); }
      },
      events: setupEventSources(app, extraLaunch$),
      get badgeLabel$() {
        return state$.map(({ dock: { badgeLabel$ = xs.empty() } = {} } = {}) => badgeLabel$)
          .flatten()
          .startWith(app.dock.getBadge());
      }
    }
  };
}

function setupEventSources(app, extraLaunch$) {
  return Object.assign(eventName => fromEvent(app, eventName), { extraLaunch$ });
}

function setupSinkSubscriptions(app, state) {
  return []
    .concat(subscribeToAppUserModelIdChanges(app, state.appUserModelId$))
    .concat(subscribeToNewChromiumParams(app, state.newChromiumParam$))
    .concat(subscribeToDockSinks(app, state.dock));
}

function subscribeToAppUserModelIdChanges(app, id$) {
  return id$ && id$.addListener({
    next: id => app.setAppUserModelId(id)
  });
}

function subscribeToNewChromiumParams(app, param$) {
  return param$ && param$.addListener({
    next: ({ switches = [], args = [] } = {}) => {
      switches.forEach(obj => {
        const applyArgs = [obj.switch];
        if ('value' in obj) {
          applyArgs.push(obj.value);
        }
        app.appendSwitch.apply(app, applyArgs);
      });

      args.forEach(arg => app.appendArgument(arg));
    }
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
    bounce.start$ && bounce.start$.addListener({
      next: ({ id, type = 'informational' } = {}) => {
        nativeIds[id] = app.dock.bounce(type);
      }
    }),
    bounce.cancel$ && bounce.cancel$.addListener({
      next: id => {
        const nativeId = nativeIds[id];
        if (nativeId) {
          app.dock.cancelBounce(nativeId);
        }
        delete nativeIds[id];
      }
    })
  ];
}

function subscribeToDockBadgeLabels(app, badgeLabel$) {
  return badgeLabel$ && badgeLabel$.addListener({
    next: label => app.dock.setBadge(label)
  });
}

function subscribeToDockVisibility(app, visibility$) {
  if (!visibility$) {
    return [];
  }

  return [
    visibility$.filter(value => value === false).addListener({
      next: () => app.dock.hide()
    }),
    visibility$.filter(value => value === true).addListener({
      next: () => app.dock.show()
    })
  ];
}

function subscribeToDockMenus(app, menu$) {
  return menu$ && menu$.addListener({
    next: menu => app.dock.setMenu(menu)
  });
}

function subscribeToDockIcons(app, icon$) {
  return icon$ && icon$.addListener({
    next: icon => app.dock.setIcon(icon)
  });
}
