import {gc} from '../canvas.js';
import {W, H} from '../constants.js';
import {AMMO, AMMO_KEYS} from '../data/ammo.js';
import {MAPS} from '../data/maps.js';
import {G} from './state.js';
import {fire, deploySmoke, callArty, logDmg, updateAmmoHUD} from './combat.js';
import {buildScene} from './scene.js';
import {matchesAction} from '../keybinds.js';
import {showTooltipOnce} from '../ui/tooltips.js';
import {togglePause} from '../ui/pauseMenu.js';

export function initInput(){
  gc.addEventListener('mousemove',e=>{const r=gc.getBoundingClientRect(),sx=W/r.width;G.mouseX=(e.clientX-r.left)*sx;G.mouseY=(e.clientY-r.top)*sx;});
  gc.addEventListener('click',e=>{
    if(G.phase!=='playing'||!G.p1||G.p1.dead||G.p1Reload>0)return;
    showTooltipOnce('ammo:'+AMMO_KEYS[G.p1AmmoIdx]);
    fire(G.p1,G.mouseX,G.mouseY,AMMO_KEYS[G.p1AmmoIdx],false);G.p1Reload=AMMO[AMMO_KEYS[G.p1AmmoIdx]].reload*(G.difficulty===-1?0.5:1);
  });
  gc.addEventListener('contextmenu',e=>{e.preventDefault();if(G.phase==='playing')callArty(G.mouseX,G.mouseY,G.artCDs[0]<=0?0:1);});
  document.addEventListener('keydown',e=>{
    G.keys[e.key.toLowerCase()]=true;G.keys[e.key]=true;
    if(e.key===' ')e.preventDefault();
    if(matchesAction(e,'pause')&&(G.phase==='playing'||G.phase==='paused')){togglePause();}
    if(matchesAction(e,'ammo1')){G.p1AmmoIdx=0;showTooltipOnce('ammo:'+AMMO_KEYS[0]);}
    if(matchesAction(e,'ammo2')){G.p1AmmoIdx=1;showTooltipOnce('ammo:'+AMMO_KEYS[1]);}
    if(matchesAction(e,'ammo3')){G.p1AmmoIdx=2;showTooltipOnce('ammo:'+AMMO_KEYS[2]);}
    if(matchesAction(e,'p2Ammo1'))G.p2AmmoIdx=0;
    if(matchesAction(e,'p2Ammo2'))G.p2AmmoIdx=1;
    if(matchesAction(e,'p2Ammo3'))G.p2AmmoIdx=2;
    if(matchesAction(e,'p1Smoke')&&G.p1&&!G.p1.dead&&G.p1SmokeCD<=0&&G.phase==='playing'){deploySmoke(G.p1.x,G.p1.y,G.mouseX,G.mouseY);G.p1SmokeCD=320;logDmg('SMOKE','#888');showTooltipOnce('ability:smoke');}
    if(matchesAction(e,'p1Fire')&&G.p1&&!G.p1.dead&&G.p1Reload<=0&&G.phase==='playing'){showTooltipOnce('ammo:'+AMMO_KEYS[G.p1AmmoIdx]);fire(G.p1,G.mouseX,G.mouseY,AMMO_KEYS[G.p1AmmoIdx],false);G.p1Reload=AMMO[AMMO_KEYS[G.p1AmmoIdx]].reload*(G.difficulty===-1?0.5:1);}
    if(matchesAction(e,'p2Fire')&&G.p2&&!G.p2.dead&&G.localMode&&G.p2Reload<=0){fire(G.p2,G.p2.x+Math.cos(G.p2.angle)*100,G.p2.y+Math.sin(G.p2.angle)*100,AMMO_KEYS[G.p2AmmoIdx],true);G.p2Reload=AMMO[AMMO_KEYS[G.p2AmmoIdx]].reload;}
    if(matchesAction(e,'p2Smoke')&&G.p2&&!G.p2.dead&&G.localMode)deploySmoke(G.p2.x,G.p2.y,G.p2.x+Math.cos(G.p2.angle)*80,G.p2.y+Math.sin(G.p2.angle)*80);
    if(matchesAction(e,'artyA')&&G.phase==='playing'){callArty(G.mouseX,G.mouseY,0);showTooltipOnce('ability:arty');}
    if(matchesAction(e,'artyB')&&G.phase==='playing'){callArty(G.mouseX,G.mouseY,1);showTooltipOnce('ability:arty');}
    if(matchesAction(e,'range')&&G.phase==='playing'){const al=G.enemies.filter(e=>!e.dead);let cl=null,md=9999;al.forEach(en=>{const d=Math.hypot(en.x-(G.p1?G.p1.x:W/2),en.y-(G.p1?G.p1.y:H/2));if(d<md){md=d;cl=en;}});if(cl)logDmg(`${Math.round(md*2.1)}m — ${cl.name}`,'#7ecfb3');}
    if(matchesAction(e,'mapCycle')&&G.phase==='playing'){G.mapIdx=(G.mapIdx+1)%MAPS.length;buildScene();}
    updateAmmoHUD();
  });
  document.addEventListener('keyup',e=>{G.keys[e.key.toLowerCase()]=false;G.keys[e.key]=false;});
}
