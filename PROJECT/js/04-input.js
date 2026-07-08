'use strict';
/* ============================== INPUT ============================== */
const keys={};
const mouse={x:innerWidth/2,y:innerHeight/2,ndc:new THREE.Vector2(0,0),l:false,r:false};
window.addEventListener('keydown',e=>{
  initAudio();
  keys[e.code]=true;
  if(e.code==='Escape') onEscape();
  if(e.code==='KeyQ') immelmann();
  if(e.code==='KeyM'){muted=!muted; popupCenter(muted?'SOUND OFF':'SOUND ON');}
});
window.addEventListener('keyup',e=>{keys[e.code]=false;});
window.addEventListener('mousemove',e=>{
  mouse.x=e.clientX; mouse.y=e.clientY;
  mouse.ndc.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
  document.getElementById('xh').style.transform=`translate(${e.clientX}px,${e.clientY}px)`;
});
window.addEventListener('mousedown',e=>{
  initAudio();
  if(e.button===0) mouse.l=true;
  if(e.button===2) mouse.r=true;
  if(e.button===1){e.preventDefault(); immelmann();}
});
window.addEventListener('mouseup',e=>{
  if(e.button===0) mouse.l=false;
  if(e.button===2) mouse.r=false;
});
window.addEventListener('contextmenu',e=>e.preventDefault());
window.addEventListener('blur',()=>{mouse.l=false;mouse.r=false;for(const k in keys)keys[k]=false;});

const rayc=new THREE.Raycaster();
const _cw=new THREE.Vector3();
function cursorWorldAt(y){ // world point under cursor at altitude y
  rayc.setFromCamera(mouse.ndc,camera);
  const o=rayc.ray.origin,d=rayc.ray.direction;
  const t=(y-o.y)/d.y;
  return _cw.set(o.x+d.x*t, y, o.z+d.z*t);
}

