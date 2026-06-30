import {MAPS, OBJDEF} from '../data/maps.js';
import {WCOMPS} from '../data/enemies.js';
import {ALL_TANKS} from '../data/tanks.js';
import {SFX, getAudioCtx} from '../audio.js';
import {$} from '../dom.js';
import {G} from './state.js';
import {makePlayerFromTank} from './entities.js';
import {updateAmmoHUD, updateZones} from './combat.js';
import {updateXPBar} from '../progression.js';
import {showScreen} from '../ui/screens.js';

export function buildScene(){
  G.terrain=MAPS[G.mapIdx].objects.map(o=>{const d=OBJDEF[o.t]||{w:20,h:16,solid:true};return{x:o.x,y:o.y,type:o.t,w:d.w,h:d.h,solid:d.solid,hp:3};});
  G.captureZones=MAPS[G.mapIdx].zones.map(z=>({x:z.x,y:z.y,r:36,owner:'neu',progress:0,label:z.label}));
  G.captureZones[0].owner='blue';G.captureZones[0].progress=100;G.captureZones[2].owner='red';G.captureZones[2].progress=100;
  G.fogOfWar=MAPS[G.mapIdx].fog||false;
}

export function buildWave(w){
  const comp=WCOMPS[Math.min(w-1,WCOMPS.length-1)];
  const pos=MAPS[G.mapIdx].spawnE;G.spawnQueue=[];
  if(G.difficulty===-1){
    // BEGINNER: only ever one enemy type, one at a time, picked from this wave's composition
    const pick=comp[0];
    const p=pos[0];
    G.spawnQueue.push({type:pick.t,x:p.x+(Math.random()-0.5)*55,y:p.y+(Math.random()-0.5)*30});
  } else {
    comp.forEach(e=>{for(let i=0;i<e.n;i++){const p=pos[G.spawnQueue.length%pos.length];G.spawnQueue.push({type:e.t,x:p.x+(Math.random()-0.5)*55,y:p.y+(Math.random()-0.5)*30});}});
  }
  G.spawnTimer=0;
  SFX.waveIn();
}

export function startGame(){
  getAudioCtx();
  G.score=0;G.kills=0;G.wave=1;G.phase='playing';
  G.p1AmmoIdx=0;G.p1Stock=G.difficulty===-1?[99,40,60]:[34,12,20];G.p1Reload=0;G.p1SmokeCD=0;G.p1Lives=G.difficulty===-1?6:3;G.p1RespTimer=0;
  G.p2AmmoIdx=0;G.p2Stock=[34,12,20];G.p2Reload=0;
  G.blueTickets=100;G.redTickets=100;
  G.projectiles=[];G.particles=[];G.smokes=[];G.craters=[];G.dmgLog=[];G.enemies=[];G.waveTimer=0;
  buildScene();
  G.p1=makePlayerFromTank(G.selectedTankKey,false);
  G.p2=G.localMode||G.gameMode==='online'?makePlayerFromTank('t34',true):null;
  buildWave(1);updateAmmoHUD();updateZones(G.p1);updateXPBar();
  $('pTankName').textContent=ALL_TANKS[G.selectedTankKey]?.name||'AEGIS';
  $('tankLabel').textContent=(ALL_TANKS[G.selectedTankKey]?.era||'FUTURE')+' · '+(ALL_TANKS[G.selectedTankKey]?.nation||'🇺🇸');
  $('respPanel').classList.remove('active');
  showScreen('__game');
}
export function startSolo(){G.gameMode='solo';G.localMode=false;startGame();}
export function startLocal(){G.gameMode='local';G.localMode=true;startGame();}
