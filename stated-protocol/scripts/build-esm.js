#!/usr/bin/env node

const esbuild = require('esbuild');

async function build() {
  // Bundle the main entry point with all dependencies
  await esbuild.build({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'dist/esm/index.js',
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    sourcemap: true,
    external: [], // Bundle everything including @noble
  });

  console.log('ESM build complete!');
}

build().catch(err => {
  console.error(err);
  process.exit(1);
});