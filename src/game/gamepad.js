// Gamepad/controller support. There's no native "give me the current
// state" push API for axes, so this is polled once per frame from the
// main loop rather than event-driven. Only player 1 -- local splitscreen
// player 2 still uses the keyboard, there's no expectation of a second
// pad.
//
// Left stick: analog move/turn (overrides keyboard only while deflected,
// so keyboard and pad can be used interchangeably without fighting).
// Right stick: aim (sets the world point the same way mouse movement
// does, so it works for both camera modes via the existing raycast-free
// "just a direction" usage in fire()).
// Face buttons: fire/smoke/view-toggle/ally-focus, bumpers: ammo cycle,
// triggers: artillery, start: pause.
import {G} from './state.js';
import {notify} from '../ui/notify.js';
import {$} from '../dom.js';
import {firePrimary, selectAmmo, deploySmokeP1, callArtyAt, toggleViewMode, allyFocusNearest, togglePauseAction} from './input.js';

const DEADZONE = 0.18;
const BTN = {FIRE:0, SMOKE:2, VIEW:3, ALLY_FOCUS:1, AMMO_PREV:4, AMMO_NEXT:5, ARTY_A:6, ARTY_B:7, PAUSE:9};

let prevButtons = {};

function risingEdge(gp, idx){
  const now = !!(gp.buttons[idx] && gp.buttons[idx].pressed);
  const was = !!prevButtons[idx];
  prevButtons[idx] = now;
  return now && !was;
}

function setStatusEl(text, connected){
  const el = $('gamepadStatus');
  if(!el)return; // settings screen markup not present (e.g. garage page)
  el.textContent = text;
  el.style.color = connected ? '#7a9a70' : '#5a5a38';
}

export function refreshGamepadStatus(){
  const status = currentStatus();
  setStatusEl(status, status!=='Not connected');
}

export function initGamepad(){
  refreshGamepadStatus();
  window.addEventListener('gamepadconnected', e=>{
    prevButtons = {};
    notify('Controller connected: '+e.gamepad.id,'#7ecfb3');
    setStatusEl(e.gamepad.id, true);
  });
  window.addEventListener('gamepaddisconnected', ()=>{
    G.gamepad.active=false;G.gamepad.fwd=0;G.gamepad.turn=0;
    notify('Controller disconnected','#e8d880');
    setStatusEl('Not connected', false);
  });
}

function currentStatus(){
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = pads && pads[0];
  return gp ? gp.id : 'Not connected';
}

export function pollGamepad(){
  const pads = navigator.getGamepads ? navigator.getGamepads() : [];
  const gp = pads && pads[0];
  G.gamepad.active = !!gp;
  if(!gp){G.gamepad.fwd=0;G.gamepad.turn=0;return;}

  const lx=gp.axes[0]||0, ly=gp.axes[1]||0;
  G.gamepad.turn = Math.abs(lx)>DEADZONE ? lx : 0;
  G.gamepad.fwd  = Math.abs(ly)>DEADZONE ? -ly : 0; // stick up is negative Y -> forward

  const rx=gp.axes[2]||0, ry=gp.axes[3]||0;
  if(Math.hypot(rx,ry)>DEADZONE && G.p1){
    const ang=Math.atan2(ry,rx);
    G.mouseX=G.p1.x+Math.cos(ang)*200;
    G.mouseY=G.p1.y+Math.sin(ang)*200;
  }

  if(risingEdge(gp,BTN.PAUSE))togglePauseAction();
  if(G.phase!=='playing')return;
  if(risingEdge(gp,BTN.FIRE))firePrimary();
  if(risingEdge(gp,BTN.SMOKE))deploySmokeP1();
  if(risingEdge(gp,BTN.VIEW))toggleViewMode();
  if(risingEdge(gp,BTN.ALLY_FOCUS))allyFocusNearest();
  if(risingEdge(gp,BTN.AMMO_PREV))selectAmmo((G.p1AmmoIdx+2)%3);
  if(risingEdge(gp,BTN.AMMO_NEXT))selectAmmo((G.p1AmmoIdx+1)%3);
  if(risingEdge(gp,BTN.ARTY_A))callArtyAt(0);
  if(risingEdge(gp,BTN.ARTY_B))callArtyAt(1);
}
