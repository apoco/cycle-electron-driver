import { Observable } from 'rxjs';
import { adapt } from '@cycle/run/lib/adapt';

export default function BasicAuthDriver(app) {
  return login$ => {
    Observable.from(login$)
      .filter(({ event }) => event.callback)
      .forEach(({ event, username, password }) => event.callback(username, password));

    return adapt(Observable.fromEvent(
      app,
      'login',
      (e, webContents, request, authInfo, callback) => {
        e.preventDefault && e.preventDefault();
        return { webContents, request, authInfo, callback };
      }));
  };
}
