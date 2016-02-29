import { Observable } from 'rx';

const defaultConstructor = e => e;

const eventConstructors = {
  'will-finish-launching':  defaultConstructor,
  'ready':                  defaultConstructor,
  'window-all-closed':      defaultConstructor,
  'before-quit':            defaultConstructor,
  'will-quit':              defaultConstructor,
  'quit':                   (e, exitCode) => Object.assign(e, { exitCode }),
  'open-file':              (e, path)     => Object.assign(e, { path }),
  'open-url':               (e, url)      => Object.assign(e, { url })
};

export default function AppEventsDriver(app) {
  return eventBehavior$ => {

    const event$ = Observable
      .merge(Object.keys(eventConstructors).map(type => Observable
        .fromEvent(app, type, (...args) => Object.assign(
          eventConstructors[type].apply(null, args),
          { type }))
      ));

    event$
      .withLatestFrom(eventBehavior$)
      .filter(([event, { prevented = [] } = {}]) => prevented.indexOf(event.type) > -1 && event.preventDefault)
      .forEach(([event]) => event.preventDefault());

    return event$;
  };
}
