import * as index from '../../src';

import { expect } from 'chai';

describe('The module', () => {
  it('exports a MainDriver function', () => {
    expect(index.MainDriver).to.be.a('function');
  });
});
