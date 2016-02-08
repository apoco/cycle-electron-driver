import { Observable } from 'rx';

export default function AppDriver(app) {
  return ({ exits, preventedEvents } = {}) => {

    exits && exits
      .map(val => isNaN(val) ? 0 : val)
      .forEach(code => app.exit(code));

    preventedEvents && preventedEvents
      .forEach(e => e.preventDefault());

    return {
      events: eventName => Observable.fromEvent(app, eventName)
    }
  };
}
