import asyncio
import json
import os
import subprocess
from pathlib import Path

from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa-artifacts-v413'
PORT=18748

async def send_touches(session,event_type,points):
    await session.send('Input.dispatchTouchEvent',{
        'type':event_type,
        'touchPoints':[{'x':p['x'],'y':p['y'],'id':p['id'],'radiusX':8,'radiusY':8,'force':.8} for p in points],
    })

async def enter_combat(page,mech):
    await page.goto(f'http://127.0.0.1:{PORT}/?qa=413&mech={mech}',wait_until='networkidle')
    await page.wait_for_selector(f'[data-mech="{mech}"]')
    await page.click(f'[data-mech="{mech}"]')
    await page.click('#start-run')
    await page.wait_for_selector('.route-card')
    index=await page.evaluate('''() => {
      const game=globalThis.__MECHA_MARCO__.game;
      return Math.max(0,game.run.graph.nodes[game.run.depth].choices.findIndex((choice)=>choice.type==='combat'));
    }''')
    await page.click(f'.route-card[data-index="{index}"]')
    await page.wait_for_function("document.documentElement.dataset.mech3d === 'ready'")
    await page.wait_for_timeout(900)

async def run():
    OUT.mkdir(exist_ok=True)
    chrome=os.environ.get('CHROME_BIN','/usr/bin/google-chrome')
    server=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    results={'mechs':{},'interaction':{},'errors':[]}
    try:
      async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,executable_path=chrome,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
        context=await browser.new_context(viewport={'width':956,'height':440},device_scale_factor=3,is_mobile=True,has_touch=True,user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Version/19.0 Mobile/15E148 Safari/604.1')
        page=await context.new_page()
        page.on('pageerror',lambda exc:results['errors'].append(str(exc)))
        for mech in ['vanguard','bulwark','starwing']:
          await enter_combat(page,mech)
          await page.screenshot(path=OUT/f'{mech}-idle.png')
          results['mechs'][mech]=await page.evaluate('''() => {
            const app=globalThis.__MECHA_MARCO__;
            const g=app.game;
            const p0=g.renderer.worldToScreen(0,0);
            const px=g.renderer.worldToScreen(1,0);
            const py=g.renderer.worldToScreen(0,1);
            const sample={x:2.25,y:-1.75};
            const screen=g.renderer.worldToScreen(sample.x,sample.y);
            const round=g.renderer.screenToWorld(screen.x/g.renderer.dpr,screen.y/g.renderer.dpr);
            return {
              view:document.documentElement.dataset.combatView,
              visual:app.visualVersion,
              state:g.state,
              selected:g.selectedMech,
              axis:{dxY:px.y-p0.y,dyX:py.x-p0.x},
              roundTrip:{x:round.x-sample.x,y:round.y-sample.y},
              camera:{...g.renderer.camera},
            };
          }''')

        await enter_combat(page,'vanguard')
        session=await context.new_cdp_session(page)
        rects=await page.evaluate('''() => ({
          move:document.querySelector('.move-stick').getBoundingClientRect().toJSON(),
          aim:document.querySelector('.aim-stick').getBoundingClientRect().toJSON(),
          dash:document.querySelector('.dash-btn').getBoundingClientRect().toJSON(),
        })''')
        before=await page.evaluate('''() => {const g=globalThis.__MECHA_MARCO__.game;return{x:g.player.x,y:g.player.y,aim:g.player.aim,shots:g.projectiles.length,dash:g.player.dashCharges};}''')
        move={'id':1,'x':rects['move']['x']+rects['move']['width']*.72,'y':rects['move']['y']+rects['move']['height']*.26}
        aim={'id':2,'x':rects['aim']['x']+rects['aim']['width']*.82,'y':rects['aim']['y']+rects['aim']['height']*.5}
        await send_touches(session,'touchStart',[move,aim])
        await page.wait_for_timeout(420)
        await page.click('.dash-btn',force=True)
        await page.wait_for_timeout(160)
        mid=await page.evaluate('''() => {const g=globalThis.__MECHA_MARCO__.game;return{x:g.player.x,y:g.player.y,aim:g.player.aim,shots:g.projectiles.length,dash:g.player.dashCharges,held:g.input.held.primary};}''')
        await page.screenshot(path=OUT/'vanguard-aim-right-dash.png')
        await send_touches(session,'touchEnd',[])
        await page.wait_for_timeout(220)
        after=await page.evaluate('''() => {const g=globalThis.__MECHA_MARCO__.game;return{held:g.input.held.primary};}''')
        results['interaction']={'before':before,'mid':mid,'after':after}
        await browser.close()
    finally:
      server.terminate()
      try:server.wait(timeout=3)
      except subprocess.TimeoutExpired:server.kill()

    (OUT/'results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
    if results['errors']:raise RuntimeError('Browser errors: '+'; '.join(results['errors']))
    for mech,data in results['mechs'].items():
      if data['view']!='topdown' or data['visual']!='4.1.3-topdown-view' or data['state']!='combat' or data['selected']!=mech:
        raise RuntimeError(f'Wrong runtime for {mech}: {data}')
      if abs(data['axis']['dxY'])>.01 or abs(data['axis']['dyX'])>.01:
        raise RuntimeError(f'Projection is not axis-aligned: {data}')
      if abs(data['roundTrip']['x'])>.01 or abs(data['roundTrip']['y'])>.01:
        raise RuntimeError(f'Projection round-trip failed: {data}')
    before=results['interaction']['before'];mid=results['interaction']['mid'];after=results['interaction']['after']
    if abs(mid['x']-before['x'])+abs(mid['y']-before['y'])<.25:raise RuntimeError('Movement did not respond')
    if mid['shots']<=before['shots']:raise RuntimeError('Right-stick fire did not respond')
    if mid['dash']>=before['dash']:raise RuntimeError('Dash did not consume a charge')
    if after['held']:raise RuntimeError('Primary remained held after touch release')

if __name__=='__main__':
    asyncio.run(run())
