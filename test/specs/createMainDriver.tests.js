import { expect } from 'chai';

import createMainDriver from '../../src/createMainDriver';

describe('createMainDriver', () => {
  it('returns a new driver function', () => {
    expect(createMainDriver()).to.be.a('function');
  });
});
