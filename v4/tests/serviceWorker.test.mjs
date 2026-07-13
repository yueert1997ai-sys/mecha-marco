import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=(file)=>readFile(path.join(root,file),'utf8');

const LOCAL_IMPORT_RE=/(?:\b(?:import|export)\s+(?:[^'"()]*?\s+from\s+)?|\bimport\s*\(\s*)['"](\.[^'"]+)['"]/g;

async function collectLocalImports(entry){
  const pending=[entry];
  const visited=new Set();
  while(pending.length){
    const current=pending.pop();
    if(visited.has(current))continue;
    visited.add(current);
    const source=await read(current);
    for(const match of source.matchAll(LOCAL_IMPORT_RE)){
      const resolved=path.posix.normalize(path.posix.join(path.posix.dirname(current),match[1]));
      if(!resolved.startsWith('src/'))throw new Error(`Local import escaped src/: ${current} -> ${match[1]}`);
      pending.push(resolved);
    }
  }
  return visited;
}

function loadServiceWorker(source,{cacheKeys=[]}={}){
  const handlers={};
  const deleted=[];
  let claimed=0;
  const context={
    self:{
      addEventListener:(type,handler)=>{handlers[type]=handler},
      skipWaiting:()=>Promise.resolve(),
      clients:{claim:()=>{claimed+=1;return Promise.resolve()}},
    },
    caches:{
      keys:()=>Promise.resolve(cacheKeys),
      delete:(key)=>{deleted.push(key);return Promise.resolve(true)},
      open:()=>Promise.resolve({addAll:()=>Promise.resolve(),put:()=>Promise.resolve()}),
      match:()=>Promise.resolve(undefined),
    },
    fetch:()=>Promise.reject(new Error('offline')),
    Response:{error:()=>({error:true})},
    Promise,
  };
  vm.runInNewContext(`${source}\n;globalThis.__swTest={CACHE,CORE};`,context);
  return {handlers,deleted,get claimed(){return claimed},...context.__swTest};
}

test('service worker precaches the complete local main.js import closure',async()=>{
  const source=await read('sw.js');
  const {CORE}=loadServiceWorker(source);
  const imported=await collectLocalImports('src/main.js');
  const precached=new Set(CORE);
  const missing=[...imported]
    .map((file)=>`./${file}`)
    .filter((file)=>!precached.has(file))
    .sort();

  assert.deepEqual(missing,[],`Offline cache is missing main.js dependencies:\n${missing.join('\n')}`);
});

test('activate deletes only stale caches in the mecha-marco-v4 namespace',async()=>{
  const source=await read('sw.js');
  const probe=loadServiceWorker(source);
  const current=probe.CACHE;
  const cacheKeys=[
    current,
    'mecha-marco-v4-20260701-old',
    'mecha-marco-v4-manual-test',
    'mecha-marco-v3-legacy',
    'another-app-shell-v8',
  ];
  const runtime=loadServiceWorker(source,{cacheKeys});
  let activation;
  runtime.handlers.activate({waitUntil:(promise)=>{activation=promise}});
  await activation;

  assert.deepEqual(runtime.deleted.sort(),[
    'mecha-marco-v4-20260701-old',
    'mecha-marco-v4-manual-test',
  ]);
  assert.equal(runtime.claimed,1);
});
