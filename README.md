# cycle-electron-driver

Cycle.js drivers for electron apps


## Drivers

An electron application is made up of two processes; the main process and the render process. Each have different sets
of modules they interact with. Thus, two different drivers are provided by `cycle-electron-driver`.


### Main process driver

To create the driver for the main process, use the `createMainDriver` function:

```js
import Cycle from '@cycle/core';
import { createMainDriver } from 'cycle-electron-driver';

function main(sources) {
  //...
}

Cycle.run(main, {
  electron: createMainDriver()
});
```

#### Sources

##### events

The `events` source factory creates an `Observable` for raw
[electron `app` events](http://electron.atom.io/docs/v0.36.5/api/app/#events).

```js
function main({ electron }) {
  const readyEvent$ = electron.events('ready');
}
```

Note that events documented with more than one parameter will be truncated; only the `Event` portion will be received.
It is recommended that you use one of the more normalized event sources listed below if you're handling an event.

Calling methods on `Event` objects, such as `preventDefault()` is antithetical to the Cycle.js philosophy; to enable
preventing defaults, use the `preventedEvents` sink listed below.

##### events.willFinishLaunching$

This is equivalent to `events('will-finish-launching')`.

See the [`will-finish-launching`](http://electron.atom.io/docs/v0.36.5/api/app/#event-will-finish-launching) event 
documentation for more information.

##### events.ready$

These events are raised once the application is ready.

See the [`ready`](http://electron.atom.io/docs/v0.36.5/api/app/#event-ready) event documentation
for more information.

##### events.activation$

These events are raised, for OS X, when the application is activated (clicked on the dock, for example). It has a
`hasVisibleWindows` property.

See the [`activate`](http://electron.atom.io/docs/v0.36.5/api/app/#event-activate) event documentation
for more information.


##### events.fileOpen$

These events are raised when a file is being requested to be opened by your app. The `path` property of an event gives
the path of the file. Be sure to pipe these to the `preventedEvent$` sink if you want to provide custom handling.

See the [`open-file`](http://electron.atom.io/docs/v0.36.5/api/app/#event-open-file) event documentation
for more information.

##### events.urlOpen$

These events are raised when a URL, indicated by the `url` property, is requested to be opened by your app. You should
pipe these to the `preventedEvent$` sink if you are overriding the default behavior.

See the [`open-url`](http://electron.atom.io/docs/v0.36.5/api/app/#event-open-url) event documentation
for more information.

##### events.windowOpen$

These events are raised when a window, identified by the `window` property, has been created. 
See the [`browser-window-create`](http://electron.atom.io/docs/v0.36.5/api/app/#event-browser-window-create) event 
documentation for more information.

##### events.windowFocus$

These events are raised when a window, identified by the `window` property, receives focus. 
See the [`browser-window-focus`](http://electron.atom.io/docs/v0.36.5/api/app/#event-browser-window-focus) event 
documentation for more information.

##### events.windowBlur$

These events are raised when a window, identified by the `window` property, loses focus. 
See the [`browser-window-blur`](http://electron.atom.io/docs/v0.36.5/api/app/#event-browser-window-blur) event 
documentation for more information.

##### events.beforeAllWindowClose$

These are raised before the application starts closing its windows in response to an exit. To prevent an exit occurring,
pipe these into the `preventedEvent$` sink:

```js
function main({ electron: { events: { beforeAllWindowClose$ } } }) {
  return {
    electron: {
      preventedEvent$: beforeAllWindowClose$
    }
  };
}
```

See the [`before-quit`](http://electron.atom.io/docs/v0.36.5/api/app/#event-before-quit) event documentation
for more information.

##### events.allWindowsClose$

These events are raised whenever all windows have closed and the application does not automatically quit after its
windows have closed. OSX, for example, does not automatically quit when its windows have closed. Here's how you can
force these events to provoke an exit:

```js
function main({ electron: { events: { allWindowsClose$ } } }) {
  return {
    electron: {
      exit$: allWindowsClose$
    }
  }
}
```

See the [`window-all-closed`](http://electron.atom.io/docs/v0.36.5/api/app/#event-window-all-closed) event documentation
for more information.

##### events.beforeExit$

These are raised after all windows have closed and the application is about to exit. Pipe these to the 
`preventedEvent$` sink to cancel the exit.

See the [`will-quit`](http://electron.atom.io/docs/v0.36.5/api/app/#event-will-quit) event documentation
for more information.

##### events.exit$

These events are raised when the electron app has exited. It has an `exitCode` property. 

See the [`quit`](http://electron.atom.io/docs/v0.36.5/api/app/#event-quit) event documentation
for more information.


#### Sinks

##### exit$

When an exit value is received, it will cause the application to quit. If the value is a number, that number will be the
exit code.

##### preventedEvent$

Events emitted by this `Observable` will have their `preventDefault` method invoked.

```js
function main({ electron }) {
  return {
    electron: {
      preventedEvent$: electron.events('before-quit')
    }
  };
}
```

##### trustedCert$

This should be a filtering of `certificate-error` events that should be overridden as trusted.

```js
function main({ electron }) {
  return {
    electron: {
      trustedCert$: electron
        .events('certificate-error')
        .filter(e => e.certificate.issuerName === 'example.com')
    }
  };
}
```