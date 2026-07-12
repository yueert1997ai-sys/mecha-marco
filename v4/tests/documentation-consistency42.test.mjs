import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const v4Root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repoRoot=path.resolve(v4Root,'..');
const readV4=(file)=>readFile(path.join(v4Root,file),'utf8');
const readRepo=(file)=>readFile(path.join(repoRoot,file),'utf8');

const VERSION='4.3.0-frontline-depth';

test('runtime and package version markers agree on 4.3',async()=>{
  const version=(await readV4('VERSION')).trim();
  const pkg=JSON.parse(await readV4('package.json'));
  const html=await readV4('index.html');
  const main=await readV4('src/main.js');
  const sw=await readV4('sw.js');

  assert.equal(version,VERSION);
  assert.equal(pkg.version,VERSION);
  assert.match(html,/天穹断刃 4\.3/);
  assert.match(main,new RegExp(VERSION.replaceAll('.','\\.')));
  assert.match(main,/dataset\.combatView = 'topdown'/);
  assert.match(main,/dataset\.mechSilhouette = 'upper-body'/);
  assert.match(main,/dataset\.campaignMode = 'continuous-12-stage'/);
  assert.match(main,/dataset\.narrativeArc = 'ma00-restoration'/);
  assert.match(sw,/frontline-depth-r\d+/);
});

test('current documentation describes top-down upper-body continuous campaign',async()=>{
  const readme=await readRepo('README.md');
  const design=await readRepo('docs/MECHA_MARCO_DESIGN_4.2.md');
  const architecture=await readRepo('docs/HADES_ARCHITECTURE_4.0.md');
  const qa=await readV4('docs/QA_REPORT_4.0.md');

  for(const text of[readme,design,architecture,qa]){
    assert.match(text,/4\.3\.0-frontline-depth/);
    assert.match(text,/纯俯视|Top-down/);
    assert.match(text,/上半身/);
    assert.match(text,/12 段|十二段/);
    assert.match(text,/MA-00/);
  }

  assert.match(readme,/不再使用斜俯视/);
  assert.match(readme,/不再是每关返回路线页面|取消“每打完一关就返回全屏路线页面”/);
  assert.match(design,/普通段落之间不返回路线页面/);
  assert.match(architecture,/固定斜俯视角/);
  assert.match(architecture,/历史表述（已过期）/);
  assert.match(architecture,/历史房间循环（部分过期）/);
  assert.match(qa,/当前未验证内容/);
  assert.match(qa,/实体 iPhone 17 Pro Max/);
});

test('historical architecture is retained but clearly demoted from current source of truth',async()=>{
  const architecture=await readRepo('docs/HADES_ARCHITECTURE_4.0.md');
  assert.match(architecture,/历史架构基线/);
  assert.match(architecture,/历史问题诊断（仍有效）/);
  assert.match(architecture,/从 Hades 学习的系统闭环（仍有效）/);
  assert.match(architecture,/4\.3 当前替代方案/);
  assert.match(architecture,/当前事实来源优先级/);
});
