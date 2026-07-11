import asyncio
import json
import os
import subprocess
from pathlib import Path

from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-artifacts-v415'
PORT=18749

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
            await page.goto(f'http://127.0.0.1:{PORT}/?qa=415',wait_until='networkidle')
            await page.wait_for_selector('#start-run')
            await page.click('#start-run')
            await page.evaluate('''() => {
              const game=globalThis.__MECHA_MARCO__.game;
              game.startCombat({template:'skirmish_open',reward:'weapon'});
            }''')
            await page.wait_for_function("document.documentElement.dataset.mech3d === 'ready'")
            await page.wait_for_timeout(700)
            results['baseline']=await page.evaluate('''() => ({visual:globalThis.__MECHA_MARCO__.visualVersion,state:globalThis.__MECHA_MARCO__.game.state,uiStyle:document.documentElement.dataset.uiStyle,view:document.documentElement.dataset.combatView})''')
            results['fullLoadout']=await page.evaluate('''async() => {
              const app=globalThis.__MECHA_MARCO__,game=app.game;
              const {MODULE_BY_ID}=await import('./src/data/modules.js');
              const ids=['primary_split_1','secondary_wave_1','dash_charge_1','ordnance_cluster_1','ordnance_drone_1','defense_hp_1','overdrive_nova_1','duo_drone_beam'];
              game.run.modules=ids.map((id)=>MODULE_BY_ID.get(id)).filter(Boolean);
              game.player.refreshBuild(game.run.modules,true);
              return {ids:game.run.modules.map((module)=>module.id),visual:game.player.visualLoadout};
            }''')
            await page.wait_for_timeout(600)
            results['rig']=await page.evaluate('''() => {
              const app=globalThis.__MECHA_MARCO__,game=app.game,entry=app.mech3dRenderer().actors.get(game.player.id),state=entry?.root?.userData?.loadout415;
              return {exists:Boolean(state),visible:Boolean(state?.rig?.visible),shoulder:Boolean(state?.shoulder?.visible),pods:Boolean(state?.pods?.visible),fins:Boolean(state?.fins?.visible),emitters:Boolean(state?.emitters?.visible),saber:Boolean(state?.saber?.visible),shield:Boolean(state?.shield?.visible),core:Boolean(state?.core?.visible),drones:Boolean(state?.drones?.visible),duo:Boolean(state?.duo?.visible),key:state?.lastKey||''};
            }''')
            await page.screenshot(path=OUT/'combat-full-loadout.png')
            await page.evaluate('''() => {const game=globalThis.__MECHA_MARCO__.game;game.run.credits=200;game.showShop();}''')
            await page.wait_for_selector('.loadout-dock')
            await page.wait_for_timeout(250)
            results['shopBefore']=await page.evaluate('''() => {const panel=document.querySelector('.panel'),dock=document.querySelector('.loadout-dock'),cards=[...document.querySelectorAll('.shop-item')];return{dock:Boolean(dock),cards:cards.length,scrollWidth:panel.scrollWidth,clientWidth:panel.clientWidth,scrollHeight:panel.scrollHeight,clientHeight:panel.clientHeight,viewport:{w:innerWidth,h:innerHeight},dockRect:dock?.getBoundingClientRect().toJSON()};}''')
            await page.screenshot(path=OUT/'shop-full-loadout.png')
            await page.click('.shop-item:not([disabled])')
            await page.wait_for_timeout(350)
            results['shopAfter']=await page.evaluate('''() => {const game=globalThis.__MECHA_MARCO__.game;return{modules:game.run.modules.length,visual:game.player.visualLoadout,dockText:document.querySelector('.loadout-dock')?.innerText||'',toast:document.querySelector('#toast')?.textContent||''};}''')
            await page.screenshot(path=OUT/'shop-after-purchase.png')
            await page.set_viewport_size({'width':844,'height':390})
            await page.wait_for_timeout(250)
            results['compact']=await page.evaluate('''() => {const panel=document.querySelector('.panel'),dock=document.querySelector('.loadout-dock'),actions=document.querySelector('.shop-actions');return{panel:{x:panel.getBoundingClientRect().x,y:panel.getBoundingClientRect().y,w:panel.getBoundingClientRect().width,h:panel.getBoundingClientRect().height,scrollW:panel.scrollWidth,clientW:panel.clientWidth},dock:dock?.getBoundingClientRect().toJSON(),actions:actions?.getBoundingClientRect().toJSON(),viewport:{w:innerWidth,h:innerHeight}};}''')
            await page.screenshot(path=OUT/'shop-compact-844x390.png')
            await browser.close()
    finally:
        server.terminate()
        try:server.wait(timeout=3)
        except subprocess.TimeoutExpired:server.kill()
    (OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    if results['errors']:raise RuntimeError('Browser errors: '+'; '.join(results['errors']))
    if results['baseline']['visual']!='4.1.5-visual-loadout-pass' or results['baseline']['uiStyle']!='low-saturation-glass':raise RuntimeError(f"Wrong runtime: {results['baseline']}")
    visual=results['fullLoadout']['visual']
    if visual['moduleCount']<7 or visual['beamTier']<1 or visual['ordnanceTier']<2 or visual['droneBits']<1:raise RuntimeError(f'Loadout profile incomplete: {visual}')
    rig=results['rig'];required=['exists','visible','shoulder','pods','fins','emitters','saber','shield','core','drones','duo']
    if any(not rig[key] for key in required):raise RuntimeError(f'Visual rig missing active layers: {rig}')
    before=results['shopBefore']
    if not before['dock'] or before['cards']<1 or before['scrollWidth']>before['clientWidth']+2:raise RuntimeError(f'Shop layout invalid: {before}')
    after=results['shopAfter']
    if after['modules']<=visual['moduleCount'] or '战斗模型同步升级' not in after['toast']:raise RuntimeError(f'Shop purchase did not update loadout: {after}')
    compact=results['compact']
    if compact['panel']['scrollW']>compact['panel']['clientW']+2:raise RuntimeError(f'Compact shop overflow: {compact}')

if __name__=='__main__':asyncio.run(run())
