import CertErrorOverrideDriver from '../../src/CertErrorOverrideDriver';

import { expect } from 'chai';
import { spy } from 'sinon';
import { Observable } from 'rx';
import Cycle from '@cycle/core';

import AppStub from '../stubs/App';

describe('The CertErrorOverrideDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new AppStub();
  });

  describe('source', () => {
    it('produces values for each certificate-error event', done => {
      Cycle.run(({ certErr$ }) => ({
        output: certErr$
      }), {
        certErr$: new CertErrorOverrideDriver(app),
        output: certErr$ => certErr$.first().forEach(assert)
      });

      const certErrorEvent = {};
      const webContents = {};
      const url = 'https://some.url/';
      const error = new Error();
      const certificate = {};
      setTimeout(() => {
        app.emit('certificate-error', certErrorEvent, webContents, url, error, certificate);
      }, 1);

      function assert(event) {
        expect(event).to.have.property('webContents', webContents);
        expect(event).to.have.property('url', url);
        expect(event).to.have.property('error', error);
        expect(event).to.have.property('certificate', certificate);
        done();
      }
    });

    it('prevents the default behavior of events', done => {
      Cycle.run(({ certErr$ }) => ({
        certErr$: certErr$.map(e => ({ event: e, allow: true }))
      }), {
        certErr$: new CertErrorOverrideDriver(app)
      });

      const certErrorEvent = { preventDefault: spy() };
      setTimeout(() => {
        app.emit('certificate-error', certErrorEvent);
        expect(certErrorEvent.preventDefault).to.have.been.called;
        done();
      }, 1);
    });
  });

  describe('sink', () => {
    it('calls the certificate-error callback with the value of the allow flag', done => {
      Cycle.run(({ certErr$ }) => ({
        certErr$: certErr$.map(e => ({ event: e, allow: e.certificate.issuerName === 'Dev issuer' }))
      }), {
        certErr$: new CertErrorOverrideDriver(app)
      });

      setTimeout(() => {
        let event1 = { preventDefault: spy() };
        let callback1 = spy();
        app.emit('certificate-error', event1, {}, '', {}, { issuerName: 'Phishing scheme' }, callback1);
        expect(event1.preventDefault).to.have.been.called;
        expect(callback1).to.have.been.calledWith(false);

        let event2 = { preventDefault: spy() };
        let callback2 = spy();
        app.emit('certificate-error', event2, {}, '', {}, { issuerName: 'Dev issuer' }, callback2);
        expect(event2.preventDefault).to.have.been.called;
        expect(callback2).to.have.been.calledWith(true);

        done();
      }, 1);
    });
  });
});
