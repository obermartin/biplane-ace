'use strict';
/* ============================== MENU / SCREENS ============================== */
const screenEl=document.getElementById('screen');
function showScreen(html){screenEl.innerHTML=html;screenEl.style.display='flex';}
function hideScreen(){screenEl.style.display='none';screenEl.innerHTML='';}
function showMenu(){
  G.state='menu';
  clearLevel();
  // pretty idle backdrop
  R=mulberry32(777);GENS[1](0);R=Math.random;
  player.pos.set(0,70,0);player.quat.identity();
  let rows='';
  CAMPAIGNS.forEach((C,ci)=>{
    rows+=`<div class="camp" data-camp="${ci}">
      <div class="num">${ci+1}</div>
      <div><h3>${C.name}</h3><p>${C.sub}</p></div></div>`;
  });
  showScreen(`
    <div class="card">
      <div class="title">TINY&nbsp;ACES<small>A&nbsp;MINIATURE&nbsp;AIR&nbsp;WAR</small></div>
      <div class="rule"></div>
      ${rows}
      <div class="rule"></div>
      <div class="help ctr"><b>MOUSE</b> aim · <b>LMB</b> fire · <b>RMB</b> boost · <b>MMB / Q</b> immelmann · <b>WASD</b> stunts<br>fly under bridges &amp; through barns for bonus points</div>
    </div>`);
}
function showCampaign(ci){
  const C=CAMPAIGNS[ci];
  let tiles='';
  C.levels.forEach((L,li)=>{
    const locked=li+1>G.unlocked[ci];
    tiles+=`<div class="lvl${locked?' locked':''}" ${locked?'':`data-ci="${ci}" data-li="${li}"`}>
      <div class="n">${locked?'✕':li+1}</div><div class="nm">${L}</div>${li===3?'<div class="bosslbl">BOSS</div>':''}</div>`;
  });
  showScreen(`
    <div class="card">
      <div class="title">${C.name}<small>${C.sub.toUpperCase()}</small></div>
      <div class="rule"></div>
      <div class="lvlrow">${tiles}</div>
      <div class="ctr"><button class="btn ghost" data-act="menu">◂ HANGAR</button></div>
    </div>`);
}
screenEl.addEventListener('click',e=>{
  initAudio();
  const c=e.target.closest('.camp');
  if(c){showCampaign(+c.dataset.camp);return;}
  const l=e.target.closest('.lvl');
  if(l&&l.dataset.ci!==undefined){loadLevel(+l.dataset.ci,+l.dataset.li);return;}
  const b=e.target.closest('button'); if(!b)return;
  const act=b.dataset.act;
  if(act==='next')loadLevel(G.ci,G.li+1);
  else if(act==='retry')loadLevel(G.ci,G.li);
  else if(act==='resume'){G.state='play';hideScreen();}
  else if(act==='menu')showMenu();
});

