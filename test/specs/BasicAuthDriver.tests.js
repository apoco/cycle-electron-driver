import BasicAuthDriver from '../../src/BasicAuthDriver';

import { expect } from 'chai';
import { spy } from 'sinon';
import { Observable } from 'rxjs';
import { run } from '@cycle/rxjs-run';

import AppStub from '../stubs/App';

describe('The BasicAuthDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new AppStub();
  });

  describe('source', () => {
    it('contains objects representing login prompts', done => {
      run(({ login$ }) => ({
        output: login$
      }), {
        login$: BasicAuthDriver(app),
        output: login$ => Observable.from(login$).first().forEach(assert)
      });

      const webContents = {};
      const request = {};
      const authInfo = {};
      setTimeout(() => app.emit('login', {}, webContents, request, authInfo), 1);

      function assert(event) {
        expect(event).to.have.property('webContents', webContents);
        expect(event).to.have.property('request', request);
        expect(event).to.have.property('authInfo', authInfo);
        done();
      }
    });

    it('prevents the default handling for login prompts', done => {
      run(({ login$ }) => ({
        output: login$
      }), {
        login$: BasicAuthDriver(app),
        output: login$ => Observable.from(login$).first().forEach(assert)
      });

      const origEvent = { preventDefault: spy() };
      setTimeout(() => app.emit('login', origEvent), 1);

      function assert() {
        expect(origEvent.preventDefault).to.have.been.called;
        done();
      }
    });
  });

  describe('sink', () => {
    it('calls the event callback with the specified username & password', done => {
      run(({ login$ }) => ({
        login$: login$.map(e => ({ event: e, username: 'jimbo', password: 'p&ssW0rd' }))
      }), {
        login$: BasicAuthDriver(app)
      });

      const origEvent = { preventDefault: spy() };
      const callback = spy();
      setTimeout(() => {
        app.emit('login', origEvent, {}, {}, {}, callback);
        expect(callback).to.have.been.calledWith('jimbo', 'p&ssW0rd');
        done();
      }, 1);
    })
  });
});
