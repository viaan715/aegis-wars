// The particle and projectile pools, sized generously above any normal
// in-flight count so pooling is invisible during ordinary play -- it only
// caps the absolute worst case (e.g. a screen full of simultaneous
// artillery barrages) instead of letting allocation grow unbounded.
import {createPool} from './pool.js';

export const particlePool = createPool(700, ()=>({x:0,y:0,vx:0,vy:0,life:0,col:'#fff',sz:1}));
export const projectilePool = createPool(120, ()=>({
  x:0,y:0,ox:0,oy:0,vx:0,vy:0,
  ammoType:'APFSDS-T',fromPlayer:false,fromP2:false,fromAI:false,pm:1,
}));

export function resetPools(){
  particlePool.releaseAll();
  projectilePool.releaseAll();
}
