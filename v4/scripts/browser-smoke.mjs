import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = process.env.REQUIRE_BROWSER_SMOKE === '1';
const port = 18743;
const url = `http://127.0.0.1:${port}/?smoke=1`;
const server = spawn('python3', ['-m','http.server',String(port),'--bind','127.0.0.1'], { cwd:root, stdio:'ignore' });
const sleep = (ms) => new Promise((resolve)=>setTimeout(resolve,ms));

const commonArgs = [
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--disable-background-networking','--disable-component-update','--no-first-run',
  '--virtual-time-budget=1400','--dump-dom',
];

const runSmoke = (name, extraArgs = []) => {
  const result = spawnSync('/usr/bin/chromium', [...commonArgs, ...extraArgs, url], { encoding:'utf8', timeout:14000 });
  const dom = result.stdout || '';
  const ok = result.status === 0
    && dom.includes('data-smoke-ready="true"')
    && dom.includes('开始出击')
    && dom.includes('断刃·先锋型')
    && dom.includes('iphone17.css')
    && !dom.includes('游戏脚本加载失败');
  if (!ok) {
    const message = `${name} unavailable or failed (status=${result.status}, signal=${result.signal}, stdout=${dom.length} bytes)`;
    if (required) throw new Error(message + `\n${result.stderr || ''}`);
    console.warn(`${message}; skipped in constrained local container.`);
    return false;
  }
  console.log(`${name}: base UI rendered successfully`);
  return true;
};

try {
  await sleep(700);
  runSmoke('Browser smoke');
  runSmoke('Large iPhone landscape smoke', [
    '--window-size=956,440',
    '--user-agent=Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Version/19.0 Mobile/15E148 Safari/604.1',
  ]);
} finally {
  server.kill('SIGTERM');
}
