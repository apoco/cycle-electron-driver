import MainDriver from '../../src/MainDriver';

import { expect } from 'chai';
import EventEmitter from 'events';

describe('MainDriver', () => {
  describe('events source factory', () => {
    it('listens to the specified event', done => {
      const app = new EventEmitter();
      const driver = new MainDriver(app);
      const sources = driver();
      const emittedEvent = {};
      sources
        .events('ready')
        .forEach(verify);

      app.emit('ready', emittedEvent);

      function verify(e) {
        expect(e).to.equal(emittedEvent);
        done();
      }
    });
  });
});
