import asyncio
import json
import os
import subprocess
from pathlib import Path

from playwright.async_api import async_playwright

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'qa-artifacts'
PORT = 18745

async def run():
    OUT.mkdir(exist_ok=True)
    chrome = os.environ.get('CHROME_BIN', '/usr/bin/google-chrome')
    server = subprocess.Popen(
        ['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    results = {'base': {}, 'combat': {}, 'errors': []}
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch(
                headless=True,
                executable_path=chrome,
                args=['--no-sandbox', '--disable-dev-shm-usage'],
            )
            context = await browser.new_context(
                viewport={'width': 956, 'height': 440},
                device_scale_factor=3,
                is_mobile=True,
                has_touch=True,
                user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1',
            )
            page = await context.new_page()
            page.on('pageerror', lambda exc: results['errors'].append(str(exc)))
            base_url = f'http://127.0.0.1:{PORT}/?v=410'

            await page.goto(base_url, wait_until='networkidle')
            await page.wait_for_selector('[data-mech="vanguard"]')
            await page.screenshot(path=OUT / 'base-956x440.png')
            results['base'] = await page.evaluate('''() => ({
              title: document.title,
              eyebrow: document.querySelector('.brand-block .eyebrow')?.textContent,
              visual: globalThis.__MECHA_MARCO__?.visualVersion,
              viewport: {w: innerWidth, h: innerHeight},
              panel: document.querySelector('#panel')?.getBoundingClientRect().toJSON(),
              cards: [...document.querySelectorAll('[data-mech]')].map((node) => ({
                id: node.dataset.mech,
                preview: Boolean(node.querySelector('.mech-preview41')),
                rect: node.getBoundingClientRect().toJSON(),
              })),
            })''')

            for mech in ['vanguard', 'bulwark', 'starwing']:
                await page.goto(base_url + '&mech=' + mech, wait_until='networkidle')
                await page.wait_for_selector(f'[data-mech="{mech}"]')
                await page.click(f'[data-mech="{mech}"]')
                await page.click('#start-run')
                await page.wait_for_selector('.route-card')
                index = await page.evaluate('''() => {
                  const game = globalThis.__MECHA_MARCO__?.game;
                  return Math.max(0, game.run.graph.nodes[game.run.depth].choices.findIndex((choice) => choice.type === 'combat'));
                }''')
                await page.click(f'.route-card[data-index="{index}"]')
                await page.wait_for_timeout(1400)
                await page.screenshot(path=OUT / f'combat-{mech}-956x440.png')
                results['combat'][mech] = await page.evaluate('''() => ({
                  state: globalThis.__MECHA_MARCO__?.game?.state,
                  selected: globalThis.__MECHA_MARCO__?.game?.selectedMech,
                  enemies: globalThis.__MECHA_MARCO__?.game?.enemies?.length,
                  visual: globalThis.__MECHA_MARCO__?.visualVersion,
                  canvas: {
                    width: document.querySelector('canvas')?.width,
                    height: document.querySelector('canvas')?.height,
                  },
                  controls: [...document.querySelectorAll('.stick,.action-btn,.pause-btn')].map((node) => ({
                    className: node.className,
                    rect: node.getBoundingClientRect().toJSON(),
                  })),
                })''')

            await page.set_viewport_size({'width': 844, 'height': 390})
            await page.goto(base_url + '&compact=1', wait_until='networkidle')
            await page.wait_for_selector('.mech-grid')
            await page.screenshot(path=OUT / 'base-844x390.png')
            results['compact'] = await page.evaluate('''() => ({
              panel: document.querySelector('#panel')?.getBoundingClientRect().toJSON(),
              pageScroll: {x: scrollX, y: scrollY},
              panelScroll: document.querySelector('#panel')?.scrollTop,
              cards: [...document.querySelectorAll('[data-mech]')].map((node) => node.getBoundingClientRect().toJSON()),
              cta: document.querySelector('#start-run')?.getBoundingClientRect().toJSON(),
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
    for mech, value in results['combat'].items():
        if value.get('state') != 'combat' or value.get('selected') != mech:
            raise RuntimeError(f'Combat verification failed for {mech}: {value}')

if __name__ == '__main__':
    asyncio.run(run())
