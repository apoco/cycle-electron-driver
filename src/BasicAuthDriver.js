import { Observable } from 'rx';

export default function BasicAuthDriver(app) {
  return login$ => {
    login$
      .filter(({ event }) => event.callback)
      .forEach(({ event, username, password }) => event.callback(username, password));

    return Observable.fromEvent(
      app,
      'login',
      (e, webContents, request, authInfo, callback) => {
        e.preventDefault && e.preventDefault();
        return { webContents, request, authInfo, callback };
      })
  };
}
