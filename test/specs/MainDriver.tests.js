import MainDriver from '../../src/MainDriver';

import { expect } from 'chai';
import { spy, stub } from 'sinon';

import Promise from 'bluebird';
import Cycle from '@cycle/core';
import { Observable } from 'rx';
import EventEmitter from 'events';

describe('MainDriver', () => {
  let app = null, driver = null;

  beforeEach(() => {
    app = new EventEmitter();
    app.getAppPath = stub();
    app.getPath = stub();
    app.exit = spy();
    app.quit = spy();
    driver = new MainDriver(app);
  });

  describe('source', () => {
    describe('events', () => {
      describe('function', () => {
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
        describe(key, () => {
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

      describe('activation$', () => {
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

      describe('fileOpen$', () => {
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

      describe('urlOpen$', () => {
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

      describe('loginPrompt$', () => {
        it('contains login events with additional details', done => {
          Cycle.run(({ electron }) => {
            return {
              output: electron.events.loginPrompt$
            }
          }, {
            electron: driver,
            output: event$ => event$.first().forEach(verify)
          });

          const webContents = {};
          const request = { url: 'https://somedomain.com/' };
          const authInfo = { };
          const callback = () => { };
          setTimeout(() => app.emit('login', { }, webContents, request, authInfo, callback), 1);

          function verify(e) {
            expect(e).to.have.property('webContents', webContents);
            expect(e).to.have.property('request', request);
            expect(e).to.have.property('authInfo', authInfo);
            done();
          }
        });
      });

      describe('clientCertPrompt$', () => {
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

      describe('certError$', () => {
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

      describe('windowOpen$', () => {
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

      describe('windowFocus$', () => {
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

      describe('windowBlur$', () => {
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

      describe('exit$', () => {
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

      describe('gpuProcessCrash$', () => {
        it('emits when gpu-process-crashed events occur', done => {
          Cycle.run(({ electron }) => {
            return {
              output: electron.events.gpuProcessCrash$
            }
          }, {
            electron: driver,
            output: event$ => event$.first().forEach(verify)
          });

          const event = { };
          setTimeout(() => app.emit('gpu-process-crashed', event), 1);

          function verify(e) {
            expect(e).to.equal(event);
            done();
          }
        });
      });
    });

    describe('path', () => {
      describe('.app property', () => {
        it('calls the getAppPath app method', done => {
          app.getAppPath.returns('/some/path');

          Cycle.run(({ electron }) => {
            return {
              output: Observable.just(electron.paths.app)
            }
          }, {
            electron: driver,
            output: path$ => path$.first().forEach(verify)
          });

          function verify(path) {
            expect(path).to.equal('/some/path');
            done();
          }
        });
      });

      describe('.home property', () => {
        it('calls the getPath app method with a "home" parameter', done => {
          app.getPath.withArgs('home').returns('/some/path');

          Cycle.run(({ electron }) => {
            return {
              output: Observable.just(electron.paths.home)
            }
          }, {
            electron: driver,
            output: path$ => path$.first().forEach(verify)
          });

          function verify(path) {
            expect(path).to.equal('/some/path');
            done();
          }
        });
      });
    });
  });

  describe('quit$ sink', () => {
    it('causes the electron app to quit', done => {
      Cycle.run(() => {
        return {
          electron: Observable.just({
            quit$: Observable.just({})
          })
        }
      }, {
        electron: driver
      });

      setTimeout(() => {
        expect(app.quit).to.have.been.called;
        done();
      }, 1);
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

  describe('login$ sink', () => {
    it('prevents the default behavior and sends the username & password', done => {
      Cycle.run(({ electron }) => {
        return {
          electron: Observable.just({
            login$: electron.events.loginPrompt$.map(e => ({ prompt: e, username: 'foo', password: 'bar' }))
          })
        }
      }, {
        electron: driver
      });

      const event = { preventDefault: spy() };
      const callback = spy();

      setTimeout(() => {
        app.emit('login', event, {}, {}, {}, callback);
        expect(event.preventDefault).to.have.been.called;
        expect(callback).to.have.been.calledWith('foo', 'bar');

        done();
      }, 1);
    });
  });
});
