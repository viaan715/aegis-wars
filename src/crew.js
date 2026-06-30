// Crew skill system — a small persistent roster (Gunner/Loader/Driver) that
// levels up from play and grants modest combat buffs. This is account-wide
// meta-progression, separate from the per-match tank stats.
const STORAGE_KEY = 'aegisCrew';

export const TIERS = [
  {name:'RECRUIT', xp:0, bonus:0},
  {name:'TRAINED', xp:150, bonus:1},
  {name:'VETERAN', xp:500, bonus:2},
  {name:'ELITE', xp:1200, bonus:3},
];

const DEFAULT_CREW = {
  gunner:{role:'Gunner', desc:'+2.5% shell penetration per tier', xp:0},
  loader:{role:'Loader', desc:'-5% reload time per tier', xp:0},
  driver:{role:'Driver', desc:'+3% top speed per tier', xp:0},
};

function load(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
    const merged = {};
    for(const k of Object.keys(DEFAULT_CREW)) merged[k] = {...DEFAULT_CREW[k], ...(saved[k]||{})};
    return merged;
  }catch(e){
    return JSON.parse(JSON.stringify(DEFAULT_CREW));
  }
}

let crew = load();
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(crew)); }

function tierFor(xp){ let t=TIERS[0]; for(const tt of TIERS) if(xp>=tt.xp) t=tt; return t; }
function nextTierFor(xp){ return TIERS.find(t=>t.xp>xp) || null; }

export function getCrew(){ return crew; }
export function getCrewTier(role){ return tierFor(crew[role].xp); }
export function getCrewNextTier(role){ return nextTierFor(crew[role].xp); }
export function addCrewXP(role, amount){
  if(!crew[role]) return;
  crew[role].xp += amount;
  save();
}
export function resetCrew(){
  crew = JSON.parse(JSON.stringify(DEFAULT_CREW));
  save();
}

// Buff multipliers, applied to the player's own tank only.
export function getLoaderReloadMult(){ return 1 - tierFor(crew.loader.xp).bonus*0.05; }
export function getGunnerPenMult(){ return 1 + tierFor(crew.gunner.xp).bonus*0.025; }
export function getDriverSpeedMult(){ return 1 + tierFor(crew.driver.xp).bonus*0.03; }
