import {$} from '../dom.js';
import {ALL_TANKS} from '../data/tanks.js';
import {getPlayerXP} from '../progression.js';
import {notify} from './notify.js';
import {G} from '../game/state.js';
import {PAINTS, DECALS, getCustomization, getPaint, getDecal, setPaint, setDecal} from '../customization.js';

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
    const locked=getPlayerXP()<t.unlockXp;
    const b=document.createElement('button');
    b.className='btn'+(key===G.selectedTankKey?' sel':'');
    b.style.cssText='min-width:0;padding:4px 7px;font-size:9px';
    b.textContent=(locked?'🔒 ':'')+t.nation+' '+t.name.split(' ').slice(-1)[0];
    b.onclick=()=>{
      if(locked){notify('Unlock at '+t.unlockXp+' XP','#e05050');return;}
      G.selectedTankKey=key;refreshGarage();
    };
    c.appendChild(b);
  });
}

function buildPaintBtns(){
  const c=$('garagePaintBtns');c.innerHTML='';
  const custom=getCustomization();
  PAINTS.forEach(p=>{
    const locked=getPlayerXP()<p.unlockXp;
    const b=document.createElement('button');
    b.className='btn'+(p.key===custom.paint?' sel':'');
    b.style.cssText='min-width:0;padding:4px 7px;font-size:9px';
    b.style.borderColor=locked?'':(p.col||'#c8b870');
    b.textContent=(locked?'🔒 ':'')+p.name;
    b.onclick=()=>{
      if(locked){notify('Unlock at '+p.unlockXp+' XP','#e05050');return;}
      setPaint(p.key);refreshGarage();
    };
    c.appendChild(b);
  });
}

function buildDecalBtns(){
  const c=$('garageDecalBtns');c.innerHTML='';
  const custom=getCustomization();
  DECALS.forEach(d=>{
    const locked=getPlayerXP()<d.unlockXp;
    const b=document.createElement('button');
    b.className='btn'+(d.key===custom.decal?' sel':'');
    b.style.cssText='min-width:0;padding:4px 7px;font-size:9px';
    b.textContent=(locked?'🔒 ':'')+d.name;
    b.onclick=()=>{
      if(locked){notify('Unlock at '+d.unlockXp+' XP','#e05050');return;}
      setDecal(d.key);refreshGarage();
    };
    c.appendChild(b);
  });
}

export function refreshGarage(){
  const t=ALL_TANKS[G.selectedTankKey]||ALL_TANKS.aegis;
  $('garageTankName').textContent=t.nation+' '+t.name;
  $('garageTankInfo').innerHTML=`[${t.era}]<br>${t.af[0]}mm front armor · ${Math.round(t.spd*30)}km/h · ${t.crew} crew · ${t.role}`;
  buildTankBtns();
  buildPaintBtns();
  buildDecalBtns();
}

export function initGarage(){
  requestAnimationFrame(loop);
}
