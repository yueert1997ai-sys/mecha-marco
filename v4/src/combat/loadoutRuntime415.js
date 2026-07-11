import { buildLoadoutVisual } from '../meta/loadoutProfile.js';

export function applyLoadoutRuntime415(PlayerMech){
  if(PlayerMech.__loadoutRuntime415)return;
  PlayerMech.__loadoutRuntime415=true;

  Object.defineProperty(PlayerMech.prototype,'visualLoadout',{
    configurable:true,
    get(){
      const modules=this.modules||[];
      const key=modules.map((module)=>module.id).join('|');
      if(this.__loadoutVisualKey!==key){
        this.__loadoutVisualKey=key;
        this.__loadoutVisual=buildLoadoutVisual(modules);
      }
      return this.__loadoutVisual||buildLoadoutVisual(modules);
    },
  });

  const previous=PlayerMech.prototype.refreshBuild;
  PlayerMech.prototype.refreshBuild=function refreshBuild415(modules,preserveHpRatio=true){
    const before=(this.modules||[]).length;
    const result=previous.call(this,modules,preserveHpRatio);
    this.__loadoutVisualKey='';
    const after=(this.modules||[]).length;
    if(after>before&&typeof window!=='undefined'){
      const module=this.modules.at(-1);
      window.dispatchEvent(new CustomEvent('mecha-loadout-changed',{detail:{module,visual:this.visualLoadout}}));
    }
    return result;
  };
}
