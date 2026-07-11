const CACHE='mecha-marco-v4-20260711-hades25d-r1';
const CORE=[
  './',
  './index.html',
  './styles.css',
  './iphone17.css',
  './mech3d41.css',
  './manifest.webmanifest',
  './src/main.js',
  './src/render/polishRenderer.js',
  './src/render/mechDesigns41.js',
  './src/render/mechMeshPrimitives41.js',
  './src/render/mechVisual41.js',
  './src/render/mech3d41.js',
  './src/render/mech3dTuning41.js',
  './src/render/mechLiteEnhance42.js',
  './src/render/hades25dCamera.js',
  './src/render/hades25dMechPose.js',
  './src/ui/mechPreview41.js',
  './src/combat/polishCombat.js',
  './src/combat/mobileFeel42.js',
];
self.addEventListener('install',(event)=>event.waitUntil(caches.open(CACHE).then((c)=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',(event)=>event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((k)=>k!==CACHE).map((k)=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',(event)=>{
  if(event.request.method!=='GET')return;
  event.respondWith(
    fetch(event.request)
      .then((response)=>{
        const copy=response.clone();
        caches.open(CACHE).then((c)=>c.put(event.request,copy));
        return response;
      })
      .catch(async()=>{
        const cached=await caches.match(event.request);
        if(cached)return cached;
        if(event.request.mode==='navigate')return caches.match('./index.html');
        return Response.error();
      })
  );
});
