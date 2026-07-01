import {$} from '../dom.js';
import {G} from '../game/state.js';
import {startGame} from '../game/scene.js';
import {showScreen} from './screens.js';

export function isPaused(){return G.phase==='paused';}

export function pauseGame(){
  if(G.phase!=='playing') return;
  G.phase='paused';
  showPauseOverlay();
}

export function resumeGame(){
  if(G.phase!=='paused') return;
  G.phase='playing';
  $('gameOverlay').innerHTML='';
}

export function togglePause(){
  if(G.phase==='playing') pauseGame();
  else if(G.phase==='paused') resumeGame();
}

function showPauseOverlay(){
  const overlay = $('gameOverlay');
  overlay.innerHTML = '';
  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:absolute;inset:0;background:rgba(0,0,0,0.7);display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:all;z-index:18';

  const title = document.createElement('div');
  title.style.cssText = 'color:#e8d880;font-size:20px;font-weight:bold;letter-spacing:4px;margin-bottom:12px';
  title.textContent = 'PAUSED';

  const resumeBtn = document.createElement('button');
  resumeBtn.className = 'btn g'; resumeBtn.textContent = 'RESUME';
  resumeBtn.addEventListener('click', resumeGame);

  const restartBtn = document.createElement('button');
  restartBtn.className = 'btn'; restartBtn.style.marginTop='3px'; restartBtn.textContent = 'RESTART';
  restartBtn.addEventListener('click', ()=>startGame());

  const quitBtn = document.createElement('button');
  quitBtn.className = 'btn r'; quitBtn.style.marginTop='3px'; quitBtn.textContent = 'QUIT TO MENU';
  quitBtn.addEventListener('click', ()=>{
    G.phase='idle';
    $('gameOverlay').innerHTML='';
    showScreen('sMenu');
  });

  wrap.appendChild(title);
  wrap.appendChild(resumeBtn);
  wrap.appendChild(restartBtn);
  wrap.appendChild(quitBtn);
  overlay.appendChild(wrap);
}
