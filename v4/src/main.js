import { GameLoop } from './core/gameLoop.js';
import { Renderer } from './render/renderer.js';
import { applyRendererPolish } from './render/polishRenderer.js';
import { applyMechVisual41 } from './render/mechVisual41.js';
import { tuneMech3DRenderer } from './render/mech3dTuning41.js';
import { enhanceLiteEnemies42 } from './render/mechLiteEnhance42.js';
import { applyMobileFeel42 } from './combat/mobileFeel42.js';
import { InputRouter } from './input/inputRouter.js';
import { AppUI } from './ui/appUI.js';
import { applyMechPreview41 } from './ui/mechPreview41.js';
import { SynthAudio } from './audio/synthAudio.js';
import { Game } from './game.js';
import { Enemy } from './actors/enemy.js';
import { PlayerMech } from './actors/player.js';
import { applyCombatPolish } from './combat/polishCombat.js';

applyRendererPolish(Renderer);
applyMechVisual41(Renderer);
applyMobileFeel42({ InputRouter, PlayerMech, Renderer });
const drawCanvasMechFallback = Renderer.prototype.drawMech;
Renderer.prototype.drawMech = function drawMechWithWebGLFallback(...args) {
  if (globalThis.__MECH_3D_READY__) return;
  return drawCanvasMechFallback.apply(this, args);
};
applyMechPreview41(AppUI);
applyCombatPolish({ Game, Enemy, PlayerMech });

const canvas = document.getElementById('game-canvas');
const mechCanvas = document.getElementById('mech-3d-canvas');
const touchRoot = document.getElementById('touch-controls');
const renderer = new Renderer(canvas);
const input = new InputRouter(canvas, touchRoot);
const ui = new AppUI();
const audio = new SynthAudio();
const game = new Game({ renderer, input, ui, audio });
let mech3d = null;
let mech3dStatus = 'loading';

try {
  const { createMech3DRenderer } = await import('./render/mech3d41.js');
  mech3d = enhanceLiteEnemies42(tuneMech3DRenderer(await createMech3DRenderer(mechCanvas, renderer)));
  globalThis.__MECH_3D_READY__ = true;
  mech3dStatus = 'ready';
  document.documentElement.dataset.mech3d = 'ready';
  document.documentElement.dataset.mechRender = 'webgl';
} catch (error) {
  globalThis.__MECH_3D_READY__ = false;
  mech3dStatus = 'fallback';
  document.documentElement.dataset.mech3d = 'fallback';
  document.documentElement.dataset.mechRender = 'canvas';
  console.warn('WebGL mech renderer unavailable; using projected Canvas fallback.', error);
}

const renderFrame = () => {
  game.render();
  mech3d?.render(game);
};
const loop = new GameLoop({ update:(dt)=>game.update(dt), render:renderFrame });
const smokeMode = new URLSearchParams(location.search).has('smoke');
if (smokeMode) {
  renderFrame();
  document.documentElement.dataset.smokeReady = 'true';
} else {
  loop.start();
}

addEventListener('pointerdown', () => audio.unlock(), { once:true });
addEventListener('keydown', () => audio.unlock(), { once:true });

if (!smokeMode && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

globalThis.__MECHA_MARCO__ = {
  game,
  visualVersion:'4.1.1-controls-camera-polish',
  mech3dStatus:()=>mech3dStatus,
  snapshot: () => ({
    state:game.state,
    depth:game.run?.depth ?? null,
    enemies:game.enemies.filter((e)=>!e.dead).length,
    projectiles:game.projectiles.length,
    mech3d:mech3dStatus,
    renderMode:document.documentElement.dataset.mechRender,
    player:game.player?{hp:game.player.hp,maxHp:game.player.maxHp,x:game.player.x,y:game.player.y}:null,
  }),
};
