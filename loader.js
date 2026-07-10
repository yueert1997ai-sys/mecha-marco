(async()=>{
  const parts=['chunks/game.part01.txt','chunks/game.part02.txt','chunks/game.part03.txt','chunks/game.part04.txt','chunks/game.part05.txt','chunks/game.part06.txt','chunks/game.part07.txt','chunks/game.part08.txt'];
  try{
    const code=(await Promise.all(parts.map(async p=>{const r=await fetch(p,{cache:"no-store"});if(!r.ok)throw new Error(`加载失败: ${p} (${r.status})`);return r.text();}))).join("");
    (0,eval)(code);
  }catch(err){
    console.error(err);
    const box=document.createElement("pre");
    box.style.cssText="position:fixed;inset:12px;z-index:99999;padding:12px;overflow:auto;background:#3b0710;color:#ffdce3;border:1px solid #ff5269;white-space:pre-wrap";
    box.textContent="游戏脚本加载失败\n"+(err.stack||err);
    document.body.appendChild(box);
  }
})();
