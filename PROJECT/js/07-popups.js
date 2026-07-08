'use strict';
/* ============================== POPUPS / ANNOUNCE ============================== */
const popsEl=document.getElementById('pops');
function project(x,y,z){
  _v.set(x,y,z).project(camera);
  return {x:(_v.x*0.5+0.5)*innerWidth, y:(-_v.y*0.5+0.5)*innerHeight, front:_v.z<1};
}
function popup(x,y,z,text,stunt){
  const s=project(x,y,z);
  if(!s.front) return;
  const d=document.createElement('div');
  d.className='pop'+(stunt?' stunt':'');
  d.textContent=text;
  d.style.left=s.x+'px'; d.style.top=s.y+'px';
  popsEl.appendChild(d);
  setTimeout(()=>d.remove(),1400);
}
function popupCenter(text){
  const d=document.createElement('div');
  d.className='pop stunt';
  d.textContent=text;
  d.style.left='50%'; d.style.top='38%';
  popsEl.appendChild(d);
  setTimeout(()=>d.remove(),1400);
}
let announceT=null;
function announce(small,big,hold){
  const el=document.getElementById('announce');
  el.querySelector('.a1').textContent=small;
  el.querySelector('.a2').textContent=big;
  el.style.opacity=1;
  clearTimeout(announceT);
  announceT=setTimeout(()=>{el.style.opacity=0;},hold||2400);
}

