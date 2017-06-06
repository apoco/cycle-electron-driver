import AppLifecycleDriver from '../../src/AppLifecycleDriver';

import { expect } from 'chai';
import { spy } from 'sinon';
import xs from 'xstream';
import { run } from '@cycle/run';

import AppStub from '../stubs/App';

describe('The AppLifecycleDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new AppStub();
  });

  describe('source', () => {
    const basicSources = {
      willFinishLaunching$: 'will-finish-launching',
      ready$: 'ready',
      windowAllClosed$: 'window-all-closed',
      beforeQuit$: 'before-quit',
      willQuit$: 'will-quit'
    };

    Object.keys(basicSources).forEach(prop => {
      describe(prop, () => {
        const eventName = basicSources[prop];
        it(`contains ${eventName} events`, done => {
          run(({ lifecycle }) => ({
            output: lifecycle[prop]
          }), {
            lifecycle: AppLifecycleDriver(app),
            output: event$ => event$.take(1).addListener({ next: verify })
          });

          const emittedEvent = {};
          setTimeout(() => app.emit(eventName, emittedEvent), 1);

          function verify(receivedEvent) {
            expect(receivedEvent).to.equal(emittedEvent);
            done();
          }
        });
      })
    });

    describe('quit$', () => {
      it('contains quit events with the exitCode added to the event objects', done => {
        run(({ lifecycle }) => ({
          output: lifecycle.quit$
        }), {
          lifecycle: AppLifecycleDriver(app),
          output: event$ => event$.take(1).addListener({ next: verify })
        });

        const emittedEvent = {};
        setTimeout(() => app.emit('quit', emittedEvent, 255), 1);

        function verify(receivedEvent) {
          expect(receivedEvent).to.have.property('exitCode', 255);
          done();
        }
      });
    });
  });

  describe('sink', () => {
    const preventionFlags = {
      'before-quit': 'isQuittingEnabled',
      'will-quit': 'isAutoExitEnabled'
    };

    Object.keys(preventionFlags).forEach(eventName => {
      const flag = preventionFlags[eventName];
      it(`prevents ${eventName} default behaviors if ${flag} is false`, done => {
        run(({ lifecycle }) => ({
          lifecycle: xs.of({
            [flag]: false
          })
        }), {
          lifecycle: AppLifecycleDriver(app)
        });

        setTimeout(() => {
          const event = { preventDefault: spy() };
          app.emit(eventName, event);

          expect(event.preventDefault).to.have.been.called;
          done();
        }, 1);
      });
    });

    it('initiates a quit if `state` is set to `quitting`', done => {
      run(({ lifecycle }) => ({
        lifecycle: xs.of({
          state: 'quitting'
        })
      }), {
        lifecycle: AppLifecycleDriver(app)
      });

      setTimeout(() => {
        expect(app.quit).to.have.been.called;
        done();
      }, 1);
    });

    it('initiates an exit if `state` is set to `exiting`', done => {
      run(({ lifecycle }) => ({
        lifecycle: xs.of({
          state: 'exiting'
        })
      }), {
        lifecycle: AppLifecycleDriver(app)
      });

      setTimeout(() => {
        expect(app.exit).to.have.been.called;
        done();
      }, 1);
    });

    it('passes a specific exit code if `state` is `exiting` and `exitCode` is specified', done => {
      run(({ lifecycle }) => ({
        lifecycle: xs.of({
          state: 'exiting',
          exitCode: 255
        })
      }), {
        lifecycle: AppLifecycleDriver(app)
      });

      setTimeout(() => {
        expect(app.exit).to.have.been.calledWith(255);
        done();
      }, 1);
    });
  });
});
