/**
 * Full-page screenshot driver over the Chrome DevTools Protocol.
 *
 * The CLI --screenshot flag captures only the viewport and ignores fragment
 * scrolling, which makes it useless for reviewing a long page whose hero is
 * sized in vh units. CDP's captureBeyondViewport gives us the whole document at
 * a realistic viewport size.
 *
 * Usage: node scripts/shot.mjs <outDir> <name>=<url>[@scrollY] ...
 *   Append @<px> to capture a single viewport at that scroll offset instead of
 *   the full page — useful for reviewing one section at realistic proportions.
 *   Env: WIDTH (default 1440), HEIGHT (default 1000), SCALE (default 1),
 *        CLICK (CSS selector to click before capturing — e.g. to open a dialog)
 */
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CHROME =
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;
const WIDTH = Number(process.env.WIDTH ?? 1440);
const HEIGHT = Number(process.env.HEIGHT ?? 1000);
const SCALE = Number(process.env.SCALE ?? 1);

const [outDir, ...pairs] = process.argv.slice(2);
if (!outDir || pairs.length === 0) {
  console.error('usage: node scripts/shot.mjs <outDir> <name>=<url> ...');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--user-data-dir=/tmp/chrome-shot-profile',
  `--window-size=${WIDTH},${HEIGHT}`,
  'about:blank',
]);
chrome.stderr.on('data', () => {});

async function endpoint() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      return (await res.json()).webSocketDebuggerUrl;
    } catch {
      await sleep(200);
    }
  }
  throw new Error('Chrome DevTools endpoint never came up');
}

class CDP {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    this.sessionId = undefined;
    ws.addEventListener('message', (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (this.sessionId) payload.sessionId = this.sessionId;
    this.ws.send(JSON.stringify(payload));
    return new Promise((resolve, reject) =>
      this.pending.set(id, { resolve, reject }),
    );
  }
}

const wsUrl = await endpoint();
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
const cdp = new CDP(ws);

const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
const { sessionId } = await cdp.send('Target.attachToTarget', {
  targetId,
  flatten: true,
});
cdp.sessionId = sessionId;

await cdp.send('Page.enable');
await cdp.send('Emulation.setDeviceMetricsOverride', {
  width: WIDTH,
  height: HEIGHT,
  deviceScaleFactor: SCALE,
  mobile: false,
});

await mkdir(outDir, { recursive: true });

for (const pair of pairs) {
  const eq = pair.indexOf('=');
  const name = pair.slice(0, eq);
  const rest = pair.slice(eq + 1);
  const at = rest.lastIndexOf('@');
  const hasScroll = at > rest.indexOf('://') + 3 && /^\d+$/.test(rest.slice(at + 1));
  const url = hasScroll ? rest.slice(0, at) : rest;
  const scrollY = hasScroll ? Number(rest.slice(at + 1)) : null;

  await cdp.send('Page.navigate', { url });
  await sleep(2200);

  // Fonts and lazy images need a beat; then force every reveal visible so the
  // capture shows final state rather than mid-animation.
  await cdp.send('Runtime.evaluate', {
    expression: `
      document.querySelectorAll('.reveal').forEach(el => el.classList.add('is-visible'));
      document.fonts ? document.fonts.ready.then(() => 1) : 1;
    `,
    awaitPromise: false,
  });
  await sleep(900);

  if (scrollY !== null) {
    await cdp.send('Runtime.evaluate', {
      expression: `window.scrollTo({ top: ${scrollY}, behavior: 'instant' }); window.scrollY;`,
    });
    await sleep(600);
  }

  if (process.env.CLICK) {
    const clicked = await cdp.send('Runtime.evaluate', {
      expression: `(() => { const el = document.querySelector(${JSON.stringify(process.env.CLICK)}); if (!el) return 'NOT FOUND'; el.click(); return 'clicked'; })()`,
    });
    console.log(`  click ${process.env.CLICK}: ${clicked.result?.value}`);
    await sleep(1400);
  }

  const { data } = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: scrollY === null,
    fromSurface: true,
  });
  const out = join(outDir, `${name}.png`);
  await writeFile(out, Buffer.from(data, 'base64'));
  const kb = (Buffer.from(data, 'base64').length / 1024).toFixed(0);
  console.log(`  ${out}  ${kb} KB`);
}

ws.close();
chrome.kill();
process.exit(0);
