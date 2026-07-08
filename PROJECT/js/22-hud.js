'use strict';
/* ============================== HUD ============================== */
const hpFill=document.getElementById('hpfill');
const scoreEl=document.getElementById('score');
const weapEl=document.getElementById('weap');
const objEl=document.getElementById('objective');
const bossbar=document.getElementById('bossbar');
const bossfill=document.getElementById('bossfill');
const bossname=document.getElementById('bossname');
const puBar=document.getElementById('pubar');
const arrowEl=document.getElementById('arrow');
const arrowD=document.getElementById('arrowd');
const hudEl=document.getElementById('hud');
const xhEl=document.getElementById('xh');
function updateHudStatic(){
  weapEl.textContent='✚ MACHINE GUNS';
}
function updateHud(){
  const play=G.state==='play'||G.state==='won'||G.state==='dead';
  hudEl.style.display=play?'block':'none';
  xhEl.style.opacity=(G.state==='play')?1:0;
  if(!play)return;
  hpFill.style.width=player.hp+'%';
  hpFill.style.background=player.hp>50?'#7dbb6a':player.hp>25?'#d8a23c':'#c9342c';
  weapEl.textContent=player.imm>0?'⟲ IMMELMANN!':'✚ MACHINE GUNS';
  let ph='';
  const PN={rate:'×2 RATE',quad:'×4 DMG',speed:'SPEED',inv:'SHIELD'};
  for(const k of['rate','quad','speed','inv'])
    if(player.pu[k]>0){
      const blink=player.pu[k]<5&&Math.floor(G.time*5)%2===0; // flash when about to expire
      const w=Math.min(player.pu[k]/30,1)*100; // fill drains like a status bar
      ph+=`<span style="color:#${PU_TYPES[k].c.toString(16).padStart(6,'0')};opacity:${blink?0.35:1}"><i style="width:${w}%"></i><b>${PN[k]}</b></span>`;
    }
  puBar.innerHTML=ph;
  scoreEl.textContent=G.score;
  if(G.li===3){
    objEl.textContent=G.boss?'DESTROY THE BOSS':'BOSS INBOUND…';
  }else objEl.textContent='VICTORIES  '+G.kills+' / '+G.quota;
  if(G.boss&&!G.boss.dying){
    bossbar.style.display='block';
    bossname.textContent=G.boss.def.name;
    bossfill.style.width=(G.boss.hp/G.boss.maxhp*100)+'%';
  }else bossbar.style.display='none';
  // enemy pointer: orbits the plane, points at the boss or nearest enemy, shows distance
  let best=(G.boss&&!G.boss.dying)?G.boss:null,bd=1e9;
  if(!best)for(const e of G.enemies){if(e.dying)continue;
    const d=Math.hypot(e.px-player.pos.x,e.pz-player.pos.z);
    if(d<bd){bd=d;best=e;}}
  if(best){
    const s=project(best.px,best.py,best.pz);
    const m=60;
    if(s.x<m||s.x>innerWidth-m||s.y<m||s.y>innerHeight-m){
      const cx=innerWidth/2,cy=innerHeight/2;
      const a=Math.atan2(s.y-cy,s.x-cx)+Math.PI/2; // css rotate: 0 = triangle up
      arrowEl.style.display='block';
      arrowEl.style.transform=`rotate(${a}rad)`;
      arrowD.textContent=Math.round(Math.hypot(best.px-player.pos.x,best.pz-player.pos.z))+' m';
      arrowD.style.transform=`translateX(-50%) rotate(${-a}rad)`;
    }else arrowEl.style.display='none';
  }else arrowEl.style.display='none';
}

