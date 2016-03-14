export default function AppTasksDriver(app) {
  return task$ => {
    task$.forEach(tasks => app.setUserTasks(tasks))
  };
}
