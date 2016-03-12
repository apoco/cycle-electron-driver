import { Observable } from 'rx';

import pathNames from './pathNames';

export default function AppPathsDriver(app) {
  return path$ => pathNames.reduce((sources, name) => {
    const pathChange$ = path$.map(paths => paths[name]).filter(Boolean);

    pathChange$.forEach(path => app.setPath(path));

    return Object.defineProperty(sources, name + '$', {
      get() {
        return Observable
          .just(app.getPath(name))
          .concat(pathChange$)
          .distinct();
      }
    });
  }, {
    app$: Observable.just(app.getAppPath())
  });
}
