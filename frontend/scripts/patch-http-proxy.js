'use strict';

const fs = require('fs');
const path = require('path');

const targetFile = path.join(
  __dirname,
  '..',
  'node_modules',
  'http-proxy',
  'lib',
  'http-proxy',
  'index.js'
);

if (!fs.existsSync(targetFile)) {
  process.exit(0);
}

const original = fs.readFileSync(targetFile, 'utf8');
const patched = original.replace(
  /extend\s*=\s*require\(['"]util['"]\)\._extend,/,
  'extend    = Object.assign,'
);

if (original === patched) {
  process.exit(0);
}

fs.writeFileSync(targetFile, patched);
console.log('Patched http-proxy to use Object.assign instead of util._extend');
