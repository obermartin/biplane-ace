'use strict';
/* ============================== AUDIO ============================== */
let AC=null, masterGain=null, muted=false, lastBoom=0, lastDing=0;
function initAudio(){
  if(AC) return;
  try{
    AC=new (window.AudioContext||window.webkitAudioContext)();
    masterGain=AC.createGain(); masterGain.gain.value=0.2; masterGain.connect(AC.destination);
  }catch(e){}
}
let _noise=null;
function noiseBuf(){
  if(_noise) return _noise;
  const b=AC.createBuffer(1, AC.sampleRate*1.2, AC.sampleRate), d=b.getChannelData(0);
  for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1;
  _noise=b; return b;
}
function spatial(x,y,z){
  const dx=x-player.pos.x,dy=y-player.pos.y,dz=z-player.pos.z;
  const d=Math.hypot(dx,dy,dz);
  const vol=clamp(1/(1+d/300),0.06,1);
  _v.setFromMatrixColumn(camera.matrixWorld,0); // screen-right in world space
  const pan=clamp((dx*_v.x+dy*_v.y+dz*_v.z)/170,-0.85,0.85);
  return {vol,pan};
}
function sfx(kind,px,py,pz){
  if(!AC||muted) return;
  const t=AC.currentTime;
  let out=masterGain;
  if(px!==undefined){
    const sp=spatial(px,py||0,pz||0);
    if(sp.vol<=0.07) return; // too far to hear
    const sg=AC.createGain(); sg.gain.value=sp.vol;
    const pn=AC.createStereoPanner(); pn.pan.value=sp.pan;
    sg.connect(pn); pn.connect(masterGain); out=sg;
  }
  if(kind==='gun'){
    const s=AC.createBufferSource(); s.buffer=noiseBuf(); s.playbackRate.value=1.6+Math.random()*0.5;
    const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1400; f.Q.value=1.2;
    const g=AC.createGain(); g.gain.setValueAtTime(0.5,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.07);
    s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t+0.09);
  }else if(kind==='boom'||kind==='bigboom'){
    if(t-lastBoom<0.05) return; lastBoom=t;
    const dur=kind==='bigboom'?0.9:0.45;
    const s=AC.createBufferSource(); s.buffer=noiseBuf(); s.playbackRate.value=0.4;
    const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(900,t); f.frequency.exponentialRampToValueAtTime(60,t+dur);
    const g=AC.createGain(); g.gain.setValueAtTime(kind==='bigboom'?1.2:0.75,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
    const o=AC.createOscillator(); o.type='sine'; o.frequency.setValueAtTime(100,t); o.frequency.exponentialRampToValueAtTime(24,t+dur*0.8);
    const og=AC.createGain(); og.gain.setValueAtTime(0.95,t); og.gain.exponentialRampToValueAtTime(0.001,t+dur*0.8);
    // initial crack transient
    const c=AC.createBufferSource(); c.buffer=noiseBuf(); c.playbackRate.value=2.2;
    const cf=AC.createBiquadFilter(); cf.type='highpass'; cf.frequency.value=1800;
    const cg=AC.createGain(); cg.gain.setValueAtTime(kind==='bigboom'?0.75:0.5,t); cg.gain.exponentialRampToValueAtTime(0.001,t+0.06);
    c.connect(cf); cf.connect(cg); cg.connect(out);
    s.connect(f); f.connect(g); g.connect(out); o.connect(og); og.connect(out);
    s.start(t); s.stop(t+dur+0.05); o.start(t); o.stop(t+dur); c.start(t); c.stop(t+0.08);
  }else if(kind==='ding'){ // ricochet: your shot connected
    if(t-lastDing<0.06)return; lastDing=t;
    const f0=2200+Math.random()*700; // varied pitch — no two ricochets alike
    // metallic impact click
    const c=AC.createBufferSource(); c.buffer=noiseBuf(); c.playbackRate.value=2.5;
    const cf=AC.createBiquadFilter(); cf.type='highpass'; cf.frequency.value=2500;
    const cg=AC.createGain(); cg.gain.setValueAtTime(0.6,t); cg.gain.exponentialRampToValueAtTime(0.001,t+0.03);
    c.connect(cf); cf.connect(cg); cg.connect(out); c.start(t); c.stop(t+0.04);
    // whine: narrow-band noise sweeping down — noise, not tone, is what sells it
    const s2=AC.createBufferSource(); s2.buffer=noiseBuf(); s2.playbackRate.value=1.4;
    const bf=AC.createBiquadFilter(); bf.type='bandpass'; bf.Q.value=11;
    bf.frequency.setValueAtTime(f0,t); bf.frequency.exponentialRampToValueAtTime(f0*0.25,t+0.22);
    const sg=AC.createGain(); sg.gain.setValueAtTime(1.6,t); sg.gain.exponentialRampToValueAtTime(0.001,t+0.24);
    s2.connect(bf); bf.connect(sg); sg.connect(out); s2.start(t); s2.stop(t+0.26);
  }else if(kind==='hit'){
    const o=AC.createOscillator(); o.type='square'; o.frequency.setValueAtTime(240,t); o.frequency.exponentialRampToValueAtTime(120,t+0.06);
    const g=AC.createGain(); g.gain.setValueAtTime(0.18,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.07);
    o.connect(g); g.connect(out); o.start(t); o.stop(t+0.08);
  }else if(kind==='toggle'){
    const o=AC.createOscillator(); o.type='triangle'; o.frequency.setValueAtTime(520,t); o.frequency.setValueAtTime(760,t+0.06);
    const g=AC.createGain(); g.gain.setValueAtTime(0.2,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.14);
    o.connect(g); g.connect(out); o.start(t); o.stop(t+0.15);
  }else if(kind==='bolt'){
    const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(900,t); o.frequency.exponentialRampToValueAtTime(180,t+0.18);
    const g=AC.createGain(); g.gain.setValueAtTime(0.14,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2);
    o.connect(g); g.connect(out); o.start(t); o.stop(t+0.22);
  }else if(kind==='stunt'){
    const o=AC.createOscillator(); o.type='triangle';
    o.frequency.setValueAtTime(440,t); o.frequency.setValueAtTime(554,t+0.09); o.frequency.setValueAtTime(659,t+0.18);
    const g=AC.createGain(); g.gain.setValueAtTime(0.22,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.4);
    o.connect(g); g.connect(out); o.start(t); o.stop(t+0.42);
  }
}
/* --- engine drone: pitch & volume follow speed, dive, roll --- */
let eng=null;
function startEngine(){
  if(!AC||eng)return;
  const o1=AC.createOscillator();o1.type='sawtooth';o1.frequency.value=62;
  const o2=AC.createOscillator();o2.type='square';o2.frequency.value=31;
  const f=AC.createBiquadFilter();f.type='lowpass';f.frequency.value=560;f.Q.value=1.6;
  const g=AC.createGain();g.gain.value=0;
  const lfo=AC.createOscillator();lfo.type='sine';lfo.frequency.value=18; // prop flutter
  const lg=AC.createGain();lg.gain.value=0;
  lfo.connect(lg);lg.connect(g.gain);
  o1.connect(f);o2.connect(f);f.connect(g);g.connect(masterGain);
  o1.start();o2.start();lfo.start();
  // Jericho siren: detuned saw pair, only audible in steep dives
  const s1=AC.createOscillator();s1.type='sawtooth';s1.frequency.value=400;
  const s2=AC.createOscillator();s2.type='sawtooth';s2.frequency.value=407;
  const sf=AC.createBiquadFilter();sf.type='bandpass';sf.frequency.value=1100;sf.Q.value=1.2;
  const sgn=AC.createGain();sgn.gain.value=0;
  s1.connect(sf);s2.connect(sf);sf.connect(sgn);sgn.connect(masterGain);
  s1.start();s2.start();
  eng={o1,o2,f,g,lfo,lg,s1,s2,sgn};
}
function updateEngine(){
  if(!AC)return;
  if(!eng)startEngine();
  if(!eng)return;
  const t=AC.currentTime;
  let vol=0,fr=58;
  if(G.state==='play'&&player.hp>0){
    const spd=player.vel.length();
    const dive=clamp(-player.vel.y/90,-0.6,1);   // diving screams, climbing labors
    const rollin=(keys.KeyA||keys.KeyD||player.imm>0)?1:0;
    fr=44+spd*0.42+dive*26+rollin*7;
    vol=clamp(0.15+(spd-70)/260+Math.max(0,dive)*0.06+rollin*0.03,0.1,0.32);
    eng.lfo.frequency.setTargetAtTime(14+spd*0.11,t,0.15);
  }
  if(muted)vol=0;
  eng.o1.frequency.setTargetAtTime(fr,t,0.08);
  eng.o2.frequency.setTargetAtTime(fr*0.5,t,0.08);
  eng.f.frequency.setTargetAtTime(360+fr*6.5,t,0.1);
  eng.g.gain.setTargetAtTime(vol,t,0.12);
  eng.lg.gain.setTargetAtTime(vol*0.4,t,0.12);
  // dive howl rises with descent rate
  let sv=0,sfq=400;
  if(G.state==='play'&&player.hp>0){
    const dive=clamp(-player.vel.y/80,0,1.3);
    const k=clamp((dive-0.3)*1.8,0,1); // silent until the dive gets steep
    sfq=380+dive*520;
    sv=muted?0:k*0.3;
  }
  eng.s1.frequency.setTargetAtTime(sfq,t,0.08);
  eng.s2.frequency.setTargetAtTime(sfq*1.017,t,0.08);
  eng.sgn.gain.setTargetAtTime(sv,t,0.1);
}
/* --- enemy engine voices: nearest air enemies hum, panned & attenuated by position --- */
const EVOICE={fighter:{w:'sawtooth',f:88},bomber:{w:'square',f:38},
  saucerS:{w:'sine',f:210},saucerM:{w:'sine',f:150},zeppelin:{w:'square',f:30}};
const eVoices=[];
function initEnemyVoices(){
  if(!AC||eVoices.length)return;
  for(let i=0;i<4;i++){
    const o=AC.createOscillator();o.type='sawtooth';o.frequency.value=80;
    const g=AC.createGain();g.gain.value=0;
    const p=AC.createStereoPanner();
    o.connect(g);g.connect(p);p.connect(masterGain);o.start();
    eVoices.push({o,g,p});
  }
}
function updateEnemyVoices(){
  if(!AC)return;
  initEnemyVoices();
  if(!eVoices.length)return;
  const t=AC.currentTime;
  const air=[];
  if(G.state==='play'&&!muted)
    for(const e of G.enemies){
      const falling=e.dying&&e.def.air&&!e.def.boss;
      if(!falling&&(e.dying||!EVOICE[e.type]))continue;
      const d=Math.hypot(e.px-player.pos.x,e.py-player.pos.y,e.pz-player.pos.z);
      if(d<430)air.push({e,d:falling?d*0.4:d,falling}); // falling planes win voice contention
    }
  air.sort((a,b)=>a.d-b.d);
  for(let i=0;i<eVoices.length;i++){
    const v=eVoices[i];
    if(i<air.length){
      const e=air[i].e;
      const sp=spatial(e.px,e.py,e.pz);
      if(air[i].falling){ // cartoon falling whistle: starts high, slides down as it drops
        if(v.o.type!=='triangle')v.o.type='triangle';
        const fall=Math.max(0,-e.vy);
        v.o.frequency.setTargetAtTime(Math.max(280,1150-fall*9),t,0.06);
        v.g.gain.setTargetAtTime(sp.vol*0.34,t,0.08);
      }else{
        const cfg=EVOICE[e.type];
        if(v.o.type!==cfg.w)v.o.type=cfg.w;
        v.o.frequency.setTargetAtTime(cfg.f+Math.sin(e.t*7)*cfg.f*0.04,t,0.1);
        v.g.gain.setTargetAtTime(sp.vol*0.22,t,0.15);
      }
      v.p.pan.setTargetAtTime(sp.pan,t,0.1);
    }else v.g.gain.setTargetAtTime(0,t,0.15);
  }
}

