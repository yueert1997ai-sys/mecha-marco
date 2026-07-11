import { GameLoop } from './core/gameLoop.js';
import { Renderer } from './render/renderer.js';
import { applyRendererPolish } from './render/polishRenderer.js';
import { applyMechVisual41 } from './render/mechVisual41.js';
import { tuneMech3DRenderer } from './render/mech3dTuning41.js';
import { enhanceLiteEnemies42 } from './render/mechLiteEnhance42.js';
import { enhanceLoadoutVisual415 } from './render/loadoutVisual415.js';
import { enhancePaintVariants416 } from './render/paintVariants416.js';
import { applyTopDownCamera } from './render/topdownCamera.js';
import { applyTopDownMechPose } from './render/topdownMechPose.js';
import { applyArenaDetail415 } from './render/arenaDetail415.js';
import { applyContinuousCampaignRenderer42 } from './render/continuousCampaign42.js';
import { applyMobileFeel42 } from './combat/mobileFeel42.js';
import { applyLoadoutRuntime415 } from './combat/loadoutRuntime415.js';
import { applyRogueTransform416 } from './combat/rogueTransform416.js';
import { applyContinuousCampaign42 } from './run/continuousCampaign42.js';
import { applyContinuousCampaignPolish42 } from './run/continuousCampaignPolish42.js';
import { installTransformModules416 } from './data/transformModules416.js';
import { InputRouter } from './input/inputRouter.js';
import { AppUI } from './ui/appUI.js';
import { applyMechPreview41 } from './ui/mechPreview41.js';
import { applyUIPolish415 } from './ui/uiPolish415.js';
import { applyDepthUI416 } from './ui/depthUI416.js';
import { applyBranding416 } from './ui/branding416.js';
import { applyPaintDock416 } from './ui/paintDock416.js';
import { applyCampaignUI42 } from './ui/campaignUI42.js';
import { SynthAudio } from './audio/synthAudio.js';
import { Game } from './game.js';
import { Enemy } from './actors/enemy.js';
import { PlayerMech } from './actors/player.js';
import { applyCombatPolish } from './combat/polishCombat.js';

installTransformModules416();
applyRendererPolish(Renderer);
applyMechVisual41(Renderer);
applyMobileFeel42({ InputRouter, PlayerMech, Renderer });
applyLoadoutRuntime415(PlayerMech);
applyTopDownCamera(Renderer);
applyArenaDetail415(Renderer);
applyContinuousCampaignRenderer42(Renderer);
const drawCanvasMechFallback = Renderer.prototype.drawMech;
Renderer.prototype.drawMech = function drawMechWithWebGLFallback(...args) {
  if (globalThis.__MECH_3D_READY__) return;
  return drawCanvasMechFallback.apply(this, args);
};
applyMechPreview41(AppUI);
applyUIPolish415(AppUI);
applyBranding416(AppUI);
applyCombatPolish({ Game, Enemy, PlayerMech });
applyDepthUI416({ AppUI, Game, InputRouter, PlayerMech });
applyPaintDock416(AppUI);
applyCampaignUI42(AppUI);
applyRogueTransform416({ PlayerMech, Game });
applyContinuousCampaign42({ Game });
applyContinuousCampaignPolish42(Game);

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
document.documentElement.dataset.combatView = 'topdown';
document.documentElement.dataset.mechSilhouette = 'upper-body';
document.documentElement.dataset.uiStyle = 'low-saturation-glass';
document.documentElement.dataset.rogueDepth = 'transform-doctrines';
document.documentElement.dataset.campaignMode = 'continuous-12-stage';
document.documentElement.dataset.narrativeArc = 'ma00-restoration';

try {
  const { createMech3DRenderer } = await import('./render/mech3d41.js');
  const tuned = tuneMech3DRenderer(await createMech3DRenderer(mechCanvas, renderer));
  const efficient = enhanceLiteEnemies42(tuned);
  const evolved = enhanceLoadoutVisual415(efficient);
  const painted = enhancePaintVariants416(evolved);
  mech3d = applyTopDownMechPose(painted);
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

addEventListener('mecha-loadout-changed',(event)=>{
  const module=event.detail?.module;
  if(module)ui.notify(`${module.name} 已安装 · 战斗模型同步升级`,1.9);
});
addEventListener('pointerdown', () => audio.unlock(), { once:true });
addEventListener('keydown', () => audio.unlock(), { once:true });

if (!smokeMode && 'serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

globalThis.__MECHA_MARCO__ = {
  game,
  visualVersion:'4.2.0-continuous-graveyard',
  mech3dStatus:()=>mech3dStatus,
  mech3dRenderer:()=>mech3d,
  snapshot: () => ({
    state:game.state,
    depth:game.run?.depth ?? null,
    stage:game.run?.stageIndex ?? null,
    stageName:game.room?.stage42?.name ?? null,
    campaignMode:document.documentElement.dataset.campaignMode,
    exitOpen:game.run?.exitOpen ?? false,
    enemies:game.enemies.filter((e)=>!e.dead).length,
    projectiles:game.projectiles.length,
    mech3d:mech3dStatus,
    renderMode:document.documentElement.dataset.mechRender,
    combatView:document.documentElement.dataset.combatView,
    mechSilhouette:document.documentElement.dataset.mechSilhouette,
    uiStyle:document.documentElement.dataset.uiStyle,
    rogueDepth:document.documentElement.dataset.rogueDepth,
    loadout:game.player?.visualLoadout||null,
    paint:game.player?.mech?.paintId||null,
    sensitivity:game.input?.tuning416||null,
    player:game.player?{hp:game.player.hp,maxHp:game.player.maxHp,x:game.player.x,y:game.player.y}:null,
  }),
};
