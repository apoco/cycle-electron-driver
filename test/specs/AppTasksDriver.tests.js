import AppTasksDriver from '../../src/AppTasksDriver';
import pathNames from '../../src/pathNames';

import { expect } from 'chai';
import { spy } from 'sinon';
import { Observable } from 'rx';
import Cycle from '@cycle/core';

import AppStub from '../stubs/App';

describe('The AppTasksDriver', () => {
  let app = null;

  beforeEach(() => {
    app = new AppStub();
  });

  it('calls `app.setUserTasks()`', done => {
    const tasks = [
      { title: 'Task 1' },
      { title: 'Task 2' }
    ];

    Cycle.run(() => ({
      userTask$: Observable.just(tasks)
    }), {
      userTask$: AppTasksDriver(app)
    });

    setTimeout(() => {
      expect(app.setUserTasks).to.have.been.calledWith(tasks);
      done();
    }, 1);
  });
});
