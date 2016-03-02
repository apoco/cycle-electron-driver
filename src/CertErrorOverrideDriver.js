import { Observable } from 'rx';

export default function CertErrorOverrideDriver(app) {
  return (override$) => {
    override$
      .filter(({ event }) => event && event.callback)
      .forEach(({ event: { callback }, allow = false }) => callback(allow));

    return Observable.fromEvent(
      app,
      'certificate-error',
      (event, webContents, url, error, certificate, callback) => {
        event.preventDefault && event.preventDefault();
        return Object.assign(
          event,
          { webContents, url, error, certificate, callback }
        )
      }
    )
  }
}