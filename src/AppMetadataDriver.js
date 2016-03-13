import { Observable } from 'rx';

export default function AppMetadataDriver(app) {
  return () => Observable.just({
    get version() { return app.getVersion(); }
  });
}
