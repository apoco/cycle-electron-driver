import AppEventsDriver from '../../src/AppEventsDriver';

import { expect } from 'chai';
import Cycle from '@cycle/core';

import AppStub from '../stubs/App';

describe('AppEventsDriver', () => {
  let driver = null;
  let app = null;

  beforeEach(() => {
    app = new AppStub();
    driver = new AppEventsDriver(app);
  });

  [
    'will-finish-launching',
    'ready'
  ].forEach(eventName => {
    it(`provides ${eventName} events`, done => {
      Cycle.run(({ app: appEvent$ }) => ({
        output: appEvent$.filter(e => e.type === eventName)
      }), {
        app: driver,
        output: event$ => event$.first().forEach(assert)
      });

      setTimeout(() => {
        app.emit(eventName);
      }, 1);

      function assert(event) {
        expect(event).to.exist;
        done();
      }
    });
  });
});
