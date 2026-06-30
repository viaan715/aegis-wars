import {$} from '../dom.js';

const STORAGE_KEY = 'aegisSeenTips';

const TEXT = {
  'ammo:APFSDS-T': '<b>APFSDS-T</b> — kinetic penetrator. Highest penetration, minimal splash. Best vs. armored tanks, especially head-on.',
  'ammo:HE-GP': '<b>HE-GP</b> — high-explosive. Low penetration, but reliably damages engine/gun/crew even when it doesn\'t pen. Strong vs. infantry and soft targets.',
  'ammo:HEAT': '<b>HEAT</b> — shaped-charge warhead. Strong penetration regardless of range, but can be intercepted by active protection systems (APS).',
  'ability:smoke': '<b>SMOKE (F)</b> — deploys a screen that blocks enemy line of sight. Use it to break contact or cross open ground safely.',
  'ability:arty': '<b>ARTILLERY (X/C)</b> — calls in an off-map strike on the targeted point. Each slot has its own cooldown — great for breaking up enemy clusters.',
};

let seen = load();
function load(){
  try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'); }catch(e){ return {}; }
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(seen)); }

let hideTimer = null;
export function showTooltipOnce(key){
  if(seen[key]) return;
  const text = TEXT[key];
  if(!text) return;
  seen[key] = true;
  save();
  const el = $('tooltipPopup');
  el.innerHTML = text;
  el.style.display = 'block';
  clearTimeout(hideTimer);
  hideTimer = setTimeout(()=>{ el.style.display = 'none'; }, 4500);
}
