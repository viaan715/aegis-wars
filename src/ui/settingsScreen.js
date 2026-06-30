import {$} from '../dom.js';
import {getSettings, setVolume, setMuted, setColorblind, setScreenShake, setGraphicsQuality} from '../settings.js';
import {keybinds, ACTION_LABELS, DEFAULT_KEYBINDS, setKey, resetKeybinds} from '../keybinds.js';
import {exportSave, importSaveFromFile} from '../saveData.js';
import {notify} from './notify.js';
import {refreshGamepadStatus} from '../game/gamepad.js';

function keyDisplayName(k){
  if(k===' ')return 'SPACE';
  if(k.length===1)return k.toUpperCase();
  return k;
}

let listening = null;

function buildKeybindList(){
  const c = $('keybindList');
  c.innerHTML = '';
  Object.keys(DEFAULT_KEYBINDS).forEach(action=>{
    const row = document.createElement('div');
    row.className = 'keybind-row';
    const label = document.createElement('span');
    label.className = 'kb-action';
    label.textContent = ACTION_LABELS[action] || action;
    const keyBtn = document.createElement('span');
    keyBtn.className = 'kb-key';
    keyBtn.textContent = keyDisplayName(keybinds[action]);
    keyBtn.onclick = ()=>startListening(action, keyBtn);
    row.appendChild(label);
    row.appendChild(keyBtn);
    c.appendChild(row);
  });
}

function startListening(action, keyBtn){
  if(listening) return;
  listening = {action, keyBtn};
  keyBtn.classList.add('listening');
  keyBtn.textContent = '...';
}

// Capture phase so a rebind keystroke is consumed here and never reaches
// the in-game keydown handler in game/input.js.
document.addEventListener('keydown', e=>{
  if(!listening) return;
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  if(e.key==='Escape'){
    listening.keyBtn.textContent = keyDisplayName(keybinds[listening.action]);
    listening.keyBtn.classList.remove('listening');
    listening = null;
    return;
  }
  setKey(listening.action, e.key);
  listening.keyBtn.textContent = keyDisplayName(e.key);
  listening.keyBtn.classList.remove('listening');
  listening = null;
}, true);

export function buildSettingsScreen(){
  const s = getSettings();
  $('volumeSlider').value = Math.round(s.volume*100);
  $('muteToggle').checked = s.muted;
  $('colorblindToggle').checked = s.colorblind;
  $('screenShakeToggle').checked = s.screenShake;
  $('graphicsQualitySelect').value = s.graphicsQuality;
  buildKeybindList();
  refreshGamepadStatus();
}

export function initSettingsControls(){
  $('volumeSlider').addEventListener('input', e=>setVolume(e.target.value/100));
  $('muteToggle').addEventListener('change', e=>setMuted(e.target.checked));
  $('colorblindToggle').addEventListener('change', e=>setColorblind(e.target.checked));
  $('screenShakeToggle').addEventListener('change', e=>setScreenShake(e.target.checked));
  $('graphicsQualitySelect').addEventListener('change', e=>setGraphicsQuality(e.target.value));
  $('keybindReset').addEventListener('click', ()=>{resetKeybinds();buildKeybindList();});

  $('saveExportBtn').addEventListener('click', ()=>{exportSave();notify('Save exported','#7a9a70');});
  $('saveImportBtn').addEventListener('click', ()=>$('saveImportInput').click());
  $('saveImportInput').addEventListener('change', e=>{
    const file = e.target.files[0];
    e.target.value = '';
    if(!file) return;
    importSaveFromFile(file).then(()=>{
      if(confirm('Save imported. Reload now to apply it?')) location.reload();
    }).catch(err=>{
      notify(err.message || 'Import failed','#e05050');
    });
  });
}
