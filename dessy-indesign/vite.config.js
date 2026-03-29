import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { uxp } from 'vite-uxp-plugin';
import config from './uxp.config';

export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [
    preact(),
    uxp(config, mode)
  ],
  build: {
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: ['uxp', 'indesign'],
      output: {
        format: 'cjs',
        entryFileNames: 'index.js',
        inlineDynamicImports: true
      }
    }
  }
}));
