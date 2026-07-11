const PROFILE_KEY = 'mecha-marco-profile-v4';

export const DEFAULT_PROFILE = {
  version: 4,
  runs: 0,
  victories: 0,
  permanent: 0,
  selectedMech: 'vanguard',
  unlockedMechs: ['vanguard','bulwark','starwing'],
  mechPaints: { vanguard:'skyline', bulwark:'foundry', starwing:'aurora' },
  seenDialogue: {},
  dialogueCooldowns: {},
  history: [],
  settings: {
    renderScale: 1,
    vibration: true,
    aimAssist: .22,
    audio: .65,
    aimSensitivity: 1,
    moveSensitivity: 1,
    aimDeadZone: .065,
  },
};

export function sanitizeProfile(raw) {
  const p = { ...DEFAULT_PROFILE, ...(raw || {}) };
  p.settings = { ...DEFAULT_PROFILE.settings, ...(raw?.settings || {}) };
  p.mechPaints = { ...DEFAULT_PROFILE.mechPaints, ...(raw?.mechPaints || {}) };
  p.unlockedMechs = Array.from(new Set(Array.isArray(p.unlockedMechs) ? p.unlockedMechs : DEFAULT_PROFILE.unlockedMechs));
  p.history = Array.isArray(p.history) ? p.history.slice(-20) : [];
  p.seenDialogue = p.seenDialogue && typeof p.seenDialogue === 'object' ? p.seenDialogue : {};
  p.dialogueCooldowns = p.dialogueCooldowns && typeof p.dialogueCooldowns === 'object' ? p.dialogueCooldowns : {};
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
  next.history.push({ ...report, at: Date.now() });
  next.history = next.history.slice(-20);
  for (const key of Object.keys(next.dialogueCooldowns)) {
    next.dialogueCooldowns[key] = Math.max(0, next.dialogueCooldowns[key] - 1);
  }
  return next;
}
