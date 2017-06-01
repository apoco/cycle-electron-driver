import { Observable } from 'rxjs';
import { adapt } from '@cycle/run/lib/adapt';

import pathNames from './pathNames';

export default function AppPathsDriver(app) {
  return configXs$ => {
    const config$ = Observable.from(configXs$);

    const task$ = config$.map(config => config.tasks).filter(Boolean);
    task$.forEach(tasks => app.setUserTasks(tasks));

    const allowNTMLForNonIntranet$ = config$
      .map(config => config.allowNTMLForNonIntranet)
      .filter(value => typeof(value) === 'boolean');
    allowNTMLForNonIntranet$.forEach(value => app.allowNTLMCredentialsForAllDomains(value));

    return {
      allowNTMLForNonIntranet$: allowNTMLForNonIntranet$.startWith(false),
      task$: adapt(task$.startWith([])),
      paths: pathNames.reduce((sources, name) => {
        const pathChange$ = config$
          .map(config => config.paths && config.paths[name])
          .filter(Boolean);

        pathChange$.forEach(path => app.setPath(name, path));

        return Object.defineProperty(sources, name + '$', {
          get() {
            return adapt(Observable
              .of(app.getPath(name))
              .concat(pathChange$)
              .distinct()
            );
          }
        })
      }, {
        app$: adapt(Observable.of(app.getAppPath()))
      })
    };
  }
}
