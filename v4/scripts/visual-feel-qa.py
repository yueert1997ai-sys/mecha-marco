import asyncio
import json
import os
import subprocess
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'qa-artifacts-v411'
PORT = 18746

async def send_touches(session, event_type, points):
    await session.send('Input.dispatchTouchEvent', {
        'type': event_type,
        'touchPoints': [
            {
                'x': p['x'], 'y': p['y'], 'id': p['id'],
                'radiusX': 8, 'radiusY': 8, 'force': .8,
            }
            for p in points
        ],
    })

async def enter_combat(page, mech):
    await page.goto(f'http://127.0.0.1:{PORT}/?qa=411&mech={mech}', wait_until='networkidle')
    await page.wait_for_selector(f'[data-mech="{mech}"]')
    await page.click(f'[data-mech="{mech}"]')
    await page.click('#start-run')
    await page.wait_for_selector('.route-card')
    index = await page.evaluate('''() => {
      const game = globalThis.__MECHA_MARCO__.game;
      return Math.max(0, game.run.graph.nodes[game.run.depth].choices.findIndex((choice) => choice.type === 'combat'));
    }''')
    await page.click(f'.route-card[data-index="{index}"]')
    await page.wait_for_function("document.documentElement.dataset.mech3d === 'ready'")
    await page.wait_for_timeout(900)

async def run():
    OUT.mkdir(exist_ok=True)
    chrome = os.environ.get('CHROME_BIN', '/usr/bin/google-chrome')
    server = subprocess.Popen(
        ['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    results = {'base': {}, 'mechs': {}, 'interaction': {}, 'errors': []}
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                executable_path=chrome,
                args=['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'],
            )
            context = await browser.new_context(
                viewport={'width': 956, 'height': 440},
                device_scale_factor=3,
                is_mobile=True,
                has_touch=True,
                user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 Version/19.0 Mobile/15E148 Safari/604.1',
            )
            page = await context.new_page()
            page.on('pageerror', lambda exc: results['errors'].append(str(exc)))
            await page.goto(f'http://127.0.0.1:{PORT}/?qa=411', wait_until='networkidle')
            await page.wait_for_selector('[data-mech="vanguard"]')
            await page.screenshot(path=OUT / 'base-956x440.png')
            results['base'] = await page.evaluate('''() => ({
              visual: globalThis.__MECHA_MARCO__?.visualVersion,
              mech3d: document.documentElement.dataset.mech3d,
              renderMode: document.documentElement.dataset.mechRender,
              viewport: {w: innerWidth, h: innerHeight},
              cards: [...document.querySelectorAll('[data-mech]')].map((node) => node.getBoundingClientRect().toJSON()),
              cta: document.querySelector('#start-run')?.getBoundingClientRect().toJSON(),
            })''')

            for mech in ['vanguard', 'bulwark', 'starwing']:
                await enter_combat(page, mech)
                await page.screenshot(path=OUT / f'combat-{mech}-idle-956x440.png')
                results['mechs'][mech] = await page.evaluate('''() => {
                  const app = globalThis.__MECHA_MARCO__;
                  const game = app.game;
                  const screen = game.renderer.worldToScreen(game.player.x, game.player.y);
                  return {
                    state: game.state,
                    selected: game.selectedMech,
                    visual: app.visualVersion,
                    mech3d: app.mech3dStatus(),
                    renderMode: document.documentElement.dataset.mechRender,
                    playerScreen: {x: screen.x / game.renderer.dpr, y: screen.y / game.renderer.dpr},
                    camera: {...game.renderer.camera},
                    enemies: game.enemies.filter((e) => !e.dead).length,
                  };
                }''')

            await enter_combat(page, 'vanguard')
            session = await context.new_cdp_session(page)
            rects = await page.evaluate('''() => ({
              move: document.querySelector('.move-stick').getBoundingClientRect().toJSON(),
              aim: document.querySelector('.aim-stick').getBoundingClientRect().toJSON(),
              dash: document.querySelector('.dash-btn').getBoundingClientRect().toJSON(),
            })''')
            before = await page.evaluate('''() => {
              const g=globalThis.__MECHA_MARCO__.game;
              return {x:g.player.x,y:g.player.y,shots:g.projectiles.length,dash:g.player.dashCharges};
            }''')
            move = {'id': 1, 'x': rects['move']['x'] + rects['move']['width'] * .76, 'y': rects['move']['y'] + rects['move']['height'] * .22}
            aim = {'id': 2, 'x': rects['aim']['x'] + rects['aim']['width'] * .72, 'y': rects['aim']['y'] + rects['aim']['height'] * .18}
            await send_touches(session, 'touchStart', [move, aim])
            await page.wait_for_timeout(420)
            await page.click('.dash-btn', force=True)
            await page.wait_for_timeout(160)
            mid = await page.evaluate('''() => {
              const g=globalThis.__MECHA_MARCO__.game;
              const screen=g.renderer.worldToScreen(g.player.x,g.player.y);
              return {
                x:g.player.x,y:g.player.y,shots:g.projectiles.length,dash:g.player.dashCharges,
                heldPrimary:g.input.held.primary,inputMove:{...g.input.move},inputAim:{...g.input.aim},
                playerScreen:{x:screen.x/g.renderer.dpr,y:screen.y/g.renderer.dpr},camera:{...g.renderer.camera},
              };
            }''')
            await page.screenshot(path=OUT / 'combat-vanguard-dual-stick-dash.png')
            await send_touches(session, 'touchEnd', [])
            await page.wait_for_timeout(240)
            after = await page.evaluate('''() => {
              const g=globalThis.__MECHA_MARCO__.game;
              return {x:g.player.x,y:g.player.y,shots:g.projectiles.length,dash:g.player.dashCharges,heldPrimary:g.input.held.primary};
            }''')
            frame = await page.evaluate('''() => new Promise((resolve) => {
              const samples=[];let last=performance.now();
              const step=(now)=>{samples.push(now-last);last=now;if(samples.length<90)requestAnimationFrame(step);else resolve({avg:samples.reduce((a,b)=>a+b,0)/samples.length,max:Math.max(...samples)});};
              requestAnimationFrame(step);
            })''')
            results['interaction'] = {'before': before, 'mid': mid, 'after': after, 'frame': frame}

            await page.set_viewport_size({'width': 844, 'height': 390})
            await page.goto(f'http://127.0.0.1:{PORT}/?qa=411&compact=1', wait_until='networkidle')
            await page.wait_for_selector('.mech-grid')
            await page.screenshot(path=OUT / 'base-844x390.png')
            results['compact'] = await page.evaluate('''() => ({
              scroll:{x:scrollX,y:scrollY},
              panelScroll:document.querySelector('#panel')?.scrollTop,
              cards:[...document.querySelectorAll('[data-mech]')].map((node)=>node.getBoundingClientRect().toJSON()),
              cta:document.querySelector('#start-run')?.getBoundingClientRect().toJSON(),
            })''')
            await browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=3)
        except subprocess.TimeoutExpired:
            server.kill()

    (OUT / 'results.json').write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')
    if results['errors']:
        raise RuntimeError('Browser page errors: ' + '; '.join(results['errors']))
    if results['base'].get('visual') != '4.1.1-controls-camera-polish' or results['base'].get('mech3d') != 'ready' or results['base'].get('renderMode') != 'webgl':
        raise RuntimeError(f'Wrong runtime: {results["base"]}')
    for mech, data in results['mechs'].items():
        if data.get('state') != 'combat' or data.get('selected') != mech or data.get('mech3d') != 'ready' or data.get('renderMode') != 'webgl':
            raise RuntimeError(f'Mech combat failed for {mech}: {data}')
        if not 190 <= data['playerScreen']['y'] <= 350:
            raise RuntimeError(f'Camera composition failed for {mech}: {data["playerScreen"]}')
    before = results['interaction']['before']
    mid = results['interaction']['mid']
    after = results['interaction']['after']
    if abs(mid['x']-before['x']) + abs(mid['y']-before['y']) < .25:
        raise RuntimeError(f'Dual-stick movement did not respond: {results["interaction"]}')
    if max(mid['shots'],after['shots']) <= before['shots']:
        raise RuntimeError(f'Right-stick fire did not respond: {results["interaction"]}')
    if mid['dash'] >= before['dash']:
        raise RuntimeError(f'Dash did not consume a charge: {results["interaction"]}')
    if after['heldPrimary']:
        raise RuntimeError(f'Primary remained stuck after touch release: {results["interaction"]}')

if __name__ == '__main__':
    asyncio.run(run())
