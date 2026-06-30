// ── XP / PROGRESSION ─────────────────────────────────────
import {RANKS, UNLOCKS} from './data/ranks.js';
import {SFX} from './audio.js';
import {$} from './dom.js';
import {notify} from './ui/notify.js';

let playerXP=parseInt(localStorage.getItem('aegisXP')||'0');
let playerName=localStorage.getItem('aegisName')||'Commander';

export function getPlayerXP(){return playerXP;}
export function getPlayerName(){return playerName;}
export function setPlayerName(v){playerName=v;localStorage.setItem('aegisName',v);}

function saveXP(){localStorage.setItem('aegisXP',playerXP);}
export function getRank(xp){let r=RANKS[0];for(const rk of RANKS)if(xp>=rk.xp)r=rk;return r;}
export function getNextRank(xp){return RANKS.find(r=>r.xp>xp)||null;}
export function addXP(amount,x,y){
  const oldRank=getRank(playerXP);
  playerXP+=amount;saveXP();
  const newRank=getRank(playerXP);
  SFX.xpGain();
  if(newRank.name!==oldRank.name){SFX.rankUp();notify('RANK UP: '+newRank.name,'#e8d880');}
  updateXPBar();
  if(x&&y)showXPPopup('+'+amount+' XP',x,y);
}
export function updateXPBar(){
  const rank=getRank(playerXP);
  const next=getNextRank(playerXP);
  const pct=next?Math.min(100,(playerXP-rank.xp)/(next.xp-rank.xp)*100):100;
  $('xpbar-fill').style.width=pct+'%';
  $('xpbar-rank').textContent=rank.icon+' '+rank.name+' · '+playerXP+' XP';
  $('menuRank').textContent=rank.icon+' '+rank.name+' · '+playerXP+' XP';
  $('frRank').textContent=rank.name+' · '+playerXP+' XP';
  $('frName').textContent=playerName;
}
function showXPPopup(text,x,y){
  const d=document.createElement('div');d.className='xp-popup';d.textContent=text;
  d.style.left=x+'px';d.style.top=y+'px';d.style.position='absolute';d.style.zIndex='25';
  document.body.appendChild(d);setTimeout(()=>d.remove(),1200);
}
export function resetXP(){if(confirm('Reset all progress?')){playerXP=0;saveXP();updateXPBar();buildProgScreen();notify('Progress reset','#e05050');}}
export function resetGameProg(){if(confirm('Reset game progress?')){playerXP=0;saveXP();updateXPBar();buildProgScreen();notify('Progress reset','#e05050');}}

export function isUnlocked(u){return playerXP>=u.xp;}

export function buildProgScreen(){
  const c=$('progContent');
  const rank=getRank(playerXP);
  const next=getNextRank(playerXP);
  const pct=next?Math.min(100,(playerXP-rank.xp)/(next.xp-rank.xp)*100):100;
  let html=`<div style="background:#0e1008;border:1px solid #2a2a18;padding:12px 16px;margin-bottom:10px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      <span style="font-size:24px">${rank.icon}</span>
      <div>
        <div style="font-size:16px;color:#e8d880;font-weight:bold">${rank.name}</div>
        <div style="font-size:9px;color:#5a5a38">${playerXP} XP total${next?' · '+next.xp+' to '+next.name:' · MAX RANK'}</div>
      </div>
    </div>
    <div style="background:#1a1a10;height:6px;border:1px solid #2a2a18;margin-bottom:4px">
      <div style="height:100%;background:#c8b870;width:${pct}%"></div>
    </div>
    <div style="font-size:8px;color:#5a5a38">${Math.round(pct)}% to next rank</div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
    <div style="background:#0a0c06;border:1px solid #2a2a18;padding:10px 12px">
      <div class="ct">Rank progression</div>`;
  RANKS.forEach(r=>{
    const done=playerXP>=r.xp;
    html+=`<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid #111;font-size:10px">
      <span style="font-size:12px">${r.icon}</span>
      <span style="flex:1;color:${done?'#c8b870':'#3a3a28'}">${r.name}</span>
      <span style="font-size:9px;color:${done?'#3a8a30':'#2a2a18'}">${done?'✔':r.xp+' XP'}</span>
    </div>`;
  });
  html+=`</div><div style="background:#0a0c06;border:1px solid #2a2a18;padding:10px 12px">
    <div class="ct">Unlocks</div>`;
  UNLOCKS.forEach(u=>{
    const done=isUnlocked(u);
    const typeCol=u.type==='tank'?'#6a7ade':u.type==='ammo'?'#c8b870':u.type==='ability'?'#e07030':'#7a9a70';
    html+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #111;font-size:10px">
      <span style="font-size:9px;background:#0e0e08;border:1px solid ${done?typeCol:'#2a2a18'};color:${done?typeCol:'#2a2a18'};padding:1px 5px">${u.type.toUpperCase()}</span>
      <span style="flex:1;color:${done?'#c8b870':'#3a3a28'}">${u.name}</span>
      <span style="font-size:9px;color:${done?'#3a8a30':'#2a2a18'}">${done?'✔':u.xp+' XP'}</span>
    </div>`;
  });
  html+=`</div></div>`;
  c.innerHTML=html;
}
