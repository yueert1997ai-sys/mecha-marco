import asyncio,json,os,subprocess
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'qa-artifacts-v412-final';PORT=18748
async def touch(session,t,points):
    await session.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':[{'x':p['x'],'y':p['y'],'id':p['id'],'radiusX':8,'radiusY':8,'force':.85} for p in points]})
async def enter(page,mech):
    await page.goto(f'http://127.0.0.1:{PORT}/?qa=412f&mech={mech}',wait_until='networkidle')
    await page.click(f'[data-mech="{mech}"]');await page.click('#start-run');await page.wait_for_selector('.route-card')
    idx=await page.evaluate('''() => {const g=__MECHA_MARCO__.game;return Math.max(0,g.run.graph.nodes[g.run.depth].choices.findIndex(c=>c.type==='combat'));}''')
    await page.click(f'.route-card[data-index="{idx}"]');await page.wait_for_function("document.documentElement.dataset.mech3d==='ready'");await page.wait_for_timeout(900)
async def main():
    OUT.mkdir(exist_ok=True);server=subprocess.Popen(['python3','-m','http.server',str(PORT),'--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    result={'mechs':{},'interaction':{},'errors':[]}
    try:
      async with async_playwright() as p:
        browser=await p.chromium.launch(headless=True,executable_path=os.environ.get('CHROME_BIN','/usr/bin/google-chrome'),args=['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'])
        ctx=await browser.new_context(viewport={'width':956,'height':440},device_scale_factor=3,is_mobile=True,has_touch=True,user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Version/19.0 Mobile/15E148 Safari/604.1')
        page=await ctx.new_page();page.on('pageerror',lambda e:result['errors'].append(str(e)))
        for mech in ['vanguard','bulwark','starwing']:
          await enter(page,mech);await page.screenshot(path=OUT/f'{mech}-idle.png')
          result['mechs'][mech]=await page.evaluate('''() => {const a=__MECHA_MARCO__,g=a.game,b=g.bounds,d=g.renderer.dpr||1,p=(x,y)=>{const s=g.renderer.worldToScreen(x,y);return{x:s.x/d,y:s.y/d}};const q={x:1.7,y:-1.2},s=p(q.x,q.y),r=g.renderer.screenToWorld(s.x,s.y);return{visual:a.visualVersion,view:a.snapshot().combatView,mech3d:a.mech3dStatus(),arena:{tl:p(b.left,b.top),tr:p(b.right,b.top),bl:p(b.left,b.bottom)},roundTrip:Math.hypot(r.x-q.x,r.y-q.y),camera:{...g.renderer.camera}}}''')
        await enter(page,'vanguard');session=await ctx.new_cdp_session(page)
        rect=await page.evaluate('''() => ({m:document.querySelector('.move-stick').getBoundingClientRect().toJSON(),a:document.querySelector('.aim-stick').getBoundingClientRect().toJSON()})''')
        before=await page.evaluate('''() => {const g=__MECHA_MARCO__.game;return{x:g.player.x,y:g.player.y,shots:g.projectiles.length,dash:g.player.dashCharges}}''')
        pts=[{'id':1,'x':rect['m']['x']+rect['m']['width']*.70,'y':rect['m']['y']+rect['m']['height']*.28},{'id':2,'x':rect['a']['x']+rect['a']['width']*.84,'y':rect['a']['y']+rect['a']['height']*.50}]
        await touch(session,'touchStart',pts);await page.wait_for_timeout(500);await page.click('.dash-btn',force=True);await page.wait_for_timeout(180)
        mid=await page.evaluate('''() => {const g=__MECHA_MARCO__.game;return{x:g.player.x,y:g.player.y,shots:g.projectiles.length,dash:g.player.dashCharges,held:g.input.held.primary,pose:globalThis.__MECHA_HADES25D_POSE__,camera:{...g.renderer.camera}}}''')
        await page.screenshot(path=OUT/'vanguard-aim-right-dash.png');await touch(session,'touchEnd',[]);await page.wait_for_timeout(250)
        after=await page.evaluate('''() => ({held:__MECHA_MARCO__.game.input.held.primary})''');result['interaction']={'before':before,'mid':mid,'after':after};await browser.close()
    finally:
      server.terminate()
      try:server.wait(timeout=3)
      except subprocess.TimeoutExpired:server.kill()
    (OUT/'results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    if result['errors']:raise RuntimeError(';'.join(result['errors']))
    for mech,data in result['mechs'].items():
      if data['visual']!='4.1.2-hades25d-view' or data['view']!='hades25d' or data['mech3d']!='ready':raise RuntimeError(str(data))
      if abs(data['arena']['tr']['y']-data['arena']['tl']['y'])<20 or abs(data['arena']['bl']['x']-data['arena']['tl']['x'])<35:raise RuntimeError(f'flat arena {data}')
      if data['roundTrip']>.03 or abs(data['camera']['x'])>.5 or abs(data['camera']['y'])>.4:raise RuntimeError(str(data))
    b=result['interaction']['before'];m=result['interaction']['mid'];a=result['interaction']['after']
    if abs(m['x']-b['x'])+abs(m['y']-b['y'])<.25 or m['shots']<=b['shots'] or m['dash']>=b['dash'] or a['held']:raise RuntimeError(str(result['interaction']))
    if not m.get('pose') or min(abs(p['forcedYaw']+3.141592653589793/2) for p in m['pose'])>.08:raise RuntimeError(f'pose failed {m.get("pose")}')
if __name__=='__main__':asyncio.run(main())
