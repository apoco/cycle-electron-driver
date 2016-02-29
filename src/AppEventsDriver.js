import { Observable } from 'rx';

const eventTypes = [
  'will-finish-launching',
  'ready',
  'window-all-closed',
  'before-quit',
  'will-quit',
  'quit'
];

const eventConstructors = {
  'quit': (e, exitCode) => Object.assign(e, { exitCode })
};

export default function AppEventsDriver(app) {
  return eventBehavior$ => {

    const event$ = Observable
      .merge(eventTypes.map(type => Observable
        .fromEvent(app, type, (...args) => Object.assign(
          (type in eventConstructors) ? eventConstructors[type].apply(null, args) : args[0],
          { type }))
      ));

    event$
      .withLatestFrom(eventBehavior$)
      .filter(([event, { prevented = [] } = {}]) => prevented.indexOf(event.type) > -1 && event.preventDefault)
      .forEach(([event]) => event.preventDefault());

    return event$;
  };
}
