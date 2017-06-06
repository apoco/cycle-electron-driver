import fromEvent from 'xstream/extra/fromEvent';

export default function CertErrorOverrideDriver(app) {
  return (override$) => {
    Observable.from(override$)
      .filter(({ event }) => event && event.callback)
      .addListener({
        next: ({ event: { callback }, allow = false }) => callback(allow)
      });

    return fromEvent(app, 'certificate-error')
      .map(arg => {
        arg = Array.isArray(arg) ? arg : [arg];
        const [event, webContents, url, error, certificate, callback] = arg;
        event.preventDefault && event.preventDefault();
        return Object.assign(
          event,
          { webContents, url, error, certificate, callback }
        );
      });
  };
}
