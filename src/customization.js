// Cosmetic-only paint jobs and decals. No stat effect -- pure visual
// flair, unlocked via the same XP track as everything else and applied
// only to the player's own tank. Entries with a `pack` field are DLC-pack
// exclusives instead (see dlc.js) -- unlockXp:Infinity means XP alone can
// never unlock them, ownership of the pack is required instead.
import {isPackOwned} from './dlc.js';

const STORAGE_KEY = 'aegisCustomization';

export const PAINTS = [
  {key:'standard', name:'Standard',    unlockXp:0,    col:null,      drk:null},
  {key:'desert',   name:'Desert Tan',  unlockXp:300,  col:'#b89860', drk:'#6e5a38'},
  {key:'arctic',   name:'Arctic White',unlockXp:900,  col:'#d8dce0', drk:'#888c90'},
  {key:'urban',    name:'Urban Grey',  unlockXp:1600, col:'#5a5c5e', drk:'#323436'},
  {key:'night',    name:'Night Black', unlockXp:2400, col:'#202020', drk:'#101010'},
  {key:'crimson',  name:'Crimson',     unlockXp:4000, col:'#7a2a28', drk:'#481614'},
  {key:'sandstorm',name:'Sandstorm',   unlockXp:Infinity, pack:'arid_ace',  col:'#cab070', drk:'#8a6e3e'},
  {key:'voidblack',name:'Void Black',  unlockXp:Infinity, pack:'night_ops', col:'#15101c', drk:'#0a0810'},
];

export const DECALS = [
  {key:'none',   name:'None',   unlockXp:0,    glyph:null},
  {key:'star',   name:'Star',   unlockXp:150,  glyph:'★'},
  {key:'stripe', name:'Stripe', unlockXp:600,  glyph:null},
  {key:'skull',  name:'Skull',  unlockXp:1800, glyph:'☠'},
  {key:'ace',     name:'Ace',     unlockXp:Infinity, pack:'arid_ace',  glyph:'♠'},
  {key:'phantom', name:'Phantom', unlockXp:Infinity, pack:'night_ops', glyph:'☾'},
];

export function isPaintUnlocked(p,xp){ return p.pack ? isPackOwned(p.pack) : xp>=p.unlockXp; }
export function isDecalUnlocked(d,xp){ return d.pack ? isPackOwned(d.pack) : xp>=d.unlockXp; }

function load(){
  try{ return {paint:'standard', decal:'none', ...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}; }
  catch(e){ return {paint:'standard', decal:'none'}; }
}
let custom = load();
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(custom)); }

export function getCustomization(){ return custom; }
export function setPaint(key){ custom = {...custom, paint:key}; save(); }
export function setDecal(key){ custom = {...custom, decal:key}; save(); }
export function getPaint(key){ return PAINTS.find(p=>p.key===key) || PAINTS[0]; }
export function getDecal(key){ return DECALS.find(d=>d.key===key) || DECALS[0]; }
