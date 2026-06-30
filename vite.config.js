import { defineConfig } from 'vite';
import { resolve } from 'path';

// `base: './'` keeps all built asset URLs relative, so the production build
// in dist/ can be hosted from any subpath (itch.io, Gumroad, S3, a CDN
// subfolder, etc.) without extra configuration.
//
// `npm run build:demo` builds with mode 'demo', which src/demo.js reads via
// import.meta.env.MODE to gate content (limited tanks/maps). It outputs to
// dist-demo/ so a full build and a demo build can exist side by side.
export default defineConfig(({mode}) => ({
  base: './',
  build: {
    outDir: mode === 'demo' ? 'dist-demo' : 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        garage: resolve(__dirname, 'garage.html'),
      },
    },
  },
}));
