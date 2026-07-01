import './style.css';
import {$} from './dom.js';
import {refreshGarage, initGarage} from './ui/garage.js';
import {getSettings, onSettingsChange} from './settings.js';
import {IS_DEMO} from './demo.js';

document.body.classList.toggle('colorblind', getSettings().colorblind);
onSettingsChange(s=>document.body.classList.toggle('colorblind', s.colorblind));

if(IS_DEMO)$('demoBanner').classList.remove('hidden');

initGarage();
refreshGarage();
