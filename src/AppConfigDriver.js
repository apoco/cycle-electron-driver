import xs from 'xstream';
import dropRepeats from 'xstream/extra/dropRepeats';

import pathNames from './pathNames';

export default function AppPathsDriver(app) {
  return configXs$ => {
    const config$ = Observable.from(configXs$);

    const task$ = config$.map(config => config.tasks).filter(Boolean);
    task$.addListener({
      next: tasks => app.setUserTasks(tasks)
    });

    const allowNTMLForNonIntranet$ = config$
      .map(config => config.allowNTMLForNonIntranet)
      .filter(value => typeof(value) === 'boolean');
    allowNTMLForNonIntranet$.addListener({
      next: value => app.allowNTLMCredentialsForAllDomains(value)
    });

    return {
      allowNTMLForNonIntranet$: allowNTMLForNonIntranet$.startWith(false),
      task$: adapt(task$.startWith([])),
      paths: pathNames.reduce((sources, name) => {
        const pathChange$ = config$
          .map(config => config.paths && config.paths[name])
          .filter(Boolean);

        pathChange$.addListener({
          next: path => app.setPath(name, path)
        });

        return Object.defineProperty(sources, name + '$', {
          get() {
            return pathChange$
              .startWith(app.getPath(name))
              .compose(dropRepeats());
          }
        })
      }, {
        app$: xs.of(app.getAppPath())
      })
    };
  }
}
