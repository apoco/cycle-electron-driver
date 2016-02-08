import MainDriver from '../../src/MainDriver';

import { expect } from 'chai';
import { spy } from 'sinon';

import { Observable } from 'rx';
import EventEmitter from 'events';

describe('MainDriver', () => {
  let app = null, driver = null;

  beforeEach(() => {
    app = new EventEmitter();
    app.exit = spy();
    driver = new MainDriver(app);
  });

  describe('events source', () => {
    let sources = null;

    beforeEach(() => {
      sources = driver();
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
  });

  describe('exits sink', () => {
    it('causes an exit with code 0 by default', () => {
      driver({ exits: Observable.just({}) });

      expect(app.exit).to.have.been.calledWith(0);
    });

    it('exits with a numeric exit code when a value is sent', () => {
      driver({ exits: Observable.just(-23) });

      expect(app.exit).to.have.been.calledWith(-23);
    });
  });

  describe('preventedEvents sink', () => {
    it('causes `preventDefault` to be called on each event', () => {
      const event = { preventDefault: spy() };

      driver({ preventedEvents: Observable.just(event) });

      expect(event.preventDefault).to.have.been.called;
    });
  });
});
