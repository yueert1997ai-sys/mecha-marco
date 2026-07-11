import asyncio
import json
import os
from pathlib import Path
from playwright.async_api import async_playwright

BASE_URL=os.environ.get('QA_URL','http://127.0.0.1:4173/v4/?qa=v42')
OUT=Path(os.environ.get('QA_OUT','/tmp/v42qa'))
OUT.mkdir(parents=True,exist_ok=True)
CHROME=os.environ.get('CHROME_PATH')

async def snapshot(page):
    return await page.evaluate("window.__MECHA_MARCO__?.snapshot?.()")

async def wait_stage(page,index):
    await page.wait_for_function("i => window.__MECHA_MARCO__?.game?.run?.stageIndex === i && window.__MECHA_MARCO__.game.state === 'combat'",arg=index,timeout=12000)

async def force_clear(page):
    await page.evaluate("""
    () => {
      const g=window.__MECHA_MARCO__.game;
      for(const enemy of g.enemies){enemy.hp=0;enemy.dead=true;}
      g.room.waveIndex=g.room.waves.length-1;
      g.waveDelay=0;
      g.room.clear=true;
      g.roomClearTimer=.01;
    }
    """)
    await page.wait_for_function("() => { const g=window.__MECHA_MARCO__.game; return g.run.exitOpen || ['reward','route','shop','event','result','ending'].includes(g.state); }",timeout=10000)

async def resolve_interruption(page,stage_index):
    state=await page.evaluate("window.__MECHA_MARCO__.game.state")
    if state=='reward':
        await page.locator('[data-field-reward42]').first.click()
    elif state=='route':
        branch=1 if stage_index==8 else 0
        await page.locator(f'[data-branch42="{branch}"]').click()
    elif state=='shop':
        await page.locator('#shop-leave').click()
    elif state=='event':
        await page.locator('[data-event42="0"]').click()
    await page.wait_for_function("() => window.__MECHA_MARCO__.game.run.exitOpen === true",timeout=10000)

async def transition(page,current):
    before=await snapshot(page)
    await page.evaluate("""
    () => {
      const g=window.__MECHA_MARCO__.game;
      g.player.y=g.room.stage42.centerY-8.25;
      g.player.vy=-2;
    }
    """)
    await wait_stage(page,current+1)
    after=await snapshot(page)
    return before,after

async def main():
    errors=[]
    network_errors=[]
    metrics={'visited':[],'transitions':[]}
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=CHROME,args=['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage'])
        context=await browser.new_context(
            viewport={'width':956,'height':440},
            device_scale_factor=3,
            is_mobile=True,
            has_touch=True,
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 26_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Mobile/15E148 Safari/604.1',
        )
        page=await context.new_page()
        page.on('pageerror',lambda error: errors.append(f'pageerror:{error}'))
        page.on('console',lambda msg: errors.append(f'console:{msg.text}') if msg.type=='error' and 'Failed to load resource' not in msg.text else None)
        page.on('response',lambda response: network_errors.append(f'{response.status}:{response.url}') if response.status>=400 and not response.url.endswith(('favicon.ico','apple-touch-icon.png','apple-touch-icon-precomposed.png')) else None)
        await page.goto(BASE_URL,wait_until='networkidle',timeout=30000)
        await page.wait_for_function("() => window.__MECHA_MARCO__ && window.__MECHA_MARCO__.mech3dStatus() === 'ready'",timeout=20000)
        await page.screenshot(path=str(OUT/'00-base.png'))
        base_text=await page.locator('#panel').inner_text()
        assert '12 段连续推进' in base_text
        assert 'WENHAO' not in base_text

        await page.evaluate("window.__MECHA_MARCO__.game.startRun()")
        await wait_stage(page,0)
        first=await snapshot(page)
        assert first['campaignMode']=='continuous-12-stage'
        assert first['stageName']=='封锁航道'
        assert await page.locator('[data-stage42]').count()==12
        assert not await page.locator('#overlay').evaluate("el => el.classList.contains('show')")
        await page.wait_for_timeout(700)
        await page.screenshot(path=str(OUT/'01-stage01.png'))

        for stage in range(12):
            await wait_stage(page,stage)
            current=await snapshot(page)
            metrics['visited'].append({'index':stage,'name':current['stageName'],'y':current['player']['y']})
            if stage==11:
                await page.screenshot(path=str(OUT/'08-boss.png'))
                await page.evaluate("window.__MECHA_MARCO__.game.bus.emit('bossPhase',{phase:2})")
                await page.wait_for_timeout(250)
                comms=await page.locator('#campaign-comms42').inner_text()
                assert '这个动作' in comms
                await force_clear(page)
                await page.wait_for_function("() => window.__MECHA_MARCO__.game.state === 'result'",timeout=10000)
                break

            await force_clear(page)
            if stage==0:
                await page.screenshot(path=str(OUT/'02-stage01-reward.png'))
            if stage==2:
                await page.screenshot(path=str(OUT/'04-dock-branch.png'))
            if stage==4:
                await page.screenshot(path=str(OUT/'05-shop.png'))
            if stage==8:
                await page.set_viewport_size({'width':844,'height':390})
                await page.wait_for_timeout(150)
                await page.screenshot(path=str(OUT/'07-tomb-branch-844x390.png'))
                compact=await page.evaluate("() => ({w:innerWidth,scroll:document.documentElement.scrollWidth,panel:document.querySelector('#panel')?.getBoundingClientRect().bottom})")
                assert compact['scroll']<=compact['w']+1
                assert compact['panel']<=390+2
                await page.set_viewport_size({'width':956,'height':440})
            await resolve_interruption(page,stage)
            if stage==0:
                await page.screenshot(path=str(OUT/'03-stage01-exit.png'))
            before,after=await transition(page,stage)
            metrics['transitions'].append({'from':stage,'to':stage+1,'beforeY':before['player']['y'],'afterY':after['player']['y']})
            assert after['stage']==stage+1
            assert after['player']['y']<before['player']['y']
            if stage==0:
                await page.screenshot(path=str(OUT/'03b-stage02.png'))

        await page.wait_for_timeout(250)
        await page.screenshot(path=str(OUT/'09-result.png'))
        report=await page.locator('#panel').inner_text()
        assert 'WENHAO MA' in report
        assert 'MA-00' in report
        assert '人格匹配率' in report
        assert not await page.locator('#toast').evaluate("el => el.classList.contains('show')")
        run=await page.evaluate("window.__MECHA_MARCO__.game.run")
        assert run['routeFlags']['dock']=='arsenal'
        assert run['routeFlags']['tomb']=='archive'
        assert run['surrenderAccepted']==1
        assert run['roomsCleared']==12
        metrics['final']={'roomsCleared':run['roomsCleared'],'routes':run['routeFlags'],'recognition':run['recognitionCount'],'archives':run['archiveFragments']}
        metrics['errors']=errors
        metrics['networkErrors']=network_errors
        (OUT/'metrics.json').write_text(json.dumps(metrics,ensure_ascii=False,indent=2),encoding='utf-8')
        if errors or network_errors:
            raise AssertionError('\n'.join(errors+network_errors))
        await browser.close()

if __name__=='__main__':
    asyncio.run(main())
