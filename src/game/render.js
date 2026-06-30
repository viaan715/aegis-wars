import {ctx, mmx} from '../canvas.js';
import {W, H} from '../constants.js';
import {MAPS} from '../data/maps.js';
import {AMMO, AMMO_KEYS} from '../data/ammo.js';
import {$} from '../dom.js';
import {G} from './state.js';

// ── DRAW ───────────────────────────────────────────────────
export function drawVehicle(v){
  const isAir=v.cat==='helo'||v.cat==='drone';
  if(isAir){ctx.save();ctx.globalAlpha=0.2;ctx.fillStyle='#000';ctx.beginPath();ctx.ellipse(v.x,v.y+12,v.w/2,v.h/3,0,0,Math.PI*2);ctx.fill();ctx.restore();}
  ctx.save();
  const bob=isAir?Math.sin((v.bobPhase||0))*5:0;ctx.translate(v.x,v.y+bob);
  if(v.cat==='helo'){
    ctx.rotate(v.angle);
    ctx.fillStyle=v.col;ctx.beginPath();ctx.ellipse(0,0,v.w/2,v.h/2,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=v.drk;ctx.fillRect(-v.w/2-14,-2,14,4);
    ctx.strokeStyle=v.col;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-v.w/2-14,-8);ctx.lineTo(-v.w/2-14,8);ctx.stroke();
    const rot=(Date.now()/100)%Math.PI;
    ctx.strokeStyle='rgba(180,180,160,0.65)';ctx.lineWidth=1.5;
    ctx.beginPath();ctx.moveTo(Math.cos(rot)*v.w,Math.sin(rot)*3);ctx.lineTo(-Math.cos(rot)*v.w,-Math.sin(rot)*3);ctx.stroke();
    ctx.beginPath();ctx.moveTo(Math.cos(rot+Math.PI/2)*v.w,Math.sin(rot+Math.PI/2)*3);ctx.lineTo(-Math.cos(rot+Math.PI/2)*v.w,-Math.sin(rot+Math.PI/2)*3);ctx.stroke();
    ctx.fillStyle='rgba(100,160,200,0.45)';ctx.beginPath();ctx.ellipse(v.w/3,0,v.w/5,v.h/3,0,0,Math.PI*2);ctx.fill();
  } else if(v.cat==='drone'){
    ctx.rotate(v.angle);ctx.fillStyle=v.col;ctx.beginPath();ctx.ellipse(0,0,v.w/2,v.h/2,0,0,Math.PI*2);ctx.fill();
    [[-v.w/2,-v.h/2],[v.w/2,-v.h/2],[v.w/2,v.h/2],[-v.w/2,v.h/2]].forEach(([rx,ry])=>{
      ctx.strokeStyle='rgba(200,200,180,0.55)';ctx.lineWidth=1;const rot=(Date.now()/80)%Math.PI;
      ctx.beginPath();ctx.moveTo(rx+Math.cos(rot)*6,ry+Math.sin(rot)*2);ctx.lineTo(rx-Math.cos(rot)*6,ry-Math.sin(rot)*2);ctx.stroke();
    });
    if(v.diving){ctx.strokeStyle='#e05050';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,v.w/2+4,0,Math.PI*2);ctx.stroke();}
  } else if(v.cat==='infantry'){
    ctx.rotate(v.angle);
    const pos=[[-5,-3],[0,-4],[5,-3],[-5,3],[0,4],[5,3]].slice(0,v.crew);
    pos.forEach(([px,py])=>{ctx.fillStyle=v.col;ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);ctx.fill();});
    ctx.strokeStyle=v.drk;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(v.w/2,0);ctx.stroke();
  } else {
    ctx.rotate(v.angle);
    ctx.fillStyle=v.drk;ctx.fillRect(-v.w/2-4,-v.h/2-2,v.w+8,v.h/2-2);ctx.fillRect(-v.w/2-4,2,v.w+8,v.h/2-2);
    ctx.fillStyle='#151510';for(let tx=-v.w/2;tx<v.w/2;tx+=6){ctx.fillRect(tx,-v.h/2-2,3,3);ctx.fillRect(tx,v.h/2-1,3,3);}
    ctx.fillStyle=v.dead?'#2a1808':v.col;ctx.fillRect(-v.w/2,-v.h/2+2,v.w,v.h-4);
    ctx.strokeStyle=v.drk;ctx.lineWidth=0.5;for(let i=-v.w/2+4;i<v.w/2;i+=7){ctx.beginPath();ctx.moveTo(i,-v.h/2+2);ctx.lineTo(i,v.h/2-2);ctx.stroke();}
    ctx.fillStyle=v.drk;ctx.fillRect(-v.w/2,-v.h/2+2,4,v.h-4);ctx.fillRect(v.w/2-4,-v.h/2+2,4,v.h-4);
    if(v.burning){ctx.fillStyle='rgba(220,90,10,0.5)';ctx.fillRect(-10,-14,20,12);}
    if(v.isTracked){ctx.fillStyle='#e05050';ctx.fillRect(-v.w/2-4,v.h/2-3,v.w+8,4);}
    // Era color stripe
    if(v.era){const ec=v.era==='WW2'?'rgba(200,160,60,0.35)':v.era==='COLD WAR'?'rgba(100,160,100,0.35)':v.era==='MODERN'?'rgba(60,100,180,0.35)':'rgba(200,184,80,0.35)';ctx.fillStyle=ec;ctx.fillRect(-v.w/2+2,-v.h/2+3,8,3);}
  }
  ctx.restore();
  if(!isAir&&v.cat!=='infantry'){
    ctx.save();ctx.translate(v.x,v.y+bob);ctx.rotate(v.tAngle);
    ctx.fillStyle=v.dead?'#1a1008':v.col;ctx.beginPath();ctx.arc(0,0,v.h/2-1,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=v.drk;ctx.lineWidth=0.8;ctx.stroke();
    ctx.fillStyle=v.drk;ctx.fillRect(0,-3,v.w/2+10,6);ctx.fillRect(v.w/2+9,-2,8,4);
    if(v===G.p1){for(let a=0;a<4;a++){const aa=a*Math.PI/2+Math.PI/4;ctx.fillStyle='#7ecfb3';ctx.fillRect(Math.cos(aa)*10-2,Math.sin(aa)*10-2,3,3);}}
    ctx.restore();
  }
  if(!v.dead){
    const bw=Math.max(v.w,18)+8,pct=v.crew/v.maxCrew;
    ctx.fillStyle='#080a05';ctx.fillRect(v.x-bw/2,v.y-v.h-(isAir?20:12),bw,4);
    ctx.fillStyle=v.team==='blue'?'#3a7ade':pct>0.6?'#3a8a30':pct>0.3?'#c8a030':'#c03030';
    ctx.fillRect(v.x-bw/2,v.y-v.h-(isAir?20:12),bw*pct,4);
    ctx.fillStyle='rgba(0,0,0,0.6)';ctx.fillRect(v.x-28,v.y-v.h-(isAir?32:26),56,10);
    ctx.fillStyle=isAir?'#7ecfb3':v.team==='blue'?'#6aaaf0':'#8a8a60';
    ctx.font='7px Courier New';ctx.textAlign='center';ctx.fillText((v.tankName||v.name||'').slice(0,12),v.x,v.y-v.h-(isAir?24:18));
    if(v.apsActive){ctx.strokeStyle='rgba(58,122,222,0.3)';ctx.lineWidth=1;ctx.setLineDash([2,4]);ctx.beginPath();ctx.arc(v.x,v.y,30,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);}
    if(v.cat==='drone'&&v.diving){ctx.fillStyle='rgba(192,48,48,0.9)';ctx.font='bold 8px Courier New';ctx.textAlign='center';ctx.fillText('DIVE',v.x,v.y-v.h-36);}
  }
}

export function drawTerrain(){G.terrain.forEach(t=>{ctx.save();ctx.translate(t.x,t.y);switch(t.type){case 'rock':case 'snowrock':ctx.fillStyle=t.type==='snowrock'?'#5a6068':'#5a5a48';ctx.beginPath();ctx.ellipse(0,0,t.w/2,t.h/2,0.2,0,Math.PI*2);ctx.fill();ctx.fillStyle=t.type==='snowrock'?'#8a9098':'#6a6a58';ctx.beginPath();ctx.ellipse(-2,-3,t.w/3,t.h/3,-0.1,0,Math.PI*2);ctx.fill();break;case 'bunker':ctx.fillStyle=t.solid?'#3a3828':'#1e1e14';ctx.fillRect(-t.w/2,-t.h/2,t.w,t.h);ctx.strokeStyle='#2a2818';ctx.lineWidth=1;ctx.strokeRect(-t.w/2,-t.h/2,t.w,t.h);break;case 'building':ctx.fillStyle=t.solid?'#342e22':'#1e1c14';ctx.fillRect(-t.w/2,-t.h/2,t.w,t.h);ctx.strokeStyle='#282018';ctx.lineWidth=1;ctx.strokeRect(-t.w/2,-t.h/2,t.w,t.h);if(t.solid){ctx.fillStyle='#282018';ctx.fillRect(-t.w/2+4,-t.h/2+4,8,10);ctx.fillRect(t.w/2-12,-t.h/2+4,8,10);}break;case 'rubble':ctx.fillStyle='#2e2c1e';ctx.beginPath();ctx.moveTo(-t.w/2,t.h/2);ctx.lineTo(0,-t.h/2);ctx.lineTo(t.w/2,t.h/2);ctx.closePath();ctx.fill();break;case 'tree':ctx.fillStyle=G.fogOfWar?'#0e2008':'#1a3010';ctx.beginPath();ctx.arc(0,-2,8,0,Math.PI*2);ctx.fill();ctx.fillStyle=G.fogOfWar?'#082004':'#112808';ctx.fillRect(-2,4,4,8);break;}ctx.restore();});}

export function drawGround(){
  const m=MAPS[G.mapIdx];
  ctx.fillStyle=m.ground;ctx.fillRect(0,0,W,H);
  if(m.name==='NIGHT'){
    // Stars
    ctx.fillStyle='rgba(200,200,180,0.3)';
    for(let i=0;i<80;i++){const sx=(i*137.5)%W,sy=(i*89.3)%H;ctx.fillRect(sx,sy,1,1);}
  }
  if(m.name==='DESERT'){
    // Sand dunes texture
    ctx.strokeStyle='rgba(60,40,10,0.15)';ctx.lineWidth=1;
    for(let i=0;i<8;i++){ctx.beginPath();ctx.moveTo(0,50+i*50);ctx.bezierCurveTo(W/3,40+i*50,W*2/3,60+i*50,W,50+i*50);ctx.stroke();}
  }
  ctx.strokeStyle=m.gridColor||'#1a1a14';ctx.lineWidth=0.4;
  for(let x=0;x<W;x+=20){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
  for(let y=0;y<H;y+=20){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
  m.patches.forEach(p=>{ctx.fillStyle=p.c;ctx.beginPath();ctx.ellipse(p.x,p.y,p.rx,p.ry,0.3,0,Math.PI*2);ctx.fill();});
}

export function drawFog(){
  if(!G.fogOfWar||!G.p1)return;
  // Night fog of war — darken everything far from player
  const grd=ctx.createRadialGradient(G.p1.x,G.p1.y,60,G.p1.x,G.p1.y,200);
  grd.addColorStop(0,'rgba(0,0,0,0)');
  grd.addColorStop(0.5,'rgba(0,0,0,0.3)');
  grd.addColorStop(1,'rgba(0,0,0,0.85)');
  ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
  // Headlights effect
  ctx.save();ctx.translate(G.p1.x,G.p1.y);ctx.rotate(G.p1.tAngle);
  const light=ctx.createRadialGradient(30,0,5,30,0,120);
  light.addColorStop(0,'rgba(255,255,200,0.15)');light.addColorStop(1,'rgba(255,255,200,0)');
  ctx.fillStyle=light;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,120,-0.5,0.5);ctx.closePath();ctx.fill();
  ctx.restore();
}

export function drawCaptureZones(){G.captureZones.forEach(z=>{
  const col=z.owner==='blue'?'rgba(58,122,222,0.1)':z.owner==='red'?'rgba(192,48,48,0.1)':'rgba(200,184,112,0.06)';
  const sc=z.owner==='blue'?'#3a7ade':z.owner==='red'?'#c03030':'#c8b870';
  ctx.beginPath();ctx.arc(z.x,z.y,z.r,0,Math.PI*2);ctx.fillStyle=col;ctx.fill();
  ctx.strokeStyle=sc;ctx.lineWidth=1.2;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle=sc;ctx.font='bold 12px Courier New';ctx.textAlign='center';ctx.fillText(z.label,z.x,z.y+4);
  if(z.progress>0&&z.progress<100){ctx.strokeStyle='#e8d870';ctx.lineWidth=2;ctx.beginPath();ctx.arc(z.x,z.y,z.r-4,-Math.PI/2,-Math.PI/2+(z.progress/100)*Math.PI*2);ctx.stroke();}
});}

export function drawMinimap(){
  mmx.fillStyle='#06080a';mmx.fillRect(0,0,120,90);
  mmx.strokeStyle='#141610';mmx.lineWidth=0.5;
  for(let x=0;x<120;x+=12){mmx.beginPath();mmx.moveTo(x,0);mmx.lineTo(x,90);mmx.stroke();}
  for(let y=0;y<90;y+=12){mmx.beginPath();mmx.moveTo(0,y);mmx.lineTo(120,y);mmx.stroke();}
  const sx=120/W,sy=90/H;
  G.terrain.forEach(t=>{if(t.solid){mmx.fillStyle='#2a2818';mmx.fillRect(t.x*sx-1,t.y*sy-1,t.w*sx+1,t.h*sy+1);}});
  G.captureZones.forEach(z=>{mmx.beginPath();mmx.arc(z.x*sx,z.y*sy,z.r*sx,0,Math.PI*2);mmx.fillStyle=z.owner==='blue'?'rgba(58,122,222,0.25)':z.owner==='red'?'rgba(192,48,48,0.25)':'rgba(200,184,112,0.1)';mmx.fill();mmx.strokeStyle=z.owner==='blue'?'#3a7ade':z.owner==='red'?'#c03030':'#c8b870';mmx.lineWidth=0.6;mmx.stroke();mmx.fillStyle=z.owner==='blue'?'#3a7ade':z.owner==='red'?'#c03030':'#c8b870';mmx.font='bold 5px Courier New';mmx.textAlign='center';mmx.fillText(z.label,z.x*sx,z.y*sy+2);});
  G.smokes.forEach(s=>{mmx.fillStyle='rgba(140,140,130,0.2)';mmx.beginPath();mmx.arc(s.x*sx,s.y*sy,s.r*sx,0,Math.PI*2);mmx.fill();});
  G.enemies.filter(e=>!e.dead).forEach(e=>{mmx.save();mmx.translate(e.x*sx,e.y*sy);if(e.cat==='helo'||e.cat==='drone'){mmx.fillStyle=e.cat==='drone'?'#e05050':'#b04040';mmx.beginPath();mmx.moveTo(0,-4);mmx.lineTo(3,3);mmx.lineTo(-3,3);mmx.closePath();mmx.fill();}else{mmx.rotate(e.angle);mmx.fillStyle='#b03030';mmx.fillRect(-3,-2,6,4);}mmx.restore();});
  if(G.p2&&!G.p2.dead){mmx.save();mmx.translate(G.p2.x*sx,G.p2.y*sy);mmx.rotate(G.p2.angle);mmx.fillStyle='#3a7ade';mmx.fillRect(-3,-2,6,4);mmx.restore();}
  if(G.p1&&!G.p1.dead){mmx.save();mmx.translate(G.p1.x*sx,G.p1.y*sy);mmx.rotate(G.p1.angle);mmx.fillStyle='#3a8a30';mmx.fillRect(-4,-3,8,6);mmx.fillStyle='#5aba50';mmx.fillRect(2,-1,5,2);mmx.restore();
    mmx.save();mmx.translate(G.p1.x*sx,G.p1.y*sy);mmx.beginPath();mmx.moveTo(0,0);mmx.arc(0,0,16,G.p1.tAngle-0.35,G.p1.tAngle+0.35);mmx.closePath();mmx.fillStyle='rgba(90,186,80,0.08)';mmx.fill();mmx.restore();}
  mmx.strokeStyle='#2a2a18';mmx.lineWidth=0.5;mmx.strokeRect(0,0,120,90);
}

export function draw(){
  drawGround();
  G.craters.forEach(c=>{ctx.globalAlpha=c.life*0.5;ctx.fillStyle='#060605';ctx.beginPath();ctx.arc(c.x,c.y,c.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;});
  drawCaptureZones();drawTerrain();
  G.smokes.forEach(s=>{ctx.save();const g=ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r);g.addColorStop(0,`rgba(140,140,130,${s.life*0.75})`);g.addColorStop(1,'rgba(90,90,80,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();ctx.restore();});
  G.enemies.filter(e=>!e.dead&&e.cat!=='helo'&&e.cat!=='drone').forEach(drawVehicle);
  if(G.p2&&!G.p2.dead)drawVehicle(G.p2);if(G.p1&&!G.p1.dead)drawVehicle(G.p1);
  G.enemies.filter(e=>!e.dead&&(e.cat==='helo'||e.cat==='drone')).forEach(drawVehicle);
  G.projectiles.forEach(p=>{const am=AMMO[p.ammoType]||AMMO['APFSDS-T'];for(let i=0;i<p.trail.length;i++){const t=p.trail[i];ctx.globalAlpha=(i/p.trail.length)*0.55;ctx.fillStyle=am.col;ctx.fillRect(t.x-1,t.y-1,2,2);}ctx.globalAlpha=1;ctx.fillStyle=am.col;ctx.fillRect(p.x-2,p.y-2,4,4);});
  G.particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.col;ctx.fillRect(p.x-p.sz/2,p.y-p.sz/2,p.sz,p.sz);});ctx.globalAlpha=1;
  drawFog();
  if(G.phase==='playing'&&G.p1&&!G.p1.dead){
    const a=G.p1.tAngle;
    ctx.strokeStyle='rgba(180,164,92,0.3)';ctx.lineWidth=0.8;ctx.setLineDash([4,6]);
    ctx.beginPath();ctx.moveTo(G.p1.x+Math.cos(a)*32,G.p1.y+Math.sin(a)*32);ctx.lineTo(G.mouseX,G.mouseY);ctx.stroke();ctx.setLineDash([]);
    ctx.strokeStyle='rgba(200,184,112,0.85)';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(G.mouseX,G.mouseY,8,0,Math.PI*2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(G.mouseX-13,G.mouseY);ctx.lineTo(G.mouseX+13,G.mouseY);ctx.stroke();
    ctx.beginPath();ctx.moveTo(G.mouseX,G.mouseY-13);ctx.lineTo(G.mouseX,G.mouseY+13);ctx.stroke();
    if(G.p1Reload>0){const pct=1-G.p1Reload/AMMO[AMMO_KEYS[G.p1AmmoIdx]].reload;ctx.strokeStyle='#c8b870';ctx.lineWidth=2;ctx.beginPath();ctx.arc(G.mouseX,G.mouseY,14,-Math.PI/2,-Math.PI/2+pct*Math.PI*2);ctx.stroke();}
  }
  $('dmglog').innerHTML=G.dmgLog.map(d=>`<div style="color:${d.col}">${d.txt}</div>`).join('');
  drawMinimap();
}
