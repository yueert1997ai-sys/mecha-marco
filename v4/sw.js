const CACHE='mecha-marco-v4-20260711-full-redesign';
const CORE=[
  './',
  './index.html',
  './styles.css',
  './iphone17.css',
  './src/main.js',
  './src/render/polishRenderer.js',
  './src/render/mechDesigns41.js',
  './src/render/mechMeshPrimitives41.js',
  './src/render/mechVisual41.js',
  './src/ui/mechPreview41.js',
  './src/combat/polishCombat.js',
];
self.addEventListener('install',(event)=>event.waitUntil(caches.open(CACHE).then((c)=>c.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',(event)=>event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((k)=>k!==CACHE).map((k)=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',(event)=>{
  if(event.request.method!=='GET')return;
  event.respondWith(fetch(event.request).then((response)=>{const copy=response.clone();caches.open(CACHE).then((c)=>c.put(event.request,copy));return response;}).catch(()=>caches.match(event.request).then((r)=>r||caches.match('./index.html'))));
});
