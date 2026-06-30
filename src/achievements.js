// Achievements behind a small provider interface. The default provider is
// plain localStorage, which works today in the browser build. If this ever
// ships as a native Steam build, swap in a Steamworks-backed provider via
// setAchievementProvider() (matching ids to Steam achievement API names) --
// nothing else in the codebase needs to change.
const STORAGE_KEY = 'aegisAchievements';

export const ACHIEVEMENTS = [
  {id:'first_blood',   name:'First Blood',   desc:'Destroy your first enemy vehicle.'},
  {id:'rank_corporal',  name:'Promoted',       desc:'Reach the rank of Corporal.'},
  {id:'capture_zone',   name:'Hold The Line',  desc:'Capture a zone.'},
  {id:'survive_wave5',  name:'Veteran',        desc:'Survive to wave 5.'},
  {id:'win_brutal',     name:'Brutal Victory', desc:'Win a match on Brutal difficulty.'},
  {id:'ace_gunner',     name:'Ace Gunner',     desc:'Reach Veteran tier with your Gunner crew member.'},
  {id:'squad_leader',   name:'Squad Leader',   desc:'Win a match with an AI squadmate deployed.'},
];

function load(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); }
  catch(e){ return {}; }
}
let unlocked = load();
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(unlocked)); }

let provider = {
  unlock(id){
    if(unlocked[id]) return false;
    unlocked[id]=true; save();
    return true;
  },
  isUnlocked(id){ return !!unlocked[id]; },
};

export function setAchievementProvider(p){ provider = p; }

export function unlockAchievement(id){
  const ach = ACHIEVEMENTS.find(a=>a.id===id);
  if(!ach) return;
  if(provider.unlock(id)){
    window.dispatchEvent(new CustomEvent('aegis-achievement-unlocked', {detail: ach}));
  }
}
export function isAchievementUnlocked(id){ return provider.isUnlocked(id); }
export function getAllAchievements(){ return ACHIEVEMENTS.map(a=>({...a, unlocked:isAchievementUnlocked(a.id)})); }
