import { Observable } from 'rx';

export default function AppDriver(app) {
  return state$ => {

    state$.forEach(
      state => {},
      error => app.quit(error.code || 1),
      end => app.quit(0)
    );

    return {
      events: (eventName, { prevented = false } = {}) => Observable
        .fromEvent(app, eventName)
        .tap(e => {
          if (prevented && e.preventDefault) {
            e.preventDefault()
          }
        })
    }
  };
}
