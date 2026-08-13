const app = require('./dist/bundle.js');
const defaultApp = app.default || app;
module.exports = defaultApp;

if (require.main === module) {
  const PORT = process.env.PORT || 4000;
  defaultApp.listen(PORT, () => {
    console.log(`[Backend] Listening on port ${PORT}`);
  });
}
