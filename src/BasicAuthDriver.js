import xs from 'xstream';
import fromEvent from 'xstream/extra/fromEvent';

export default function BasicAuthDriver(app) {
  return login$ => {
    login$
      .filter(({event}) => event.callback)
      .addListener({
        next: ({event, username, password}) => event.callback(username, password)
      });

    return fromEvent(app, 'login')
      .map(arg => {
        arg = Array.isArray(arg) ? arg : [arg];
        const [ev, webContents, request, authInfo, callback] = arg;
        ev.preventDefault && ev.preventDefault();
        return { webContents, request, authInfo, callback };
      })
  };
}
