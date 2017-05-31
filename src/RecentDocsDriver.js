export default function RecentDocsDriver(app) {
  return recentDoc$ => {
    recentDoc$.addListener({
      next: ops => {
        if (ops.clear) {
          app.clearRecentDocuments();
        }
        if (ops.add) {
          app.addRecentDocument(ops.add);
        }
      }
    });
  };
}
