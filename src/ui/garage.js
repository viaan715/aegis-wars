import {$} from '../dom.js';
import {ALL_TANKS} from '../data/tanks.js';
import {getPlayerXP} from '../progression.js';
import {notify} from './notify.js';
import {G} from '../game/state.js';
import {PAINTS, DECALS, getCustomization, getPaint, getDecal, setPaint, setDecal, isPaintUnlocked, isDecalUnlocked} from '../customization.js';
import {PACKS, isPackOwned, redeemCode} from '../dlc.js';
import {isSupporter, redeemSupporterCode} from '../supporter.js';
import {IS_DEMO, isTankLocked} from '../demo.js';

const gcanvas = $('garageCanvas');
const gctx = gcanvas.getContext('2d');
let previewAngle = 0;

function drawPreview(){
  const tank = ALL_TANKS[G.selectedTankKey] || ALL_TANKS.aegis;
  const custom = getCustomization();
  const paint = getPaint(custom.paint);
  const decal = getDecal(custom.decal);
  const cx=90, cy=80;
  gctx.clearRect(0,0,180,180);
  // turntable platform
  gctx.fillStyle='#15170d';gctx.beginPath();gctx.ellipse(cx,130,70,16,0,0,Math.PI*2);gctx.fill();
  gctx.strokeStyle='#2a2a18';gctx.lineWidth=1;gctx.stroke();

  gctx.save();
  gctx.translate(cx,cy);gctx.rotate(previewAngle);
  const w=Math.min(70,tank.w*2.1), h=Math.min(46,tank.h*2.3);
  const col=paint.col||tank.col, drk=paint.drk||tank.drk;
  gctx.fillStyle=drk;gctx.fillRect(-w/2-6,-h/2-3,w+12,h/2-3);gctx.fillRect(-w/2-6,3,w+12,h/2-3);
  gctx.fillStyle=col;gctx.fillRect(-w/2,-h/2+3,w,h-6);
  gctx.strokeStyle=drk;gctx.lineWidth=1;gctx.strokeRect(-w/2,-h/2+3,w,h-6);
  gctx.beginPath();gctx.fillStyle=col;gctx.arc(0,0,h/2,0,Math.PI*2);gctx.fill();gctx.strokeStyle=drk;gctx.stroke();
  gctx.fillStyle=drk;gctx.fillRect(0,-3,w/2+18,6);
  if(decal.key==='stripe'){gctx.strokeStyle='rgba(232,216,128,0.9)';gctx.lineWidth=2;gctx.beginPath();gctx.moveTo(-w/2,h/2-3);gctx.lineTo(w/2,-h/2+3);gctx.stroke();}
  else if(decal.glyph){gctx.fillStyle='rgba(232,216,128,0.95)';gctx.font='14px Courier New';gctx.textAlign='center';gctx.textBaseline='middle';gctx.fillText(decal.glyph,0,0);}
  gctx.restore();
}

function loop(){
  if(!$('sGarage').classList.contains('hidden')){
    previewAngle += 0.015;
    drawPreview();
  }
  requestAnimationFrame(loop);
}

function buildTankBtns(){
  const c=$('garageTankBtns');c.innerHTML='';
  Object.entries(ALL_TANKS).forEach(([key,t])=>{
    const normalLocked=t.supporterOnly?!isSupporter():getPlayerXP()<t.unlockXp;
    const locked=isTankLocked(key,normalLocked);
    const b=document.createElement('button');
    b.className='btn'+(key===G.selectedTankKey?' sel':'');
    b.style.cssText='min-width:0;padding:4px 7px;font-size:9px';
    b.textContent=(locked?'🔒 ':'')+t.nation+' '+t.name.split(' ').slice(-1)[0]+(t.supporterOnly?' ⭐':'');
    b.onclick=()=>{
      if(locked){notify(IS_DEMO?'Full version only':t.supporterOnly?'Supporter Edition exclusive':'Unlock at '+t.unlockXp+' XP','#e05050');return;}
      G.selectedTankKey=key;refreshGarage();
    };
    c.appendChild(b);
  });
}

function buildPaintBtns(){
  const c=$('garagePaintBtns');c.innerHTML='';
  const custom=getCustomization();
  const xp=getPlayerXP();
  PAINTS.forEach(p=>{
    const locked=!isPaintUnlocked(p,xp);
    const b=document.createElement('button');
    b.className='btn'+(p.key===custom.paint?' sel':'');
    b.style.cssText='min-width:0;padding:4px 7px;font-size:9px';
    b.style.borderColor=locked?'':(p.col||'#c8b870');
    b.textContent=(locked?'🔒 ':'')+p.name+(p.pack?' (DLC)':'');
    b.onclick=()=>{
      if(locked){notify(p.pack?'Requires the '+(PACKS.find(k=>k.key===p.pack)||{}).name:'Unlock at '+p.unlockXp+' XP','#e05050');return;}
      setPaint(p.key);refreshGarage();
    };
    c.appendChild(b);
  });
}

function buildDecalBtns(){
  const c=$('garageDecalBtns');c.innerHTML='';
  const custom=getCustomization();
  const xp=getPlayerXP();
  DECALS.forEach(d=>{
    const locked=!isDecalUnlocked(d,xp);
    const b=document.createElement('button');
    b.className='btn'+(d.key===custom.decal?' sel':'');
    b.style.cssText='min-width:0;padding:4px 7px;font-size:9px';
    b.textContent=(locked?'🔒 ':'')+d.name+(d.pack?' (DLC)':'');
    b.onclick=()=>{
      if(locked){notify(d.pack?'Requires the matching DLC pack':'Unlock at '+d.unlockXp+' XP','#e05050');return;}
      setDecal(d.key);refreshGarage();
    };
    c.appendChild(b);
  });
}

function buildPackList(){
  const c=$('garagePacks');c.innerHTML='';
  PACKS.forEach(p=>{
    const owned=isPackOwned(p.key);
    const row=document.createElement('div');
    row.style.cssText='display:flex;justify-content:space-between;gap:6px';
    row.innerHTML=`<span style="color:${owned?'#7a9a70':'#5a5a38'}">${owned?'✔':'🔒'} ${p.name}</span><span style="color:#3a3a28">${p.desc}</span>`;
    c.appendChild(row);
  });
  const supRow=document.createElement('div');
  const sup=isSupporter();
  supRow.style.cssText='display:flex;justify-content:space-between;gap:6px;border-top:1px solid #1c1c10;padding-top:4px;margin-top:2px';
  supRow.innerHTML=`<span style="color:${sup?'#e8d880':'#5a5a38'}">${sup?'✔':'🔒'} Supporter Edition</span><span style="color:#3a3a28">⭐ Vanguard Ridge + XM-9 Vanguard</span>`;
  c.appendChild(supRow);
}

export function refreshGarage(){
  const t=ALL_TANKS[G.selectedTankKey]||ALL_TANKS.aegis;
  $('garageTankName').textContent=t.nation+' '+t.name;
  $('garageTankInfo').innerHTML=`[${t.era}]<br>${t.af[0]}mm front armor · ${Math.round(t.spd*30)}km/h · ${t.crew} crew · ${t.role}`;
  buildTankBtns();
  buildPaintBtns();
  buildDecalBtns();
  buildPackList();
}

export function initGarage(){
  requestAnimationFrame(loop);
  $('garageRedeemBtn').addEventListener('click',()=>{
    const input=$('garageRedeemInput');
    const packRes=redeemCode(input.value);
    if(packRes.ok){notify('Unlocked: '+packRes.pack.name,'#7a9a70');input.value='';refreshGarage();return;}
    const supRes=redeemSupporterCode(input.value);
    if(supRes.ok){notify('Supporter Edition unlocked!','#e8d880');input.value='';refreshGarage();return;}
    notify(input.value.trim()?packRes.msg:'Enter a code','#e05050');
  });
}
