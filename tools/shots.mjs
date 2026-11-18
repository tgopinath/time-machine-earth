// Captures the portfolio card screenshots: npm run build && node tools/shots.mjs
// Phone shots (390 x 849 @2x, saved 600 wide) go to prototype/shots, the 1440 x 900 desktop shot to shots-desktop/web.jpg.
// Serves the built dist/ folder; the boundary snapshots load from jsDelivr, so this needs an internet connection.
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';

const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'dist');
const SHOTS = path.join(ROOT, 'prototype', 'shots');
const DESK = path.join(ROOT, 'shots-desktop');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = ms => new Promise(r => setTimeout(r, ms));

if (!fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('Run npm run build first');
fs.mkdirSync(SHOTS, { recursive: true });
fs.mkdirSync(DESK, { recursive: true });
const tmp = fs.mkdtempSync(path.join(ROOT, '.shots-'));
const port = 5700 + Math.floor(Math.random() * 200), dbg = port + 1000;
const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1', '--directory', DIST], { stdio: 'ignore' });
const chrome = spawn(CHROME, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', `--remote-debugging-port=${dbg}`, `--user-data-dir=${tmp}/profile`, 'about:blank'], { stdio: 'ignore' });
try {
  let ws;
  for (let i = 0; i < 60 && !ws; i++) {
    try { const p = (await (await fetch(`http://127.0.0.1:${dbg}/json`)).json()).find(t => t.type === 'page'); if (p) ws = new WebSocket(p.webSocketDebuggerUrl); } catch {}
    if (!ws) await sleep(250);
  }
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = {};
  ws.onmessage = e => { const m = JSON.parse(e.data); if (pending[m.id]) { pending[m.id](m); delete pending[m.id]; } };
  const send = (method, params = {}) => new Promise(r => { const i = ++id; pending[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
  const origin = `http://127.0.0.1:${port}`;
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  const grab = async (query, out, { width, height, scale, mobile, resize, wait = 9000, js }) => {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile });
    await send('Page.navigate', { url: `${origin}/?app=web${query}` }); await sleep(wait);
    if (js) { await send('Runtime.evaluate', { expression: js, awaitPromise: true }); await sleep(2500); }
    const s = await send('Page.captureScreenshot', { format: 'png' });
    const png = path.join(tmp, path.basename(out) + '.png');
    fs.writeFileSync(png, Buffer.from(s.result.data, 'base64'));
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '84', '--resampleWidth', String(resize), png, '--out', out], { stdio: 'pipe' });
  };
  const phone = { width: 390, height: 849, scale: 2, mobile: true, resize: 600 };
  // Close the info sheet on the phone so the map shows.
  const closePanel = "document.querySelector('[aria-label=\"Close panel\"], [aria-label=\"Hide panel\"]')?.click()";
  await grab('&year=1500', path.join(SHOTS, 'explore.jpg'), { ...phone, js: closePanel });
  await grab('&year=117', path.join(SHOTS, 'rome.jpg'), { ...phone, js: closePanel });
  await grab('&view=civilizations', path.join(SHOTS, 'civilizations.jpg'), { ...phone, wait: 6000 });
  await grab('&view=compare', path.join(SHOTS, 'compare.jpg'), phone);
  await grab('&view=learn', path.join(SHOTS, 'learn.jpg'), { ...phone, wait: 6000 });
  await grab('&year=1500', path.join(DESK, 'web.jpg'), { width: 1440, height: 900, scale: 1, mobile: false, resize: 1440, wait: 10000 });
  console.log('captured', fs.readdirSync(SHOTS).join(', '), '+ shots-desktop/web.jpg');
  ws.close();
} finally {
  const exited = new Promise(r => chrome.once('exit', r));
  chrome.kill(); server.kill();
  await Promise.race([exited, sleep(5000)]);
  fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}
