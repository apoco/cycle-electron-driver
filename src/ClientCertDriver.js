import { Observable } from 'rxjs';
import { adapt } from '@cycle/run/lib/adapt';

export default function ClientCertDriver(app) {
  return prompt$ => {
    Observable.from(prompt$)
      .filter(({ event: { callback } }) => callback)
      .forEach(({ event: { callback }, cert }) => callback(cert));

    return adapt(Observable.fromEvent(
      app,
      'select-client-certificate',
      ({ preventDefault }, webContents, url, certificateList, callback) => {
        preventDefault && preventDefault();
        return { webContents, url, certificateList, callback };
      }));
  }
}
