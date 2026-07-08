'use strict';
/* ============================== CAMPAIGNS & LEVEL MANAGER ============================== */
const CAMPAIGNS=[
  {name:'VERDUN',sub:'the western front · 1916',gen:0,boss:'zeppelin',
   levels:['NO MAN\u2019S LAND','THE MUD BELT','FORT SOUFFRANCE','SHADOW OF THE ZEPPELIN'],
   table:[['fighter',5],['bomber',2],['balloon',2],['tank',3],['truck',3]]},
  {name:'ISLAND HOPPING',sub:'the turquoise campaign',gen:1,boss:'battleship',
   levels:['ATOLL PATROL','SMUGGLER\u2019S REEF','TYPHOON STRAIT','THE THUNDERER'],
   table:[['fighter',5],['bomber',2],['boatS',4],['boatM',2]]},
  {name:'VISITORS',sub:'america · 1926',gen:2,boss:'robot',
   levels:['CORNFIELD CONTACT','MAIN STREET PANIC','METROPOLIS UNDER FIRE','THE COLOSSUS'],
   table:[['saucerS',5],['saucerM',2],['tripod',2]]},
];
function clearLevel(){
  clearBullets();
  for(const e of G.enemies)entGroup.remove(e.mesh);
  G.enemies.length=0; G.boss=null;
  G.solids.length=0; G.stunts.length=0; G.emitters.length=0;
  for(const s of G.spinners)worldGroup.remove(s.obj);
  G.spinners.length=0;
  G.pus.length=0;
  if(G.water){G.water.material.dispose();G.water=null;}
  disposeGroup(worldGroup); disposeGroup(entGroup);
}
function loadLevel(ci,li){
  clearLevel();
  G.ci=ci;G.li=li;G.kills=0;G.state='play';
  R=mulberry32(1234+ci*97+li*13);
  GENS[CAMPAIGNS[ci].gen](li);
  R=Math.random;
  G.quota=[12,18,24,0][li];
  G.spawnT=1.5;
  player.hp=100;player.iT=1;player.imm=0;player.loopAcc=0;
  player.pu.rate=0;player.pu.quad=0;player.pu.speed=0;player.pu.inv=0;
  player.pos.set(0,70,-WORLD*0.55);
  player.quat.identity();
  player.vel.set(0,0,70);
  camTarget.copy(player.pos);
  for(let i=0;i<4+li*2;i++)spawnPU();
  if(li===3)setTimeout(()=>{if(G.state==='play')spawnEnemy(CAMPAIGNS[ci].boss,rr(-200,200),rr(-100,200));},1800);
  hideScreen();
  const C=CAMPAIGNS[ci];
  announce(C.name+' · MISSION '+(li+1),C.levels[li],3000);
  updateHudStatic();
}
function pickSpawnType(){
  const T=CAMPAIGNS[G.ci].table;
  let tot=0;for(const[,w]of T)tot+=w;
  let r=R()*tot;
  for(const[t,w]of T){r-=w;if(r<=0)return t;}
  return T[0][0];
}
function updateSpawner(dt){
  const maxAlive=(G.li===3?4:5+G.li*2);
  let alive=0;for(const e of G.enemies)if(!e.def.boss&&!e.dying)alive++;
  if(alive>=maxAlive)return;
  G.spawnT-=dt;
  if(G.spawnT>0)return;
  G.spawnT=(G.li===3?rr(3.5,5.5):rr(1.6,3))- G.li*0.2;
  let type=pickSpawnType();
  const def=ETYPES[type];
  let x,z,ok=false;
  for(let t=0;t<24&&!ok;t++){
    if(def.air){
      const a=rr(0,TAU),r=rr(600,900);
      x=clamp(player.pos.x+Math.cos(a)*r,-WORLD,WORLD);
      z=clamp(player.pos.z+Math.sin(a)*r,-WORLD,WORLD);
      ok=true;
    }else{
      x=rr(-WORLD,WORLD);z=rr(-WORLD,WORLD);
      const h=G.heightAt(x,z);
      const wantsWater=(type==='boatS'||type==='boatM');
      ok=wantsWater? h<=G.waterLevel+0.3 : h>G.waterLevel+0.5;
      if(Math.hypot(x-player.pos.x,z-player.pos.z)<150)ok=false;
    }
  }
  if(ok)spawnEnemy(type,x,z);
}
function levelWon(){
  if(G.state!=='play')return;
  G.state='won';
  sfx('stunt');
  if(G.li<3)G.unlocked[G.ci]=Math.max(G.unlocked[G.ci],G.li+2);
  announce('MISSION COMPLETE','+1000 BONUS',2500);
  G.score+=1000;
  setTimeout(()=>{
    if(G.li<3) showScreen(`
      <div class="card ctr"><div class="title">MISSION<br>COMPLETE<small>${CAMPAIGNS[G.ci].levels[G.li]}</small></div>
      <div class="rule"></div>
      <div class="stat">SCORE <b>${G.score}</b></div>
      <button class="btn" data-act="next">NEXT MISSION</button>
      <button class="btn ghost" data-act="retry">FLY AGAIN</button>
      <button class="btn ghost" data-act="menu">HANGAR</button></div>`);
    else showScreen(`
      <div class="card ctr"><div class="title">CAMPAIGN<br>COMPLETE<small>${CAMPAIGNS[G.ci].name}</small></div>
      <div class="rule"></div>
      <div class="stat">FINAL SCORE <b>${G.score}</b></div>
      <button class="btn" data-act="menu">RETURN TO HANGAR</button></div>`);
  },1600);
}
function playerDown(){
  if(G.water&&G.heightAt(player.pos.x,player.pos.z)<G.waterLevel&&player.pos.y-G.waterLevel<12)splash(player.pos.x,player.pos.z,2);
  explosion(player.pos.x,player.pos.y,player.pos.z,3.4,true);
  shake=1;
  G.state='dead';
  setTimeout(()=>showScreen(`
    <div class="card ctr"><div class="title">SHOT<br>DOWN<small>${CAMPAIGNS[G.ci].levels[G.li]}</small></div>
    <div class="rule"></div>
    <div class="stat">SCORE <b>${G.score}</b></div>
    <button class="btn" data-act="retry">FLY AGAIN</button>
    <button class="btn ghost" data-act="menu">HANGAR</button></div>`),1300);
}
function onEscape(){
  if(G.state==='play'){G.state='pause';showScreen(`
    <div class="card ctr"><div class="title">PAUSED</div>
    <div class="rule"></div>
    <div class="help"><b>LMB</b> fire &nbsp; <b>RMB</b> boost &nbsp; <b>MMB / Q</b> immelmann turn<br><b>W S</b> pitch &nbsp; <b>A D</b> roll &nbsp; <b>M</b> mute</div>
    <button class="btn" data-act="resume">RESUME</button>
    <button class="btn ghost" data-act="retry">RESTART MISSION</button>
    <button class="btn ghost" data-act="menu">HANGAR</button></div>`);}
  else if(G.state==='pause'){G.state='play';hideScreen();}
}

