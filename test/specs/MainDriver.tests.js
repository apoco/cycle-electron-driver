import MainDriver from '../../src/MainDriver';

import { expect } from 'chai';
import { spy } from 'sinon';

import Promise from 'bluebird';
import Cycle from '@cycle/core';
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
    it('listens to the specified event', done => {
      Cycle.run(({ electron }) => {
        return {
          receivedEvent$: electron.events('ready')
        }
      }, {
        electron: driver,
        receivedEvent$: events$ => events$.first().forEach(verify)
      });

      const emittedEvent = {};
      setTimeout(() => app.emit('ready', emittedEvent), 1);

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

      it(`emits when ${eventName} events are emitted`, done => {
        Cycle.run(({ electron }) => {
          return {
            receivedEvent$: electron.events[key]
          }
        }, {
          electron: driver,
          receivedEvent$: events$ => events$.first().forEach(verify)
        });

        const emittedEvent = {};
        setTimeout(() => app.emit(eventName, emittedEvent), 1);

        function verify(e) {
          expect(e).to.equal(emittedEvent);
          done();
        }
      });
    });
  });

  describe('events.activation$ source', () => {
    it('contains activate events with a hasVisibleWindows property', done => {
      Cycle.run(({ electron }) => {
        return {
          verify: electron.events.activation$
        }
      }, {
        electron: driver,
        verify: events$ => events$.first().forEach(verify)
      });

      setTimeout(() => app.emit('activate', { }, true), 1);

      function verify(e) {
        expect(e).to.have.property('hasVisibleWindows', true);
        done();
      }
    });
  });

  describe('events.fileOpen$ source', () => {
    it('contains open-file events with a path property', done => {
      Cycle.run(({ electron }) => {
        return {
          output: electron.events.fileOpen$
        }
      }, {
        electron: driver,
        output: event$ => event$.first().forEach(verify)
      });

      setTimeout(() => app.emit('open-file', { }, '/home/user/file.txt'), 1);

      function verify(e) {
        expect(e).to.have.property('path', '/home/user/file.txt');
        done();
      }
    });
  });

  describe('events.urlOpen$ source', () => {
    it('contains open-url events with a url property', done => {
      Cycle.run(({ electron }) => {
        return {
          output: electron.events.urlOpen$
        }
      }, {
        electron: driver,
        output: event$ => event$.first().forEach(verify)
      });

      setTimeout(() => app.emit('open-url', { }, 'http://somedomain.com/'), 1);

      function verify(e) {
        expect(e).to.have.property('url', 'http://somedomain.com/');
        done();
      }
    });
  });

  describe('events.clientCertPrompt$ source', () => {
    it('contains select-client-certificate events with additional details', done => {
      Cycle.run(({ electron }) => {
        return {
          output: electron.events.clientCertPrompt$
        }
      }, {
        electron: driver,
        output: event$ => event$.first().forEach(verify)
      });

      const webContents = {};
      const url = 'https://somedomain.com/';
      const certificateList = [
        { data: 'PEM data', issuerName: 'issuer' },
        { data: 'PEM data 2', issuerName: 'issuer2' }
      ];
      const callback = trust => { };
      setTimeout(() => app.emit('select-client-certificate', { }, webContents, url, certificateList, callback), 1);

      function verify(e) {
        expect(e).to.have.property('url', url);
        expect(e).to.have.property('certificateList', certificateList);
        done();
      }
    });
  });

  describe('events.certError$ source', () => {
    it('contains certificate-error events containing additional details', done => {
      Cycle.run(({ electron }) => {
        return {
          output: electron.events.certError$
        }
      }, {
        electron: driver,
        output: event$ => event$.first().forEach(verify)
      });

      const webContents = {};
      const url = 'https://somedomain.com/';
      const error = new Error();
      const certificate = { data: 'PEM data', issuerName: 'issuer' };
      const callback = trust => { };
      setTimeout(() => app.emit('certificate-error', { }, webContents, url, error, certificate, callback), 1);

      function verify(e) {
        expect(e).to.have.property('url', url);
        expect(e).to.have.property('error', error);
        expect(e).to.have.property('certificate', certificate);
        done();
      }
    });
  });

  describe('events.windowOpen$ source', () => {
    it('contains browser-window-created events with a window property', done => {
      Cycle.run(({ electron }) => {
        return {
          output: electron.events.windowOpen$
        }
      }, {
        electron: driver,
        output: event$ => event$.first().forEach(verify)
      });

      const window = {};
      setTimeout(() => app.emit('browser-window-created', { }, window), 1);

      function verify(e) {
        expect(e).to.have.property('window', window);
        done();
      }
    });
  });

  describe('events.windowFocus$ source', () => {
    it('contains browser-window-focus events with a window property', done => {
      Cycle.run(({ electron }) => {
        return {
          output: electron.events.windowFocus$
        }
      }, {
        electron: driver,
        output: event$ => event$.first().forEach(verify)
      });

      const window = {};
      setTimeout(() => app.emit('browser-window-focus', { }, window), 1);

      function verify(e) {
        expect(e).to.have.property('window', window);
        done();
      }
    });
  });

  describe('events.windowBlur$ source', () => {
    it('contains browser-window-blur events with a window property', done => {
      Cycle.run(({ electron }) => {
        return {
          output: electron.events.windowBlur$
        }
      }, {
        electron: driver,
        output: event$ => event$.first().forEach(verify)
      });

      const window = {};
      setTimeout(() => app.emit('browser-window-blur', { }, window), 1);

      function verify(e) {
        expect(e).to.have.property('window', window);
        done();
      }
    });
  });

  describe('events.exit$ source', () => {
    it('contains the quit event merged with the exit code', done => {
      Cycle.run(({ electron }) => {
        return {
          output: electron.events.exit$
        }
      }, {
        electron: driver,
        output: event$ => event$.first().forEach(verify)
      });

      setTimeout(() => app.emit('quit', { name: 'quit' }, -3289), 1);

      function verify(e) {
        expect(e).to.have.property('name', 'quit');
        expect(e).to.have.property('exitCode', -3289);
        done();
      }
    });
  });

  describe('exit$ sink', () => {
    it('causes an exit with code 0 by default', done => {
      Cycle.run(() => {
        return {
          electron: Observable.just({
            exit$: Observable.just({})
          })
        }
      }, {
        electron: driver
      });

      setTimeout(() => {
        expect(app.exit).to.have.been.calledWith(0);
        done();
      }, 1);
    });

    it('exits with a numeric exit code when a value is sent', done => {
      Cycle.run(() => {
        return {
          electron: Observable.just({
            exit$: Observable.just(-23)
          })
        }
      }, {
        electron: driver
      });

      setTimeout(() => {
        expect(app.exit).to.have.been.calledWith(-23);
        done();
      }, 1);
    });
  });

  describe('preventedEvent$ sink', () => {
    it('causes `preventDefault` to be called on each event', done => {
      Cycle.run(({ electron }) => {
        return {
          electron: Observable.just({
            preventedEvent$: electron.events.fileOpen$
          })
        }
      }, {
        electron: driver
      });

      const event = { preventDefault: spy() };
      setTimeout(() => {
        app.emit('open-file', event);
        expect(event.preventDefault).to.have.been.called;
        done();
      }, 1);
    });
  });

  describe('clientCertSelection$ sink', () => {
    it('prevents the default cert selection behavior and uses a custom certificate selection', done => {
      Cycle.run(({ electron }) => {
        return {
          electron: Observable.just({
            clientCertSelection$: electron.events.clientCertPrompt$
              .map(e => ({ prompt: e, cert: e.certificateList[1] }))
          })
        }
      }, {
        electron: driver
      });

      const event1 = {
        event: { preventDefault: spy() },
        certs: [{ }, { }],
        callback: spy()
      };

      setTimeout(() => {
        app.emit('select-client-certificate', event1.event, {}, '', event1.certs, event1.callback);
        expect(event1.event.preventDefault).to.have.been.called;
        expect(event1.callback).to.have.been.calledWith(event1.certs[1]);

        done();
      }, 1);
    });
  });

  describe('trustedCert$ sink', () => {
    it('prevents the default behavior of an untrusted cert and trusts it instead', done => {
      Cycle.run(({ electron }) => {
        return {
          electron: Observable.just({
            trustedCert$: electron.events.certError$.filter(e => e.certificate.issuerName === 'trusted.issuer.com')
          })
        }
      }, {
        electron: driver
      });

      const event1 = {
        event: { preventDefault: spy() },
        cert: { issuerName: 'trusted.issuer.com' },
        callback: spy()
      };
      const event2 = {
        event: { preventDefault: spy() },
        cert: { issuerName: 'other.issuer.com' },
        callback: spy()
      };

      setTimeout(() => {
        app.emit('certificate-error', event1.event, {}, '', {}, event1.cert, event1.callback);
        expect(event1.event.preventDefault).to.have.been.called;
        expect(event1.callback).to.have.been.calledWith(true);

        app.emit('certificate-error', event2.event, {}, '', {}, event2.cert, event2.callback);
        expect(event2.event.preventDefault).to.have.not.been.called;
        expect(event2.callback).to.have.not.been.called;

        done();
      }, 1);
    });
  });
});
