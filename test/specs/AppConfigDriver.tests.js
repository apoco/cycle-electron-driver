import AppConfigDriver from '../../src/AppConfigDriver';
import pathNames from '../../src/pathNames';

import { expect } from 'chai';
import { spy } from 'sinon';
import xs from 'xstream';
import { run } from '@cycle/run';

import AppStub from '../stubs/App';

describe('The AppConfigDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new AppStub();
  });

  describe('source', () => {
    describe('paths', () => {
      pathNames.forEach(name => {
        const source = `${name}$`;
        describe(source, () => {
          it(`gets the path named "${name}"`, done => {
            app.getPath.withArgs(name).returns('/some/path');

            run(({ config: { paths } }) => ({
              output: paths[source].take(1).addListener({ next: assert })
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

            run(({ config: { paths } }) => {
              const path$ = paths[source].remember();

              return {
                config: xs.of({ paths: { [name]: newPath } }),
                output1: path$.take(1),
                output2: path$.drop(1).take(1)
              }
            }, {
              config: AppConfigDriver(app),
              output1: path$ => path$.addListener({
                next: path => expect(path).to.equal('/original/path')
              }),
              output2: path$ => path$.addListener({
                next: path => {
                  expect(app.setPath).to.have.been.calledWith(name, newPath);
                  expect(path).to.equal(newPath);
                  done();
                }
              })
            });
          });
        })
      });

      describe('app$', () => {
        it('calls app.getAppPath()', done => {
          app.getAppPath.returns('/some/path');

          run(({ config: { paths } }) => ({
            output: paths.app$.take(1).addListener({ next: assert })
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

    describe('allowNTMLForNonIntranet$', () => {
      it('reflects changes to the allowNTMLForNonIntranet config setting', done => {
        run(({ config }) => ({
          config: xs.of({
            allowNTMLForNonIntranet: true
          }),
          output: config.allowNTMLForNonIntranet$
        }), {
          config: AppConfigDriver(app),
          output: value$ => {
            value$.take(1).addListener({
              next: value => {
                expect(value).to.be.false;
              }
            });
            value$.drop(1).take(1).addListener({
              next: value => {
                expect(value).to.be.true;
                expect(app.allowNTLMCredentialsForAllDomains).to.have.been.calledWith(true);
                done();
              }
            })
          }
        });
      });
    });
  });

  describe('tasks sink property', () => {

    it('calls `app.setUserTasks()`', done => {
      const tasks = [
        { title: 'Task 1' },
        { title: 'Task 2' }
      ];

      run(() => ({
        config$: xs.of({ tasks })
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
