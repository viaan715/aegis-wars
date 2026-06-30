import {MAPS} from '../data/maps.js';
import {ALL_TANKS} from '../data/tanks.js';
import {ETYPES} from '../data/enemies.js';
import {G} from './state.js';

export function makePlayerFromTank(key,isP2){
  const m=MAPS[G.mapIdx];const sp=isP2?m.spawnP2:m.spawnP;
  const t=ALL_TANKS[key]||ALL_TANKS.aegis;
  return{x:sp.x+(Math.random()-0.5)*20,y:sp.y,angle:isP2?-Math.PI/4:-Math.PI/2,tAngle:isP2?-Math.PI/4:-Math.PI/2,
    spd:t.spd,trv:t.trv,w:t.w,h:t.h,col:isP2?'#8a3030':t.col,drk:isP2?'#5a2020':t.drk,
    af:isP2?[...t.af]:t.af.map(v=>G.difficulty===-1?Math.round(v*1.5):v),
    as:isP2?[...t.as]:t.as.map(v=>G.difficulty===-1?Math.round(v*1.5):v),
    ar:isP2?[...t.ar]:t.ar.map(v=>G.difficulty===-1?Math.round(v*1.5):v),
    crew:t.crew,maxCrew:t.crew,eng:100,gun:100,trk:100,
    dead:false,burning:false,burnTick:0,isPlayer:true,isP2,
    isTracked:false,trackedTimer:0,team:isP2?'red':'blue',
    apsActive:t.ability==='aps'||t.ability==='aps360',apsCd:0,
    tankName:t.name,era:t.era,nation:t.nation};
}

export function makeEnemy(typeKey,x,y){
  const t=ETYPES[typeKey];if(!t)return makeEnemy('btr',x,y);
  return{x,y,angle:Math.PI/2+(Math.random()-0.5)*0.5,tAngle:Math.PI/2,
    w:t.w,h:t.h,col:t.col,drk:t.drk,spd:t.spd*(1+Math.max(0,G.difficulty)*0.18)*(G.difficulty===-1?0.8:1),trv:t.trv,
    name:t.name,cat:t.cat||'tank',af:[...t.af],as:[...t.as],ar:[...t.ar],
    crew:t.crew,maxCrew:t.crew,eng:100,gun:100,trk:100,
    pts:t.pts,role:t.role,cd:(t.cd||2000)*(1-Math.max(0,G.difficulty)*0.12)*(G.difficulty===-1?1.6:1),pm:t.pm||1,
    lastShot:0,dead:false,burning:false,burnTick:0,isTracked:false,trackedTimer:0,
    team:'red',isAI:true,ability:t.ability||null,abilityCd:0,maxAbilityCd:t.abilityCd||t.maxAbilityCd||400,
    apsActive:t.apsActive||false,apsCd:0,bobPhase:Math.random()*Math.PI*2,diving:false};
}
