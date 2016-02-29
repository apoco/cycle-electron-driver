import { Observable } from 'rx';

const eventTypes = [
  'will-finish-launching',
  'ready',
  'window-all-closed',
  'before-quit',
  'will-quit',
  'quit'
];

export default function AppEventsDriver(app) {
  return eventBehavior$ => {

    const event$ = Observable
      .merge(eventTypes.map(type => Observable
        .fromEvent(app, type)
        .map(e => Object.assign(e, { type }))
      ));

    event$
      .withLatestFrom(eventBehavior$)
      .filter(([event, { prevented = [] } = {}]) => prevented.indexOf(event.type) > -1 && event.preventDefault)
      .forEach(([event]) => event.preventDefault());

    return event$;
  };
}
