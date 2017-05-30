import { Observable } from 'rxjs';
import { adapt } from '@cycle/run/lib/adapt';

const eventParams = {
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
  const events = Object.keys(eventParams).map(type => Observable
    .fromEvent(app, type, (event, ...args) => eventParams[type].reduce(
      (event, param, i) => Object.assign(event, { [param]: args[i] }),
      Object.assign(event, { type })))
  );

  return () => adapt(Observable.merge(...events));
}
