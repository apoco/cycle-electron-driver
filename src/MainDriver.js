import { Observable } from 'rx';

export default function AppDriver(app) {
  return ({ exit$, preventedEvent$, trustedCert$ } = {}) => {

    exit$ && exit$
      .map(val => isNaN(val) ? 0 : val)
      .forEach(code => app.exit(code));

    preventedEvent$ && preventedEvent$
      .forEach(e => e.preventDefault());

    trustedCert$ && trustedCert$
      .forEach(e => {
        e.preventDefault();
        e.callback(true);
      });

    const events = eventName => Observable.fromEvent(app, eventName);
    events.willFinishLaunching$ = events('will-finish-launching');

    return { events }
  };
}
