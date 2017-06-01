import { Observable } from 'rxjs';
import { adapt } from '@cycle/run/lib/adapt';

export default function AppVisibilityDriver(app) {
  return visibility$ => {
    adapt(Observable.from(visibility$).forEach(isVisible => isVisible ? app.show() : app.hide()));
  };
}
