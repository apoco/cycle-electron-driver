import AppMetadataDriver from '../../src/AppMetadataDriver';

import { expect } from 'chai';
import { spy } from 'sinon';
import { run } from '@cycle/run';

import AppStub from '../stubs/App';

describe('The AppMetadataDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new AppStub();
  });

  it('provides the app\'s name', done => {
    app.getName.returns('Some arbitrary app');

    run(({ metadata$ }) => ({
      output: metadata$
    }), {
      metadata$: new AppMetadataDriver(app),
      output: metadata$ => metadata$.take(1).addListener({
        next: metadata => {
          expect(metadata).to.have.property('name', 'Some arbitrary app');
          done();
        }
      })
    });
  });

  it('provides the app\'s version', done => {
    app.getVersion.returns('1.2.3');

    run(({ metadata$ }) => ({
      output: metadata$
    }), {
      metadata$: new AppMetadataDriver(app),
      output: metadata$ => metadata$.take(1).addListener({
        next: metadata => {
          expect(metadata).to.have.property('version', '1.2.3');
          done();
        }
      })
    });
  });

  it('provides the app\'s locale', done => {
    app.getLocale.returns('es-MX');

    run(({ metadata$ }) => ({
      output: metadata$
    }), {
      metadata$: new AppMetadataDriver(app),
      output: metadata$ => metadata$.take(1).addListener({
        next: metadata => {
          expect(metadata).to.have.property('locale', 'es-MX');
          done();
        }
      })
    });
  });
});
