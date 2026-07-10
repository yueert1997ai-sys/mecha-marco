export const TAU = Math.PI * 2;
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => a === b ? 0 : (v - a) / (b - a);
export const smoothstep = (a, b, v) => {
  const t = clamp(invLerp(a, b, v), 0, 1);
  return t * t * (3 - 2 * t);
};
export const distSq = (a, b) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};
export const distance = (a, b) => Math.sqrt(distSq(a, b));
export const length = (v) => Math.hypot(v.x, v.y);
export const normalize = (v) => {
  const l = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / l, y: v.y / l };
};
export const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
export const mul = (v, s) => ({ x: v.x * s, y: v.y * s });
export const dot = (a, b) => a.x * b.x + a.y * b.y;
export const fromAngle = (a, m = 1) => ({ x: Math.cos(a) * m, y: Math.sin(a) * m });
export const angleOf = (v) => Math.atan2(v.y, v.x);
export const rotate = (v, a) => ({
  x: v.x * Math.cos(a) - v.y * Math.sin(a),
  y: v.x * Math.sin(a) + v.y * Math.cos(a),
});
export const wrapAngle = (a) => {
  while (a > Math.PI) a -= TAU;
  while (a < -Math.PI) a += TAU;
  return a;
};
export const angleDelta = (a, b) => wrapAngle(b - a);
export const approachAngle = (a, b, maxDelta) => a + clamp(angleDelta(a, b), -maxDelta, maxDelta);
export const rand = (min = 0, max = 1, rng = Math.random) => min + (max - min) * rng();
export const randInt = (min, max, rng = Math.random) => Math.floor(rand(min, max + 1, rng));
export const pick = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];
export const shuffle = (arr, rng = Math.random) => {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};
export const seededRng = (seed = Date.now()) => {
  let s = seed >>> 0;
  return () => {
    s += 0x6D2B79F5;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
export const circleHit = (a, ar, b, br) => distSq(a, b) <= (ar + br) ** 2;
export const pointInCircle = (p, c, r) => distSq(p, c) <= r * r;
export const segmentPointDistanceSq = (a, b, p) => {
  const ab = sub(b, a);
  const ap = sub(p, a);
  const denom = dot(ab, ab) || 1;
  const t = clamp(dot(ap, ab) / denom, 0, 1);
  const q = add(a, mul(ab, t));
  return distSq(q, p);
};
export const rgba = (hex, alpha = 1) => {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const n = Number.parseInt(full, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
};
