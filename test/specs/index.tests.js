import * as index from '../../src';

import { expect } from 'chai';

describe('The module', () => {
  ['AppEventsDriver', 'CertErrorOverrideDriver', 'ClientCertDriver', 'MainDriver'].forEach(name => {
    it(`exports a ${name} function`, () => {
      expect(index).to.have.property(name);
      expect(index[name]).to.be.a('function');
    });
  });
});
