import {$} from '../dom.js';
import {gc} from '../canvas.js';
import {MAPS} from '../data/maps.js';
import {getPlayerXP, buildProgScreen} from '../progression.js';
import {notify} from './notify.js';
import {buildTankSelect} from './tankSelect.js';
import {buildSettingsScreen} from './settingsScreen.js';
import {G} from '../game/state.js';

// Build map selection buttons (runs once, at module load — mirrors the
// original inline script which built these immediately on page load).
const mb=$('mapBtns');
MAPS.forEach((m,i)=>{
  const b=document.createElement('button');b.className='btn';b.style.cssText='min-width:0;padding:5px 8px;font-size:9px;position:relative';
  b.textContent=m.name;
  if(m.unlockXp>0){b.style.opacity='0.5';b.setAttribute('data-xp',m.unlockXp);}
  b.onclick=()=>{
    if(m.unlockXp>0&&getPlayerXP()<m.unlockXp){notify('Unlock at '+m.unlockXp+' XP','#e05050');return;}
    G.mapIdx=i;mb.querySelectorAll('.btn').forEach(x=>{x.style.borderColor='';x.textContent=MAPS[MAPS.findIndex(mm=>mm.name===x.textContent.replace('🔒 ',''))].name;});
    b.style.borderColor='#c8b870';
  };
  if(m.unlockXp>0)b.textContent='🔒 '+m.name;
  mb.appendChild(b);
});
mb.children[0].style.borderColor='#c8b870';

export function setDiff(d){G.difficulty=d;['dE','dN','dH','dB'].forEach((id,i)=>{$(id).style.borderColor=(i-1)===d?'#c8b870':'';});}

export function updateMapBtns(){
  mb.querySelectorAll('.btn').forEach((b,i)=>{
    const m=MAPS[i];const locked=m.unlockXp>0&&getPlayerXP()<m.unlockXp;
    b.style.opacity=locked?'0.5':'1';
    b.textContent=(locked?'🔒 ':'')+m.name;
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
