'use strict';
/* ============================== PLAYER ============================== */
const dmgEl=document.getElementById('dmg');
const player={
  mesh:makeUnit('biplane_player',()=>makeBiplane(PLAYER_PAINT)),
  pos:V3(0,60,0), vel:V3(0,0,70),
  quat:new THREE.Quaternion(),
  hp:100, iT:0, boost:0,
  imm:0, // scripted Immelmann timer
  rollSign:1,
  fireT:0, loopAcc:0, loopCd:0,
  pu:{rate:0,quad:0,speed:0,inv:0}
};
const IMM_P=0.62,IMM_R=0.34,IMM_T=IMM_P+IMM_R;
player.mesh.castShadow=true;
fxGroup.add(player.mesh);
function refreshPlayerMesh(){ // hot-swap once the GLB arrives (created above pre-load)
  const m=makeUnit('biplane_player',()=>null);
  if(!m)return;
  m.position.copy(player.mesh.position);
  m.quaternion.copy(player.mesh.quaternion);
  m.visible=player.mesh.visible;
  fxGroup.remove(player.mesh);
  player.mesh.traverse(o=>{if(o.isMesh)o.geometry.dispose();});
  player.mesh=m;
  fxGroup.add(m);
}

const _f=V3(),_rgt=V3(),_up=V3();
function updatePlayer(dt){
  if(player.hp<=0)return;
  player.iT=Math.max(0,player.iT-dt);
  const q=player.quat;
  // scripted Immelmann: half loop up, then half roll — exits reversed, level, higher up
  if(player.imm>0){
    const step=Math.min(dt,player.imm);
    if(player.imm>IMM_R) _q.setFromAxisAngle(_v.set(1,0,0),-(Math.PI/IMM_P)*step);
    else                 _q.setFromAxisAngle(_v.set(0,0,1), (Math.PI/IMM_R)*step);
    q.multiply(_q);
    player.imm-=dt;
  }else{
  // stick input
  const RATE=2.6;
  if(keys.KeyW){_q.setFromAxisAngle(_v.set(1,0,0),-RATE*dt);q.multiply(_q);player.loopAcc+=RATE*dt;}
  else if(keys.KeyS){_q.setFromAxisAngle(_v.set(1,0,0),RATE*dt);q.multiply(_q);player.loopAcc=0;}
  else player.loopAcc=Math.max(0,player.loopAcc-dt*0.4);
  // roll reads screen-relative: flip when the nose points toward the camera
  _v3.set(0,0,1).applyQuaternion(q);
  camera.getWorldDirection(_v2);
  const rd=_v3.dot(_v2);
  if(Math.abs(rd)>0.25)player.rollSign=rd>=0?1:-1; // hysteresis: hold sign while crossing sideways
  const rs=player.rollSign;
  if(keys.KeyA){_q.setFromAxisAngle(_v.set(0,0,1),-3.2*dt*rs);q.multiply(_q);}
  if(keys.KeyD){_q.setFromAxisAngle(_v.set(0,0,1), 3.2*dt*rs);q.multiply(_q);}
  // loop-the-loop stunt
  player.loopCd=Math.max(0,player.loopCd-dt);
  if(player.loopAcc>5.6&&player.loopCd<=0){
    player.loopAcc=0;player.loopCd=4;
    G.score+=600;popupCenter('LOOP-THE-LOOP  +600');sfx('stunt');
  }
  _f.set(0,0,1).applyQuaternion(q);
  _rgt.set(1,0,0).applyQuaternion(q);
  // bank-induced yaw (world Y) — banking turns the plane
  if(Math.abs(_f.y)<0.92){
    _q.setFromAxisAngle(_v.set(0,1,0), -_rgt.y*2.0*dt);
    q.premultiply(_q);
  }
  // mouse steering: gentle world-yaw toward cursor point at own altitude
  const stunting=keys.KeyW||keys.KeyS||keys.KeyA||keys.KeyD;
  const cw=cursorWorldAt(player.pos.y);
  if(cw&&!stunting&&Math.abs(_f.y)<0.92){
    _v2.set(cw.x-player.pos.x,0,cw.z-player.pos.z);
    if(_v2.lengthSq()>60){
      const want=Math.atan2(_v2.x,_v2.z);
      const have=Math.atan2(_f.x,_f.z);
      const d=wrapAngle(want-have);
      _q.setFromAxisAngle(_v.set(0,1,0), clamp(d,-1,1)*2.4*dt);
      q.premultiply(_q);
      // lean into the turn a bit (visual)
      _q.setFromAxisAngle(_v.set(0,0,1), clamp(-d,-1,1)*1.2*dt);
      q.multiply(_q);
    }
  }
  // auto-level when hands off: smoothly return to upright, wings-level flight
  if(!stunting){
    _f.set(0,0,1).applyQuaternion(q);
    let hx=_f.x,hz=_f.z,hl=Math.hypot(hx,hz);
    if(hl<0.05){ // nose near vertical: recover heading from the up vector
      _up.set(0,1,0).applyQuaternion(q);
      const s=_f.y>0?-1:1;
      hx=_up.x*s; hz=_up.z*s; hl=Math.hypot(hx,hz);
    }
    if(hl>0.01){
      _q.setFromAxisAngle(_v.set(0,1,0),Math.atan2(hx,hz)); // level pose at current heading
      q.rotateTowards(_q,2.8*dt);
    }
  }
  } // end manual controls (skipped during Immelmann)
  q.normalize();
  // speed
  const su=player.pu.speed>0;
  const targetSpd=(mouse.r||player.imm>0)?(su?205:142):(su?100:70);
  player.boost=lerp(player.boost,mouse.r?1:0,dt*5);
  const spd=lerp(player.vel.length()||70,targetSpd,dt*3.5);
  _f.set(0,0,1).applyQuaternion(q);
  player.vel.copy(_f).multiplyScalar(spd);
  player.pos.addScaledVector(player.vel,dt);
  // ceiling & world bounds
  if(player.pos.y>260){player.pos.y=260;if(_f.y>0){_q.setFromAxisAngle(_rgt,_f.y*2*dt);q.premultiply(_q);}}
  const out=Math.max(Math.abs(player.pos.x),Math.abs(player.pos.z))-(WORLD+60);
  if(out>0){
    const want=Math.atan2(-player.pos.x,-player.pos.z), have=Math.atan2(_f.x,_f.z);
    _q.setFromAxisAngle(_v.set(0,1,0), clamp(wrapAngle(want-have),-1,1)*2.5*dt);
    q.premultiply(_q);
    if(G.hintT<=0){announce('','RETURN TO THE FIGHT',1500);G.hintT=3;}
  }
  G.hintT=Math.max(0,G.hintT-dt);
  // terrain / water crash-bounce
  const gy=Math.max(G.heightAt(player.pos.x,player.pos.z),G.waterLevel)+1.6;
  if(player.pos.y<gy){
    player.pos.y=gy;
    damagePlayer(22);
    explosion(player.pos.x,gy,player.pos.z,0.8,false);
    if(G.water&&G.heightAt(player.pos.x,player.pos.z)<G.waterLevel)splash(player.pos.x,player.pos.z,1.2);
    _q.setFromAxisAngle(_rgt,-0.5);q.premultiply(_q); // kick nose up
    player.vel.y=Math.abs(player.vel.y)+20;
  }
  // prop wash & boost wake: skimming low over water stirs it up
  if(G.water&&G.heightAt(player.pos.x,player.pos.z)<G.waterLevel){
    const alt=player.pos.y-G.waterLevel;
    const surfY=G.water.position.y+0.6;
    if(alt<26){
      const boosting=mouse.r&&alt<16;
      player.wkT=(player.wkT||0)-dt;
      if(player.wkT<=0){
        player.wkT=boosting?0.06:0.11;
        addRipple(player.pos.x,player.pos.z,(boosting?1.0:0.55)*(1-alt/26)+0.1);
        if(boosting) // flat foam streak on the surface
          spawnP(PS_SOLID,player.pos.x+rr(-2,2),surfY-0.15,player.pos.z+rr(-2,2),
            0,0,0,rr(1.4,2.2),rr(1.2,2),0xf4fafc,0xa9c8cd,0,1,0.18);
      }
      if(alt<10&&R()<dt*(boosting?55:30))
        spawnP(PS_SOLID,player.pos.x+rr(-1,1),surfY,player.pos.z+rr(-1,1),
          rr(-2,2),rr(4,9),rr(-2,2),rr(0.3,0.6),rr(0.5,1),0xeaf2f4,0x9fc3c9,22,0.93);
      if(boosting&&alt<12){ // rooster tail: dense fountain arcing up and raining back down
        _f.set(0,0,1).applyQuaternion(q);
        const near=1-alt/12;
        const bx=player.pos.x-_f.x*5, bz=player.pos.z-_f.z*5;
        for(let k=0;k<4;k++) if(R()<dt*80)
          spawnP(PS_SOLID,bx+rr(-1.2,1.2),surfY,bz+rr(-1.2,1.2),
            -_f.x*rr(8,16)+rr(-5,5), rr(48,75)*(0.65+near*0.45), -_f.z*rr(8,16)+rr(-5,5),
            rr(1.8,2.6),rr(0.6,1.0),0xf2ffff,0x6fa8b4,55,0.99);
        if(R()<dt*40) // glinting droplets catch the sun
          spawnP(PS_GLOW,bx+rr(-1,1),surfY+rr(1,4),bz+rr(-1,1),
            -_f.x*rr(6,13),rr(44,66),-_f.z*rr(6,13),
            rr(1.4,2.0),rr(0.5,0.8),0xeaffff,0x9fd8e0,55,0.99);
      }
    }
  }
  // solid collisions (buildings, bridges…)
  const p=player.pos, r=2.4;
  for(const s of G.solids){
    if(p.x>s.x0-r&&p.x<s.x1+r&&p.y>s.y0-r&&p.y<s.y1+r&&p.z>s.z0-r&&p.z<s.z1+r){
      damagePlayer(26);
      explosion(p.x,p.y,p.z,0.8,false);
      // push out along smallest axis + bounce up
      const cx=(s.x0+s.x1)/2,cz=(s.z0+s.z1)/2;
      _v.set(p.x-cx,3,p.z-cz).normalize();
      p.addScaledVector(_v,6);
      p.y=Math.max(p.y,s.y1+3);
      break;
    }
  }
  // stunt zones
  for(const s of G.stunts){
    s.cd=Math.max(0,s.cd-dt);
    if(s.cd<=0&&p.x>s.x0&&p.x<s.x1&&p.y>s.y0&&p.y<s.y1&&p.z>s.z0&&p.z<s.z1){
      s.cd=8; G.score+=s.pts;
      popupCenter(s.msg+'  +'+s.pts); sfx('stunt');
    }
  }
  // wingtip contrails while rolling (incl. Immelmann roll phase)
  const rolling=keys.KeyA||keys.KeyD||(player.imm>0&&player.imm<=IMM_R);
  if(rolling&&R()<dt*50){
    _rgt.set(1,0,0).applyQuaternion(q);
    for(const side of[-1,1]){
      spawnP(PS_SOLID,
        player.pos.x+_rgt.x*4.6*side, player.pos.y+_rgt.y*4.6*side+0.6, player.pos.z+_rgt.z*4.6*side,
        rr(-0.5,0.5),rr(0.2,0.8),rr(-0.5,0.5), rr(0.45,0.75),rr(0.5,0.85),
        0xf2f5f7,0xcfd8dd,0,0.94);
    }
  }
  // boost exhaust trail
  if((mouse.r||player.imm>0)&&R()<dt*40){
    _f.set(0,0,1).applyQuaternion(q);
    spawnP(PS_SOLID,
      player.pos.x-_f.x*3.4+rr(-0.4,0.4), player.pos.y-_f.y*3.4+rr(-0.2,0.4), player.pos.z-_f.z*3.4+rr(-0.4,0.4),
      rr(-1,1),rr(0.5,1.5),rr(-1,1), rr(0.5,0.9),rr(0.7,1.2),
      0x3c3a36,0x6e6a62,0,0.95);
    if(R()<0.25)spawnP(PS_GLOW,
      player.pos.x-_f.x*3.2, player.pos.y-_f.y*3.2, player.pos.z-_f.z*3.2,
      rr(-0.5,0.5),rr(0,1),rr(-0.5,0.5), rr(0.15,0.3),rr(0.5,0.8),
      0xffc25a,0xff6a2a,0,0.9);
  }
  // golden shimmer while invulnerable
  if(player.pu.inv>0&&R()<dt*30)
    spawnP(PS_GLOW,player.pos.x+rr(-2.5,2.5),player.pos.y+rr(-1.5,2),player.pos.z+rr(-2.5,2.5),
      rr(-1,1),rr(0,2),rr(-1,1),rr(0.25,0.45),rr(0.5,0.9),0xffd76a,0xfff3c0,0,0.92);
  // firing
  player.fireT-=dt;
  if(mouse.l&&player.fireT<=0&&G.state==='play'){
    player.fireT=player.pu.rate>0?0.05:0.1;
    // fire along the nose; generous auto-aim snaps to enemies near the crosshair line
    const dir=_v3.copy(_f);
    let best=null,bd=1e9;
    for(const e of G.enemies){
      if(e.dying)continue;
      _v.set(e.px-p.x,e.py-p.y,e.pz-p.z);
      const d=_v.length();_v.divideScalar(d);
      if(d<300&&_v.dot(dir)>Math.cos(0.26)&&d<bd){bd=d;best=_v.clone();}
    }
    if(best)dir.copy(best);
    const sp=260;
    _rgt.set(1,0,0).applyQuaternion(player.quat);
    for(const side of[-1,1]){
      spawnBullet(p.x+_rgt.x*2*side,p.y+_rgt.y*2*side,p.z+_rgt.z*2*side,
        dir.x*sp+rr(-6,6),dir.y*sp+rr(-4,4),dir.z*sp+rr(-6,6),
        {friendly:true,dmg:player.pu.quad>0?24:6,life:1.4,kind:'mg',color:player.pu.quad>0?0xd18aff:0xffe9a0});
    }
    sfx('gun');
  }
}
function immelmann(){
  if(G.state!=='play'||player.imm>0||player.hp<=0)return;
  player.imm=IMM_T;
  sfx('toggle');
}

