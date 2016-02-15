# cycle-electron-driver

Cycle.js drivers for electron apps


## Drivers

An electron application is made up of two processes; the main process and the render process. Each have different sets
of modules they interact with. Thus, two different drivers are provided by `cycle-electron-driver`.


### Main process driver

To create the driver for the main process, call the `MainDriver` function with the Electron app:

```js
import Cycle from '@cycle/core';
import { app } from 'electron';
import { MainDriver } from 'cycle-electron-driver';

function main(sources) {
  //...
}

Cycle.run(main, {
  electron: MainDriver(app)
});
```

#### Sources

##### appInfo

The appInfo object provides the following metadata about the electron app:

* `name`
* `version`
* `locale`

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

###### events.willFinishLaunching$

This is equivalent to `events('will-finish-launching')`.

See the [`will-finish-launching`](http://electron.atom.io/docs/v0.36.5/api/app/#event-will-finish-launching) event 
documentation for more information.

###### events.ready$

These events are raised once the application is ready.

See the [`ready`](http://electron.atom.io/docs/v0.36.5/api/app/#event-ready) event documentation
for more information.

###### events.activation$

These events are raised, for OS X, when the application is activated (clicked on the dock, for example). It has a
`hasVisibleWindows` property.

See the [`activate`](http://electron.atom.io/docs/v0.36.5/api/app/#event-activate) event documentation
for more information.


###### events.fileOpen$

These events are raised when a file is being requested to be opened by your app. The `path` property of an event gives
the path of the file. Be sure to pipe these to the `preventedEvent$` sink if you want to provide custom handling.

See the [`open-file`](http://electron.atom.io/docs/v0.36.5/api/app/#event-open-file) event documentation
for more information.

###### events.urlOpen$

These events are raised when a URL, indicated by the `url` property, is requested to be opened by your app. You should
pipe these to the `preventedEvent$` sink if you are overriding the default behavior.

See the [`open-url`](http://electron.atom.io/docs/v0.36.5/api/app/#event-open-url) event documentation
for more information.

###### events.windowOpen$

These events are raised when a window, identified by the `window` property, has been created. 
See the [`browser-window-created`](http://electron.atom.io/docs/v0.36.5/api/app/#event-browser-window-created) event 
documentation for more information.

###### events.windowFocus$

These events are raised when a window, identified by the `window` property, receives focus. 
See the [`browser-window-focus`](http://electron.atom.io/docs/v0.36.5/api/app/#event-browser-window-focus) event 
documentation for more information.

###### events.windowBlur$

These events are raised when a window, identified by the `window` property, loses focus. 
See the [`browser-window-blur`](http://electron.atom.io/docs/v0.36.5/api/app/#event-browser-window-blur) event 
documentation for more information.

###### events.loginPrompt$

These events are raised when being prompted to login (with HTTP basic auth). By default, the prompt is cancelled and no
login takes place. To override this behavior, inspect the `webContents`, `request`, and `authInfo` properties, and pipe
events to the `login$` property of the sink with the following properties:

```
{
  request: <the loginPrompt$ event>,
  username: <the username to use for logging in>
  password: <the password>
}
```

See the [`login`](http://electron.atom.io/docs/v0.36.5/api/app/#event-login) event documentation for more information.

###### events.clientCertPrompt$

These events are raised when a browser window is prompting for a client certificate selection. By default, electron will
automatically select the first available client certificate. To override this behavior, you should inspect the
`webContents` and/or `url`, choose a certificate object from `certificateList`, then pipe an object of this format into
the `clientCertSelection$` property of the sink:

```
{
  prompt: <event object>,
  cert: <object from event.certificateList>
}
```

See the [`select-client-certificate`](http://electron.atom.io/docs/v0.36.5/api/app/#event-select-client-certificate)
event documentation for more information.

###### events.certError$

These events are raised when the certificate for a URL is not trusted. To override trust failure, first inspect the 
`webContents`, `url`, `error` string, `certificate.data` PEM buffer, and `certificate.issuerName` properties attached
to the event. If you want to trust the cert, pipe the event into the `trustedCert$` sink.

See the [`certificate-error`](http://electron.atom.io/docs/v0.36.5/api/app/#event-certificate-error) event 
documentation for more information.

###### events.gpuProcessCrash$

These are raised when the GPU process crashes. 
See the [`gpu-process-crashed`](http://electron.atom.io/docs/v0.36.5/api/app/#event-gpu-process-crashed) event 
documentation for more information.


###### events.beforeAllWindowClose$

These are raised before the application starts closing its windows in response to an exit. To prevent an exit occurring,
pipe these into the `preventedEvent$` sink:

```js
function main({ electron: { events: { beforeAllWindowClose$ } } }) {
  return {
    electron: Observable.just({
      preventedEvent$: beforeAllWindowClose$
    })
  };
}
```

See the [`before-quit`](http://electron.atom.io/docs/v0.36.5/api/app/#event-before-quit) event documentation
for more information.

###### events.allWindowsClose$

These events are raised whenever all windows have closed and the application does not automatically quit after its
windows have closed. OSX, for example, does not automatically quit when its windows have closed. Here's how you can
force these events to provoke an exit:

```js
function main({ electron: { events: { allWindowsClose$ } } }) {
  return {
    electron: Observable.just({
      exit$: allWindowsClose$
    })
  }
}
```

See the [`window-all-closed`](http://electron.atom.io/docs/v0.36.5/api/app/#event-window-all-closed) event documentation
for more information.

###### events.beforeExit$

These are raised after all windows have closed and the application is about to exit. Pipe these to the 
`preventedEvent$` sink to cancel the exit.

See the [`will-quit`](http://electron.atom.io/docs/v0.36.5/api/app/#event-will-quit) event documentation
for more information.

###### events.exit$

These events are raised when the electron app has exited. It has an `exitCode` property. 

See the [`quit`](http://electron.atom.io/docs/v0.36.5/api/app/#event-quit) event documentation
for more information.

##### paths

The `paths` property contains observables for various file paths used by the electron app:

* `app$`       - The current application directory
* `appData$`   - The directory for application data
* `desktop$`   - The directory for the user's desktop files
* `documents$` - The directory for the user's documents
* `downloads$` - The directory for the user's downloaded files
* `exe$`       - The path to the application executable
* `home$`      - The user's home directory
* `module$`    - The path to the `libchromiumcontent` library
* `music$`     - The directory for the user's music files
* `pictures$`  - The directory for the user's image files
* `temp$`      - The directory for storing temporary data
* `userData$`  - The directory for storing user-specific application data
* `videos$`    - The directory for the user's video files

Changing these paths can be done through the `paths` sinks, except for `app$` which is read-only.

#### Sinks

##### login$

To perform a login, this `Observable` should emit objects of this format:

```
{
  request: <a loginPrompt$ event>,
  username: <the username to use for logging in>
  password: <the password>
}
```

##### clientCertSelection$

If overriding client certificate selections, read from the `events.clientCertPrompt$` source, select a certificate from
the `certificateList` property of those events, then emit an object of the format:

```
{
  prompt: <source event object>,
  cert: <object from certificateList property>
}
```

##### trustedCert$

This should be a filtering of the `events.certError$` events that should be overridden as trusted.

```js
function main({ electron }) {
  return {
    electron: Observable.just({
      trustedCert$: electron.events
        .certError$
        .filter(e => e.certificate.issuerName === 'example.com')
    })
  };
}
```

##### preventedEvent$

Events emitted by this `Observable` will have their `preventDefault` method invoked.

```js
function main({ electron }) {
  return {
    electron: Observable.just({
      preventedEvent$: electron.events('before-quit')
    })
  };
}
```

##### pathUpdates

Provide one of the following sinks to change the file path used by electron:

* `appData$`   - The directory for application data
* `desktop$`   - The directory for the user's desktop files
* `documents$` - The directory for the user's documents
* `downloads$` - The directory for the user's downloaded files
* `exe$`       - The path to the application executable
* `home$`      - The user's home directory
* `module$`    - The path to the `libchromiumcontent` library
* `music$`     - The directory for the user's music files
* `pictures$`  - The directory for the user's image files
* `temp$`      - The directory for storing temporary data
* `userData$`  - The directory for storing user-specific application data
* `videos$`    - The directory for the user's video files

##### recentDocs

The recentDocs object has the following available sinks:

* `add$`    - The strings produced by this observable will be added to the OS's recent documents for the app
* `clear$`  - When this observable produces values, it clears the recent documents for the app

##### quit$

When this `Observable` produces a value, an application quit is issued. Use `exit$` instead to forcefully terminate.

##### exit$

When an exit value is received, it will cause the application to immediately exit. If the value is a number, that number
will be the exit code. Use `quit$` for a more graceful way to end an application.
