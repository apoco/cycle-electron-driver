import { Observable } from 'rx';

export default function AppDriver(app) {
  return state$ => {

    state$.forEach(
      state => {},
      error => app.quit(error.code || 1),
      end => app.quit(0)
    );

    return {
      events: eventName => Observable.fromEvent(app, eventName)
    }
  };
}
