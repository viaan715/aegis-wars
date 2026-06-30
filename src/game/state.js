// Central shared mutable game state. The original single-file script kept
// all of this as loose top-level `let` variables; ES modules can't share
// mutable bindings that way (an importer can't reassign an imported `let`),
// so everything that multiple modules need to read AND write lives as
// properties on this one object instead. Values and semantics are unchanged.
import {W,H} from '../constants.js';

export const G={
  mapIdx:0,
  difficulty:0,
  selectedTankKey:'aegis',

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
};
