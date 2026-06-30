// Player-configurable settings, persisted to localStorage.
const STORAGE_KEY = 'aegisSettings';

const DEFAULTS = {
  volume: 0.8,       // 0..1, master SFX volume
  muted: false,
  colorblind: false, // swaps team-red for an orange-based colorblind-safe palette
  screenShake: true,
  graphicsQuality: 'high', // 'low' | 'medium' | 'high' -- see graphicsQuality.js
};

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return {...DEFAULTS};
    const parsed = JSON.parse(raw);
    return {...DEFAULTS, ...parsed};
  }catch(e){
    return {...DEFAULTS};
  }
}

let settings = load();
const listeners = [];

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  listeners.forEach(fn=>fn(settings));
}

export function getSettings(){
  return settings;
}

export function onSettingsChange(fn){
  listeners.push(fn);
}

export function setVolume(v){
  settings.volume = Math.max(0, Math.min(1, v));
  save();
}

export function setMuted(b){
  settings.muted = !!b;
  save();
}

export function setColorblind(b){
  settings.colorblind = !!b;
  save();
}

export function setScreenShake(b){
  settings.screenShake = !!b;
  save();
}

export function setGraphicsQuality(q){
  settings.graphicsQuality = ['low','medium','high'].includes(q) ? q : 'high';
  save();
}
