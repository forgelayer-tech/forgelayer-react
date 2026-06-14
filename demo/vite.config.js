import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // So the demo can import from 'forgelayer-react' as if it were installed
      'forgelayer-react': path.resolve(__dirname, '../src/index.js'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy all /fl/* requests to the Express backend (forgelayer-js-plugin example server)
      '/fl': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
