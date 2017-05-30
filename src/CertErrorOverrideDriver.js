import { Observable } from 'rxjs';
import { adapt } from '@cycle/run/lib/adapt';

export default function CertErrorOverrideDriver(app) {
  return (override$) => {
    Observable.from(override$)
      .filter(({ event }) => event && event.callback)
      .forEach(({ event: { callback }, allow = false }) => callback(allow));

    return adapt(Observable.fromEvent(
      app,
      'certificate-error',
      (event, webContents, url, error, certificate, callback) => {
        event.preventDefault && event.preventDefault();
        return Object.assign(
          event,
          { webContents, url, error, certificate, callback }
        )
      }
    ));
  }
}
