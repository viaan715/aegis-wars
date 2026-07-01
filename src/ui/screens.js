import {$} from '../dom.js';
import {gc} from '../canvas.js';
import {MAPS} from '../data/maps.js';
import {getPlayerXP, buildProgScreen} from '../progression.js';
import {notify} from './notify.js';
import {buildTankSelect} from './tankSelect.js';
import {buildSettingsScreen} from './settingsScreen.js';
import {G} from '../game/state.js';
import {isSupporter} from '../supporter.js';
import {IS_DEMO, isMapLocked} from '../demo.js';

function mapLocked(m){
  const normalLocked = m.supporterOnly ? !isSupporter() : (m.unlockXp>0&&getPlayerXP()<m.unlockXp);
  return isMapLocked(m.name, normalLocked);
}
function mapLockMsg(m){
  if(IS_DEMO) return 'Full version only';
  return m.supporterOnly ? 'Supporter Edition exclusive' : 'Unlock at '+m.unlockXp+' XP';
}

// Build map selection buttons (runs once, at module load — mirrors the
// original inline script which built these immediately on page load).
const mb=$('mapBtns');
MAPS.forEach((m,i)=>{
  const b=document.createElement('button');b.className='btn';b.style.cssText='min-width:0;padding:5px 8px;font-size:9px;position:relative';
  b.textContent=m.name+(m.supporterOnly?' ⭐':'');
  if(mapLocked(m))b.style.opacity='0.5';
  b.onclick=()=>{
    if(mapLocked(m)){notify(mapLockMsg(m),'#e05050');return;}
    G.mapIdx=i;mb.querySelectorAll('.btn').forEach(x=>x.style.borderColor='');
    b.style.borderColor='#c8b870';
  };
  if(mapLocked(m))b.textContent='🔒 '+b.textContent;
  mb.appendChild(b);
});
mb.children[0].style.borderColor='#c8b870';

export function setDiff(d){G.difficulty=d;['dE','dN','dH','dB'].forEach((id,i)=>{$(id).style.borderColor=(i-1)===d?'#c8b870':'';});}

export function updateMapBtns(){
  mb.querySelectorAll('.btn').forEach((b,i)=>{
    const m=MAPS[i];const locked=mapLocked(m);
    b.style.opacity=locked?'0.5':'1';
    b.textContent=(locked?'🔒 ':'')+m.name+(m.supporterOnly?' ⭐':'');
  });
}

export function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.add('hidden'));
  if(id==='sProg'){buildProgScreen();}
  if(id==='sSolo'){buildTankSelect();updateMapBtns();}
  if(id==='sSettings'){buildSettingsScreen();}
  if($(id))$(id).classList.remove('hidden');
  const gameElements=['statsbl','capbar','killshud','artbar','zonepanel','ammohud','mmwrap','dmglog','xpbar-wrap','tankLabel','controls','respPanel','pauseBtn'];
  gameElements.forEach(el=>{const e=$(el);if(e)e.style.display=id==='__game'?'':'none';});
  if(id==='__game'){
    $('statsbl').style.display='';$('capbar').style.display='';$('killshud').style.display='';
    $('artbar').style.display='';$('zonepanel').style.display='';$('ammohud').style.display='';
    $('mmwrap').style.display='';$('dmglog').style.display='';$('xpbar-wrap').style.display='';
    $('tankLabel').style.display='';$('controls').style.display='';
  }
  gc.style.display=id==='__game'?'block':'none';
}
