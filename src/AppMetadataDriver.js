import { Observable } from 'rxjs';
import { adapt } from '@cycle/run/lib/adapt';

export default function AppMetadataDriver(app) {
  return () => adapt(Observable.of({
    get name() { return app.getName(); },
    get version() { return app.getVersion(); },
    get locale() { return app.getLocale(); }
  }));
}
