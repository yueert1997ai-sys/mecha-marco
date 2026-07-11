import { DEFAULT_MECH_PAINTS_416, getPaintVariant416 } from '../data/paintVariants416.js';

export function applyPaintDock416(AppUI){
  if(AppUI.__paintDock416)return;
  AppUI.__paintDock416=true;
  const showShop=AppUI.prototype.showShop;
  AppUI.prototype.showShop=function showPaintedShop416(...args){
    showShop.apply(this,args);
    const game=globalThis.__MECHA_MARCO__?.game;
    const mechId=game?.selectedMech||'vanguard';
    const paintId=game?.profile?.mechPaints?.[mechId]||DEFAULT_MECH_PAINTS_416[mechId];
    const paint=getPaintVariant416(mechId,paintId);
    const dock=this.panel.querySelector('.dock-mech');
    if(!dock)return;
    dock.dataset.paint416=paint.id;
    dock.style.setProperty('--paint-primary',paint.palette.primary);
    dock.style.setProperty('--paint-secondary',paint.palette.secondary);
    dock.style.setProperty('--paint-accent',paint.palette.accent);
    dock.style.setProperty('--paint-trim',paint.palette.trim);
    dock.style.setProperty('--paint-glow',paint.palette.glow);
    dock.style.setProperty('--paint-dark',paint.palette.dark);
    const label=this.panel.querySelector('.dock-preview>small');
    if(label)label.textContent=`LIVE LOADOUT · ${paint.name}`;
  };
}
