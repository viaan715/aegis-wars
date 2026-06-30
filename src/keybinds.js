// Remappable key bindings. Movement actions also accept a fixed arrow-key
// fallback (not remappable) so arrow keys keep working exactly as in the
// original, regardless of how the primary key is rebound.
import {G} from './game/state.js';

const STORAGE_KEY = 'aegisKeybinds';

export const DEFAULT_KEYBINDS = {
  p1Forward:'w', p1Back:'s', p1Left:'a', p1Right:'d',
  p1Fire:'g', p1Smoke:'f',
  artyA:'x', artyB:'c',
  ammo1:'1', ammo2:'2', ammo3:'3',
  range:'r', mapCycle:'m',
  p2Forward:'i', p2Back:'k', p2Left:'j', p2Right:'l',
  p2Fire:';', p2Smoke:'p',
  p2Ammo1:'4', p2Ammo2:'5', p2Ammo3:'6',
  pause:'Escape',
  viewToggle:'v',
};

export const ACTION_LABELS = {
  p1Forward:'P1 Forward', p1Back:'P1 Reverse', p1Left:'P1 Turn Left', p1Right:'P1 Turn Right',
  p1Fire:'P1 Fire', p1Smoke:'P1 Smoke',
  artyA:'Artillery Slot 1', artyB:'Artillery Slot 2',
  ammo1:'P1 Ammo Slot 1', ammo2:'P1 Ammo Slot 2', ammo3:'P1 Ammo Slot 3',
  range:'Range Ping', mapCycle:'Cycle Map (debug)',
  p2Forward:'P2 Forward', p2Back:'P2 Reverse', p2Left:'P2 Turn Left', p2Right:'P2 Turn Right',
  p2Fire:'P2 Fire', p2Smoke:'P2 Smoke',
  p2Ammo1:'P2 Ammo Slot 1', p2Ammo2:'P2 Ammo Slot 2', p2Ammo3:'P2 Ammo Slot 3',
  pause:'Pause',
  viewToggle:'Toggle Gunner Scope',
};

const ARROW_FALLBACK = {p1Forward:'ArrowUp', p1Back:'ArrowDown', p1Left:'ArrowLeft', p1Right:'ArrowRight'};

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return {...DEFAULT_KEYBINDS};
    return {...DEFAULT_KEYBINDS, ...JSON.parse(raw)};
  }catch(e){
    return {...DEFAULT_KEYBINDS};
  }
}

export let keybinds = load();

export function getKey(action){
  return keybinds[action];
}

export function setKey(action, key){
  keybinds = {...keybinds, [action]: key};
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keybinds));
}

export function resetKeybinds(){
  keybinds = {...DEFAULT_KEYBINDS};
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keybinds));
}

// Used in keydown handlers for discrete (single-press) actions.
export function matchesAction(e, action){
  const k = keybinds[action];
  if(k==null) return false;
  if(k.length===1 && /[a-zA-Z]/.test(k)) return e.key.toLowerCase()===k.toLowerCase();
  return e.key===k;
}

// Used in the per-frame update loop for continuous (held) movement actions.
export function isActionDown(action){
  const k = keybinds[action];
  const down = !!(k && (G.keys[k] || G.keys[k.toLowerCase()]));
  const fb = ARROW_FALLBACK[action];
  return down || (fb ? !!G.keys[fb] : false);
}
