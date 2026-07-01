// Unified save export/import. Every feature module owns its own
// localStorage key (progression, crew, customization, achievements, DLC,
// supporter, settings, keybinds, selected tank) -- this just bundles all
// of them into one downloadable JSON file and restores them verbatim, so
// a player who loses localStorage (browser data clear, private window,
// new device) doesn't lose progress.
const SAVE_KEYS = [
  'aegisXP', 'aegisName', 'aegisCrew', 'aegisCustomization',
  'aegisAchievements', 'aegisDLC', 'aegisSupporter', 'aegisSettings',
  'aegisKeybinds', 'aegisSelectedTank',
];
const SAVE_APP_ID = 'aegis-wars';
const SAVE_VERSION = 1;

export function exportSave(){
  const data = {};
  for(const k of SAVE_KEYS){
    const v = localStorage.getItem(k);
    if(v!=null) data[k] = v;
  }
  const payload = {app:SAVE_APP_ID, version:SAVE_VERSION, exportedAt:new Date().toISOString(), data};
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'aegis-wars-save.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Resolves once the file is parsed and applied to localStorage. Callers
// still need to reload the page afterward -- every module that owns a
// save key caches its value in a module-scope variable read once at
// import time, so writing localStorage alone wouldn't update an
// already-running session.
export function importSaveFromFile(file){
  return file.text().then(text=>{
    let payload;
    try{ payload = JSON.parse(text); }
    catch(e){ throw new Error('That file isn\'t valid JSON.'); }
    if(!payload || payload.app!==SAVE_APP_ID || typeof payload.data!=='object'){
      throw new Error('Not an Aegis Wars save file.');
    }
    for(const k of SAVE_KEYS){
      if(payload.data[k]!=null) localStorage.setItem(k, payload.data[k]);
    }
  });
}
