import {gc} from '../canvas.js';
import {W, H} from '../constants.js';
import {screenToGround} from './render3d.js';
import {AMMO, AMMO_KEYS} from '../data/ammo.js';
import {MAPS} from '../data/maps.js';
import {G} from './state.js';
import {fire, deploySmoke, callArty, logDmg, updateAmmoHUD} from './combat.js';
import {buildScene} from './scene.js';
import {matchesAction} from '../keybinds.js';
import {showTooltipOnce} from '../ui/tooltips.js';
import {togglePause} from '../ui/pauseMenu.js';
import {getLoaderReloadMult} from '../crew.js';
import {notify} from '../ui/notify.js';

// ── Shared action helpers ────────────────────────────────────
// Pulled out of the keydown/click handlers below so the gamepad poller
// (gamepad.js) can trigger the exact same actions as mouse/keyboard
// instead of re-implementing or synthesizing fake DOM events.
export function firePrimary(){
  if(!G.p1||G.p1.dead||G.p1Reload>0||G.phase!=='playing')return;
  showTooltipOnce('ammo:'+AMMO_KEYS[G.p1AmmoIdx]);
  fire(G.p1,G.mouseX,G.mouseY,AMMO_KEYS[G.p1AmmoIdx],false);
  G.p1Reload=AMMO[AMMO_KEYS[G.p1AmmoIdx]].reload*(G.difficulty===-1?0.5:1)*getLoaderReloadMult();
}
export function selectAmmo(idx){
  G.p1AmmoIdx=idx;showTooltipOnce('ammo:'+AMMO_KEYS[idx]);updateAmmoHUD();
}
export function deploySmokeP1(){
  if(G.p1&&!G.p1.dead&&G.p1SmokeCD<=0&&G.phase==='playing'){
    deploySmoke(G.p1.x,G.p1.y,G.mouseX,G.mouseY);G.p1SmokeCD=320;logDmg('SMOKE','#888');showTooltipOnce('ability:smoke');
  }
}
export function callArtyAt(slot){
  if(G.phase==='playing'){callArty(G.mouseX,G.mouseY,slot);showTooltipOnce('ability:arty');}
}
export function toggleViewMode(){
  if(G.phase==='playing'){G.viewMode=G.viewMode==='topdown'?'cockpit':'topdown';notify(G.viewMode==='cockpit'?'GUNNER SCOPE':'TOP-DOWN VIEW','#7ecfb3');}
}
export function allyFocusNearest(){
  if(!(G.phase==='playing'&&G.p2&&G.p2.isAlly&&!G.p2.dead))return;
  const al=G.enemies.filter(en=>!en.dead);let cl=null,md=9999;
  al.forEach(en=>{const d=Math.hypot(en.x-G.mouseX,en.y-G.mouseY);if(d<md){md=d;cl=en;}});
  if(cl){G.allyCommand={type:'focus',target:cl};logDmg('SQUADMATE: FOCUSING '+cl.name,'#7ecfb3');}
}
export function togglePauseAction(){
  if(G.phase==='playing'||G.phase==='paused')togglePause();
}

export function initInput(){
  gc.addEventListener('mousemove',e=>{
    const r=gc.getBoundingClientRect(),sx=W/r.width;
    const px=(e.clientX-r.left)*sx, py=(e.clientY-r.top)*sx;
    // Raycast the mouse against the 3D ground plane to get the world (game
    // x/y) point under the cursor -- works for both the top-down tactical
    // camera and the first-person gunner scope camera.
    const hit=screenToGround(px,py);
    if(hit){G.mouseX=hit.x;G.mouseY=hit.y;}
  });
  gc.addEventListener('click',e=>{
    if(G.phase!=='playing')return;
    if(e.shiftKey&&G.p2&&G.p2.isAlly&&!G.p2.dead){
      G.allyCommand={type:'move',x:G.mouseX,y:G.mouseY};
      logDmg('SQUADMATE: MOVING','#7ecfb3');
      return;
    }
    firePrimary();
  });
  gc.addEventListener('contextmenu',e=>{e.preventDefault();if(G.phase==='playing')callArty(G.mouseX,G.mouseY,G.artCDs[0]<=0?0:1);});
  document.addEventListener('keydown',e=>{
    G.keys[e.key.toLowerCase()]=true;G.keys[e.key]=true;
    if(e.key===' ')e.preventDefault();
    if(matchesAction(e,'pause'))togglePauseAction();
    if(matchesAction(e,'ammo1'))selectAmmo(0);
    if(matchesAction(e,'ammo2'))selectAmmo(1);
    if(matchesAction(e,'ammo3'))selectAmmo(2);
    if(matchesAction(e,'p2Ammo1'))G.p2AmmoIdx=0;
    if(matchesAction(e,'p2Ammo2'))G.p2AmmoIdx=1;
    if(matchesAction(e,'p2Ammo3'))G.p2AmmoIdx=2;
    if(matchesAction(e,'p1Smoke'))deploySmokeP1();
    if(matchesAction(e,'p1Fire'))firePrimary();
    if(matchesAction(e,'p2Fire')&&G.p2&&!G.p2.dead&&G.localMode&&G.p2Reload<=0){fire(G.p2,G.p2.x+Math.cos(G.p2.angle)*100,G.p2.y+Math.sin(G.p2.angle)*100,AMMO_KEYS[G.p2AmmoIdx],true);G.p2Reload=AMMO[AMMO_KEYS[G.p2AmmoIdx]].reload;}
    if(matchesAction(e,'p2Smoke')&&G.p2&&!G.p2.dead&&G.localMode)deploySmoke(G.p2.x,G.p2.y,G.p2.x+Math.cos(G.p2.angle)*80,G.p2.y+Math.sin(G.p2.angle)*80);
    if(matchesAction(e,'artyA'))callArtyAt(0);
    if(matchesAction(e,'artyB'))callArtyAt(1);
    if(matchesAction(e,'range')&&G.phase==='playing'){const al=G.enemies.filter(e=>!e.dead);let cl=null,md=9999;al.forEach(en=>{const d=Math.hypot(en.x-(G.p1?G.p1.x:W/2),en.y-(G.p1?G.p1.y:H/2));if(d<md){md=d;cl=en;}});if(cl)logDmg(`${Math.round(md*2.1)}m — ${cl.name}`,'#7ecfb3');}
    if(matchesAction(e,'mapCycle')&&G.phase==='playing'){G.mapIdx=(G.mapIdx+1)%MAPS.length;buildScene();}
    if(matchesAction(e,'viewToggle'))toggleViewMode();
    if(matchesAction(e,'allyFocus'))allyFocusNearest();
    updateAmmoHUD();
  });
  document.addEventListener('keyup',e=>{G.keys[e.key.toLowerCase()]=false;G.keys[e.key]=false;});
}
