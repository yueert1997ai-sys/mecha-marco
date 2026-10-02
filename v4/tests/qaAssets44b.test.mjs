import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const assetRoot=path.join(root,'assets','scenes','og04');

test('OG-04 temporary layers are real WebP assets and not the supplied reference image',()=>{
  for(const name of['background.webp','far.webp','mid.webp','foreground.webp','atmosphere.webp']){
    const bytes=fs.readFileSync(path.join(assetRoot,name));
    assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF',`${name} RIFF signature`);
    assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP',`${name} WebP signature`);
    assert.ok(bytes.length>20_000,`${name} contains a production-sized layer`);
  }
  assert.equal(fs.existsSync(path.join(assetRoot,'codex-clipboard-9b9168ac-0b6b-4b9d-a769-817b73cc0e93.png')),false);
});

test('4.4B scene evidence is encoded as real PNG at both required viewports',()=>{
  const artifactRoot=path.join(root,'docs','qa-artifacts');
  const names=[
    '4.4B-og04-before-844x390.png','4.4B-og04-after-844x390.png','4.4B-og04-exit-closed-844x390.png','4.4B-og04-exit-open-844x390.png',
    ...['intact','active','heavy-damage','destroyed'].map((state)=>`4.4B-og04-facility-${state}-844x390.png`),
    '4.4B-og04-missing-far-fallback-844x390.png','4.4B-og04-low-tier-canvas-844x390.png',
  ];
  const signature=Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);
  for(const name of names){const bytes=fs.readFileSync(path.join(artifactRoot,name));assert.deepEqual(bytes.subarray(0,8),signature,`${name} signature`);assert.equal(bytes.readUInt32BE(16),844,`${name} width`);assert.equal(bytes.readUInt32BE(20),390,`${name} height`);assert.ok(bytes.length>100_000,`${name} contains rendered scene evidence`)}
  const wide=fs.readFileSync(path.join(artifactRoot,'4.4B-og04-after-956x440.png'));assert.deepEqual(wide.subarray(0,8),signature);assert.equal(wide.readUInt32BE(16),956);assert.equal(wide.readUInt32BE(20),440);assert.ok(wide.length>100_000);
});
