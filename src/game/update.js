import {$} from '../dom.js';
import {SFX} from '../audio.js';
import {W, H} from '../constants.js';
import {WCOMPS} from '../data/enemies.js';
import {G} from './state.js';
import {makeEnemy, makePlayerFromTank} from './entities.js';
import {applyHit, solidAt, spawnParticles, updateZones, updateAmmoHUD, logDmg} from './combat.js';
import {aiUpdate, p2AiUpdate} from './ai.js';
import {buildWave, startGame} from './scene.js';
import {addXP} from '../progression.js';
import {showScreen} from '../ui/screens.js';
import {decayShake} from './shake.js';
import {isActionDown} from '../keybinds.js';
import {addCrewXP, getDriverSpeedMult} from '../crew.js';
import {AMMO_KEYS, AMMO} from '../data/ammo.js';
import {notify} from '../ui/notify.js';

function buildGameOverlay(state,xpEarned){
  const overlay=$('gameOverlay');
  overlay.innerHTML='';
  const wrap=document.createElement('div');
  wrap.style.cssText='position:absolute;inset:0;background:rgba(0,0,0,0.7);display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:all;z-index:18';
  const msgEl=document.createElement('div');
  msgEl.style.cssText='color:#e8d880;font-size:22px;font-weight:bold;text-align:center;letter-spacing:3px';
  msgEl.innerHTML=state==='win'
    ?`VICTORY!<br><span style="font-size:13px;color:#c8b870">Score: ${G.score} · +${xpEarned} XP</span>`
    :`DEFEAT<br><span style="font-size:11px;color:#c03030">Score: ${G.score} · +${xpEarned} XP</span>`;
  const menuBtn=document.createElement('button');
  menuBtn.className='btn g';menuBtn.style.marginTop='14px';menuBtn.textContent='← MENU';
  menuBtn.addEventListener('click',()=>showScreen('sMenu'));
  const replayBtn=document.createElement('button');
  replayBtn.className='btn';replayBtn.style.marginTop='3px';replayBtn.textContent='REPLAY';
  replayBtn.addEventListener('click',()=>startGame());
  wrap.appendChild(msgEl);wrap.appendChild(menuBtn);wrap.appendChild(replayBtn);
  overlay.appendChild(wrap);
}

// ── UPDATE ─────────────────────────────────────────────────
export function update(dt){
  if(G.phase!=='playing')return;
  decayShake();
  G.spawnTimer+=dt;if(G.spawnQueue.length&&G.spawnTimer>1250){const s=G.spawnQueue.shift();G.enemies.push(makeEnemy(s.type,s.x,s.y));G.spawnTimer=0;}
  G.p1Reload=Math.max(0,G.p1Reload-1);G.p2Reload=Math.max(0,G.p2Reload-1);G.p1SmokeCD=Math.max(0,G.p1SmokeCD-1);
  G.artCDs=G.artCDs.map(c=>Math.max(0,c-1));
  [0,1].forEach(i=>{const r=G.artCDs[i]<=0;$('aCD'+i).textContent=r?'READY':Math.ceil(G.artCDs[i]/60)+'s';$('aCD'+i).style.color=r?'#3a8a30':'#3a3a28';$('aSlot'+i).className='aslot'+(r?' aready':'');});
  G.crateSpawnTimer--;
  if(G.crateSpawnTimer<=0&&G.ammoCrates.length<2){
    let cx,cy,tries=0;
    do{cx=40+Math.random()*(W-80);cy=40+Math.random()*(H-80);tries++;}while(solidAt(cx,cy)&&tries<20);
    G.ammoCrates.push({x:cx,y:cy});
    G.crateSpawnTimer=900+Math.random()*600;
  }
  [G.p1,G.p2].filter(p=>p&&!p.dead).forEach(p=>{
    for(let i=G.ammoCrates.length-1;i>=0;i--){
      const c=G.ammoCrates[i];
      if(Math.hypot(p.x-c.x,p.y-c.y)<24){
        const stock=p===G.p2?G.p2Stock:G.p1Stock;
        AMMO_KEYS.forEach((k,idx)=>{stock[idx]=Math.min(AMMO[k].max,stock[idx]+Math.round(AMMO[k].max*0.3));});
        if(p===G.p1)updateAmmoHUD();
        G.ammoCrates.splice(i,1);
        SFX.resupply();notify('Ammo resupplied','#5aba50');logDmg('AMMO CRATE','#5aba50');
      }
    }
  });
  if(G.p1RespTimer>0){G.p1RespTimer--;$('respCD').textContent=Math.ceil(G.p1RespTimer/60);if(G.p1RespTimer<=0){G.p1=makePlayerFromTank(G.selectedTankKey,false);if(G.difficulty===-1)G.p1Stock=[99,40,60];updateAmmoHUD();$('respPanel').classList.remove('active');updateZones(G.p1);}}
  if(G.p1&&!G.p1.dead){
    const driverMult=getDriverSpeedMult();
    const fwd=isActionDown('p1Forward')?1:isActionDown('p1Back')?-1:0;
    const turn=isActionDown('p1Right')?1:isActionDown('p1Left')?-1:0;
    if(!G.p1.isTracked&&G.p1.eng>0){
      G.p1.angle+=turn*G.p1.trv*(G.p1.eng/100);
      if(fwd){const sp=fwd*G.p1.spd*driverMult*(G.p1.eng/100)*0.65,nx=G.p1.x+Math.cos(G.p1.angle)*sp,ny=G.p1.y+Math.sin(G.p1.angle)*sp;if(!solidAt(nx,ny)){G.p1.x=Math.max(22,Math.min(W-22,nx));G.p1.y=Math.max(22,Math.min(H-22,ny));}}
    }
    if(G.p1.isTracked){G.p1.trackedTimer--;if(G.p1.trackedTimer<=0){G.p1.isTracked=false;SFX.trackRepair();}}
    if(G.p1.burning){G.p1.burnTick++;if(G.p1.burnTick%60===0){spawnParticles(G.p1.x,G.p1.y,'#e07030',2,false);G.p1.eng=Math.max(0,G.p1.eng-0.5);}}
    if(G.p1.apsCd>0)G.p1.apsCd--;
    G.p1.tAngle=Math.atan2(G.mouseY-G.p1.y,G.mouseX-G.p1.x);
    const vel=Math.abs(fwd)*G.p1.spd*driverMult*(G.p1.eng/100)*0.65;
    $('sGear').textContent=vel<0.1?'N':(fwd>0?vel<0.8?'1':vel<1.2?'2':vel<1.6?'3':'4':'R');
    $('sRpm').textContent=Math.round(800+vel*600);$('sSpd').textContent=Math.round(vel*32)+' km/h';
    G.engineTick++;if(G.engineTick%8===0){if(vel>0.5)SFX.engineRev();else SFX.engineIdle();}
  }
  if(G.p2&&!G.p2.dead&&G.localMode){
    const fwd2=isActionDown('p2Forward')?1:isActionDown('p2Back')?-1:0,turn2=isActionDown('p2Right')?1:isActionDown('p2Left')?-1:0;
    if(!G.p2.isTracked&&G.p2.eng>0){G.p2.angle+=turn2*G.p2.trv;if(fwd2){const sp=fwd2*G.p2.spd*0.65,nx=G.p2.x+Math.cos(G.p2.angle)*sp,ny=G.p2.y+Math.sin(G.p2.angle)*sp;if(!solidAt(nx,ny)){G.p2.x=Math.max(22,Math.min(W-22,nx));G.p2.y=Math.max(22,Math.min(H-22,ny));}}}
    G.p2.tAngle=G.p2.angle;
  }else if(G.p2&&G.gameMode==='online')p2AiUpdate();
  G.enemies.forEach(e=>aiUpdate(e));
  G.captureZones.forEach(z=>{
    const pl=[G.p1,G.p2].filter(p=>p&&!p.dead&&Math.hypot(p.x-z.x,p.y-z.y)<z.r);
    const ai=G.enemies.filter(e=>!e.dead&&e.cat!=='helo'&&e.cat!=='drone'&&Math.hypot(e.x-z.x,e.y-z.y)<z.r);
    if(pl.length&&!ai.length){z.progress=Math.min(100,z.progress+0.3);if(z.progress>=100&&z.owner!=='blue'){z.owner='blue';logDmg('Zone '+z.label+' CAPTURED','#3a7ade');SFX.capture();addXP(50,z.x,z.y);}}
    else if(ai.length&&!pl.length){z.progress=Math.max(0,z.progress-0.2);if(z.progress<=0&&z.owner!=='red'){z.owner='red';z.progress=100;logDmg('Zone '+z.label+' LOST!','#c03030');SFX.lose();}}
  });
  const bl=G.captureZones.filter(z=>z.owner==='blue').length,rl=G.captureZones.filter(z=>z.owner==='red').length;
  if(rl>bl)G.blueTickets=Math.max(0,G.blueTickets-0.022*rl);if(bl>rl)G.redTickets=Math.max(0,G.redTickets-0.022*bl);
  $('capblue').style.width=(G.blueTickets/2)+'%';$('capred').style.width=(G.redTickets/2)+'%';
  G.captureZones.forEach((z,i)=>{const d=$('d'+'ABC'[i]);if(d)d.className='cdot '+(z.owner==='blue'?'blue':z.owner==='red'?'red':'neu');});
  let ct='';G.captureZones.forEach(z=>{if([G.p1,G.p2].some(p=>p&&!p.dead&&Math.hypot(p.x-z.x,p.y-z.y)<z.r)&&z.owner!=='blue')ct='Capturing '+z.label+'...';});$('captext').textContent=ct;
  $('killsV').textContent=G.kills;$('scoreV').textContent=G.score;$('waveV').textContent=G.wave;
  if(G.blueTickets<=0){G.phase='dead';SFX.lose();}if(G.redTickets<=0){G.phase='win';SFX.rankUp();}
  G.smokes.forEach(s=>{if(s.r<s.maxR)s.r=Math.min(s.maxR,s.r+0.85);else s.life-=0.0015;s.x+=s.vx||0;s.y+=s.vy||0;});G.smokes=G.smokes.filter(s=>s.life>0);
  for(let i=G.projectiles.length-1;i>=0;i--){
    const p=G.projectiles[i];p.trail.push({x:p.x,y:p.y});if(p.trail.length>10)p.trail.shift();
    p.x+=p.vx;p.y+=p.vy;
    if(p.x<0||p.x>W||p.y<0||p.y>H){G.projectiles.splice(i,1);continue;}
    let hit=false;
    if(!p.fromAI){for(const t of G.terrain){if(t.solid&&Math.abs(p.x-t.x)<t.w/2&&Math.abs(p.y-t.y)<t.h/2){SFX.shellHit();spawnParticles(p.x,p.y,'#c0c0a0',5,false);G.craters.push({x:p.x,y:p.y,r:3,life:1});if(t.hp>0)t.hp--;if(t.hp<=0)t.solid=false;G.projectiles.splice(i,1);hit=true;break;}}}
    if(hit)continue;
    const targets=p.fromAI?[G.p1,G.p2].filter(v=>v&&!v.dead):G.enemies.filter(v=>!v.dead);
    for(const v of targets){const hw=(v.cat==='helo'||v.cat==='drone')?v.w/2+6:v.w/2+4,hh=(v.cat==='helo'||v.cat==='drone')?v.h/2+6:v.h/2+4;if(!v.dead&&Math.abs(p.x-v.x)<hw&&Math.abs(p.y-v.y)<hh){applyHit(v,p,p.x,p.y);G.projectiles.splice(i,1);hit=true;break;}}
    if(hit)continue;
  }
  G.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vx*=0.88;p.vy*=0.88;p.life-=0.022;});G.particles=G.particles.filter(p=>p.life>0);
  if(G.enemies.length&&G.enemies.every(e=>e.dead)&&!G.spawnQueue.length){
    G.waveTimer++;
    if(G.waveTimer>110){
      addXP(G.wave*100,W/2,H/2);addCrewXP('driver',10);G.wave++;G.waveTimer=0;
      if(G.wave>WCOMPS.length){G.phase='win';SFX.rankUp();addXP(500,W/2,H/2);}
      else{G.enemies=[];buildWave(G.wave);}
    }
  }
  if(G.phase==='dead'||G.phase==='win'){
    const xpEarned=Math.round(G.score/10);
    if(xpEarned>0)addXP(xpEarned,W/2,200);
    buildGameOverlay(G.phase,xpEarned);
    G.phase='over';
  } else if(G.phase!=='over') $('gameOverlay').innerHTML='';
}
