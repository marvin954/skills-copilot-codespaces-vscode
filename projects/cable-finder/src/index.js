#!/usr/bin/env node
'use strict';

const { findAvailability } = require('./services/availability');
const { createCableFinderServer } = require('./server');

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (options.address) {
    process.stdout.write(`${JSON.stringify(findAvailability(options.address), null, 2)}\n`);
    return;
  }

  await listen(options);
}

function parseArgs(args) {
  const options = {
    address: process.env.CABLE_FINDER_ADDRESS || '',
    host: process.env.HOST || '127.0.0.1',
    port: Number(process.env.PORT || 3000)
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    switch (arg) {
      case '--address':
        options.address = readValue(args, index, arg);
        index += 1;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--host':
        options.host = readValue(args, index, arg);
        index += 1;
        break;
      case '--port':
        options.port = Number(readValue(args, index, arg));
        index += 1;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (!Number.isInteger(options.port) || options.port <= 0) {
    throw new Error('--port must be a positive integer.');
  }

  return options;
}

function readValue(args, index, flag) {
  const value = args[index + 1];
  if (value === undefined || value.startsWith('--')) {
    throw new Error(`${flag} requires a value.`);
  }

  return value;
}

function listen(options) {
  const server = createCableFinderServer();

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(options.port, options.host, () => {
      const address = server.address();
      process.stdout.write(`Cable Finder is running at http://${address.address}:${address.port}\n`);
      resolve(server);
    });
  });
}

function printHelp() {
  process.stdout.write(`Cable Finder

Usage:
  npm start
  node src/index.js --address "123 Main St, Springfield, IL 62704"

Options:
  --address <address>  Print matching services as JSON instead of starting the web app.
  --host <host>        Host for the web app. Default: 127.0.0.1
  --port <port>        Port for the web app. Default: 3000

Open the web app and enter a customer address to view available internet services.
`);
}

if (require.main === module) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = {
  parseArgs,
  listen,
  main
};
