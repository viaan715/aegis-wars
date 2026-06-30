import {AMMO, AMMO_KEYS} from '../data/ammo.js';
import {SFX} from '../audio.js';
import {$} from '../dom.js';
import {notify} from '../ui/notify.js';
import {addXP} from '../progression.js';
import {ART_CD, W, H} from '../constants.js';
import {G} from './state.js';
import {addShake} from './shake.js';

// ── ARMOR ─────────────────────────────────────────────────
export function getArmor(v,hitA){
  let rel=hitA-v.angle;while(rel>Math.PI)rel-=Math.PI*2;while(rel<-Math.PI)rel+=Math.PI*2;
  const abs=Math.abs(rel);let face,arr;
  if(abs<0.9){face='FRONT';arr=v.af;}else if(abs>2.2){face='REAR';arr=v.ar;}else{face='SIDE';arr=v.as;}
  const sl=face==='FRONT'?1+Math.abs(Math.sin(rel))*0.5:1;
  return{face,a:(Math.random()<0.42?arr[0]:arr[1])*sl};
}

export function applyHit(v,proj,hx,hy){
  const am=AMMO[proj.ammoType]||AMMO['APFSDS-T'];
  if(v.apsActive&&v.apsCd<=0&&proj.ammoType==='HEAT'&&proj.fromPlayer){
    spawnParticles(hx,hy,'#3a7ade',10,false);logDmg('APS INTERCEPTED HEAT!','#3a7ade');v.apsCd=200;return;
  }
  const dist=Math.hypot(proj.ox-hx,proj.oy-hy);
  const{face,a}=getArmor(v,Math.atan2(hy-v.y,hx-v.x));
  const armor=(v.cat==='helo'||v.cat==='drone'||v.cat==='infantry')?a*0.3:a;
  const pen=(am.pen*(proj.pm||1))*(1-Math.min(dist/1800,(G.difficulty===-1&&proj.fromPlayer)?0.08:0.22))*(0.82+Math.random()*0.36);
  const penned=pen>armor;
  spawnParticles(hx,hy,penned?'#ff8830':'#b0b0b0',penned?12:5,penned);
  G.craters.push({x:hx,y:hy,r:am===AMMO['HE-GP']?14:4,life:1});
  if(!penned){logDmg(`${face} ${Math.round(pen)}/${Math.round(armor)}mm RICO`,'#4a4a38');SFX.ricochet();return;}
  SFX.shellHit();
  const isPlayerVeh=v===G.p1||v===G.p2;
  addShake(isPlayerVeh?4:1.5);
  const r=Math.random();let msg='';
  const easyMode=G.difficulty===-1&&isPlayerVeh;
  if(am===AMMO['HE-GP']){v.eng=Math.max(0,v.eng-(easyMode?12:30));v.gun=Math.max(0,v.gun-(easyMode?10:25));if(r<(easyMode?0.1:0.4))v.crew=Math.max(0,v.crew-1);msg='HE DMG';}
  else if(r<0.22){if(!easyMode||Math.random()<0.3)v.crew=Math.max(0,v.crew-1);msg='CREW';}
  else if(r<0.45){v.eng=Math.max(0,v.eng-(easyMode?18:45));if(v.eng<25)v.burning=true;msg='ENGINE';}
  else if(r<0.65){v.gun=Math.max(0,v.gun-(easyMode?25:60));msg='GUN';}
  else if(r<0.82){v.trk=Math.max(0,(v.trk||100)-(easyMode?30:75));if(v.trk<=0){v.isTracked=true;v.trackedTimer=easyMode?120:280;}msg='TRACK';}
  else{if(easyMode){v.crew=Math.max(0,v.crew-1);v.eng=Math.max(0,v.eng-20);}else{v.crew=0;v.eng=0;v.burning=true;}msg='AMMO RACK!';}
  const isP=isPlayerVeh;
  logDmg(`${face} (${Math.round(pen)}/${Math.round(armor)}) — ${msg}`,isP?'#e05050':'#e8d880');
  if(isP){updateZones(v);if(v.crew<=0)killPlayer(v);}
  else if(v.isAI){
    if(v.crew<=0||(v.eng<=0&&v.burning)){
      const xpAmt=v.pts;const ex=v.x,ey=v.y;
      setTimeout(()=>{if(!v.dead){v.dead=true;SFX.explosion();addShake(5);spawnParticles(ex,ey,'#e07030',30,true);G.kills++;G.score+=xpAmt;addXP(Math.round(xpAmt/5),ex,ey);}},300);
    }
  }
}

export function killPlayer(v){
  v.dead=true;SFX.explosion();addShake(6);
  if(v===G.p1){
    G.p1Lives--;
    if(G.p1Lives<=0){G.phase='dead';SFX.lose();}
    else{G.p1RespTimer=G.difficulty===-1?120:300;$('respPanel').classList.add('active');$('livesV').textContent=G.p1Lives;}
  }
}

export function callArty(tx,ty,slot){
  if(G.artCDs[slot]>0){notify('Recharging','#3a3a28');return;}
  G.artCDs[slot]=G.difficulty===-1?ART_CD*0.4:ART_CD;SFX.arty();notify('Artillery!','#e8d880');
  let n=0;const iv=setInterval(()=>{
    if(G.phase!=='playing'){clearInterval(iv);return;}
    const ix=Math.max(10,Math.min(W-10,tx+(Math.random()-0.5)*88));
    const iy=Math.max(10,Math.min(H-10,ty+(Math.random()-0.5)*88));
    SFX.arty();addShake(3);spawnParticles(ix,iy,'#e07030',18,true);G.craters.push({x:ix,y:iy,r:16,life:1});
    [G.p1,G.p2,...G.enemies].filter(v=>v&&!v.dead).forEach(v=>{
      if(Math.hypot(v.x-ix,v.y-iy)<30){v.eng=Math.max(0,v.eng-18);if(Math.random()<0.3)v.crew=Math.max(0,v.crew-1);
        if(v===G.p1||v===G.p2){updateZones(v);if(v.crew<=0)killPlayer(v);}
        else if(v.isAI&&v.crew<=0){v.dead=true;G.kills++;G.score+=v.pts;addXP(Math.round(v.pts/5),v.x,v.y);}}});
    n++;if(n>=7)clearInterval(iv);
  },190);
}

export function fire(from,tx,ty,ammoType,isP2f){
  const stock=isP2f?G.p2Stock:G.p1Stock,aIdx=isP2f?G.p2AmmoIdx:G.p1AmmoIdx;
  if(stock[aIdx]<=0){logDmg('NO AMMO','#e05050');return;}
  stock[aIdx]--;updateAmmoHUD();SFX.shoot();
  const a=Math.atan2(ty-from.y,tx-from.x),spd=AMMO[ammoType].vel*(G.difficulty===-1?1.6:1);
  G.projectiles.push({x:from.x+Math.cos(a)*26,y:from.y+Math.sin(a)*26,ox:from.x,oy:from.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,ammoType,fromPlayer:true,fromP2:isP2f,pm:1,trail:[]});
  spawnParticles(from.x+Math.cos(a)*26,from.y+Math.sin(a)*26,'#e8e8b0',5,false);
}

export function fireAI(from,tx,ty,ammoType,pm){
  const a=Math.atan2(ty-from.y,tx-from.x),spd=(AMMO[ammoType]||AMMO['APFSDS-T']).vel;
  G.projectiles.push({x:from.x+Math.cos(a)*22,y:from.y+Math.sin(a)*22,ox:from.x,oy:from.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,ammoType:ammoType||'APFSDS-T',fromPlayer:false,fromAI:true,pm:pm||from.pm||1,trail:[]});
  spawnParticles(from.x+Math.cos(a)*22,from.y+Math.sin(a)*22,'#e8c870',3,false);
}

export function spawnParticles(x,y,col,n,big){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=(big?2:0.5)+Math.random()*(big?5:2);G.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,col,sz:big?3:1.5});}}
export function deploySmoke(fx,fy,tx,ty){SFX.smoke();const a=Math.atan2(ty-fy,tx-fx),px=fx+Math.cos(a)*60,py=fy+Math.sin(a)*60;for(let i=-1;i<=1;i++)G.smokes.push({x:px+Math.cos(a+i*0.5)*25,y:py+Math.sin(a+i*0.5)*25,r:0,maxR:44,life:1});}
export function inSmoke(x,y){return G.smokes.some(s=>Math.hypot(s.x-x,s.y-y)<s.r);}
export function solidAt(x,y){return G.terrain.some(t=>t.solid&&Math.abs(x-t.x)<t.w/2+8&&Math.abs(y-t.y)<t.h/2+8);}
export function updateZones(v){if(v!==G.p1)return;$('zG').style.width=(v.gun||100)+'%';$('zE').style.width=(v.eng||100)+'%';$('zTr').style.width=(v.trk||100)+'%';$('zC').style.width=(v.crew/v.maxCrew*100)+'%';}
export function updateAmmoHUD(){AMMO_KEYS.forEach((k,i)=>{const el=$('sh'+i),cnt=$('c'+i);el.classList.toggle('sel',i===G.p1AmmoIdx);el.classList.toggle('empty',G.p1Stock[i]<=0);cnt.textContent=G.p1Stock[i];});}
export function logDmg(txt,col='#e8d880'){G.dmgLog.unshift({txt,col});if(G.dmgLog.length>5)G.dmgLog.pop();}
