export default function AppVisibilityDriver(app) {
  return visibility$ => {
    visibility$.forEach(isVisible => isVisible ? app.show() : app.hide());
  };
}
