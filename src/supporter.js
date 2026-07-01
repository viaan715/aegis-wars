// Supporter Edition -- a one-time redeem code that flags the account as
// a supporter, unlocking a bonus map and an exclusive tank. Same
// redeem-code pattern as DLC packs (dlc.js) but tracked as a single flag
// rather than a list, since it's one edition rather than stackable packs.
const STORAGE_KEY = 'aegisSupporter';
const SUPPORTER_CODE = 'AEGIS-SUPPORTER-2026';

export function isSupporter(){ return localStorage.getItem(STORAGE_KEY)==='1'; }

export function redeemSupporterCode(code){
  if(String(code||'').trim().toUpperCase()!==SUPPORTER_CODE) return {ok:false, msg:'Invalid code'};
  if(isSupporter()) return {ok:false, msg:'Supporter Edition already active'};
  localStorage.setItem(STORAGE_KEY,'1');
  return {ok:true};
}
