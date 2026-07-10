import { spawn, spawnSync } from 'node:child_process';
import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = process.env.REQUIRE_BROWSER_SMOKE === '1';
const port = 18743;
const server = spawn('python3', ['-m','http.server',String(port),'--bind','127.0.0.1'], { cwd:root, stdio:'ignore' });
const sleep = (ms) => new Promise((resolve)=>setTimeout(resolve,ms));
try {
  await sleep(700);
  const result = spawnSync('/usr/bin/chromium', [
    '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
    '--disable-background-networking','--disable-component-update','--no-first-run',
    '--virtual-time-budget=1200','--dump-dom',`http://127.0.0.1:${port}/?smoke=1`
  ], { encoding:'utf8', timeout:12000 });
  const dom = result.stdout || '';
  const ok = result.status === 0 && dom.includes('data-smoke-ready="true"') && dom.includes('开始出击') && dom.includes('断刃·先锋型') && !dom.includes('游戏脚本加载失败');
  if (!ok) {
    const message = `Browser smoke unavailable or failed (status=${result.status}, signal=${result.signal}, stdout=${dom.length} bytes)`;
    if (required) throw new Error(message + `\n${result.stderr || ''}`);
    console.warn(`${message}; skipped in constrained local container.`);
  } else {
    console.log('Browser smoke: base UI rendered successfully');
  }
} finally {
  server.kill('SIGTERM');
}
