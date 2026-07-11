import asyncio,json,os,subprocess
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-artifacts-v412';PORT=18747
async def touches(session,event_type,points):
    await session.send('Input.dispatchTouchEvent',{'type':event_type,'touchPoints':[{'x':p['x'],'y':p['y'],'id':p['id'],'radiusX':8,'radiusY':8,'force':.85} for p in points]})
async def enter(page,mech):
    await page.goto(f'http://127.0.0.1:{PORT}/?qa=412&mech={mech}',wait_until='networkidle')
    await page.click(f'[data-mech="{mech}"]');await page.click('#start-run');await page.wait_for_selector('.route-card')
    index=await page.evaluate('''() => {const g=globalThis.__MECHA_MARCO__.game;return Math.max(0,g.run.graph.nodes[g.run.depth].choices.findIndex(c=>c.type==='combat'));}''')
    await page.click(f'.route-card[data-index="{index}"]');await page.wait_for_function("document.documentElement.dataset.mech3d==='ready'");await page.wait_for_timeout(1000)
async def run():
    OUT.mkdir(exist_ok=True);chrome=os.environ.get('CHROME_BIN','/usr/bin/google-chrome')
    server=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    result={'base':{},'mechs':{},'interaction':{},'errors':[]}
    try:
      async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,executable_path=chrome,args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
        context=await browser.new_context(viewport={'width':956,'height':440},device_scale_factor=3,is_mobile=True,has_touch=True,user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Version/19.0 Mobile/15E148 Safari/604.1')
        page=await context.new_page();page.on('pageerror',lambda e:result['errors'].append(str(e)))
        await page.goto(f'http://127.0.0.1:{PORT}/?qa=412',wait_until='networkidle');await page.wait_for_selector('[data-mech="vanguard"]');await page.screenshot(path=OUT/'base-956x440.png')
        result['base']=await page.evaluate('''() => ({visual:__MECHA_MARCO__.visualVersion,combatView:__MECHA_MARCO__.snapshot().combatView,mech3d:document.documentElement.dataset.mech3d})''')
        for mech in ['vanguard','bulwark','starwing']:
          await enter(page,mech);await page.screenshot(path=OUT/f'combat-{mech}-idle-956x440.png')
          result['mechs'][mech]=await page.evaluate('''() => {const a=__MECHA_MARCO__,g=a.game,b=g.bounds,d=g.renderer.dpr||1,p=(x,y)=>{const s=g.renderer.worldToScreen(x,y);return{x:s.x/d,y:s.y/d}};const q={x:2.15,y:-1.35},s=p(q.x,q.y),r=g.renderer.screenToWorld(s.x,s.y);return{state:g.state,selected:g.selectedMech,visual:a.visualVersion,combatView:a.snapshot().combatView,mech3d:a.mech3dStatus(),playerScreen:p(g.player.x,g.player.y),camera:{...g.renderer.camera},arena:{tl:p(b.left,b.top),tr:p(b.right,b.top),br:p(b.right,b.bottom),bl:p(b.left,b.bottom)},roundTripError:Math.hypot(r.x-q.x,r.y-q.y)}}''')
        await enter(page,'vanguard');session=await context.new_cdp_session(page)
        rect=await page.evaluate('''() => ({move:document.querySelector('.move-stick').getBoundingClientRect().toJSON(),aim:document.querySelector('.aim-stick').getBoundingClientRect().toJSON()})''')
        before=await page.evaluate('''() => {const g=__MECHA_MARCO__.game;return{x:g.player.x,y:g.player.y,shots:g.projectiles.length,dash:g.player.dashCharges}}''')
        move={'id':1,'x':rect['move']['x']+rect['move']['width']*.70,'y':rect['move']['y']+rect['move']['height']*.28};aim={'id':2,'x':rect['aim']['x']+rect['aim']['width']*.84,'y':rect['aim']['y']+rect['aim']['height']*.50}
        await touches(session,'touchStart',[move,aim]);await page.wait_for_timeout(500);await page.click('.dash-btn',force=True);await page.wait_for_timeout(180)
        mid=await page.evaluate('''() => {const g=__MECHA_MARCO__.game,p=g.renderer.worldToScreen(g.player.x,g.player.y);return{x:g.player.x,y:g.player.y,shots:g.projectiles.length,dash:g.player.dashCharges,heldPrimary:g.input.held.primary,playerScreen:{x:p.x/g.renderer.dpr,y:p.y/g.renderer.dpr},camera:{...g.renderer.camera},pose:globalThis.__MECHA_HADES25D_POSE__}}''')
        await page.screenshot(path=OUT/'combat-vanguard-aim-right-dash.png');await touches(session,'touchEnd',[]);await page.wait_for_timeout(250)
        after=await page.evaluate('''() => {const g=__MECHA_MARCO__.game;return{heldPrimary:g.input.held.primary}}''');result['interaction']={'before':before,'mid':mid,'after':after};await browser.close()
    finally:
      server.terminate()
      try:server.wait(timeout=3)
      except subprocess.TimeoutExpired:server.kill()
    (OUT/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    if result['errors']:raise RuntimeError(';'.join(result['errors']))
    if result['base']!={'visual':'4.1.2-hades25d-view','combatView':'hades25d','mech3d':'ready'}:raise RuntimeError(str(result['base']))
    for mech,data in result['mechs'].items():
      if data['state']!='combat' or data['selected']!=mech or data['mech3d']!='ready':raise RuntimeError(str(data))
      a=data['arena']
      if abs(a['tr']['y']-a['tl']['y'])<20 or abs(a['bl']['x']-a['tl']['x'])<35:raise RuntimeError(f'flat arena {a}')
      if data['roundTripError']>.03 or abs(data['camera']['x'])>.5 or abs(data['camera']['y'])>.4:raise RuntimeError(str(data))
    b=result['interaction']['before'];m=result['interaction']['mid'];a=result['interaction']['after']
    if abs(m['x']-b['x'])+abs(m['y']-b['y'])<.25 or m['shots']<=b['shots'] or m['dash']>=b['dash'] or a['heldPrimary']:raise RuntimeError(str(result['interaction']))
    player_pose=next((x for x in (m.get('pose') or []) if x.get('id')==__import__('builtins').str(x.get('id'))),None)
    if not m.get('pose') or min(abs(x['forcedYaw']+3.141592653589793/2) for x in m['pose'])>.08:raise RuntimeError(f'upright yaw lock missing {m.get("pose")}')
if __name__=='__main__':asyncio.run(run())
