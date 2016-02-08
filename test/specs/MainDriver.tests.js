import MainDriver from '../../src/MainDriver';

import { expect } from 'chai';
import { spy } from 'sinon';

import { Observable } from 'rx';
import EventEmitter from 'events';

describe('MainDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new EventEmitter();
    app.quit = spy();
  });

  describe('events source factory', () => {
    it('listens to the specified event', done => {
      const driver = new MainDriver(app);
      const sources = driver(Observable.empty());
      const emittedEvent = {};
      sources
        .events('ready')
        .forEach(verify);

      app.emit('ready', emittedEvent);

      function verify(e) {
        expect(e).to.equal(emittedEvent);
        done();
      }
    });
  });

  describe('sink handler', () => {
    it('exits with code 0 when it ends', done => {
      const driver = new MainDriver(app);
      const state$ = Observable.empty();

      driver(state$);

      state$.subscribeOnCompleted(() => {
        expect(app.quit).to.have.been.called;
        done();
      });
    });

    it('exits with code 1 when it errors', () => {
      const driver = new MainDriver(app);

      driver(Observable.throw(new Error()));

      expect(app.quit).to.have.been.calledWith(1);
    });

    it('exits with a numeric exit code when an error has the code in a `code` property', () => {
      const driver = new MainDriver(app);

      driver(Observable.throw({ code: -23 }));

      expect(app.quit).to.have.been.calledWith(-23);
    });
  });
});
