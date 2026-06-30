import './style.css';
import {$} from './dom.js';
import {showScreen, setDiff} from './ui/screens.js';
import {resetXP, updateXPBar, buildProgScreen} from './progression.js';
import {setName, addFriend, createRoom, copyCode, joinRoom, swTeam, startOnline, renderFriends} from './ui/friends.js';
import {buildTankSelect} from './ui/tankSelect.js';
import {startSolo, startLocal} from './game/scene.js';
import {initInput} from './game/input.js';
import {startLoop} from './game/loop.js';
import {runLoadingScreen} from './ui/loading.js';
import {initSettingsControls} from './ui/settingsScreen.js';
import {pauseGame} from './ui/pauseMenu.js';
import {getSettings, onSettingsChange} from './settings.js';

// ── Wire up screen navigation / menu buttons (replaces the original's
// inline onclick="..." attributes, which don't work against module-scoped
// functions) ─────────────────────────────────────────────────
$('btnSolo').addEventListener('click',()=>showScreen('sSolo'));
$('btnFriends').addEventListener('click',()=>showScreen('sFriends'));
$('btnLocal').addEventListener('click',()=>showScreen('sLocal'));
$('btnProg').addEventListener('click',()=>showScreen('sProg'));
$('btnSettings').addEventListener('click',()=>showScreen('sSettings'));
$('settingsBack').addEventListener('click',()=>showScreen('sMenu'));
$('pauseBtn').addEventListener('click',()=>pauseGame());

$('progBack').addEventListener('click',()=>showScreen('sMenu'));
$('progReset').addEventListener('click',()=>resetXP());

$('friendsSetName').addEventListener('click',()=>setName());
$('friendsAddFriend').addEventListener('click',()=>addFriend());
$('friendsCreateRoom').addEventListener('click',()=>createRoom());
$('friendsCopyCode').addEventListener('click',()=>copyCode());
$('friendsJoinRoom').addEventListener('click',()=>joinRoom());
$('friendsTeamBlue').addEventListener('click',()=>swTeam('blue'));
$('friendsTeamRed').addEventListener('click',()=>swTeam('red'));
$('friendsStartOnline').addEventListener('click',()=>startOnline());
$('friendsBack').addEventListener('click',()=>showScreen('sMenu'));

$('localDeploy').addEventListener('click',()=>startLocal());
$('localBack').addEventListener('click',()=>showScreen('sMenu'));

$('dE').addEventListener('click',()=>setDiff(-1));
$('dN').addEventListener('click',()=>setDiff(0));
$('dH').addEventListener('click',()=>setDiff(1));
$('dB').addEventListener('click',()=>setDiff(2));
$('soloDeploy').addEventListener('click',()=>startSolo());
$('soloBack').addEventListener('click',()=>showScreen('sMenu'));

// ── Init ─────────────────────────────────────────────────
buildTankSelect();
initInput();
initSettingsControls();
startLoop();
updateXPBar();
buildProgScreen();
renderFriends();

// Colorblind mode swaps team-red for orange across canvas-drawn UI (theme.js)
// and DOM-driven indicators (body.colorblind CSS rules in style.css).
document.body.classList.toggle('colorblind', getSettings().colorblind);
onSettingsChange(s=>document.body.classList.toggle('colorblind', s.colorblind));

runLoadingScreen();
