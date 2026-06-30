// Cosmetic-only paint jobs and decals. No stat effect -- pure visual
// flair, unlocked via the same XP track as everything else and applied
// only to the player's own tank.
const STORAGE_KEY = 'aegisCustomization';

export const PAINTS = [
  {key:'standard', name:'Standard',    unlockXp:0,    col:null,      drk:null},
  {key:'desert',   name:'Desert Tan',  unlockXp:300,  col:'#b89860', drk:'#6e5a38'},
  {key:'arctic',   name:'Arctic White',unlockXp:900,  col:'#d8dce0', drk:'#888c90'},
  {key:'urban',    name:'Urban Grey',  unlockXp:1600, col:'#5a5c5e', drk:'#323436'},
  {key:'night',    name:'Night Black', unlockXp:2400, col:'#202020', drk:'#101010'},
  {key:'crimson',  name:'Crimson',     unlockXp:4000, col:'#7a2a28', drk:'#481614'},
];

export const DECALS = [
  {key:'none',   name:'None',   unlockXp:0,    glyph:null},
  {key:'star',   name:'Star',   unlockXp:150,  glyph:'★'},
  {key:'stripe', name:'Stripe', unlockXp:600,  glyph:null},
  {key:'skull',  name:'Skull',  unlockXp:1800, glyph:'☠'},
];

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
