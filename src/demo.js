// Demo build gating. Built via `npm run build:demo` (vite --mode demo),
// which sets import.meta.env.MODE to 'demo'. The regular `npm run build`
// is unaffected -- IS_DEMO is false and nothing in this file changes
// behavior. Demo restricts content (tanks/maps), not mechanics: balance
// and game logic are identical between demo and full version.
export const IS_DEMO = import.meta.env.MODE === 'demo';

// A handful of tanks/maps are demo-playable -- always unlocked outright,
// no XP needed (demo saves don't carry over, so XP gating would be
// meaningless). Everything else is locked behind "full version" even if
// the player's XP would normally unlock it.
export const DEMO_TANK_KEYS = ['aegis', 'tiger1', 'sherman'];
export const DEMO_MAP_NAMES = ['STEPPES', 'URBAN'];

// Combine demo gating with the normal (XP/supporter) lock check: in demo
// mode the allowed set overrides to unlocked and everything else is
// force-locked; outside demo mode, normalLocked passes through unchanged.
export function isTankLocked(key, normalLocked){
  return IS_DEMO ? !DEMO_TANK_KEYS.includes(key) : normalLocked;
}
export function isMapLocked(name, normalLocked){
  return IS_DEMO ? !DEMO_MAP_NAMES.includes(name) : normalLocked;
}
