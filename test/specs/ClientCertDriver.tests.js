import ClientCertDriver from '../../src/ClientCertDriver';

import { expect } from 'chai';
import { spy } from 'sinon';
import { run } from '@cycle/run';

import AppStub from '../stubs/App';

describe('The ClientCertDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new AppStub();
  });

  describe('source', () => {
    it('produces an object for each select-client-certificate event from the electron app', done => {
      run(({ certPrompt$ }) => ({
        output: certPrompt$
      }), {
        certPrompt$: ClientCertDriver(app),
        output: certPrompt$ => certPrompt$.take(1).addListener({ next: assert })
      });

      const webContents = {};
      const url = '';
      const certs = [{ data: 'cert 1' }, { data: 'cert 2' }];
      setTimeout(() => {
        app.emit('select-client-certificate', {}, webContents, url, certs);
      }, 1);

      function assert(event) {
        expect(event).to.have.property('webContents', webContents);
        expect(event).to.have.property('url', url);
        expect(event).to.have.property('certificateList', certs);
        done();
      }
    });

    it('prevents the default behavior for events', done => {
      run(({ certPrompt$ }) => ({
        output: certPrompt$
      }), {
        certPrompt$: ClientCertDriver(app),
        output: prompt$ => prompt$.addListener({ next: () => {} })
      });

      const origEvent = { preventDefault: spy() };
      setTimeout(() => {
        app.emit('select-client-certificate', origEvent);
        expect(origEvent.preventDefault).to.have.been.called;
        done();
      }, 1);
    });
  });

  describe('sink', () => {
    it('calls the event callback with the indicated certificate', done => {
      run(({ certPrompt$ }) => ({
        certPrompt$: certPrompt$.map(event => ({ event, cert: event.certificateList[1] }))
      }), {
        certPrompt$: ClientCertDriver(app)
      });

      const origEvent = { preventDefault: spy() };
      const clientCerts = [{ data: 'cert 1' }, { data: 'cert 2' }];
      const callback = spy();
      setTimeout(() => {
        app.emit('select-client-certificate', origEvent, {}, '', clientCerts, callback);
        expect(origEvent.preventDefault).to.have.been.called;
        expect(callback).to.have.been.calledWith(clientCerts[1]);
        done();
      }, 1);
    });
  });
});
