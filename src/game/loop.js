import {G} from './state.js';
import {update} from './update.js';
import {draw3D} from './render3d.js';

export function startLoop(){
  function loop(ts){
    const dt=ts-G.last;G.last=ts;
    if(G.phase==='playing'){update(dt);draw3D();}
    else if(G.phase==='over'||G.phase==='paused'){draw3D();}
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}
