// Fixed-capacity object pool. Projectiles and particles are created and
// discarded at high frequency during big fights -- pooling reuses a fixed
// set of pre-allocated objects instead of letting every spawn/expire pair
// allocate and then garbage-collect a fresh object (and, for the array
// itself, a fresh array on every per-frame filter()). `live` is the
// public array of currently-active objects, safe to assign directly to a
// G.* field and iterate/index as a normal array; `releaseAt` is an O(1)
// swap-pop removal for use from an index-based loop (order doesn't matter
// for particles/projectiles).
export function createPool(capacity, makeBlank){
  const free = [];
  for(let i=0;i<capacity;i++) free.push(makeBlank());
  const live = [];
  return {
    live,
    capacity,
    // Returns a recycled object to populate, or null if the pool is full
    // (caller should just skip the spawn rather than grow unbounded).
    acquire(){
      if(!free.length) return null;
      const obj = free.pop();
      live.push(obj);
      return obj;
    },
    releaseAt(i){
      const obj = live[i];
      const last = live.pop();
      if(i<live.length) live[i] = last;
      free.push(obj);
      return obj;
    },
    releaseAll(){
      while(live.length) free.push(live.pop());
    },
  };
}
