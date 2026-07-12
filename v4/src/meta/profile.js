const PROFILE_KEY = 'mecha-marco-profile-v4';

export const DEFAULT_PROFILE = {
  version: 6,
  runs: 0,
  victories: 0,
  permanent: 0,
  selectedMech: 'vanguard',
  unlockedMechs: ['vanguard','bulwark','starwing'],
  mechPaints: { vanguard:'skyline', bulwark:'foundry', starwing:'aurora' },
  seenDialogue: {},
  dialogueCooldowns: {},
  history: [],
  restorationScore: 0,
  commandAuthority: 0,
  bossKills: {},
  mechUsage: { vanguard:0, bulwark:0, starwing:0 },
  weaponUsage: { primary:0, secondary:0, ordnance:0 },
  highRiskChoices: 0,
  surrenderAccepted: 0,
  surrenderRejected: 0,
  recognitionCount: 0,
  archiveFragments: [],
  settings: {
    renderScale: 1,
    vibration: true,
    aimAssist: .22,
    audio: .65,
    aimSensitivity: 1,
    moveSensitivity: 1,
    aimDeadZone: .065,
    controlOpacity: .78,
    autoFire: true,
  },
};

export function sanitizeProfile(raw) {
  const p = { ...DEFAULT_PROFILE, ...(raw || {}) };
  p.version = Math.max(6, Number(p.version) || 6);
  p.settings = { ...DEFAULT_PROFILE.settings, ...(raw?.settings || {}) };
  p.mechPaints = { ...DEFAULT_PROFILE.mechPaints, ...(raw?.mechPaints || {}) };
  p.unlockedMechs = Array.from(new Set(Array.isArray(p.unlockedMechs) ? p.unlockedMechs : DEFAULT_PROFILE.unlockedMechs));
  p.history = Array.isArray(p.history) ? p.history.slice(-20) : [];
  p.seenDialogue = p.seenDialogue && typeof p.seenDialogue === 'object' ? p.seenDialogue : {};
  p.dialogueCooldowns = p.dialogueCooldowns && typeof p.dialogueCooldowns === 'object' ? p.dialogueCooldowns : {};
  p.bossKills = { ...DEFAULT_PROFILE.bossKills, ...(raw?.bossKills || {}) };
  p.mechUsage = { ...DEFAULT_PROFILE.mechUsage, ...(raw?.mechUsage || {}) };
  p.weaponUsage = { ...DEFAULT_PROFILE.weaponUsage, ...(raw?.weaponUsage || {}) };
  p.archiveFragments = Array.from(new Set(Array.isArray(raw?.archiveFragments) ? raw.archiveFragments : []));
  p.restorationScore = Math.max(0, Number(p.restorationScore) || 0);
  p.commandAuthority = Math.max(0, Number(p.commandAuthority) || 0);
  p.highRiskChoices = Math.max(0, Number(p.highRiskChoices) || 0);
  p.surrenderAccepted = Math.max(0, Number(p.surrenderAccepted) || 0);
  p.surrenderRejected = Math.max(0, Number(p.surrenderRejected) || 0);
  p.recognitionCount = Math.max(0, Number(p.recognitionCount) || 0);
  return p;
}

export function loadProfile(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem(PROFILE_KEY);
    return sanitizeProfile(raw ? JSON.parse(raw) : null);
  } catch {
    return sanitizeProfile(null);
  }
}

export function saveProfile(profile, storage = globalThis.localStorage) {
  const clean = sanitizeProfile(profile);
  try { storage?.setItem(PROFILE_KEY, JSON.stringify(clean)); } catch {}
  return clean;
}

export function recordRun(profile, report) {
  const next = sanitizeProfile(profile);
  next.runs += 1;
  if (report.victory) next.victories += 1;
  next.permanent += report.permanentEarned || 0;
  next.restorationScore += report.restorationEarned || 0;
  next.commandAuthority = Math.max(next.commandAuthority, report.commandAuthority || 0);
  if (report.bossKilled) next.bossKills[report.bossKilled] = (next.bossKills[report.bossKilled] || 0) + 1;
  if (report.mechId) next.mechUsage[report.mechId] = (next.mechUsage[report.mechId] || 0) + 1;
  next.weaponUsage.primary += report.primaryKills || 0;
  next.weaponUsage.secondary += report.secondaryKills || 0;
  next.weaponUsage.ordnance += report.ordnanceKills || 0;
  next.highRiskChoices += report.highRiskChoices || 0;
  next.surrenderAccepted += report.surrenderAccepted || 0;
  next.surrenderRejected += report.surrenderRejected || 0;
  next.recognitionCount += report.recognitionCount || 0;
  next.archiveFragments = Array.from(new Set([...next.archiveFragments,...(report.archiveFragments || [])]));
  next.history.push({ ...report, at: Date.now() });
  next.history = next.history.slice(-20);
  for (const key of Object.keys(next.dialogueCooldowns)) {
    next.dialogueCooldowns[key] = Math.max(0, next.dialogueCooldowns[key] - 1);
  }
  return next;
}
