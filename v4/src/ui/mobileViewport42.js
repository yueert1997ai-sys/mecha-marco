const UPDATE_DELAYS = [0, 80, 240, 600];

const viewportBox = () => {
  const viewport = globalThis.visualViewport;
  return {
    width: Math.round(viewport?.width || globalThis.innerWidth || 1),
    height: Math.round(viewport?.height || globalThis.innerHeight || 1),
    offsetLeft: Math.round(viewport?.offsetLeft || 0),
    offsetTop: Math.round(viewport?.offsetTop || 0),
  };
};

export function installMobileViewport42() {
  let last = '';
  let timers = [];
  const apply = (reason = 'resize') => {
    const box = viewportBox();
    const signature = `${box.width}x${box.height}@${box.offsetLeft},${box.offsetTop}`;
    const root = document.documentElement;
    root.style.setProperty('--app-width', `${box.width}px`);
    root.style.setProperty('--app-height', `${box.height}px`);
    root.style.setProperty('--visual-offset-left', `${box.offsetLeft}px`);
    root.style.setProperty('--visual-offset-top', `${box.offsetTop}px`);
    root.dataset.viewport = signature;
    if (signature === last && reason !== 'force') return;
    last = signature;
    dispatchEvent(new CustomEvent('mecha-viewport-change', { detail:{ ...box, reason } }));
  };
  const schedule = (reason) => {
    timers.forEach(clearTimeout);
    timers = UPDATE_DELAYS.map((delay) => setTimeout(() => requestAnimationFrame(() => apply(reason)), delay));
  };
  addEventListener('resize', () => schedule('window-resize'), { passive:true });
  addEventListener('orientationchange', () => schedule('orientation'), { passive:true });
  addEventListener('pageshow', () => schedule('pageshow'), { passive:true });
  addEventListener('focus', () => schedule('focus'), { passive:true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) schedule('resume');
  });
  globalThis.visualViewport?.addEventListener('resize', () => schedule('visual-resize'), { passive:true });
  globalThis.visualViewport?.addEventListener('scroll', () => schedule('visual-scroll'), { passive:true });
  document.addEventListener('touchmove', (event) => {
    if (event.target === document.documentElement || event.target === document.body) event.preventDefault();
  }, { passive:false });
  schedule('install');
  return { apply:() => apply('force'), schedule };
}

export function auditMobileViewport42(){
  const viewport=viewportBox(),root=document.documentElement,tolerance=2;
  const visible=(element)=>element&&element.getClientRects().length>0&&getComputedStyle(element).visibility!=='hidden';
  const critical=[...document.querySelectorAll('#start-run,#open-settings416,#settings-back416,#armory-back43,#return-base,#resume,#retire')].filter(visible);
  const criticalInside=critical.every((element)=>{const r=element.getBoundingClientRect();return r.left>=-tolerance&&r.top>=-tolerance&&r.right<=viewport.width+tolerance&&r.bottom<=viewport.height+tolerance});
  const panel=document.getElementById('panel'),panelRect=panel?.getBoundingClientRect();
  const panelContained=!visible(panel)||panelRect.left>=-tolerance&&panelRect.top>=-tolerance&&panelRect.right<=viewport.width+tolerance&&panelRect.bottom<=viewport.height+tolerance;
  const panelButtons=visible(panel)?[...panel.querySelectorAll('button')].filter((button)=>!button.disabled):[];
  const panelHasReachableControl=!panelButtons.length||panelButtons.some((button)=>{const r=button.getBoundingClientRect();return r.right>panelRect.left&&r.left<panelRect.right&&r.bottom>panelRect.top&&r.top<panelRect.bottom});
  const canvases=[...document.querySelectorAll('canvas')].filter(visible);
  const canvasSync=canvases.every((canvas)=>{const r=canvas.getBoundingClientRect(),scaleX=canvas.width/Math.max(1,r.width),scaleY=canvas.height/Math.max(1,r.height);return Math.abs(r.width-viewport.width)<=tolerance&&Math.abs(r.height-viewport.height)<=tolerance&&canvas.width>0&&canvas.height>0&&Math.abs(scaleX-scaleY)<=.05});
  const objective=document.getElementById('campaign-objective42');
  const hud=document.getElementById('hud'),objectiveVisible=!objective||hud?.classList.contains('hidden')||hud?.classList.contains('boss-active')||visible(objective);
  const layers=['#campaign-progress42.show','#boss-bar:not(.hidden)','.campaign-comms42.show','.tactical-receipt43.show','.vanguard-identity44.show'].map((selector)=>document.querySelector(selector)).filter(visible).map((element)=>element.getBoundingClientRect());
  const combatLayersSeparated=layers.every((a,index)=>layers.slice(index+1).every((b)=>a.right<=b.left+tolerance||b.right<=a.left+tolerance||a.bottom<=b.top+tolerance||b.bottom<=a.top+tolerance));
  return{
    pageFit:root.scrollHeight<=viewport.height+tolerance&&root.scrollWidth<=viewport.width+tolerance,
    criticalInside,panelContained,panelHasReachableControl,canvasSync,objectiveVisible,combatLayersSeparated,viewport,
    document:{width:root.scrollWidth,height:root.scrollHeight},
  };
}
