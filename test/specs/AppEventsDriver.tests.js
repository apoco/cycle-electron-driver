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

  [
    'will-finish-launching',
    'ready',
    'window-all-closed',
    'before-quit',
    'will-quit',
    'quit'
  ].forEach(eventName => {
    it(`provides ${eventName} events`, done => {
      Cycle.run(({ app: appEvent$ }) => ({
        output: appEvent$.filter(e => e.type === eventName)
      }), {
        app: driver,
        output: event$ => event$.first().forEach(assert)
      });

      setTimeout(() => {
        app.emit(eventName, {});
      }, 1);

      function assert(event) {
        expect(event).to.exist;
        done();
      }
    });
  });

  it('adds an exitCode property to quit events', done => {
    Cycle.run(({ appEvent$ }) => ({
      output: appEvent$.filter(e => e.type === 'quit')
    }), {
      appEvent$: driver,
      output: event$ => event$.first().forEach(assert)
    });

    setTimeout(() => {
      app.emit('quit', {}, 255);
    }, 1);

    function assert(event) {
      expect(event).to.have.property('exitCode', 255);
      done();
    }
  });

  it('adds a path property to open-file events', done => {
    Cycle.run(({ appEvent$ }) => ({
      output: appEvent$.filter(e => e.type === 'open-file')
    }), {
      appEvent$: driver,
      output: event$ => event$.first().forEach(assert)
    });

    setTimeout(() => {
      app.emit('open-file', {}, '/some/path');
    }, 1);

    function assert(event) {
      expect(event).to.have.property('path', '/some/path');
      done();
    }
  });

  it('adds a url property to open-url events', done => {
    Cycle.run(({ appEvent$ }) => ({
      output: appEvent$.filter(e => e.type === 'open-url')
    }), {
      appEvent$: driver,
      output: event$ => event$.first().forEach(assert)
    });

    setTimeout(() => {
      app.emit('open-url', {}, 'http://some.domain/some/path');
    }, 1);

    function assert(event) {
      expect(event).to.have.property('url', 'http://some.domain/some/path');
      done();
    }
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
