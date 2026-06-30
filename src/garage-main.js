import './style.css';
import {refreshGarage, initGarage} from './ui/garage.js';
import {getSettings, onSettingsChange} from './settings.js';

document.body.classList.toggle('colorblind', getSettings().colorblind);
onSettingsChange(s=>document.body.classList.toggle('colorblind', s.colorblind));

initGarage();
refreshGarage();
