import { Observable } from 'rx';

export default function ClientCertDriver(app) {
  return prompt$ => {
    prompt$
      .filter(({ event: { callback } }) => callback)
      .forEach(({ event: { callback }, cert }) => callback(cert));

    return Observable.fromEvent(
      app,
      'select-client-certificate',
      ({ preventDefault }, webContents, url, certificateList, callback) => {
        preventDefault && preventDefault();
        return { webContents, url, certificateList, callback };
      });
  }
}