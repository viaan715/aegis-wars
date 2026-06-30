// The main battlefield view is now rendered in 3D (render3d.js). This
// module only keeps the 2D minimap, which is drawn on its own small
// canvas and stays 2D by design (consistent with how minimaps work in
// most 3D vehicle games, including the one we're imitating).
import {mmx} from '../canvas.js';
import {W, H} from '../constants.js';
import {G} from './state.js';
import {pal} from '../theme.js';

export function drawMinimap(){
  mmx.fillStyle='#06080a';mmx.fillRect(0,0,120,90);
  mmx.strokeStyle='#141610';mmx.lineWidth=0.5;
  for(let x=0;x<120;x+=12){mmx.beginPath();mmx.moveTo(x,0);mmx.lineTo(x,90);mmx.stroke();}
  for(let y=0;y<90;y+=12){mmx.beginPath();mmx.moveTo(0,y);mmx.lineTo(120,y);mmx.stroke();}
  const sx=120/W,sy=90/H;
  G.terrain.forEach(t=>{if(t.solid){mmx.fillStyle='#2a2818';mmx.fillRect(t.x*sx-1,t.y*sy-1,t.w*sx+1,t.h*sy+1);}});
  G.captureZones.forEach(z=>{mmx.beginPath();mmx.arc(z.x*sx,z.y*sy,z.r*sx,0,Math.PI*2);mmx.fillStyle=z.owner==='blue'?'rgba(58,122,222,0.25)':z.owner==='red'?pal().redRgba(0.25):'rgba(200,184,112,0.1)';mmx.fill();mmx.strokeStyle=z.owner==='blue'?'#3a7ade':z.owner==='red'?pal().red:'#c8b870';mmx.lineWidth=0.6;mmx.stroke();mmx.fillStyle=z.owner==='blue'?'#3a7ade':z.owner==='red'?pal().red:'#c8b870';mmx.font='bold 5px Courier New';mmx.textAlign='center';mmx.fillText(z.label,z.x*sx,z.y*sy+2);});
  G.smokes.forEach(s=>{mmx.fillStyle='rgba(140,140,130,0.2)';mmx.beginPath();mmx.arc(s.x*sx,s.y*sy,s.r*sx,0,Math.PI*2);mmx.fill();});
  G.ammoCrates.forEach(c=>{mmx.fillStyle='#e8d870';mmx.fillRect(c.x*sx-1.5,c.y*sy-1.5,3,3);});
  G.enemies.filter(e=>!e.dead).forEach(e=>{mmx.save();mmx.translate(e.x*sx,e.y*sy);if(e.cat==='helo'||e.cat==='drone'){mmx.fillStyle=e.cat==='drone'?pal().redLight:pal().redMid;mmx.beginPath();mmx.moveTo(0,-4);mmx.lineTo(3,3);mmx.lineTo(-3,3);mmx.closePath();mmx.fill();}else{mmx.rotate(e.angle);mmx.fillStyle=pal().red;mmx.fillRect(-3,-2,6,4);}mmx.restore();});
  if(G.p2&&!G.p2.dead){mmx.save();mmx.translate(G.p2.x*sx,G.p2.y*sy);mmx.rotate(G.p2.angle);mmx.fillStyle='#3a7ade';mmx.fillRect(-3,-2,6,4);mmx.restore();}
  if(G.p1&&!G.p1.dead){mmx.save();mmx.translate(G.p1.x*sx,G.p1.y*sy);mmx.rotate(G.p1.angle);mmx.fillStyle='#3a8a30';mmx.fillRect(-4,-3,8,6);mmx.fillStyle='#5aba50';mmx.fillRect(2,-1,5,2);mmx.restore();
    mmx.save();mmx.translate(G.p1.x*sx,G.p1.y*sy);mmx.beginPath();mmx.moveTo(0,0);mmx.arc(0,0,16,G.p1.tAngle-0.35,G.p1.tAngle+0.35);mmx.closePath();mmx.fillStyle='rgba(90,186,80,0.08)';mmx.fill();mmx.restore();}
  mmx.strokeStyle='#2a2a18';mmx.lineWidth=0.5;mmx.strokeRect(0,0,120,90);
}
