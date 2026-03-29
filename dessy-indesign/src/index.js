import { entrypoints } from 'uxp';
import { render, h } from 'preact';
import App from './ui/App';

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
