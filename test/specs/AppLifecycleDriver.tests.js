import AppLifecycleDriver from '../../src/AppLifecycleDriver';

import { expect } from 'chai';
import { spy } from 'sinon';
import { Observable } from 'rx';
import Cycle from '@cycle/core';

import AppStub from '../stubs/App';

describe('The AppLifecycleDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new AppStub();
  });

  describe('source', () => {
    describe('willFinishLaunching$', () => {
      it('contains will-finish-launching events', done => {
        Cycle.run(({ lifecycle }) => ({
          output: lifecycle.willFinishLaunching$
        }), {
          lifecycle: AppLifecycleDriver(app),
          output: event$ => event$.first().forEach(verify)
        });

        const emittedEvent = {};
        setTimeout(() => app.emit('will-finish-launching', emittedEvent), 1);

        function verify(receivedEvent) {
          expect(receivedEvent).to.equal(emittedEvent);
          done();
        }
      });
    });
  })
});
