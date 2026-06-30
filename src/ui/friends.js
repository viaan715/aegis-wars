import {$} from '../dom.js';
import {getPlayerName, setPlayerName} from '../progression.js';
import {notify} from './notify.js';
import {G} from '../game/state.js';
import {startGame} from '../game/scene.js';

let myName=getPlayerName(),currentRoom=null,myTeam='blue';
let friends=[{name:'TankAce99',status:'online'},{name:'IronWolf',status:'inroom'},{name:'Ghost_T90',status:'offline'}];
export function renderFriends(){$('friendsList').innerHTML=friends.map(f=>`<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #111;font-size:10px"><div style="width:6px;height:6px;border-radius:50%;background:${f.status==='online'?'#3a8a30':f.status==='inroom'?'#3a7ade':'#2a2a20'}"></div><span style="flex:1;color:#c8b870">${f.name}</span><span style="font-size:8px;color:#3a3a28">${f.status}</span></div>`).join('');}
export function setName(){const v=$('nameInp').value.trim();if(v){myName=v;setPlayerName(v);$('frName').textContent=v;notify('Name: '+v);}}
export function addFriend(){const v=$('addFInp').value.trim();if(v){friends.push({name:v,status:'online'});$('addFInp').value='';renderFriends();notify('Added: '+v,'#3a8a30');}}
export function createRoom(){currentRoom=Math.random().toString(36).substr(2,6).toUpperCase();$('roomCode').textContent=currentRoom;$('lobbyCard').style.display='block';$('lobCode').textContent=currentRoom;renderLobby();notify('Room: '+currentRoom,'#3a8a30');}
export function copyCode(){if(currentRoom){navigator.clipboard&&navigator.clipboard.writeText(currentRoom);notify('Copied!');}}
export function joinRoom(){const c=$('joinInp').value.trim().toUpperCase();if(c.length<4){notify('Invalid','#e05050');return;}currentRoom=c;$('roomCode').textContent=c;$('lobbyCard').style.display='block';$('lobCode').textContent=c;renderLobby();notify('Joined: '+c,'#3a7ade');}
export function swTeam(t){myTeam=t;renderLobby();}
function renderLobby(){$('lobSlots').innerHTML=`<div style="font-size:9px;color:#3a7ade;margin:3px 0">BLUE: <span style="color:#c8b870">${myTeam==='blue'?myName:'AI'}</span></div><div style="font-size:9px;color:#c03030;margin:3px 0">RED: <span style="color:#c8b870">Enemy AI</span></div>`;}
export function startOnline(){notify('Starting…','#3a8a30');setTimeout(()=>{G.gameMode='online';startGame();},400);}
