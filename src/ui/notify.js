import {$} from '../dom.js';

export function notify(msg,col='#c8b870'){const n=$('notif');n.style.color=col;n.textContent=msg;n.style.opacity='1';setTimeout(()=>n.style.opacity='0',2500);}
