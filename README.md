# cycle-electron-driver

The `cycle-electron-driver` module provides Cycle.js drivers for building Electron apps.

## API mappings

If you are already familiar with the `electron` API, here's a map of its interface to drivers:

* app
  * events
    * `will-finish-launching` - [AppEventsDriver](#appeventsdriver)
    * `ready` - [AppEventsDriver](#appeventsdriver)
    * `window-all-closed` - [AppEventsDriver](#appeventsdriver)
    * `before-quit` - [AppEventsDriver](#appeventsdriver)
    * `will-quit` - [AppEventsDriver](#appeventsdriver)
    * `quit` - [AppEventsDriver](#appeventsdriver)
    * `open-file` - [AppEventsDriver](#appeventsdriver)
    * `open-url` - [AppEventsDriver](#appeventsdriver)
    * `activate` - [AppEventsDriver](#appeventsdriver)
    * `browser-window-blur` - [AppEventsDriver](#appeventsdriver)
    * `browser-window-focus` - [AppEventsDriver](#appeventsdriver)
    * `browser-window-created` - [AppEventsDriver](#appeventsdriver)
    * `certificate-error` - [CertErrorOverrideDriver](#certerroroverridedriver)

## Drivers

An electron application is made up of two processes; the main process and the render process. Each have different sets
of modules they interact with. Thus, two different drivers are provided by `cycle-electron-driver`.

### AppEventsDriver

`AppEventsDriver` provides access to electron app events. It provides a source observable containing all events.
To create the driver, simply call the constructor with the electron `app`:

```js
import Cycle from '@cycle/core';
import { app } from 'electron';

Cycle.run(({ appEvent$ }) => ({
  ready$: appEvent$.filter(e => e.type === 'ready')
}), {
  appEvent$: AppEventsDriver(app)
});
```

These events have a `type` property that matches
[the names of the electron events](https://github.com/atom/electron/blob/master/docs/api/app.md#events). Additional
event arguments are normalized into the event object properties as follows:

* `quit` - `exitCode`
* `open-file` - `path`
* `open-url` - `url`
* `activate` - `hasVisibleWindows`
* `browser-window-blur` - `window`
* `browser-window-focus` - `window`
* `browser-window-created` - `window`
* `certificate-error` - `webContents`, `url`, `error`, `certificate`

Additionally, you can provide a sink observable for controlling the behavior of events. The `prevented` Array 
property of the observable value objects lists the event types that should automatically have their default
behavior cancelled. Use this, for example, to prevent `before-quit` events if the app is not saved:

```js
Cycle.run(sources => {  
  // let isSaved$ = ...
  
  return {
    appEvent$: isSaved$.map(isSaved => ({
      prevented: isSaved ? [] : ['before-quit']
    }))
  };

}, {
  appEvent$: AppEventsDriver(app)
});
```

### CertErrorOverrideDriver

`CertErrorOverrideDriver` provides a source observable of events indicating when verification of a server's SSL 
certificate has failed, and consumes a sink observable of objects indicating whether the certificate rejection should
be overridden. This driver should only rarely be needed, but it can be helpful for cases such as when you are using
a self-signed certificate during development and want your app to accept that certificate. For example:

```js
import { app } from 'electron';
import { CertErrorOverrideDriver } from 'cycle-electron-driver';

Cycle.run(({ certErr$ }) => ({
  certErr$: certErr$.map(e => ({ event: e, allow: e.certificate.issuerName === 'My Test CA' }));
}), {
  certErr$: CertErrorOverrideDriver(app);
});
```

The source objects are based on 
[electron certificate-error events](http://electron.atom.io/docs/v0.36.8/api/app/#event-certificate-error) and have the
following properties:

* `webContents` - The contents of the window that received the error
* `url` - The URL being requested
* `error` - The error code
* `certificate.data` - A buffer containing the PEM-formatted certificate
* `certificate.issuerName` - The issuer of the certificate

Sink objects should have these properties:

* `event` - The source event representing the certificate error
* `allow` - A boolean `true` or `false`. If `true`, the SSL request will be allowed to continue. Else it will fail.

You must have one object for each source event; otherwise the driver does not know whether the certificate error should
cause the SSL requests to succeed or fail. If you do not want to override any certificate errors, do not use this
driver. If you only want to be notified when these events occur, filter the `AppEventsDriver` events by type
`certificate-error`.

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

#### Options

When constructing the main process driver, an optional second argument can provide the following options:

* `isSingleInstance` - If set to `true`, only one instance of the application can be created. The `extraLaunch$` source
  will emit when additional launches are attempted. This defaults to `false`.

#### Sources

The source object provided by `MainDriver` contains multiple properties and observables, most of which you will never
need to use. To summarize the overall structure, it looks something like this:

```
appInfo:
  name
  version
  locale
platformInfo:
  isAeroGlassEnabled
events() :: String -> Observable
  extraLaunch$
  windowOpen$
  windowFocus$
  windowBlur$
  loginPrompt$
  clientCertPrompt$
  certError$
  gpuProcessCrash$
  beforeAllWindowClose$
  beforeExit$
  exit$
paths:
  app$
  appData$
  desktop$
  documents$
  downloads$
  exe$
  home$
  module$
  music$
  pictures$
  temp$
  userData$
  videos$
badgeLabel$
```

##### appInfo

The `appInfo` object provides the following metadata about the electron app:

* `name`
* `version`
* `locale`

##### platformInfo

The `platformInfo` object provides the following information about the runtime platform:

* `isAeroGlassEnabled`  - (Windows only) whether DWM composition is enabled 

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

###### events.extraLaunch$

When the `isSingleInstance` option is `true`, this observable indicates when blocked additional launches are attempted.
Values are objects with the following properties:

* `argv`  - Array of command-line arguments used when this was launched
* `cwd`   - The working directory of the process that was launched

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

##### badgeLabel$

This `Observable` gives the current and future badge labels of the OS X dock icon.

#### Sinks

The sink for the driver should be an observable that produces an object containing multiple sink observables. Any of
these sinks can be omitted if not needed. The object properties can be summarized as follows:

```
login$
clientCertSelection$
trustedCert$
preventedEvent$
pathUpdates:
  appData$
  desktop$
  documents$
  downloads$
  exe$
  home$
  module$
  music$
  pictures$
  temp$
  userData$
  videos$
recentDocs:
  add$
  clear$
newChromiumParam$
userTask$
dock:
  bounce:
    start$
    cancel$
  visibility$
  badgeLabel$
  menu$
  icon$
ntlmAllowedOverride$
appUserModelId$
quit$
exit$
```

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

The `recentDocs` object has the following available sinks:

* `add$`    - The strings produced by this observable will be added to the OS's recent documents for the app
* `clear$`  - When this observable produces values, it clears the recent documents for the app

##### newChromiumParam$

The `newChromiumParam$` sink should produce objects with the following properties:

* `switches`  - An `Array` of objects with a required `switch` and optional `value` property to be appended to the
                Chromium parameters
* `args`      - An `Array` of strings that will be used for additional command-line arguments to Chromium

Note that these are write-only and cannot be undone. In other words, you cannot remove a switch or argument once it has
been included.

##### userTask$

This sink should emit array of task objects to set the user tasks for the application (Windows only). The objects should
have the following properties:

* `program` - The application executable; use `process.execPath` to use the currently-executing app executable.
* `arguments` - An array of strings to use as program arguments
* `title` - The title to give the task
* `description` - The full description of the task
* `iconPath` - Path to the icon to show for the task
* `iconIndex` - If `iconPath` contains multiple icons, the index of the icon to use for the task

##### dock

The `dock` property is a container for multiple OSX-specific sinks.

###### bounce

The bounce property of `dock` has the following observable properties:

* `start$` - This should be an `Observable` of objects with an `id` and `type` property. The `type` property should be
  a string equalling either `critical` or `informational`. `id` is an arbitrary string that should be unique
  and kept track of if you wish to cancel the bounce at a later time. Otherwise, it may be omitted.
* `cancel$` - This should be an `Observable` of string IDs; these IDs should correlate to the `id` used in the `start$`
  observable objects.

###### visibility$

This `Observable` should contain boolean values; `true` values will cause the dock icon to show, `false` to hide.

###### badgeLabel$

This sink causes the OS X badge label to be updated.

###### menu$

This sink sets the menu in the OS X dock for the application. See 
[the electron documentation](http://electron.atom.io/docs/v0.36.7/api/app/#appdocksetmenumenu-os-x) for details on what
these values should be.

###### icon$

This sink sets the icon in the OS X dock. Values should be  
[NativeImage](http://electron.atom.io/docs/v0.36.7/api/native-image) objects.

##### ntlmAllowedOverride$

This sink should be an `Observable` of boolean values; when true, NTLM authentication is enabled for sites not 
recognized as being part of the local intranet.

##### appUserModelId$

This causes the Windows 
[Application User Model ID](https://msdn.microsoft.com/en-us/library/windows/desktop/dd378459(v=vs.85).aspx) to change
to the values of the `Observable`.

##### quit$

When this `Observable` produces a value, an application quit is issued. Use `exit$` instead to forcefully terminate.

##### exit$

When an exit value is received, it will cause the application to immediately exit. If the value is a number, that number
will be the exit code. Use `quit$` for a more graceful way to end an application.
