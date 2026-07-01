// ── SOUND ENGINE ─────────────────────────────────────────
import {getSettings, onSettingsChange} from './settings.js';

const AudioCtx=window.AudioContext||window.webkitAudioContext;
let audioCtx=null;
let masterGain=null;

function effectiveVolume(){
  const s=getSettings();
  return s.muted?0:s.volume;
}

export function getAudioCtx(){
  if(!audioCtx){
    try{
      audioCtx=new AudioCtx();
      masterGain=audioCtx.createGain();
      masterGain.gain.value=effectiveVolume();
      masterGain.connect(audioCtx.destination);
    }catch(e){}
  }
  return audioCtx;
}

onSettingsChange(()=>{if(masterGain)masterGain.gain.value=effectiveVolume();});

function playTone(freq,type,vol,dur,pitchEnd){
  const ac=getAudioCtx();if(!ac)return;
  try{
    const o=ac.createOscillator(),g=ac.createGain();
    o.connect(g);g.connect(masterGain);
    o.type=type||'sine';o.frequency.setValueAtTime(freq,ac.currentTime);
    if(pitchEnd)o.frequency.exponentialRampToValueAtTime(pitchEnd,ac.currentTime+dur);
    g.gain.setValueAtTime(vol,ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+dur);
    o.start();o.stop(ac.currentTime+dur);
  }catch(e){}
}

function playNoise(vol,dur,filter){
  const ac=getAudioCtx();if(!ac)return;
  try{
    const buf=ac.createBuffer(1,ac.sampleRate*dur,ac.sampleRate);
    const d=buf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*0.8;
    const src=ac.createBufferSource(),g=ac.createGain();
    if(filter){const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=filter;src.connect(f);f.connect(g);}
    else src.connect(g);
    g.connect(masterGain);
    src.buffer=buf;g.gain.setValueAtTime(vol,ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+dur);
    src.start();src.stop(ac.currentTime+dur);
  }catch(e){}
}

export const SFX={
  shoot:()=>{playNoise(0.6,0.12,800);playTone(180,'sawtooth',0.3,0.15,60);},
  shellHit:()=>{playNoise(0.8,0.18,400);playTone(80,'square',0.4,0.2,30);},
  ricochet:()=>{playTone(800,'sine',0.3,0.08,2000);playNoise(0.2,0.05,2000);},
  explosion:()=>{playNoise(1.0,0.5,200);playTone(60,'sawtooth',0.6,0.4,20);},
  engineIdle:()=>{playTone(55,'sawtooth',0.06,0.1);},
  engineRev:()=>{playTone(80+Math.random()*40,'sawtooth',0.08,0.08);},
  capture:()=>{playTone(523,'sine',0.4,0.1);setTimeout(()=>playTone(659,'sine',0.4,0.1),120);setTimeout(()=>playTone(784,'sine',0.4,0.15),240);},
  lose:()=>{playTone(400,'sine',0.5,0.15);setTimeout(()=>playTone(320,'sine',0.5,0.2),200);setTimeout(()=>playTone(220,'sine',0.5,0.3),450);},
  xpGain:()=>{playTone(600,'sine',0.2,0.08);setTimeout(()=>playTone(800,'sine',0.2,0.1),90);},
  rankUp:()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>playTone(f,'sine',0.5,0.15),i*120));},
  smoke:()=>{playNoise(0.3,0.2,300);},
  arty:()=>{playNoise(1.0,0.6,150);playTone(40,'sawtooth',0.8,0.5,15);},
  drone:()=>{playTone(400+Math.random()*100,'square',0.15,0.05);},
  trackRepair:()=>{playTone(200,'square',0.2,0.1);setTimeout(()=>playTone(300,'square',0.2,0.1),120);},
  waveIn:()=>{[220,277,330].forEach((f,i)=>setTimeout(()=>playTone(f,'sawtooth',0.3,0.2),i*100));},
  resupply:()=>{playTone(440,'sine',0.3,0.08);setTimeout(()=>playTone(660,'sine',0.3,0.12),80);},
};
