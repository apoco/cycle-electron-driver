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

The `events` source factory creates an `Observable` for 
[electron `app` events](http://electron.atom.io/docs/v0.36.5/api/app/#events).

```js
function main({ electron }) {
  const readyEvent$ = electron.events('ready');
}
```

Calling methods on `Event` objects, such as `preventDefault()` is antithetical to the Cycle.js philosophy; to enable
preventing defaults, you can subscribe to events with a second options parameter:

```js
const beforeQuit$ = electron.events('before-quit', { prevented: true });
```

When you receive these events, they will already have had their `preventDefault` called.

#### Sink

An component using an electron driver should return an `Observable` that produces objects representing the application
state. The `cycle-electron-driver` exports some functions to help create these state objects.

##### Exiting

When the sink `Observable` completes, the application will exit normally (exit code `0`). When the `Observable` emits an
error, the application will print an error to `stderr` and return with exit code `1`. A different exit code can be
specified by having a numeric `code` property in the error object.
