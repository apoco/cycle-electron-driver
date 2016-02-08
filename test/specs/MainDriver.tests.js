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
    let sources = null;

    beforeEach(() => {
      const driver = new MainDriver(app);
      sources = driver(Observable.empty());
    });

    it('listens to the specified event', done => {
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

    it('automatically prevents the default handling if the `prevented` option is `true`', done => {
      const emittedEvent = {
        preventDefault: spy()
      };
      sources
        .events('before-quit', { prevented: true })
        .forEach(verify);

      app.emit('before-quit', emittedEvent);

      function verify(e) {
        expect(e.preventDefault).to.have.been.called;
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
