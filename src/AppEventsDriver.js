import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';
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
  const events = Object.keys(eventParams).map(type =>
    fromEvent(app, type)
      .map(arg => {
        arg = Array.isArray(arg) ? arg : [arg];
        const [event, ...paramValues] = arg;
        return eventParams[type].reduce(
          (ev, param, i) => Object.assign(ev, { [param]: paramValues[i] }),
          Object.assign(event, { type })
        )
      })
  );

  return () => xs.merge(...events);
}
