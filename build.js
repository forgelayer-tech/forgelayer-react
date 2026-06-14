#!/usr/bin/env node
'use strict';

const esbuild = require('esbuild');
const path    = require('path');

const shared = {
  entryPoints: ['src/index.js'],
  bundle:      true,
  external:    ['react', 'react-dom'],   // peer deps — don't bundle React
  jsx:         'automatic',              // React 17+ JSX transform
  sourcemap:   true,
  minify:      false,
};

Promise.all([
  // CommonJS (require())
  esbuild.build({
    ...shared,
    format:  'cjs',
    outfile: 'dist/index.cjs.js',
  }),
  // ES Modules (import)
  esbuild.build({
    ...shared,
    format:  'esm',
    outfile: 'dist/index.esm.js',
  }),
]).then(() => {
  console.log('✓ forgelayer-react built to dist/');
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
