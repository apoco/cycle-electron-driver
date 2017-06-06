import MainDriver from '../../src/MainDriver';

import { expect } from 'chai';
import { spy } from 'sinon';

import Promise from 'bluebird';
import xs from 'xstream';
import delay from 'xstream/extra/delay';
import { run } from '@cycle/run';

import AppStub from '../stubs/App';

describe('MainDriver', () => {
  let app = null, driver = null;

  beforeEach(() => {
    app = new AppStub();
    driver = new MainDriver(app);
  });

  it('quits if isSingleInstance option is true and makeSingleInstance returns true', done => {
    app.makeSingleInstance.returns(true);

    run(() => {
      return {
        electron: xs.of({})
      }
    }, {
      electron: new MainDriver(app, { isSingleInstance: true })
    });

    setTimeout(() => {
      expect(app.quit).to.have.been.called;
      done();
    }, 1);
  });

  describe('source', () => {
    describe('platformInfo', () => {
      describe('isAeroGlassEnabled property', () => {
        it('calls the isAeroGlassEnabled method of the app', done => {
          app.isAeroGlassEnabled.returns(true);

          run(({ electron }) => ({
            output: xs.of(electron.platformInfo.isAeroGlassEnabled)
          }), {
            electron: driver,
            output: value$ => value$.take(1).addListener({
              next: isEnabled => {
                expect(isEnabled).to.be.true;
                done();
              }
            })
          });
        });
      });
    });

    describe('events', () => {
      describe('function', () => {
        it('listens to the specified event', done => {
          run(({ electron }) => {
            return {
              receivedEvent$: electron.events('ready')
            }
          }, {
            electron: driver,
            receivedEvent$: events$ => events$.take(1).addListener({ next: verify })
          });

          const emittedEvent = {};
          setTimeout(() => app.emit('ready', emittedEvent), 1);

          function verify(e) {
            expect(e).to.equal(emittedEvent);
            done();
          }
        });
      });

      describe('extraLaunch$', () => {
        it('indicates when additional launches are requested in single-instance mode', done => {
          const args = ['arg1', 'arg2'];
          const workingDir = '/some/path';
          app.makeSingleInstance.returns(false);

          run(({ electron }) => {
            return {
              output: electron.events.extraLaunch$
            }
          }, {
            electron: new MainDriver(app, { isSingleInstance: true }),
            output: value$ => value$.addListener({ next: assert })
          });

          setTimeout(() => {
            app.makeSingleInstance.lastCall.args[0].call(null, args, workingDir);
          }, 1);

          function assert({ argv, cwd }) {
            expect(argv).to.equal(args);
            expect(cwd).to.equal(workingDir);
            done();
          }
        });
      });
    });

    describe('badgeLabel$', () => {
      it('reflects the current and future badge labels', done => {
        app.dock.getBadge.returns('Label 1');
        let valueCount = 0;

        run(({ electron }) => ({
          electron: xs.of({
            dock: {
              badgeLabel$: xs.of('Label 2').compose(delay(5))
            }
          }),
          output: electron.badgeLabel$
        }), {
          electron: driver,
          output: value$ => value$.addListener({
            next: label => {
              valueCount++;
              expect(label).to.equal(`Label ${valueCount}`);
              if (valueCount === 2) {
                expect(app.dock.setBadge).to.have.been.calledWith('Label 2');
                done();
              }
            }
          })
        });
      });
    })
  });

  describe('sink', () => {
    describe('dock', () => {
      describe('bounce', () => {
        describe('start$', () => {
          it('invokes app.dock.bounce method with "informational" type by default', () => {
            return testBounceStart({}, () => {
              expect(app.dock.bounce).to.have.been.calledWith('informational');
            })
          });

          it('invokes app.dock.bounce method with a specific type if provided', () => {
            return testBounceStart({ type: 'critical' }, () => {
              expect(app.dock.bounce).to.have.been.calledWith('critical');
            })
          });

          function testBounceStart(bounce, assertions) {
            return new Promise(resolve => {
              run(() => ({
                electron: xs.of({
                  dock: {
                    bounce: {
                      start$: xs.of(bounce)
                    }
                  }
                })
              }), { electron: driver });

              setTimeout(() => {
                assertions();
                resolve();
              }, 1)
            });
          }
        });

        describe('cancel$', () => {
          it('causes previously-started bounces to be cancelled', done => {
            app.dock.bounce.returns(8346);

            run(() => ({
              electron: xs.of({
                dock: {
                  bounce: {
                    start$: xs.of({ id: 'auth-has-expired', type: 'critical' }),
                    cancel$: xs.of('auth-has-expired').compose(delay(5))
                  }
                }
              })
            }), { electron: driver });

            setTimeout(() => {
              expect(app.dock.cancelBounce).to.have.been.calledWith(8346);
              done();
            }, 25)
          });
        });
      });

      describe('visibility$', () => {
        it('hides the dock when producing `false` values', () => {
          return testVisibility(false, () => {
            expect(app.dock.hide).to.have.been.called;
          })
        });

        it('shows the dock when producing `true` values', () => {
          return testVisibility(true, () => {
            expect(app.dock.show).to.have.been.called;
          })
        });

        function testVisibility(value, assertions) {
          return new Promise(resolve => {
            run(() => ({
              electron: xs.of({
                dock: {
                  visibility$: xs.of(value)
                }
              })
            }), { electron: driver });

            setTimeout(() => {
              assertions();
              resolve();
            }, 1);
          });
        }
      });

      describe('icon$', () => {
        it('causes app.dock.setIcon to be called', done => {
          const img = {};

          run(() => ({
            electron: xs.of({
              dock: {
                icon$: xs.of(img)
              }
            })
          }), { electron: driver });

          setTimeout(() => {
            expect(app.dock.setIcon).to.have.been.calledWith(img);
            done();
          }, 1)
        });
      });

      describe('menu$', () => {
        it('causes app.dock.setMenu to be called', done => {
          const menu = {};

          run(() => ({
            electron: xs.of({
              dock: {
                menu$: xs.of(menu)
              }
            })
          }), { electron: driver });

          setTimeout(() => {
            expect(app.dock.setMenu).to.have.been.calledWith(menu);
            done();
          }, 1);
        });
      });
    });

    describe('newChromiumParam$', () => {
      it('calls appendSwitch and appendArgument for each switch & argument', done => {
        run(() => ({
          electron: xs.of({
            newChromiumParam$: xs.of({
              switches: [
                { 'switch': 'prefetch', value: 1 },
                { 'switch': 'aggressive-cache-discard' }
              ],
              args: [
                'some arg'
              ]
            })
          })
        }), { electron: driver });

        setTimeout(() => {
          expect(app.appendSwitch).to.have.been.calledWith('prefetch', 1);
          expect(app.appendSwitch).to.have.been.calledWith('aggressive-cache-discard');
          expect(app.appendArgument).to.have.been.calledWith('some arg');
          done();
        }, 1);
      });
    });

    describe('appUserModelId$', () => {
      it('causes the setAppUserModelId method of the app to be called', done => {
        run(() => ({
          electron: xs.of({
            appUserModelId$: xs.of('new-user-model-id')
          })
        }), { electron: driver });

        setTimeout(() => {
          expect(app.setAppUserModelId).to.have.been.calledWith('new-user-model-id');
          done();
        }, 1);
      });
    });
  });
});
