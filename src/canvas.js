import {$} from './dom.js';

// gc is now owned by the Three.js WebGLRenderer (render3d.js) -- it can
// only have one context type for its lifetime, so we no longer grab a 2D
// context from it here. The minimap stays a separate 2D canvas.
export const gc=$('gc');
export const mmc=$('mmcanvas2');
export const mmx=mmc.getContext('2d');
