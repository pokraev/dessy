const { entrypoints } = require('uxp');
const { render, h } = require('preact');
const App = require('./ui/App').default;

entrypoints.setup({
  panels: {
    'dessy-panel': {
      show(node) {
        render(h(App, null), node);
      },
      destroy() {
        // cleanup if needed
      }
    }
  }
});
