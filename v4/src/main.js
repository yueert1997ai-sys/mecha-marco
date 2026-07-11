import { GameLoop } from './core/gameLoop.js';
import { Renderer } from './render/renderer.js';
import { applyRendererPolish } from './render/polishRenderer.js';
import { applyMechVisual41 } from './render/mechVisual41.js';
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
applyMechPreview41(AppUI);
applyCombatPolish({ Game, Enemy, PlayerMech });

const canvas = document.getElementById('game-canvas');
const touchRoot = document.getElementById('touch-controls');
const renderer = new Renderer(canvas);
const input = new InputRouter(canvas, touchRoot);
const ui = new AppUI();
const audio = new SynthAudio();
const game = new Game({ renderer, input, ui, audio });
const loop = new GameLoop({ update:(dt)=>game.update(dt), render:()=>game.render() });
const smokeMode = new URLSearchParams(location.search).has('smoke');
if (smokeMode) {
  game.render();
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
  visualVersion:'4.1.0-full-redesign',
  snapshot: () => ({
    state:game.state,
    depth:game.run?.depth ?? null,
    enemies:game.enemies.filter((e)=>!e.dead).length,
    projectiles:game.projectiles.length,
    player:game.player?{hp:game.player.hp,maxHp:game.player.maxHp,x:game.player.x,y:game.player.y}:null,
  }),
};
