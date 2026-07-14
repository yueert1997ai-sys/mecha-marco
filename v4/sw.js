const CACHE_PREFIX='mecha-marco-v4-';
const CACHE='mecha-marco-v4-20260713-stability-pass-r1';
const CORE=[
  './','./index.html','./icon.svg','./styles.css','./iphone17.css','./frontline-depth43.css','./mech3d41.css','./visual415.css','./visual415-refine.css','./depth416.css','./campaign42.css','./manifest.webmanifest','./src/main.js',
  './src/core/eventBus.js','./src/core/gameLoop.js','./src/core/math.js','./src/core/stateMachine.js',
  './src/actors/enemy.js','./src/actors/player.js','./src/audio/synthAudio.js','./src/input/inputRouter.js','./src/game.js',
  './src/meta/loadoutProfile.js','./src/meta/narrativeDirector.js','./src/meta/restoration42.js','./src/meta/profile.js','./src/meta/frontlineProgress43.js',
  './src/data/dialogue.js','./src/data/encounters.js','./src/data/mechs.js','./src/data/modules.js','./src/data/frontlineDepth43.js','./src/data/paintVariants416.js','./src/data/transformModules416.js','./src/data/regionOrbitalGraveyard42.js',
  './src/run/doctrine416.js','./src/run/rewardResolver.js','./src/run/roomGraph.js','./src/run/continuousCampaign42.js','./src/run/continuousCampaignPolish42.js','./src/run/frontlineDepth43.js',
  './src/render/renderer.js','./src/render/polishRenderer.js','./src/render/mechDesigns41.js','./src/render/mechMeshPrimitives41.js','./src/render/mechVisual41.js','./src/render/mech3d41.js','./src/render/mech3dTuning41.js','./src/render/mechLiteEnhance42.js','./src/render/loadoutVisual415.js','./src/render/paintVariants416.js','./src/render/arenaDetail415.js','./src/render/topdownCamera.js','./src/render/topdownMechPose.js','./src/render/continuousCampaign42.js','./src/render/frontlineDepth43.js','./src/render/og04IdentityVisual44.js',
  './src/ui/appUI.js','./src/ui/mechPreview41.js','./src/ui/uiPolish415.js','./src/ui/depthUI416.js','./src/ui/branding416.js','./src/ui/paintDock416.js','./src/ui/campaignUI42.js','./src/ui/campaignUIPolish42.js','./src/ui/frontlineDepth43.js','./src/ui/vanguardIdentity44.js','./src/ui/mobileViewport42.js',
  './src/combat/abilitySystem.js','./src/combat/hardpointRig.js','./src/combat/hitSystem.js','./src/combat/polishCombat.js','./src/combat/mobileFeel42.js','./src/combat/loadoutRuntime415.js','./src/combat/rogueTransform416.js','./src/combat/vanguardIdentity44.js',
];
self.addEventListener('install',(event)=>event.waitUntil(caches.open(CACHE).then((cache)=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',(event)=>event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map((key)=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',(event)=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request).then((response)=>{const copy=response.clone();caches.open(CACHE).then((cache)=>cache.put(event.request,copy));return response}).catch(async()=>{const cached=await caches.match(event.request);if(cached)return cached;if(event.request.mode==='navigate')return caches.match('./index.html');return Response.error()}));
});
