import xs from 'xstream';

export default function AppMetadataDriver(app) {
  return () => xs.of({
    get name() { return app.getName(); },
    get version() { return app.getVersion(); },
    get locale() { return app.getLocale(); }
  }));
}
