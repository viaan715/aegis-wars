// Cosmetic-only DLC packs -- camo paint + decal bundles gated behind a
// redeem code instead of the XP track. Purely visual, no stat effect,
// so nothing here is pay-to-win. In a storefront build, redeemCode()
// would instead be called after a verified purchase webhook/receipt
// check; the rest of the app only cares about isPackOwned().
const STORAGE_KEY = 'aegisDLC';

export const PACKS = [
  {key:'arid_ace',  name:'Arid Ace Pack',  code:'ARID-ACE-2026',  desc:'Sandstorm paint + Ace decal.'},
  {key:'night_ops', name:'Night Ops Pack', code:'NIGHT-OPS-2026', desc:'Void Black paint + Phantom decal.'},
];

function load(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]'); }
  catch(e){ return []; }
}
let owned = load();
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(owned)); }

export function isPackOwned(key){ return owned.includes(key); }
export function getOwnedPacks(){ return owned.slice(); }

export function redeemCode(code){
  const norm = String(code||'').trim().toUpperCase();
  const pack = PACKS.find(p=>p.code===norm);
  if(!pack) return {ok:false, msg:'Invalid code'};
  if(owned.includes(pack.key)) return {ok:false, msg:'Already owned: '+pack.name};
  owned = [...owned, pack.key]; save();
  return {ok:true, pack};
}
