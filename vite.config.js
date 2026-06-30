import { defineConfig } from 'vite';
import { resolve } from 'path';

// `base: './'` keeps all built asset URLs relative, so the production build
// in dist/ can be hosted from any subpath (itch.io, Gumroad, S3, a CDN
// subfolder, etc.) without extra configuration.
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        garage: resolve(__dirname, 'garage.html'),
      },
    },
  },
});
