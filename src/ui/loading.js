import {$} from '../dom.js';
import {showScreen} from './screens.js';

const STEPS = [
  'INITIALIZING TACTICAL SYSTEMS...',
  'CALIBRATING OPTICS...',
  'LOADING ARMOR DATABASE...',
  'ESTABLISHING COMMAND LINK...',
  'READY.',
];

export function runLoadingScreen(){
  const fill = $('loadingFill');
  const status = $('loadingStatus');
  const total = 1100;
  const start = performance.now();
  let stepIdx = 0;
  status.textContent = STEPS[0];

  function tick(now){
    const pct = Math.min(100, ((now - start) / total) * 100);
    fill.style.width = pct + '%';
    const nextStep = Math.min(STEPS.length - 1, Math.floor((pct / 100) * STEPS.length));
    if(nextStep !== stepIdx){
      stepIdx = nextStep;
      status.textContent = STEPS[stepIdx];
    }
    if(pct < 100){
      requestAnimationFrame(tick);
    }else{
      showScreen('sMenu');
    }
  }
  requestAnimationFrame(tick);
}
