import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/dessy/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'fabric-aligning-guidelines': path.resolve(
        __dirname,
        'node_modules/fabric/dist-extensions/aligning_guidelines/index.mjs'
      ),
    },
  },
  server: {
    port: 3002,
  },
  build: {
    outDir: 'dist',
  },
});
