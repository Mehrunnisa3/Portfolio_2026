/**
 * Render an HTML file to PDF via Chrome's DevTools Protocol.
 *
 * Used for the resume: authoring it as HTML keeps it diffable and editable, while
 * Page.printToPDF produces the actual artefact to send and to link from the site.
 * printBackground is on so the header rule and accent colour survive.
 *
 * Usage: node scripts/pdf.mjs <input.html> <output.pdf>
 */
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9355;

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('usage: node scripts/pdf.mjs <input.html> <output.pdf>');
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  '--disable-gpu',
  '--no-first-run',
  '--user-data-dir=/tmp/chrome-pdf-profile',
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

const ws = new WebSocket(await endpoint());
await new Promise((r) => ws.addEventListener('open', r, { once: true }));

let id = 0;
const pending = new Map();
let sessionId;
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    const { resolve: res, reject } = pending.get(msg.id);
    pending.delete(msg.id);
    msg.error ? reject(new Error(JSON.stringify(msg.error))) : res(msg.result);
  }
});
const send = (method, params = {}) => {
  const i = ++id;
  ws.send(JSON.stringify(sessionId ? { id: i, method, params, sessionId } : { id: i, method, params }));
  return new Promise((res, reject) => pending.set(i, { resolve: res, reject }));
};

const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
({ sessionId } = await send('Target.attachToTarget', { targetId, flatten: true }));
await send('Page.enable');
await send('Page.navigate', { url: `file://${resolve(input)}` });
// Fonts must load before layout is measured, or line breaks shift in the PDF.
await sleep(2600);

const { data } = await send('Page.printToPDF', {
  printBackground: true,
  paperWidth: 8.5,
  paperHeight: 11,
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  preferCSSPageSize: true,
});

const buf = Buffer.from(data, 'base64');
await writeFile(output, buf);
console.log(`  ${output}  ${(buf.length / 1024).toFixed(0)} KB`);

ws.close();
chrome.kill();
process.exit(0);
