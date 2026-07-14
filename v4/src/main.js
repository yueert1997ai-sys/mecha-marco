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
import { applyFrontlineRenderer43 } from './render/frontlineDepth43.js';
import { applyOg04IdentityVisual44 } from './render/og04IdentityVisual44.js';
import { applyMobileFeel42 } from './combat/mobileFeel42.js';
import { applyLoadoutRuntime415 } from './combat/loadoutRuntime415.js';
import { applyRogueTransform416 } from './combat/rogueTransform416.js';
import { applyVanguardIdentity44 } from './combat/vanguardIdentity44.js';
import { applyContinuousCampaign42 } from './run/continuousCampaign42.js';
import { applyContinuousCampaignPolish42 } from './run/continuousCampaignPolish42.js';
import { applyFrontlineDepth43 } from './run/frontlineDepth43.js';
import { installTransformModules416 } from './data/transformModules416.js';
import { InputRouter } from './input/inputRouter.js';
import { AppUI } from './ui/appUI.js';
import { applyMechPreview41 } from './ui/mechPreview41.js';
import { applyUIPolish415 } from './ui/uiPolish415.js';
import { applyDepthUI416 } from './ui/depthUI416.js';
import { applyBranding416 } from './ui/branding416.js';
import { applyPaintDock416 } from './ui/paintDock416.js';
import { applyCampaignUI42 } from './ui/campaignUI42.js';
import { applyCampaignUIPolish42 } from './ui/campaignUIPolish42.js';
import { applyFrontlineUI43 } from './ui/frontlineDepth43.js';
import { applyVanguardIdentityUI44 } from './ui/vanguardIdentity44.js';
import { auditMobileViewport42, installMobileViewport42 } from './ui/mobileViewport42.js';
import { SynthAudio } from './audio/synthAudio.js';
import { Game } from './game.js';
import { Enemy } from './actors/enemy.js';
import { PlayerMech } from './actors/player.js';
import { applyCombatPolish } from './combat/polishCombat.js';

installTransformModules416();
const mobileViewport42 = installMobileViewport42();
applyRendererPolish(Renderer);
applyMechVisual41(Renderer);
applyMobileFeel42({ InputRouter, PlayerMech, Renderer });
applyLoadoutRuntime415(PlayerMech);
applyTopDownCamera(Renderer);
applyArenaDetail415(Renderer);
applyContinuousCampaignRenderer42(Renderer);
applyFrontlineRenderer43(Renderer);
applyOg04IdentityVisual44(Renderer);
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
applyCampaignUIPolish42(AppUI);
applyRogueTransform416({ PlayerMech, Game });
applyContinuousCampaign42({ Game });
applyContinuousCampaignPolish42(Game);
applyFrontlineDepth43({ Game, Enemy });
applyFrontlineUI43({ AppUI, Game });
applyVanguardIdentity44({ Game, PlayerMech, InputRouter, Enemy });
applyVanguardIdentityUI44(AppUI);

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
const syncRenderSurfaces=()=>{
  renderer.resize();
  mech3d?.resize?.();
};
addEventListener('mecha-viewport-change',syncRenderSurfaces);
mobileViewport42.apply();
document.documentElement.dataset.combatView = 'topdown';
document.documentElement.dataset.mechSilhouette = 'upper-body';
document.documentElement.dataset.uiStyle = 'low-saturation-glass';
document.documentElement.dataset.rogueDepth = 'transform-doctrines';
document.documentElement.dataset.campaignMode = 'continuous-12-stage';
document.documentElement.dataset.campaignDepth = 'missions-routes-horizontal-growth';
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
const smokeParams=new URLSearchParams(location.search),smokeMode=smokeParams.has('smoke');
if (smokeMode) {
  const screen=smokeParams.get('screen')||'base';
  if(screen==='campaign'){
    game.ui.showFieldReward42=(modules,reward,onChoose)=>onChoose(0);
    game.ui.showCampaignBranch42=(stage,branches,onChoose)=>onChoose(0);
    game.ui.showShop=(run,inventory,onBuy,onRepair,onLeave)=>onLeave();
    game.ui.showCampaignEvent42=(event,onChoose)=>onChoose(0);
    game.ui.showModuleReplacement43=(run,module,onReplace,onCancel)=>onCancel();
    game.ui.showResult=(report)=>{game.__smokeCampaignReport=report};
    game.startRun();
    for(let index=0;index<12&&game.run?.stageIndex===index;index+=1){
      if(game.run.mission43)game.run.mission43.complete=true;
      for(const target of game.facilities42||[])target.dead=true;
      for(const enemy of game.enemies)enemy.dead=true;
      game.room.waveIndex=game.room.waves.length-1;game.waveDelay=0;
      game.completeCombatRoom();
      if(index<11&&game.run.exitOpen){game.player.y=game.room.stage42.centerY-8;game.updateCombat(0)}
    }
    setTimeout(()=>{const complete=game.run?.visitedStages?.length===12&&game.state==='result'&&game.__smokeCampaignReport?.victory===true;document.documentElement.dataset.campaignFlow=complete?'pass':'fail'},1700);
  }
  if(screen==='combat'||screen==='boss')game.startRun();
  if(screen==='boss'){
    game.startCampaignStage42(11,false);game.waveDelay=0;game.spawnNextWave();
    game.ui.showComms42?.('守墓者·阿尔法','阶段转换通讯测试',30,'enemy');
    game.ui.showTacticalReceipt43?.('指挥链仍在线','PHASE 2 敌方精英增援抵达','danger');
  }
  if(screen==='settings')game.openSettings416('base');
  if(screen==='armory')game.openArmory43();
  if(screen==='reward'){game.startRun();game.resolveCampaignReward42(game.room.stage42)}
  if(screen==='shop'){game.startRun();game.run.credits=100;game.showShop()}
  if(screen==='event'){game.startRun();game.showEvent()}
  if(screen==='pause'){game.startRun();game.pause()}
  if(screen==='result'){game.startRun();game.finishRun(false)}
  if(screen==='branch'){game.startRun();game.startCampaignStage42(2,false);game.ui.showCampaignBranch42(game.room.stage42,game.room.stage42.branches,()=>{})}
  mobileViewport42.apply();
  if(game.state==='combat')game.ui.updateHud(game);
  renderFrame();
  document.documentElement.dataset.smokeReady = 'true';
  document.documentElement.dataset.smokeScreen=screen;
  const recordAudit=()=>{
    const audit=auditMobileViewport42();
    document.documentElement.dataset.pageFit=audit.pageFit?'pass':'fail';
    document.documentElement.dataset.criticalInside=audit.criticalInside?'pass':'fail';
    document.documentElement.dataset.panelContained=audit.panelContained?'pass':'fail';
    document.documentElement.dataset.panelControl=audit.panelHasReachableControl?'pass':'fail';
    document.documentElement.dataset.canvasSync=audit.canvasSync?'pass':'fail';
    document.documentElement.dataset.objectiveVisible=audit.objectiveVisible?'pass':'fail';
    document.documentElement.dataset.combatLayers=audit.combatLayersSeparated?'pass':'fail';
  };
  recordAudit();
  setTimeout(recordAudit,700);
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
  visualVersion:'4.3.2-stability-pass',
  mech3dStatus:()=>mech3dStatus,
  mech3dRenderer:()=>mech3d,
  refreshViewport:()=>mobileViewport42.apply(),
  auditViewport:auditMobileViewport42,
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
