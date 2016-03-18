import AppConfigDriver from '../../src/AppConfigDriver';
import pathNames from '../../src/pathNames';

import { expect } from 'chai';
import { spy } from 'sinon';
import { Observable } from 'rx';
import Cycle from '@cycle/core';

import AppStub from '../stubs/App';

describe('The AppConfigDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new AppStub();
  });

  describe('paths source', () => {
    pathNames.forEach(name => {
      const source = `${name}$`;
      describe(source, () => {
        it(`gets the path named "${name}"`, done => {
          app.getPath.withArgs(name).returns('/some/path');

          Cycle.run(({ config: { paths } }) => ({
            output: paths[source].first().forEach(assert)
          }), {
            config: AppConfigDriver(app)
          });

          function assert(path) {
            expect(path).to.equal('/some/path');
            done();
          }
        });

        it('updates when a path has changed', done => {
          const originalPath = '/original/path';
          const newPath = '/new/path';
          app.getPath.withArgs(name).onFirstCall().returns(originalPath);

          Cycle.run(({ config: { paths } }) => {
            const path$ = paths[source];

            return {
              config: Observable.just({ paths: { [name]: newPath } }),
              output1: path$.first(),
              output2: path$.skip(1).first()
            }
          }, {
            config: AppConfigDriver(app),
            output1: path$ => path$.forEach(path => {
              expect(path).to.equal('/original/path')
            }),
            output2: path$ => path$.forEach(path => {
              expect(app.setPath).to.have.been.calledWith(name, newPath);
              expect(path).to.equal(newPath);
              done();
            })
          });
        });
      })
    });

    describe('app$', () => {
      it('calls app.getAppPath()', done => {
        app.getAppPath.returns('/some/path');

        Cycle.run(({ config: { paths } }) => ({
          output: paths.app$.first().forEach(assert)
        }), {
          config: AppConfigDriver(app)
        });

        function assert(path) {
          expect(path).to.equal('/some/path');
          done();
        }
      });
    });
  });

  describe('tasks sink property', () => {

    it('calls `app.setUserTasks()`', done => {
      const tasks = [
        { title: 'Task 1' },
        { title: 'Task 2' }
      ];

      Cycle.run(() => ({
        config$: Observable.just({ tasks })
      }), {
        config$: AppConfigDriver(app)
      });

      setTimeout(() => {
        expect(app.setUserTasks).to.have.been.calledWith(tasks);
        done();
      }, 1);
    });
  });
});
