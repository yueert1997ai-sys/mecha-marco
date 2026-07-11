import asyncio
import json
import os
import subprocess
from pathlib import Path

from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-artifacts-v416'
PORT=18752

async def run():
    OUT.mkdir(exist_ok=True)
    chrome=os.environ.get('CHROME_BIN','/usr/bin/google-chrome')
    server=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    results={'errors':[]}
    try:
        async with async_playwright() as p:
            browser=await p.chromium.launch(headless=True,executable_path=chrome,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
            context=await browser.new_context(viewport={'width':956,'height':440},device_scale_factor=3,is_mobile=True,has_touch=True,user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Version/19.0 Mobile/15E148 Safari/604.1')
            page=await context.new_page()
            page.on('pageerror',lambda exc:results['errors'].append(str(exc)))
            await page.goto(f'http://127.0.0.1:{PORT}/?qa=416',wait_until='networkidle')
            await page.wait_for_selector('#start-run')
            await page.wait_for_function("globalThis.__MECHA_MARCO__?.visualVersion === '4.1.6-control-transform-paints'")

            results['base']=await page.evaluate('''() => ({
              version:globalThis.__MECHA_MARCO__.visualVersion,
              paintButtons:document.querySelectorAll('[data-paint416]').length,
              settingsButton:Boolean(document.querySelector('#open-settings416')),
              width:document.querySelector('.panel').scrollWidth,
              clientWidth:document.querySelector('.panel').clientWidth,
            })''')
            await page.screenshot(path=OUT/'base-paints.png')

            await page.click('[data-paint416="night-ops"]')
            await page.wait_for_selector('[data-paint416="night-ops"].selected')
            results['paintSaved']=await page.evaluate("() => JSON.parse(localStorage.getItem('mecha-marco-profile-v4')).mechPaints.vanguard")

            await page.click('#open-settings416')
            await page.wait_for_selector('.settings-screen416')
            await page.click('[data-preset416="fast"]')
            results['settings']=await page.evaluate('''() => ({
              stored:JSON.parse(localStorage.getItem('mecha-marco-profile-v4')).settings,
              live:globalThis.__MECHA_MARCO__.game.input.tuning416,
              ranges:document.querySelectorAll('.setting-row416 input[type="range"]').length,
            })''')
            await page.screenshot(path=OUT/'settings-fast.png')
            await page.click('#settings-back416')
            await page.wait_for_selector('#start-run')

            await page.click('#start-run')
            await page.wait_for_function("globalThis.__MECHA_MARCO__.game.state === 'route'")
            results['run']=await page.evaluate('''() => {
              const game=globalThis.__MECHA_MARCO__.game;
              return {
                paint:game.player.mech.paintId,
                rewards:[1,5].map((depth)=>game.run.graph.nodes[depth]?.choices?.find((choice)=>choice.type==='combat')?.reward),
              };
            }''')

            await page.evaluate('''() => {
              const game=globalThis.__MECHA_MARCO__.game;
              game.startCombat({template:'open_crossfire',reward:'transform'});
              game.enemies.length=0;
            }''')
            await page.wait_for_function("document.documentElement.dataset.mech3d === 'ready'")
            await page.wait_for_timeout(500)
            results['paint3d']=await page.evaluate('''() => {
              const app=globalThis.__MECHA_MARCO__,game=app.game;
              const entry=app.mech3dRenderer().actors.get(game.player.id);
              return {paint:entry?.root?.userData?.paint416,palette:entry?.root?.userData?.paintPalette416};
            }''')
            await page.screenshot(path=OUT/'combat-night-ops.png')

            results['transforms']=await page.evaluate('''async() => {
              const game=globalThis.__MECHA_MARCO__.game;
              const {MODULE_BY_ID}=await import('./src/data/modules.js');
              const setModule=(id)=>{game.run.modules=[MODULE_BY_ID.get(id)];game.player.refreshBuild(game.run.modules,true)};

              setModule('core_lance_cycle_416');
              game.projectiles.length=0;
              for(let i=0;i<5;i+=1)game.player.firePrimary(game);
              const lance=game.projectiles.some((shot)=>shot.type==='rail-lance');

              setModule('core_phase_blink_416');
              game.player.resetForRoom({x:0,y:0});
              game.player.ability.request('dash');
              game.player.updateDash(.016,{move:{x:1,y:0}},game);
              const blink={x:game.player.x,dashTimer:game.player.dashTimer,vfx:game.vfx.some((item)=>item.type==='phaseBlink')};

              setModule('core_sentry_ordnance_416');
              game.protocolSentries416=[];game.missiles.length=0;
              game.player.ability.request('ordnance');
              game.player.updateOrdnance(game);
              const sentry={count:game.protocolSentries416.length,missiles:game.missiles.length};

              setModule('core_saber_tempest_416');
              game.projectiles.length=0;
              game.player.executeSlash(game,false);
              const tempest=game.projectiles.filter((shot)=>shot.type==='saber-tempest').length;
              return {lance,blink,sentry,tempest};
            }''')

            await page.evaluate('''async() => {
              const {TRANSFORM_MODULES_416}=await import('./src/data/transformModules416.js');
              globalThis.__MECHA_MARCO__.game.ui.showReward(TRANSFORM_MODULES_416.slice(0,3),'transform',()=>{});
            }''')
            await page.wait_for_selector('.transform-screen416')
            results['transformUI']=await page.evaluate('''() => ({
              cards:document.querySelectorAll('.module-card.transform').length,
              doctrines:[...document.querySelectorAll('.doctrine-badge416')].map((item)=>item.textContent),
              scrollWidth:document.querySelector('.panel').scrollWidth,
              clientWidth:document.querySelector('.panel').clientWidth,
            })''')
            await page.screenshot(path=OUT/'transform-reward.png')

            await page.set_viewport_size({'width':844,'height':390})
            await page.wait_for_timeout(250)
            results['compact']=await page.evaluate('''() => {
              const panel=document.querySelector('.panel');
              return {scrollWidth:panel.scrollWidth,clientWidth:panel.clientWidth,rect:panel.getBoundingClientRect().toJSON(),viewport:{w:innerWidth,h:innerHeight}};
            }''')
            await page.screenshot(path=OUT/'transform-compact-844x390.png')
            await browser.close()
    finally:
        server.terminate()
        try:server.wait(timeout=3)
        except subprocess.TimeoutExpired:server.kill()

    (OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    if results['errors']:
        raise RuntimeError('Browser errors: '+'; '.join(results['errors']))
    if results['base']['paintButtons']!=4 or not results['base']['settingsButton'] or results['base']['width']>results['base']['clientWidth']+2:
        raise RuntimeError(f"Base UI invalid: {results['base']}")
    if results['paintSaved']!='night-ops' or results['run']['paint']!='night-ops' or results['paint3d']['paint']!='night-ops':
        raise RuntimeError(f"Paint persistence failed: {results['paintSaved']}, {results['run']}, {results['paint3d']}")
    settings=results['settings']
    if settings['ranges']!=3 or abs(settings['stored']['aimSensitivity']-1.35)>.001 or abs(settings['live']['aimDeadZone']-.04)>.001:
        raise RuntimeError(f'Settings failed: {settings}')
    if results['run']['rewards']!=['transform','transform']:
        raise RuntimeError(f"Transform rewards missing: {results['run']}")
    transforms=results['transforms']
    if not transforms['lance'] or transforms['blink']['x']<2 or transforms['blink']['dashTimer']!=0 or not transforms['blink']['vfx'] or transforms['sentry']['count']!=1 or transforms['sentry']['missiles']!=0 or transforms['tempest']!=8:
        raise RuntimeError(f'Transforms failed: {transforms}')
    if results['transformUI']['cards']!=3 or results['transformUI']['scrollWidth']>results['transformUI']['clientWidth']+2:
        raise RuntimeError(f"Transform UI invalid: {results['transformUI']}")
    if results['compact']['scrollWidth']>results['compact']['clientWidth']+2:
        raise RuntimeError(f"Compact overflow: {results['compact']}")

if __name__=='__main__':
    asyncio.run(run())
