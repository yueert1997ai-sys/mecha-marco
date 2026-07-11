import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const read = (file) => readFile(path.join(root, file), 'utf8');

test('iPhone landscape override is loaded after the base stylesheet', async () => {
  const html = await read('index.html');
  assert.match(html, /<link rel="stylesheet" href="\.\/styles\.css">[\s\S]*<link rel="stylesheet" href="\.\/iphone17\.css">/);
  assert.match(html, /viewport-fit=cover/);
});

test('large iPhone landscape layout uses dynamic viewport and safe areas', async () => {
  const css = await read('iphone17.css');
  assert.match(css, /100dvh/);
  assert.match(css, /100svh/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /orientation:\s*landscape/);
  assert.match(css, /pointer:\s*coarse/);
  assert.match(css, /max-height:\s*560px/);
  assert.match(css, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /home-indicator-buffer/);
});

test('short landscape mode keeps the base screen compact and complete', async () => {
  const css = await read('iphone17.css');
  assert.match(css, /grid-template-rows:\s*auto auto auto auto minmax\(88px,\s*1fr\) auto/);
  assert.match(css, /\.control-note\s*\{\s*display:\s*none/);
  assert.match(css, /\.dialogue-card p[\s\S]*text-overflow:\s*ellipsis/);
  assert.match(css, /scrollbar-width:\s*none/);
});

test('renderer and combat polish modules are activated', async () => {
  const main = await read('src/main.js');
  const rendererPolish = await read('src/render/polishRenderer.js');
  const combatPolish = await read('src/combat/polishCombat.js');
  assert.match(main, /applyRendererPolish\(Renderer\)/);
  assert.match(main, /applyCombatPolish\(\{ Game, Enemy, PlayerMech \}\)/);
  assert.match(rendererPolish, /coarse \? \.84 : \.9/);
  assert.match(rendererPolish, /drawLayeredSlashes/);
  assert.match(combatPolish, /hitPause/);
  assert.match(combatPolish, /impactRing/);
});

test('real device regressions keep safe-area panels and touch targets separated', async () => {
  const css = await read('iphone17.css');
  assert.match(css, /\.panel\.base-panel\s*\{/);
  assert.doesNotMatch(css, /(^|\n)\.base-panel\s*\{/);
  assert.match(css, /\.hud-top-right[\s\S]*margin-right:\s*52px/);
  assert.match(css, /\.saber-btn[\s\S]*clamp\(150px,\s*17vw,\s*190px\)/);
  assert.match(css, /\.missile-btn[\s\S]*clamp\(210px,\s*23vw,\s*260px\)/);
  assert.match(css, /\.overdrive-btn[\s\S]*clamp\(270px,\s*29vw,\s*320px\)/);
});
