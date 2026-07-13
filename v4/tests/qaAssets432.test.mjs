import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const artifactDir = path.resolve(here, '../docs/qa-artifacts');
const assets = [
  '4.3.2-base-844x390.png',
  '4.3.2-settings-844x390.png',
  '4.3.2-combat-844x390.png',
  '4.3.2-shop-844x390.png',
  '4.3.2-result-844x390.png',
  '4.3.2-boss-844x390.png',
];
const pngSignature = Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]);

test('4.3.2 QA screenshots are real 844x390 PNG files', () => {
  for (const name of assets) {
    const bytes = fs.readFileSync(path.join(artifactDir, name));
    assert.deepEqual(bytes.subarray(0, 8), pngSignature, `${name} must use PNG encoding`);
    assert.equal(bytes.subarray(12, 16).toString('ascii'), 'IHDR', `${name} must contain a PNG IHDR chunk`);
    assert.equal(bytes.readUInt32BE(16), 844, `${name} width`);
    assert.equal(bytes.readUInt32BE(20), 390, `${name} height`);
  }
});
