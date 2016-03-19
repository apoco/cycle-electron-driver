import { Observable } from 'rx';

import pathNames from './pathNames';

export default function AppPathsDriver(app) {
  return config$ => {

    const task$ = config$.map(config => config.tasks).filter(Boolean);
    task$.forEach(tasks => app.setUserTasks(tasks));

    const allowNTMLForNonIntranet$ = config$
      .map(config => config.allowNTMLForNonIntranet)
      .filter(value => typeof(value) === 'boolean');
    allowNTMLForNonIntranet$.forEach(value => app.allowNTLMCredentialsForAllDomains(value));

    return {
      allowNTMLForNonIntranet$: allowNTMLForNonIntranet$.startWith(false),
      task$: task$.startWith([]),
      paths: pathNames.reduce((sources, name) => {
        const pathChange$ = config$
          .map(config => config.paths && config.paths[name])
          .filter(Boolean);

        pathChange$.forEach(path => app.setPath(name, path));

        return Object.defineProperty(sources, name + '$', {
          get() {
            return Observable
              .just(app.getPath(name))
              .concat(pathChange$)
              .distinct();
          }
        })
      }, {
        app$: Observable.just(app.getAppPath())
      })
    };
  }
}
