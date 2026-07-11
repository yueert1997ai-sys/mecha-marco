const SVG={
  vanguard:`<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="v41a" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5f7fa"/><stop offset="1" stop-color="#6b7787"/></linearGradient></defs><g fill="url(#v41a)" stroke="#8cefff" stroke-width="2"><path d="M45 8 55 8 61 19 54 27 46 27 39 19Z"/><path d="M34 26 50 20 66 26 75 48 64 61 36 61 25 48Z"/><path d="M18 32 33 27 38 43 26 53 13 48Z"/><path d="M82 32 67 27 62 43 74 53 87 48Z"/><path d="M40 59 49 62 45 91 29 94 32 72Z"/><path d="M60 59 51 62 55 91 71 94 68 72Z"/></g><path d="M50 27 58 43 50 52 42 43Z" fill="#cf3e53"/><path d="M68 40 94 29 96 36 72 52Z" fill="#202a36" stroke="#b9f8ff" stroke-width="2"/></svg>`,
  bulwark:`<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="v41b" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#e2e5df"/><stop offset="1" stop-color="#6c737d"/></linearGradient></defs><g fill="url(#v41b)" stroke="#e1c47a" stroke-width="2"><path d="M41 9 59 9 66 20 58 29 42 29 34 20Z"/><path d="M24 25 50 20 76 25 84 56 68 67 32 67 16 56Z"/><path d="M7 28 28 23 34 49 21 62 4 56Z"/><path d="M93 28 72 23 66 49 79 62 96 56Z"/><path d="M31 64 48 65 45 94 21 96 22 75Z"/><path d="M69 64 52 65 55 94 79 96 78 75Z"/></g><path d="M41 35 59 35 63 51 50 59 37 51Z" fill="#d66434"/><path d="M63 35 98 28 99 40 67 54Z" fill="#252a31" stroke="#ffd78a" stroke-width="3"/></svg>`,
  starwing:`<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="v41c" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5fbff"/><stop offset="1" stop-color="#758396"/></linearGradient></defs><g fill="url(#v41c)" stroke="#9ff6ff" stroke-width="2"><path d="M44 8 56 8 62 18 55 27 45 27 38 18Z"/><path d="M36 27 50 21 64 27 70 50 59 60 41 60 30 50Z"/><path d="M24 31 37 27 39 45 29 54 18 49Z"/><path d="M76 31 63 27 61 45 71 54 82 49Z"/><path d="M42 58 49 61 44 92 30 94 34 70Z"/><path d="M58 58 51 61 56 92 70 94 66 70Z"/></g><path d="M29 33 3 11 21 47Z" fill="#7e5bd6" stroke="#bdffff" stroke-width="2"/><path d="M71 33 97 11 79 47Z" fill="#7e5bd6" stroke="#bdffff" stroke-width="2"/><path d="M50 29 57 43 50 51 43 43Z" fill="#a36ae9"/></svg>`,
};

export function applyMechPreview41(AppUI){
  if(AppUI.__mechPreview41Applied)return;
  AppUI.__mechPreview41Applied=true;
  const original=AppUI.prototype.showBase;
  AppUI.prototype.showBase=function(...args){
    original.apply(this,args);
    const eyebrow=this.panel.querySelector('.brand-block .eyebrow');
    if(eyebrow)eyebrow.textContent='MECHA MARCO · V4.1 FULL MECH REDESIGN';
    this.panel.querySelectorAll('[data-mech]').forEach((card)=>{
      const id=card.dataset.mech,box=card.querySelector('.mech-emblem');
      if(!box)return;
      box.className='mech-preview41';
      box.removeAttribute('style');
      box.style.cssText='width:68px;height:68px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(145deg,rgba(25,39,59,.96),rgba(5,11,23,.98));border:1px solid rgba(139,235,255,.34);box-shadow:inset 0 0 22px rgba(87,211,255,.08),0 0 20px rgba(54,179,255,.08);overflow:hidden';
      box.innerHTML=SVG[id]||SVG.vanguard;
      const svg=box.querySelector('svg');if(svg)svg.style.cssText='width:92%;height:92%;filter:drop-shadow(0 0 5px rgba(117,235,255,.35))';
    });
  };
}
