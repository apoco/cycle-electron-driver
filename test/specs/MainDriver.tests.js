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

  const eventShortcuts = {
    ready$: 'ready',
    willFinishLaunching$: 'will-finish-launching'
  };

  Object.keys(eventShortcuts).forEach(key => {
    describe(`events.${key} source`, () => {
      const eventName = eventShortcuts[key];
      let sources = null;

      beforeEach(() => {
        sources = driver();
      });

      it(`emits when ${eventName} events are emitted`, done => {
        const emittedEvent = {};
        sources.events[key].forEach(verify);

        app.emit(eventName, emittedEvent);

        function verify(e) {
          expect(e).to.equal(emittedEvent);
          done();
        }
      });
    });
  });

  describe('exit$ sink', () => {
    it('causes an exit with code 0 by default', () => {
      driver({ exit$: Observable.just({}) });

      expect(app.exit).to.have.been.calledWith(0);
    });

    it('exits with a numeric exit code when a value is sent', () => {
      driver({ exit$: Observable.just(-23) });

      expect(app.exit).to.have.been.calledWith(-23);
    });
  });

  describe('preventedEvent$ sink', () => {
    it('causes `preventDefault` to be called on each event', () => {
      const event = { preventDefault: spy() };

      driver({ preventedEvent$: Observable.just(event) });

      expect(event.preventDefault).to.have.been.called;
    });
  });

  describe('trustedCert$ sink', () => {
    it('prevents the default behavior of an untrusted cert and trusts it instead', () => {
      const event = {
        preventDefault: spy(),
        callback: spy()
      };

      driver({ trustedCert$: Observable.just(event) });

      expect(event.preventDefault).to.have.been.called;
      expect(event.callback).to.have.been.calledWith(true);
    });
  });
});
