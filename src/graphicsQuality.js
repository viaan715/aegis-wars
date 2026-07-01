// Graphics quality tiers -- a single setting drives particle density,
// camera draw distance, and shadow rendering together rather than
// exposing each as an independent slider, since that's the combination
// that actually matters for frame time on lower-end machines and keeps
// the settings UI to one dropdown.
import {getSettings} from './settings.js';

export const QUALITY_TIERS = {
  low:    {label:'Low',    particleScale:0.3,  drawDistance:550,  shadows:false},
  medium: {label:'Medium', particleScale:0.65, drawDistance:1000, shadows:true},
  high:   {label:'High',   particleScale:1,    drawDistance:2000, shadows:true},
};

export function getQualityTier(){
  return QUALITY_TIERS[getSettings().graphicsQuality] || QUALITY_TIERS.high;
}
