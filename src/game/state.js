// Central shared mutable game state. The original single-file script kept
// all of this as loose top-level `let` variables; ES modules can't share
// mutable bindings that way (an importer can't reassign an imported `let`),
// so everything that multiple modules need to read AND write lives as
// properties on this one object instead. Values and semantics are unchanged.
import {W,H} from '../constants.js';

const TANK_STORAGE_KEY='aegisSelectedTank';
let _selectedTankKey=localStorage.getItem(TANK_STORAGE_KEY)||'aegis';

export const G={
  mapIdx:0,
  difficulty:0,
  // Persisted across page loads (the garage is a separate page from the
  // main game, so a plain in-memory field would lose the selection on nav).
  get selectedTankKey(){return _selectedTankKey;},
  set selectedTankKey(v){_selectedTankKey=v;localStorage.setItem(TANK_STORAGE_KEY,v);},

  gameMode:'solo',
  localMode:false,
  phase:'idle', // was the bare `state` variable in the original (game phase: idle/playing/dead/win/over)
  score:0,kills:0,wave:1,

  p1:null,p2:null,
  enemies:[],projectiles:[],particles:[],smokes:[],craters:[],terrain:[],captureZones:[],

  mouseX:W/2,mouseY:H/2,keys:{},

  p1AmmoIdx:0,p1Stock:[34,12,20],p1Reload:0,p1SmokeCD:0,p1Lives:3,p1RespTimer:0,
  p2AmmoIdx:0,p2Stock:[34,12,20],p2Reload:0,

  blueTickets:100,redTickets:100,

  dmgLog:[],waveTimer:0,spawnQueue:[],spawnTimer:0,

  artCDs:[0,0],

  engineTick:0,
  fogOfWar:false,

  p2AiTick:0,

  last:0,
  shakeAmt:0,
  weather:{type:'clear',visibilityMult:1,windX:0,windY:0},

  ammoCrates:[],
  crateSpawnTimer:600,

  viewMode:'topdown', // 'topdown' | 'cockpit'

  // Squadmate command for the solo-mode AI ally (G.p2 doubling as a
  // friendly unit): {type:'move',x,y} or {type:'focus',target:enemyRef}
  allyCommand:null,
  allySquadmate:false,
};
