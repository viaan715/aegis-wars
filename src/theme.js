// Colorblind-safe palette for team/zone indicators. Blue is left as-is
// (it reads fine for all common forms of color blindness); the "red"
// team/enemy/hostile-zone color is swapped for an orange that stays
// clearly distinct from blue under deuteranopia/protanopia/tritanopia.
import {getSettings} from './settings.js';

const PALETTES = {
  normal: {
    red:'#c03030', redLight:'#e05050', redDark:'#5a2020', redMid:'#8a3030',
    redRgba:(a)=>`rgba(192,48,48,${a})`,
  },
  colorblind: {
    red:'#e0962a', redLight:'#f0b050', redDark:'#5a3a08', redMid:'#a06a18',
    redRgba:(a)=>`rgba(224,150,42,${a})`,
  },
};

export function pal(){
  return getSettings().colorblind ? PALETTES.colorblind : PALETTES.normal;
}
