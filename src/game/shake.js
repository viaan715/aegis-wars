import {G} from './state.js';
import {getSettings} from '../settings.js';

export function addShake(amt){
  if(!getSettings().screenShake) return;
  G.shakeAmt = Math.min(18, G.shakeAmt + amt);
}

export function decayShake(){
  if(G.shakeAmt>0) G.shakeAmt = Math.max(0, G.shakeAmt - 0.9);
}

export function shakeOffset(){
  if(G.shakeAmt<=0) return {x:0,y:0};
  const m = G.shakeAmt;
  return {x:(Math.random()-0.5)*m, y:(Math.random()-0.5)*m};
}
