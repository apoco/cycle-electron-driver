import AppVisibilityDriver from '../../src/AppVisibilityDriver';

import { expect } from 'chai';
import { spy } from 'sinon';
import { Observable } from 'rxjs';
import { run } from '@cycle/rxjs-run';

import AppStub from '../stubs/App';

describe('AppVisibilityDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new AppStub();
  });

  it('calls `app.hide()` for `false` values', done => {
    run(() => ({
      visibility$: Observable.of(false)
    }), {
      visibility$: AppVisibilityDriver(app)
    });

    setTimeout(() => {
      expect(app.hide).to.have.been.called;
      done();
    }, 1);
  });

  it('calls `app.show()` for `true` values', done => {
    run(() => ({
      visibility$: Observable.of(true)
    }), {
      visibility$: AppVisibilityDriver(app)
    });

    setTimeout(() => {
      expect(app.show).to.have.been.called;
      done();
    }, 1);
  });
});
