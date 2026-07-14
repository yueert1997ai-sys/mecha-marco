import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../docs/qa-artifacts');
const names=['4.4A-og04-before-844x390.png','4.4A-og04-after-844x390.png','4.4A-og04-exit-closed-844x390.png','4.4A-og04-exit-open-844x390.png','4.4A-og04-spatial-obstacles-844x390.png',...['intact','active','heavy-damage','destroyed'].map((state)=>`4.4A-og04-facility-${state}-844x390.png`)];
const signature=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);

test('4.4A OG-04 evidence is encoded as real 844x390 PNG',()=>{
  for(const name of names){const bytes=fs.readFileSync(path.join(root,name));assert.deepEqual(bytes.subarray(0,8),signature,`${name} signature`);assert.equal(bytes.readUInt32BE(16),844,`${name} width`);assert.equal(bytes.readUInt32BE(20),390,`${name} height`)}
});
