import { BASE_DIALOGUE } from '../data/dialogue.js';

export function selectDialogue(profile, lastRun) {
  const candidates = BASE_DIALOGUE.filter((d) => {
    if (d.once && profile.seenDialogue[d.id]) return false;
    if ((profile.dialogueCooldowns[d.id] || 0) > 0) return false;
    return d.when(profile, lastRun);
  }).sort((a, b) => b.priority - a.priority);
  return candidates[0] || BASE_DIALOGUE.at(-1);
}

export function markDialogue(profile, dialogue) {
  const next = structuredClone(profile);
  next.seenDialogue[dialogue.id] = (next.seenDialogue[dialogue.id] || 0) + 1;
  if (dialogue.cooldown) next.dialogueCooldowns[dialogue.id] = dialogue.cooldown;
  return next;
}
