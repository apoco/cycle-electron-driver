import { Observable } from 'rx';

const eventParams = {
  'window-all-closed':          [],
  'before-quit':                [],
  'will-quit':                  [],
  'quit':                       ['exitCode'],
  'open-file':                  ['path'],
  'open-url':                   ['url'],
  'activate':                   ['hasVisibleWindows'],
  'browser-window-blur':        ['window'],
  'browser-window-focus':       ['window'],
  'browser-window-created':     ['window'],
  'certificate-error':          ['webContents', 'url', 'error', 'certificate'],
  'select-client-certificate':  ['webContents', 'url', 'certificateList', 'callback'],
  'login':                      ['webContents', 'request', 'authInfo', 'callback'],
  'gpu-process-crashed':        []
};

export default function AppEventsDriver(app) {
  return eventBehavior$ => {

    const event$ = Observable
      .merge(Object.keys(eventParams).map(type => Observable
        .fromEvent(app, type, (event, ...args) => eventParams[type].reduce(
          (event, param, i) => Object.assign(event, { [param]: args[i] }),
          Object.assign(event, { type })))
      ));

    event$
      .withLatestFrom(eventBehavior$)
      .filter(([event, { prevented = [] } = {}]) => prevented.indexOf(event.type) > -1 && event.preventDefault)
      .forEach(([event]) => event.preventDefault());

    return event$;
  };
}
