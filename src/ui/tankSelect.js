import {$} from '../dom.js';
import {ALL_TANKS} from '../data/tanks.js';
import {getPlayerXP} from '../progression.js';
import {notify} from './notify.js';
import {G} from '../game/state.js';
import {isSupporter} from '../supporter.js';
import {IS_DEMO, isTankLocked} from '../demo.js';

export function buildTankSelect(){
  const c=$('tankSelectBtns');c.innerHTML='';
  Object.entries(ALL_TANKS).forEach(([key,t])=>{
    const normalLocked=t.supporterOnly?!isSupporter():getPlayerXP()<t.unlockXp;
    const locked=isTankLocked(key,normalLocked);
    const b=document.createElement('button');
    b.className='btn'+(key===G.selectedTankKey?' sel':'');
    b.style.cssText='min-width:0;padding:4px 7px;font-size:9px';
    b.textContent=(locked?'🔒 ':'')+t.nation+' '+t.name.split(' ').slice(-1)[0];
    b.onclick=()=>{
      if(locked){notify(IS_DEMO?'Full version only':t.supporterOnly?'Supporter Edition exclusive':'Unlock at '+t.unlockXp+' XP','#e05050');return;}
      G.selectedTankKey=key;buildTankSelect();showTankInfo(key);
    };
    c.appendChild(b);
  });
  showTankInfo(G.selectedTankKey);
}
export function showTankInfo(key){
  const t=ALL_TANKS[key];
  $('selTankInfo').innerHTML=`<span style="color:#e8d880">${t.nation} ${t.name}</span> <span style="color:#3a3a28">[${t.era}]</span><br>${t.af[0]}mm front · ${Math.round(t.spd*30)}km/h · ${t.role}`;
}
