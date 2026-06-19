// @ts-check
'use strict';

const { spawn, exec } = require('child_process');
const path = require('path');
const net = require('net');

// When packaged with pkg, the exe lives at the project root.
// When running from source, __dirname is launcher/, so go up one level.
const isPackaged = typeof process.pkg !== 'undefined';
const root = isPackaged
  ? path.dirname(process.execPath)
  : path.resolve(__dirname, '..');

const BE_DIR = path.join(root, 'snugmark-be');
const FE_DIR = path.join(root, 'snugmark-fe');
const BE_PORT = 4000;
const FE_PORT = 8080;
const FE_URL = `http://localhost:${FE_PORT}`;

const children = [];

function log(prefix, msg) {
  const line = msg.toString().trimEnd();
  if (line) console.log(`[${prefix}] ${line}`);
}

function checkPort(port) {
  return new Promise((resolve) => {
    const client = net.createConnection({ port }, () => {
      client.destroy();
      resolve(true);
    });
    client.on('error', () => resolve(false));
  });
}

async function waitForPort(port, label, maxSeconds = 90) {
  process.stdout.write(`Waiting for ${label} on :${port}`);
  for (let i = 0; i < maxSeconds; i++) {
    const up = await checkPort(port);
    if (up) {
      console.log(' ready!');
      return true;
    }
    await new Promise((r) => setTimeout(r, 1000));
    process.stdout.write('.');
  }
  console.log(' TIMED OUT');
  return false;
}

function startProcess(label, cwd) {
  // Use shell:true so npm.cmd resolves correctly on Windows
  const child = spawn('npm', ['run', 'dev'], {
    cwd,
    shell: true,
    stdio: 'pipe',
  });
  child.stdout.on('data', (d) => log(label, d));
  child.stderr.on('data', (d) => log(label, d));
  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[${label}] exited with code ${code}`);
    }
  });
  children.push(child);
  return child;
}

function killAll() {
  for (const child of children) {
    try {
      // On Windows, kill the whole process tree spawned via shell
      exec(`taskkill /PID ${child.pid} /T /F`, () => {});
    } catch (_) {}
  }
}

async function main() {
  console.log('╔══════════════════════════════╗');
  console.log('║       Snugmark Launcher      ║');
  console.log('╚══════════════════════════════╝\n');
  console.log(`Project root : ${root}`);
  console.log(`Backend dir  : ${BE_DIR}`);
  console.log(`Frontend dir : ${FE_DIR}\n`);

  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    killAll();
    process.exit(0);
  });
  process.on('exit', killAll);

  console.log('Starting backend and frontend...\n');
  startProcess('BE', BE_DIR);
  startProcess('FE', FE_DIR);

  const [beReady, feReady] = await Promise.all([
    waitForPort(BE_PORT, 'Backend'),
    waitForPort(FE_PORT, 'Frontend'),
  ]);

  if (beReady && feReady) {
    console.log(`\nOpening ${FE_URL} in your browser...\n`);
    exec(`start "" "${FE_URL}"`);
  } else {
    console.error('\nOne or more services failed to start. Check logs above.');
  }
}

main().catch((err) => {
  console.error('Launcher error:', err);
  process.exit(1);
});
