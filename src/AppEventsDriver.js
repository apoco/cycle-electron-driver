import { Observable } from 'rx';

export default function AppEventsDriver(app) {
  return () => {
    return Observable.fromEvent(app, 'will-finish-launching').map(e => ({ type: 'will-finish-launching' }))
  };
}
