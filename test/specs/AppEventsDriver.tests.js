import AppEventsDriver from '../../src/AppEventsDriver';

import { expect } from 'chai';
import { spy } from 'sinon';
import { Observable } from 'rx';
import Cycle from '@cycle/core';

import AppStub from '../stubs/App';

describe('AppEventsDriver', () => {
  let driver = null;
  let app = null;

  beforeEach(() => {
    app = new AppStub();
    driver = new AppEventsDriver(app);
  });

  const eventsToTest = [
    { name: 'will-finish-launching' },
    { name: 'ready' },
    { name: 'window-all-closed' },
    { name: 'before-quit' },
    { name: 'will-quit' },
    { name: 'quit', params: ['exitCode'] },
    { name: 'open-file', params: ['path'] },
    { name: 'open-url', params: ['url'] },
    { name: 'activate', params: ['hasVisibleWindows'] },
    { name: 'browser-window-blur', params: ['window'] },
    { name: 'browser-window-focus', params: ['window'] },
    { name: 'browser-window-created', params: ['window'] }
  ];

  eventsToTest.forEach(({ name: eventName, params = [] }) => {
    it(`provides ${eventName} events`, done => {
      Cycle.run(({ app: appEvent$ }) => ({
        output: appEvent$.filter(e => e.type === eventName)
      }), {
        app: driver,
        output: event$ => event$.first().forEach(assert)
      });

      const origEventObj = {};
      const paramValues = params.reduce((paramValues, name, i) => Object.assign(paramValues, { [name]: i }), {});
      setTimeout(() => {
        app.emit.apply(app, [eventName, origEventObj].concat(params.map(name => paramValues[name])));
      }, 1);

      function assert(event) {
        expect(event).to.exist;
        params.forEach(param => {
          expect(event).to.have.property(param, paramValues[param]);
        });
        done();
      }
    });
  });

  it('can prevent default behaviors for events', done => {
    Cycle.run(() => ({
      appEvent$: Observable.just({
        prevented: ['will-quit']
      })
    }), {
      appEvent$: driver
    });

    setTimeout(() => {
      const event1 = { preventDefault: spy() };
      const event2 = { preventDefault: spy() };

      app.emit('before-quit', event1);
      expect(event1.preventDefault).to.have.not.been.called;

      app.emit('will-quit', event2);
      expect(event2.preventDefault).to.have.been.called;

      done();
    }, 1);
  });
});
