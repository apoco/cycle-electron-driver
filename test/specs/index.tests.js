import * as index from '../../src';

import { expect } from 'chai';

describe('The module', () => {
  it('exports a createMainDriver function', () => {
    expect(index.createMainDriver).to.be.a('function');
  });
});
