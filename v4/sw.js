const CACHE='mecha-marco-v4-20260712-continuous-graveyard-r1';
const CORE=[
  './','./index.html','./styles.css','./iphone17.css','./mech3d41.css','./visual415.css','./visual415-refine.css','./depth416.css','./campaign42.css','./manifest.webmanifest','./src/main.js',
  './src/meta/loadoutProfile.js','./src/meta/restoration42.js','./src/meta/profile.js','./src/data/paintVariants416.js','./src/data/transformModules416.js','./src/data/regionOrbitalGraveyard42.js','./src/run/doctrine416.js','./src/run/continuousCampaign42.js',
  './src/render/polishRenderer.js','./src/render/mechDesigns41.js','./src/render/mechMeshPrimitives41.js','./src/render/mechVisual41.js','./src/render/mech3d41.js','./src/render/mech3dTuning41.js','./src/render/mechLiteEnhance42.js','./src/render/loadoutVisual415.js','./src/render/paintVariants416.js','./src/render/arenaDetail415.js','./src/render/topdownCamera.js','./src/render/topdownMechPose.js','./src/render/continuousCampaign42.js',
  './src/ui/mechPreview41.js','./src/ui/uiPolish415.js','./src/ui/depthUI416.js','./src/ui/branding416.js','./src/ui/paintDock416.js','./src/ui/campaignUI42.js','./src/combat/polishCombat.js','./src/combat/mobileFeel42.js','./src/combat/loadoutRuntime415.js','./src/combat/rogueTransform416.js',
];
self.addEventListener('install',(event)=>event.waitUntil(caches.open(CACHE).then((cache)=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',(event)=>event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key!==CACHE).map((key)=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',(event)=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request).then((response)=>{const copy=response.clone();caches.open(CACHE).then((cache)=>cache.put(event.request,copy));return response}).catch(async()=>{const cached=await caches.match(event.request);if(cached)return cached;if(event.request.mode==='navigate')return caches.match('./index.html');return Response.error()}));
});
