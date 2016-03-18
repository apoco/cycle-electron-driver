import { Observable } from 'rx';

import pathNames from './pathNames';

export default function AppPathsDriver(app) {
  return config$ => {

    const task$ = config$.map(config => config.tasks).filter(Boolean).startWith([]);
    task$.forEach(tasks => app.setUserTasks(tasks));

    return {
      task$,
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
