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
    allWindowsClose$: 'window-all-closed',
    beforeAllWindowClose$: 'before-quit',
    ready$: 'ready',
    willFinishLaunching$: 'will-finish-launching',
    beforeExit$: 'will-quit'
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

  describe('events.activation$ source', () => {
    it('contains activate events with a hasVisibleWindows property', done => {
      const { events: { activation$ } } = driver();
      activation$.first().forEach(verify);

      app.emit('activate', { }, true);

      function verify(e) {
        expect(e).to.have.property('hasVisibleWindows', true);
        done();
      }
    });
  });

  describe('events.fileOpen$ source', () => {
    it('contains open-file events with a path property', done => {
      const { events: { fileOpen$ } } = driver();
      fileOpen$.first().forEach(verify);

      app.emit('open-file', { }, '/home/user/file.txt');

      function verify(e) {
        expect(e).to.have.property('path', '/home/user/file.txt');
        done();
      }
    });
  });

  describe('events.urlOpen$ source', () => {
    it('contains open-url events with a url property', done => {
      const { events: { urlOpen$ } } = driver();
      urlOpen$.first().forEach(verify);

      app.emit('open-url', { }, 'http://somedomain.com/');

      function verify(e) {
        expect(e).to.have.property('url', 'http://somedomain.com/');
        done();
      }
    });
  });

  describe('events.windowOpen$ source', () => {
    it('contains browser-window-created events with a window property', done => {
      const window = {};
      const { events: { windowOpen$ } } = driver();
      windowOpen$.first().forEach(verify);

      app.emit('browser-window-created', { }, window);

      function verify(e) {
        expect(e).to.have.property('window', window);
        done();
      }
    });
  });

  describe('events.windowFocus$ source', () => {
    it('contains browser-window-focus events with a window property', done => {
      const window = {};
      const { events: { windowFocus$ } } = driver();
      windowFocus$.first().forEach(verify);

      app.emit('browser-window-focus', { }, window);

      function verify(e) {
        expect(e).to.have.property('window', window);
        done();
      }
    });
  });

  describe('events.windowBlur$ source', () => {
    it('contains browser-window-blur events with a window property', done => {
      const window = {};
      const { events: { windowBlur$ } } = driver();
      windowBlur$.first().forEach(verify);

      app.emit('browser-window-blur', { }, window);

      function verify(e) {
        expect(e).to.have.property('window', window);
        done();
      }
    });
  });

  describe('events.exit$ source', () => {
    it('contains the quit event merged with the exit code', done => {
      const { events: { exit$ } } = driver();
      exit$.first().forEach(verify);

      app.emit('quit', { name: 'quit' }, -3289);

      function verify(e) {
        expect(e).to.have.property('name', 'quit');
        expect(e).to.have.property('exitCode', -3289);
        done();
      }
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
