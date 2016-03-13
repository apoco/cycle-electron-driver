import { Observable } from 'rx';

export default function AppMetadataDriver(app) {
  return () => Observable.just({
    get name() { return app.getName(); },
    get version() { return app.getVersion(); }
  });
}
