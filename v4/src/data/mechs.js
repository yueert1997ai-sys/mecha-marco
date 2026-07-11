export const MECHS = {
  vanguard: {
    id: 'vanguard',
    name: '断刃·先锋型',
    title: '近远切换 / 高速取消',
    description: '稳定光束步枪与宽幅军刀。推进冷却短，适合主动贴近后快速拉开。',
    oldCode:'MA-VG-01',
    publicArchive:'长期战争时期开发的多用途王牌机。兼顾光束射击、军刀格斗和快速推进，曾是前线士兵眼中的胜利象征。',
    sealedArchive:'初代驾驶记录被列为最高级封存档案。大量现役教材仍沿用该机动作，但原驾驶员姓名已被删除。',
    trueArchive:'文浩马作为战争英雄时使用的机体，代表他仍相信纪律、荣誉和有限战争的时期。',
    palette: { primary: '#f4f7ff', secondary: '#2e7bff', accent: '#ff425f', trim: '#ffd35a', glow: '#7cf5ff', dark: '#17243d' },
    stats: { maxHp:120, moveSpeed:6.8, turnSpeed:12, primaryDamage:18, primaryRate:.18, projectileSpeed:18, secondaryDamage:44, dashSpeed:17, dashDuration:.17, dashCooldown:.75, ordnanceDamage:32, ordnanceCooldown:5.2, overdriveNeed:100 },
    tags: ['beam', 'saber', 'agile'],
  },
  bulwark: {
    id: 'bulwark',
    name: '断岳·重装型',
    title: '爆裂重炮 / 护盾反击',
    description: '火力和装甲最高。推进距离较短，但冲撞期间具备减伤和高硬直。',
    oldCode:'MA-BW-02',
    publicArchive:'针对大型军事基地和重装目标设计的突破机体。装甲与火力远超普通王牌机。',
    sealedArchive:'主炮标定参数不符合机甲决斗需求，其目标列表包括城市防护穹顶与轨道升降设施。',
    trueArchive:'文浩马从王牌转向统治者时使用的攻城机。它的任务是让整个区域失去继续抵抗的能力。',
    palette: { primary: '#eef1e9', secondary: '#58647a', accent: '#ff8a35', trim: '#ffd168', glow: '#ffb55e', dark: '#202632' },
    stats: { maxHp:175, moveSpeed:5.2, turnSpeed:9, primaryDamage:34, primaryRate:.42, projectileSpeed:14, secondaryDamage:62, dashSpeed:13, dashDuration:.2, dashCooldown:1.05, ordnanceDamage:52, ordnanceCooldown:6.2, overdriveNeed:100 },
    tags: ['cannon', 'saber', 'armor'],
  },
  starwing: {
    id: 'starwing',
    name: '星翼·高机动型',
    title: '双联光束 / 浮游刃',
    description: '速度最快，可储存两段推进。浮游刃适合多目标压制和标记联动。',
    oldCode:'MA-SW-03',
    publicArchive:'以高速推进和多目标浮游武器为核心的后期实验机，能够独立压制大量敌方单位。',
    sealedArchive:'浮游刃索敌档案中的部分目标分类已被删除。残留字段显示，它可在目标失去武装后继续追踪。',
    trueArchive:'文浩马统治后期的执行机。不需要普通军队协助，可以快速清理整片区域的抵抗者。',
    palette: { primary: '#f7fbff', secondary: '#7c54ff', accent: '#ff4fc8', trim: '#72f2ff', glow: '#b6f9ff', dark: '#211a48' },
    stats: { maxHp:100, moveSpeed:7.7, turnSpeed:14, primaryDamage:12, primaryRate:.11, projectileSpeed:21, secondaryDamage:35, dashSpeed:19, dashDuration:.15, dashCooldown:.6, dashCharges:2, ordnanceDamage:25, ordnanceCooldown:4.4, overdriveNeed:100 },
    tags: ['beam', 'drone', 'agile'],
  },
};

export const DEFAULT_MECH_ID = 'vanguard';
export const getMech = (id) => MECHS[id] || MECHS[DEFAULT_MECH_ID];
