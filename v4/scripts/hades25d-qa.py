import asyncio
import json
import os
import subprocess
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'qa-artifacts-v412'
PORT = 18747

async def send_touches(session, event_type, points):
    await session.send('Input.dispatchTouchEvent', {
        'type': event_type,
        'touchPoints': [
            {'x': p['x'], 'y': p['y'], 'id': p['id'], 'radiusX': 8, 'radiusY': 8, 'force': .85}
            for p in points
        ],
    })

async def enter_combat(page, mech):
    await page.goto(f'http://127.0.0.1:{PORT}/?qa=412&mech={mech}', wait_until='networkidle')
    await page.wait_for_selector(f'[data-mech="{mech}"]')
    await page.click(f'[data-mech="{mech}"]')
    await page.click('#start-run')
    await page.wait_for_selector('.route-card')
    index = await page.evaluate('''() => {
      const game=globalThis.__MECHA_MARCO__.game;
      return Math.max(0,game.run.graph.nodes[game.run.depth].choices.findIndex((choice)=>choice.type==='combat'));
    }''')
    await page.click(f'.route-card[data-index="{index}"]')
    await page.wait_for_function("document.documentElement.dataset.mech3d === 'ready'")
    await page.wait_for_timeout(1000)

async def run():
    OUT.mkdir(exist_ok=True)
    chrome=os.environ.get('CHROME_BIN','/usr/bin/google-chrome')
    server=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    results={'base':{},'mechs':{},'interaction':{},'errors':[]}
    try:
        async with async_playwright() as playwright:
            browser=await playwright.chromium.launch(headless=True,executable_path=chrome,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
            context=await browser.new_context(viewport={'width':956,'height':440},device_scale_factor=3,is_mobile=True,has_touch=True,user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Version/19.0 Mobile/15E148 Safari/604.1')
            page=await context.new_page()
            page.on('pageerror',lambda exc:results['errors'].append(str(exc)))
            await page.goto(f'http://127.0.0.1:{PORT}/?qa=412',wait_until='networkidle')
            await page.wait_for_selector('[data-mech="vanguard"]')
            await page.screenshot(path=OUT/'base-956x440.png')
            results['base']=await page.evaluate('''() => ({visual:globalThis.__MECHA_MARCO__?.visualVersion,combatView:globalThis.__MECHA_MARCO__?.snapshot().combatView,mech3d:document.documentElement.dataset.mech3d,viewport:{w:innerWidth,h:innerHeight}})''')

            for mech in ['vanguard','bulwark','starwing']:
                await enter_combat(page,mech)
                await page.screenshot(path=OUT/f'combat-{mech}-idle-956x440.png')
                results['mechs'][mech]=await page.evaluate('''() => {
                  const app=globalThis.__MECHA_MARCO__,game=app.game,b=game.bounds,dpr=game.renderer.dpr||1;
                  const point=(x,y)=>{const p=game.renderer.worldToScreen(x,y);return{x:p.x/dpr,y:p.y/dpr};};
                  const sample={x:2.15,y:-1.35},screen=point(sample.x,sample.y),round=game.renderer.screenToWorld(screen.x,screen.y);
                  return {state:game.state,selected:game.selectedMech,visual:app.visualVersion,combatView:app.snapshot().combatView,mech3d:app.mech3dStatus(),playerScreen:point(game.player.x,game.player.y),camera:{...game.renderer.camera},arena:{tl:point(b.left,b.top),tr:point(b.right,b.top),br:point(b.right,b.bottom),bl:point(b.left,b.bottom)},roundTripError:Math.hypot(round.x-sample.x,round.y-sample.y),enemies:game.enemies.filter((enemy)=>!enemy.dead).length};
                }''')

            await enter_combat(page,'vanguard')
            session=await context.new_cdp_session(page)
            rects=await page.evaluate('''() => ({move:document.querySelector('.move-stick').getBoundingClientRect().toJSON(),aim:document.querySelector('.aim-stick').getBoundingClientRect().toJSON(),dash:document.querySelector('.dash-btn').getBoundingClientRect().toJSON()})''')
            before=await page.evaluate('''() => {const game=globalThis.__MECHA_MARCO__.game;return{x:game.player.x,y:game.player.y,shots:game.projectiles.length,dash:game.player.dashCharges};}''')
            move={'id':1,'x':rects['move']['x']+rects['move']['width']*.70,'y':rects['move']['y']+rects['move']['height']*.28}
            aim={'id':2,'x':rects['aim']['x']+rects['aim']['width']*.84,'y':rects['aim']['y']+rects['aim']['height']*.50}
            await send_touches(session,'touchStart',[move,aim])
            await page.wait_for_timeout(500)
            await page.click('.dash-btn',force=True)
            await page.wait_for_timeout(180)
            mid=await page.evaluate('''() => {const game=globalThis.__MECHA_MARCO__.game,p=game.renderer.worldToScreen(game.player.x,game.player.y);return{x:game.player.x,y:game.player.y,shots:game.projectiles.length,dash:game.player.dashCharges,heldPrimary:game.input.held.primary,inputMove:{...game.input.move},inputAim:{...game.input.aim},playerScreen:{x:p.x/game.renderer.dpr,y:p.y/game.renderer.dpr},camera:{...game.renderer.camera}};}''')
            await page.screenshot(path=OUT/'combat-vanguard-aim-right-dash.png')
            await send_touches(session,'touchEnd',[])
            await page.wait_for_timeout(250)
            after=await page.evaluate('''() => {const game=globalThis.__MECHA_MARCO__.game;return{x:game.player.x,y:game.player.y,shots:game.projectiles.length,dash:game.player.dashCharges,heldPrimary:game.input.held.primary};}''')
            results['interaction']={'before':before,'mid':mid,'after':after}
            await browser.close()
    finally:
        server.terminate()
        try: server.wait(timeout=3)
        except subprocess.TimeoutExpired: server.kill()

    (OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    if results['errors']: raise RuntimeError('Browser page errors: '+'; '.join(results['errors']))
    if results['base'].get('visual')!='4.1.2-hades25d-view' or results['base'].get('combatView')!='hades25d' or results['base'].get('mech3d')!='ready': raise RuntimeError(f'Wrong runtime: {results["base"]}')
    for mech,data in results['mechs'].items():
        if data.get('state')!='combat' or data.get('selected')!=mech or data.get('mech3d')!='ready': raise RuntimeError(f'Mech combat failed for {mech}: {data}')
        arena=data['arena']
        if abs(arena['tr']['y']-arena['tl']['y'])<20: raise RuntimeError(f'Arena top edge is still flat for {mech}: {arena}')
        if abs(arena['bl']['x']-arena['tl']['x'])<35: raise RuntimeError(f'Arena side edge is still vertical for {mech}: {arena}')
        if data['roundTripError']>.03: raise RuntimeError(f'Projection inverse mismatch for {mech}: {data["roundTripError"]}')
        if not 175<=data['playerScreen']['y']<=370: raise RuntimeError(f'Player composition failed for {mech}: {data["playerScreen"]}')
        if abs(data['camera']['x'])>.5 or abs(data['camera']['y'])>.4: raise RuntimeError(f'Camera drifted too far for {mech}: {data["camera"]}')
    before=results['interaction']['before'];mid=results['interaction']['mid'];after=results['interaction']['after']
    if abs(mid['x']-before['x'])+abs(mid['y']-before['y'])<.25: raise RuntimeError(f'Dual-stick movement did not respond: {results["interaction"]}')
    if mid['shots']<=before['shots']: raise RuntimeError(f'Right-stick fire did not respond: {results["interaction"]}')
    if mid['dash']>=before['dash']: raise RuntimeError(f'Dash did not consume a charge: {results["interaction"]}')
    if after['heldPrimary']: raise RuntimeError(f'Primary remained stuck after touch release: {results["interaction"]}')

if __name__=='__main__': asyncio.run(run())
