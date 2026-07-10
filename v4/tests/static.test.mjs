import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('static entry and mobile controls are wired', async () => {
  for (const file of ['index.html','styles.css','manifest.webmanifest','sw.js','src/main.js','docs/HADES_ARCHITECTURE_4.0.md']) await access(path.join(root,file));
  const html = await readFile(path.join(root,'index.html'),'utf8');
  assert.match(html,/type="module" src="\.\/src\/main\.js"/);
  assert.match(html,/data-stick="move"/);
  assert.match(html,/data-stick="aim"/);
  assert.match(html,/viewport-fit=cover/);
  const css = await readFile(path.join(root,'styles.css'),'utf8');
  assert.match(css,/safe-area-inset-left/);
  assert.match(css,/touch-action:none/);
});
