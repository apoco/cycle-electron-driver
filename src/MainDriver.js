import { Observable } from 'rx';

export default function AppDriver(app) {
  return () => ({
    events: eventName => Observable.fromEvent(app, eventName)
  });
}
