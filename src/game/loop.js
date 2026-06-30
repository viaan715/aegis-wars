import {G} from './state.js';
import {update} from './update.js';
import {draw} from './render.js';

export function startLoop(){
  function loop(ts){
    const dt=ts-G.last;G.last=ts;
    if(G.phase==='playing'){update(dt);draw();}
    else if(G.phase==='over'){draw();}
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
