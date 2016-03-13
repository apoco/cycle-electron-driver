import AppMetadataDriver from '../../src/AppMetadataDriver';

import { expect } from 'chai';
import { spy } from 'sinon';
import { Observable } from 'rx';
import Cycle from '@cycle/core';

import AppStub from '../stubs/App';

describe('The AppMetadataDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new AppStub();
  });

  it('provides the app\'s version', done => {
    app.getVersion.returns('1.2.3');

    Cycle.run(({ metadata$ }) => ({
      output: metadata$
    }), {
      metadata$: new AppMetadataDriver(app),
      output: metadata$ => metadata$.first().forEach(metadata => {
        expect(metadata).to.have.property('version', '1.2.3');
        done();
      })
    });
  });
});
