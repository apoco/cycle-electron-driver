import RecentDocsDriver from '../../src/RecentDocsDriver';

import { expect } from 'chai';
import { spy } from 'sinon';
import { Observable } from 'rxjs';
import { run } from '@cycle/rxjs-run';

import AppStub from '../stubs/App';

describe('RecentDocsDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new AppStub();
  });

  it('performs clear operations before adds', done => {
    run(() => ({
      recentDoc$: Observable.of({
        clear: true,
        add: '/some/path'
      })
    }), {
      recentDoc$: RecentDocsDriver(app)
    });

    setTimeout(() => {
      expect(app.clearRecentDocuments).to.have.been.calledBefore(app.addRecentDocument);
      expect(app.addRecentDocument).to.have.been.calledWith('/some/path');
      done();
    }, 1);
  });
});
