'use strict';
window.addEventListener('error', e=>{const d=document.getElementById('err');d.style.display='block';d.textContent=e.message+' @'+e.lineno;});
/* ============================== UTILS ============================== */
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
function wrapAngle(a){while(a>Math.PI)a-=TAU;while(a<-Math.PI)a+=TAU;return a;}
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
let R=Math.random;
const rr=(a,b)=>a+R()*(b-a);
const ri=(a,b)=>Math.floor(a+R()*(b-a+1));
const pick=arr=>arr[Math.floor(R()*arr.length)];
const V3=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);
const _v=V3(), _v2=V3(), _v3=V3(), _q=new THREE.Quaternion(), _m=new THREE.Matrix4(), _e=new THREE.Euler();

