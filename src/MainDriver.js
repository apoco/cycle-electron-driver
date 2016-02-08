import { Observable } from 'rx';

export default function AppDriver(app) {
  return ({ exit$, preventedEvent$ } = {}) => {

    exit$ && exit$
      .map(val => isNaN(val) ? 0 : val)
      .forEach(code => app.exit(code));

    preventedEvent$ && preventedEvent$
      .forEach(e => e.preventDefault());

    return {
      events: eventName => Observable.fromEvent(app, eventName)
    }
  };
}
