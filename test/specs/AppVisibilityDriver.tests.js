import AppVisibilityDriver from '../../src/AppVisibilityDriver';

import { expect } from 'chai';
import { spy } from 'sinon';
import { Observable } from 'rx';
import Cycle from '@cycle/core';

import AppStub from '../stubs/App';

describe('AppVisibilityDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new AppStub();
  });

  it('calls `app.hide()` for `false` values', done => {
    Cycle.run(() => ({
      visibility$: Observable.just(false)
    }), {
      visibility$: AppVisibilityDriver(app)
    });

    setTimeout(() => {
      expect(app.hide).to.have.been.called;
      done();
    }, 1);
  });

  it('calls `app.show()` for `true` values', done => {
    Cycle.run(() => ({
      visibility$: Observable.just(true)
    }), {
      visibility$: AppVisibilityDriver(app)
    });

    setTimeout(() => {
      expect(app.show).to.have.been.called;
      done();
    }, 1);
  });
});
