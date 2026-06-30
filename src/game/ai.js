import {SFX} from '../audio.js';
import {AMMO, AMMO_KEYS} from '../data/ammo.js';
import {W, H} from '../constants.js';
import {G} from './state.js';
import {fireAI, deploySmoke, inSmoke, solidAt, logDmg, fire, spawnParticles, updateZones, killPlayer} from './combat.js';
import {addShake} from './shake.js';

// ── AI ─────────────────────────────────────────────────────
export function aiUpdate(e){
  if(e.dead)return;
  if(e.isTracked){e.trackedTimer--;if(e.trackedTimer<=0){e.isTracked=false;SFX.trackRepair();}}
  if(e.apsCd>0)e.apsCd--;
  if(e.abilityCd>0)e.abilityCd--;
  if(e.burning){e.burnTick=(e.burnTick||0)+1;if(e.burnTick%50===0)spawnParticles(e.x,e.y,'#e07030',2,false);}
  const targets=[G.p1,G.p2].filter(p=>p&&!p.dead);if(!targets.length)return;
  let tgt=targets[0];let minD=Math.hypot(tgt.x-e.x,tgt.y-e.y);
  targets.forEach(p=>{const d=Math.hypot(p.x-e.x,p.y-e.y);if(d<minD){minD=d;tgt=p;}});
  const dx=tgt.x-e.x,dy=tgt.y-e.y,dist=minD,toP=Math.atan2(dy,dx);
  if(G.fogOfWar&&dist>180&&!inSmoke(e.x,e.y))return;
  if(inSmoke(e.x,e.y)||inSmoke(tgt.x,tgt.y))return;
  e.tAngle=toP;
  if(e.cat==='helo'){
    e.bobPhase+=0.04;
    let ad=toP-e.angle;while(ad>Math.PI)ad-=Math.PI*2;while(ad<-Math.PI)ad+=Math.PI*2;
    e.angle+=Math.sign(ad)*Math.min(Math.abs(ad),e.trv);
    if(dist>160){e.x+=Math.cos(toP)*e.spd*0.7;e.y+=Math.sin(toP)*e.spd*0.7;}
    else if(dist<100){e.x-=Math.cos(toP)*e.spd*0.4;e.y-=Math.sin(toP)*e.spd*0.4;}
    const perp=toP+Math.PI/2;e.x+=Math.cos(perp)*Math.sin(e.bobPhase)*0.8;e.y+=Math.sin(perp)*Math.sin(e.bobPhase)*0.8;
    e.x=Math.max(18,Math.min(W-18,e.x));e.y=Math.max(18,Math.min(H-18,e.y));
    const now=Date.now();
    if(e.gun>20&&dist<240*G.weather.visibilityMult&&now-e.lastShot>e.cd){
      if(e.ability==='rocketPod'&&e.abilityCd<=0){for(let i=-1;i<=1;i++)setTimeout(()=>{if(!e.dead)fireAI(e,tgt.x+(Math.random()-0.5)*50,tgt.y+(Math.random()-0.5)*50,'HE-GP',0.5);},i*80+80);e.abilityCd=e.maxAbilityCd||300;}
      else if(e.ability==='hellfire'&&e.abilityCd<=0){fireAI(e,tgt.x,tgt.y,'HEAT',1.8);e.abilityCd=e.maxAbilityCd||400;logDmg('HELLFIRE INBOUND!','#c03030');}
      else fireAI(e,tgt.x+(Math.random()-0.5)*60,tgt.y+(Math.random()-0.5)*60,'APFSDS-T');
      e.lastShot=now;
    }
    return;
  }
  if(e.cat==='drone'){
    e.bobPhase+=0.06;SFX.drone();
    if(!e.diving){e.x+=Math.cos(toP)*e.spd*0.6;e.y+=Math.sin(toP)*e.spd*0.6;e.x=Math.max(18,Math.min(W-18,e.x));e.y=Math.max(18,Math.min(H-18,e.y));if(dist<55){e.diving=true;logDmg('DRONE DIVING!','#e05050');}}
    else{e.x+=Math.cos(toP)*e.spd*1.8;e.y+=Math.sin(toP)*e.spd*1.8;if(dist<18){targets.forEach(t=>{if(Math.hypot(t.x-e.x,t.y-e.y)<22){t.crew=Math.max(0,t.crew-2);t.eng=Math.max(0,t.eng-50);if(t===G.p1||t===G.p2){updateZones(t);if(t.crew<=0)killPlayer(t);}logDmg('DRONE IMPACT!','#c03030');}});SFX.explosion();addShake(5);spawnParticles(e.x,e.y,'#e07030',30,true);G.craters.push({x:e.x,y:e.y,r:20,life:1});e.dead=true;}}
    e.angle=toP;return;
  }
  if(e.cat==='infantry'){
    let ad=toP-e.angle;while(ad>Math.PI)ad-=Math.PI*2;while(ad<-Math.PI)ad+=Math.PI*2;
    e.angle+=Math.sign(ad)*Math.min(Math.abs(ad),e.trv);
    if(dist>60){const nx=e.x+Math.cos(e.angle)*e.spd*0.4,ny=e.y+Math.sin(e.angle)*e.spd*0.4;if(!solidAt(nx,ny)){e.x=Math.max(18,Math.min(W-18,nx));e.y=Math.max(18,Math.min(H-18,ny));}}
    const now=Date.now();
    if(e.gun>20&&dist<200*G.weather.visibilityMult&&now-e.lastShot>e.cd){
      if(e.ability==='guidedMissile'&&e.abilityCd<=0){fireAI(e,tgt.x,tgt.y,'HEAT',1.5);e.abilityCd=e.maxAbilityCd||600;logDmg('ATGM FIRED!','#e05050');}
      else fireAI(e,tgt.x+(Math.random()-0.5)*80,tgt.y+(Math.random()-0.5)*80,'HE-GP',1.2);
      e.lastShot=now;
    }
    return;
  }
  if(!e.isTracked&&e.eng>15){
    let ad=toP-e.angle;while(ad>Math.PI)ad-=Math.PI*2;while(ad<-Math.PI)ad+=Math.PI*2;
    e.angle+=Math.sign(ad)*Math.min(Math.abs(ad),e.trv*(e.eng/100));
    const ideal=e.role==='sniper'?195:e.role==='boss'?160:e.role==='fortress'?145:120;
    if(dist>ideal+30&&Math.abs(ad)<0.75){const nx=e.x+Math.cos(e.angle)*e.spd*0.52,ny=e.y+Math.sin(e.angle)*e.spd*0.52;if(!solidAt(nx,ny)){e.x=Math.max(18,Math.min(W-18,nx));e.y=Math.max(18,Math.min(H-18,ny));}}
    else if(dist<70){const nx=e.x-Math.cos(e.angle)*e.spd*0.3,ny=e.y-Math.sin(e.angle)*e.spd*0.3;if(!solidAt(nx,ny)){e.x=Math.max(18,Math.min(W-18,nx));e.y=Math.max(18,Math.min(H-18,ny));}}
  }
  const now=Date.now();
  if(e.gun>20&&dist<270*G.weather.visibilityMult&&now-e.lastShot>e.cd){
    const sp=(1-e.gun/100)*0.14;const tx=tgt.x+(Math.random()-0.5)*sp*200,ty=tgt.y+(Math.random()-0.5)*sp*200;
    if(e.ability==='smokeBarrage'&&e.abilityCd<=0&&dist<150){deploySmoke(e.x,e.y,e.x,e.y-70);deploySmoke(e.x,e.y,e.x+70,e.y);e.abilityCd=e.maxAbilityCd||500;logDmg('Enemy smoke!','#888');}
    else if(e.ability==='tow'&&e.abilityCd<=0){fireAI(e,tgt.x,tgt.y,'HEAT',1.6);e.abilityCd=e.maxAbilityCd||500;logDmg('TOW MISSILE!','#e05050');}
    else if(e.ability==='artyCall'&&e.abilityCd<=0&&Math.random()<0.25){
      e.abilityCd=e.maxAbilityCd||600;
      setTimeout(()=>{if(!e.dead&&G.p1&&!G.p1.dead){SFX.arty();let n=0;const iv=setInterval(()=>{const ix=Math.max(10,Math.min(W-10,G.p1.x+(Math.random()-0.5)*70));const iy=Math.max(10,Math.min(H-10,G.p1.y+(Math.random()-0.5)*70));SFX.arty();spawnParticles(ix,iy,'#e07030',15,true);[G.p1,G.p2].filter(v=>v&&!v.dead).forEach(v=>{if(Math.hypot(v.x-ix,v.y-iy)<28){v.eng=Math.max(0,v.eng-20);updateZones(v);if(v.crew<=0)killPlayer(v);}});n++;if(n>=5)clearInterval(iv);},200);}},1400);
      logDmg('BOSS CALLING ARTY!','#c03030');
    }
    else if(e.ability==='rapidFire'){for(let i=0;i<3;i++)setTimeout(()=>{if(!e.dead)fireAI(e,tgt.x+(Math.random()-0.5)*60,tgt.y+(Math.random()-0.5)*60,'APFSDS-T',0.5);},i*120);}
    else if(e.ability==='aps'){}
    else fireAI(e,tx,ty,'APFSDS-T');
    e.lastShot=now;
  }
}

export function p2AiUpdate(){
  if(!G.p2||G.p2.dead||G.gameMode==='local')return;G.p2AiTick++;
  const al=G.enemies.filter(e=>!e.dead);if(!al.length)return;
  let tgt=al[0];let md=Math.hypot(tgt.x-G.p2.x,tgt.y-G.p2.y);
  al.forEach(e=>{const d=Math.hypot(e.x-G.p2.x,e.y-G.p2.y);if(d<md){md=d;tgt=e;}});
  const toP=Math.atan2(tgt.y-G.p2.y,tgt.x-G.p2.x);G.p2.tAngle=toP;
  let ad=toP-G.p2.angle;while(ad>Math.PI)ad-=Math.PI*2;while(ad<-Math.PI)ad+=Math.PI*2;
  G.p2.angle+=Math.sign(ad)*Math.min(Math.abs(ad),G.p2.trv);
  if(md>120&&Math.abs(ad)<0.8){const nx=G.p2.x+Math.cos(G.p2.angle)*G.p2.spd*0.5,ny=G.p2.y+Math.sin(G.p2.angle)*G.p2.spd*0.5;if(!solidAt(nx,ny)){G.p2.x=Math.max(18,Math.min(W-18,nx));G.p2.y=Math.max(18,Math.min(H-18,ny));}}
  if(G.p2AiTick%130===0&&md<240&&G.p2Reload<=0){fire(G.p2,tgt.x+(Math.random()-0.5)*40,tgt.y+(Math.random()-0.5)*40,AMMO_KEYS[G.p2AmmoIdx],true);G.p2Reload=AMMO[AMMO_KEYS[G.p2AmmoIdx]].reload;}
}
