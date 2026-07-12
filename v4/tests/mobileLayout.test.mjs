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
  const viewport = await read('src/ui/mobileViewport42.js');
  assert.match(css, /100dvh/);
  assert.match(css, /100svh/);
  assert.match(css, /safe-area-inset-bottom/);
  assert.match(css, /orientation:\s*landscape/);
  assert.match(css, /pointer:\s*coarse/);
  assert.match(css, /max-height:\s*560px/);
  assert.match(css, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /home-indicator-buffer/);
  assert.match(css, /position:\s*fixed[\s\S]*overflow:\s*hidden/);
  assert.match(css, /--app-height/);
  assert.match(viewport, /visualViewport/);
  assert.match(viewport, /orientationchange/);
  assert.match(viewport, /pageshow/);
  assert.match(viewport, /mecha-viewport-change/);
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
  assert.match(css, /\.aim-stick[\s\S]*width:\s*142px/);
  assert.match(css, /\.saber-btn[\s\S]*right:\s*calc\(166px \+ var\(--safe-right\)\)/);
  assert.match(css, /\.dash-btn[\s\S]*bottom:\s*calc\(118px \+ var\(--safe-bottom\)\)/);
  assert.match(css, /\.missile-btn[\s\S]*right:\s*calc\(244px \+ var\(--safe-right\)\)/);
  assert.match(css, /\.overdrive-btn[\s\S]*right:\s*calc\(252px \+ var\(--safe-right\)\)/);
});

test('unified touch layout exposes cooldowns and source-owned multitouch', async () => {
  const html = await read('index.html');
  const input = await read('src/input/inputRouter.js');
  const tuning = await read('src/ui/depthUI416.js');
  assert.match(html, /data-stick="aim"[\s\S]*主炮/);
  assert.match(html, /data-action="secondary"[\s\S]*data-action="dash"[\s\S]*data-action="ordnance"[\s\S]*data-action="overdrive"/);
  assert.match(input, /actionSources/);
  assert.match(input, /lostpointercapture/);
  assert.match(tuning, /autoFire/);
  assert.match(tuning, /controlOpacity/);
  assert.doesNotMatch(tuning, /data-preset416/);
});
