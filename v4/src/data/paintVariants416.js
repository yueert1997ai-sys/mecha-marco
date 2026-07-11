export const MECH_PAINTS_416 = {
  vanguard: [
    { id:'skyline', name:'天穹白蓝', palette:{ primary:'#eef4f7', secondary:'#466f9f', accent:'#c84b5d', trim:'#d4b86d', glow:'#87d9ec', dark:'#17202b' } },
    { id:'night-ops', name:'夜航石墨', palette:{ primary:'#8e9ba7', secondary:'#263544', accent:'#6ea8b7', trim:'#a9bbc3', glow:'#76d6e8', dark:'#0d141d' } },
    { id:'crimson-ace', name:'赤锋王牌', palette:{ primary:'#d7d8d6', secondary:'#7e343e', accent:'#d75a4f', trim:'#d1ab69', glow:'#f2a48f', dark:'#211318' } },
    { id:'desert-guard', name:'荒原护航', palette:{ primary:'#d8d0bd', secondary:'#7b6a52', accent:'#b95e3d', trim:'#cbb482', glow:'#e7c48d', dark:'#211d18' } },
  ],
  bulwark: [
    { id:'foundry', name:'铸岳工业', palette:{ primary:'#d4d8d1', secondary:'#6d747b', accent:'#c56a3d', trim:'#c5ac72', glow:'#dda56f', dark:'#1a2026' } },
    { id:'naval', name:'深海舰队', palette:{ primary:'#b9c3ca', secondary:'#2f465d', accent:'#b08b52', trim:'#d5c18d', glow:'#8dbed1', dark:'#111a24' } },
    { id:'polar', name:'极地重装', palette:{ primary:'#eef0ec', secondary:'#89949d', accent:'#d57e45', trim:'#c8d1d4', glow:'#bddbe6', dark:'#20262b' } },
    { id:'hazard', name:'警戒黑黄', palette:{ primary:'#686d70', secondary:'#202326', accent:'#c99a35', trim:'#e0bf62', glow:'#f0c76c', dark:'#090b0d' } },
  ],
  starwing: [
    { id:'aurora', name:'极光星翼', palette:{ primary:'#edf2f6', secondary:'#75649a', accent:'#b75f9f', trim:'#8ec8d3', glow:'#b8e7ee', dark:'#171725' } },
    { id:'midnight', name:'午夜棱镜', palette:{ primary:'#707887', secondary:'#28293f', accent:'#5aa3b6', trim:'#7ed7e3', glow:'#89ecf2', dark:'#0c0d18' } },
    { id:'rose', name:'蔷薇轨迹', palette:{ primary:'#e4dce3', secondary:'#9a637e', accent:'#ce6c9d', trim:'#d7b7c9', glow:'#f1b7d8', dark:'#241621' } },
    { id:'cobalt', name:'钴蓝流星', palette:{ primary:'#cfd8df', secondary:'#385b82', accent:'#6c79bd', trim:'#8dbad0', glow:'#9fdff0', dark:'#10192a' } },
  ],
};

export const DEFAULT_MECH_PAINTS_416 = {
  vanguard:'skyline',
  bulwark:'foundry',
  starwing:'aurora',
};

export function getPaintVariants416(mechId){
  return MECH_PAINTS_416[mechId] || MECH_PAINTS_416.vanguard;
}

export function getPaintVariant416(mechId, paintId){
  const variants=getPaintVariants416(mechId);
  return variants.find((paint)=>paint.id===paintId) || variants[0];
}
