import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/vitestSetup.js'],
  },
  resolve: {
    alias: {
      pg: path.resolve(__dirname, 'test/pgMemShim.js'),
    },
  },
});
