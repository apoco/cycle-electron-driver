import { Observable } from 'rx';

const eventTypes = [
  'will-finish-launching',
  'ready',
  'window-all-closed'
];

export default function AppEventsDriver(app) {
  return () => Observable.merge(eventTypes.map(type => Observable.fromEvent(app, type).map(e => ({ type }))));
}
