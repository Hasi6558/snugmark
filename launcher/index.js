// @ts-check
'use strict';

const { spawn, exec, execSync } = require('child_process');
const path = require('path');
const net = require('net');
const fs = require('fs');
const readline = require('readline');

// When packaged with pkg, the exe lives at the project root.
// When running from source, __dirname is launcher/, so go up one level.
const isPackaged = typeof process.pkg !== 'undefined';
const root = isPackaged
  ? path.dirname(process.execPath)
  : path.resolve(__dirname, '..');

const BE_DIR = path.join(root, 'snugmark-be');
const FE_DIR = path.join(root, 'snugmark-fe');
const CONFIG_FILE = path.join(root, 'snugmark-launcher.json');
const BE_PORT = 5201;
const FE_PORT = 5202;
const FE_URL = `http://localhost:${FE_PORT}`;

const children = [];

// ─── Browser detection ───────────────────────────────────────────────────────

const KNOWN_BROWSERS = [
  {
    name: 'Brave Browser',
    paths: [
      'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      'C:\\Program Files (x86)\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
    ],
  },
  {
    name: 'Google Chrome',
    paths: [
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    ],
  },
  {
    name: 'Microsoft Edge',
    paths: [
      'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    ],
  },
  {
    name: 'Mozilla Firefox',
    paths: [
      'C:\\Program Files\\Mozilla Firefox\\firefox.exe',
      'C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe',
    ],
  },
];

/** @returns {{ name: string, exePath: string }[]} */
function detectBrowsers() {
  const found = [];
  for (const browser of KNOWN_BROWSERS) {
    for (const p of browser.paths) {
      if (fs.existsSync(p)) {
        found.push({ name: browser.name, exePath: p });
        break; // only add once per browser
      }
    }
  }
  return found;
}

// ─── Config ──────────────────────────────────────────────────────────────────

/** @returns {{ browserExe?: string, browserName?: string } | null} */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (_) {}
  return null;
}

/** @param {{ browserExe: string, browserName: string }} config */
function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

// ─── Browser prompt ──────────────────────────────────────────────────────────

/**
 * Ask the user to pick a browser from the detected list.
 * Returns the chosen { name, exePath } or null for system default.
 */
function promptBrowser(detected) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    console.log('\nWhich browser should open Snugmark?\n');

    const options = [...detected, { name: 'System default', exePath: null }];
    const braveIdx = options.findIndex((b) => b.name === 'Brave Browser');

    options.forEach((b, i) => {
      const marker = i === braveIdx ? ' (recommended)' : '';
      const def = i === (braveIdx >= 0 ? braveIdx : options.length - 1) ? ' [default]' : '';
      console.log(`  ${i + 1}. ${b.name}${marker}${def}`);
    });

    const defaultIdx = braveIdx >= 0 ? braveIdx + 1 : options.length;
    console.log('');

    rl.question(`Enter number [${defaultIdx}]: `, (answer) => {
      rl.close();
      const n = parseInt(answer.trim(), 10);
      const idx = isNaN(n) ? defaultIdx - 1 : n - 1;
      const choice = options[idx] ?? options[defaultIdx - 1];
      resolve(choice);
    });
  });
}

/**
 * Resolve which browser to use:
 *   - Use saved config if it exists
 *   - Otherwise detect, prompt, and save
 * Returns { name, exePath } — exePath is null for system default.
 */
async function resolveBrowser() {
  const config = loadConfig();
  if (config && config.browserExe !== undefined) {
    // Validate the saved exe still exists (or null = system default)
    if (config.browserExe === null || fs.existsSync(config.browserExe)) {
      console.log(`Browser: ${config.browserName} (saved preference)`);
      console.log('  Tip: delete snugmark-launcher.json to pick a different browser.\n');
      return { name: config.browserName, exePath: config.browserExe };
    }
    console.log(`Saved browser not found (${config.browserExe}), re-selecting...\n`);
  }

  const detected = detectBrowsers();

  if (detected.length === 0) {
    console.log('No supported browsers detected — will use system default.\n');
    saveConfig({ browserExe: null, browserName: 'System default' });
    return { name: 'System default', exePath: null };
  }

  // Auto-select Brave without prompting if it's the only browser, or silently pick it
  const brave = detected.find((b) => b.name === 'Brave Browser');
  if (detected.length === 1) {
    const b = detected[0];
    console.log(`Browser: ${b.name} (only detected browser, selecting automatically)\n`);
    saveConfig({ browserExe: b.exePath, browserName: b.name });
    return b;
  }

  const choice = await promptBrowser(detected);
  console.log(`\nSaved "${choice.name}" as your browser preference.\n`);
  saveConfig({ browserExe: choice.exePath, browserName: choice.name });
  return choice;
}

// ─── Open URL ────────────────────────────────────────────────────────────────

/** @param {string} url @param {{ name: string, exePath: string | null }} browser */
function openUrl(url, browser) {
  if (browser.exePath) {
    // Launch the specific browser exe directly
    spawn(browser.exePath, [url], { detached: true, stdio: 'ignore' }).unref();
  } else {
    // Windows "start" delegates to the system default browser
    exec(`start "" "${url}"`);
  }
}

// ─── Server management ───────────────────────────────────────────────────────

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
  const child = spawn('npm', ['run', 'dev'], {
    cwd,
    shell: true,
    stdio: 'pipe',
    // detached + windowsHide: child runs in its own process group with no
    // visible console window, so it keeps running after the launcher exits.
    detached: true,
    windowsHide: true,
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
      exec(`taskkill /PID ${child.pid} /T /F`, () => {});
    } catch (_) {}
  }
}

function detachAll() {
  for (const child of children) {
    try {
      child.stdout.destroy();
      child.stderr.destroy();
      child.unref();
    } catch (_) {}
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('╔══════════════════════════════╗');
  console.log('║       Snugmark Launcher      ║');
  console.log('╚══════════════════════════════╝\n');

  // Ctrl+C while the launcher is still open: kill both servers and exit.
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    killAll();
    process.exit(0);
  });

  // Resolve browser first (may prompt user on first run)
  const browser = await resolveBrowser();

  console.log('Starting backend and frontend...\n');
  startProcess('BE', BE_DIR);
  startProcess('FE', FE_DIR);

  const [beReady, feReady] = await Promise.all([
    waitForPort(BE_PORT, 'Backend'),
    waitForPort(FE_PORT, 'Frontend'),
  ]);

  if (beReady && feReady) {
    console.log(`\nOpening ${FE_URL} in ${browser.name}...`);
    openUrl(FE_URL, browser);
    // Detach child processes so they survive the launcher closing,
    // then exit to close this console window.
    detachAll();
    setTimeout(() => process.exit(0), 500);
  } else {
    console.error('\nOne or more services failed to start. Check logs above.');
    console.error('Press Ctrl+C to exit.');
  }
}

main().catch((err) => {
  console.error('Launcher error:', err);
  process.exit(1);
});
