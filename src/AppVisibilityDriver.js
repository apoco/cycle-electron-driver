import xs from 'xstream';

export default function AppVisibilityDriver(app) {
  return visibility$ => {
    visibility$.addListener({
      next: isVisible => isVisible ? app.show() : app.hide()
    });
  };
}
