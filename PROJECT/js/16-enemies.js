'use strict';
/* ============================== ENEMIES ============================== */
function aimAtPlayer(e,lead){ // returns normalized dir with simple lead
  const L=lead||0;
  _v.set(player.pos.x+player.vel.x*L-e.px, player.pos.y+player.vel.y*L-e.py, player.pos.z+player.vel.z*L-e.pz);
  const d=_v.length(); _v.divideScalar(d||1);
  return {dx:_v.x,dy:_v.y,dz:_v.z,dist:d};
}
function fireEBullet(e,y0,speed,dmg,lead,color){
  const a=aimAtPlayer(e,lead);
  spawnBullet(e.px,e.py+ (y0||0),e.pz, a.dx*speed,a.dy*speed,a.dz*speed,
    {friendly:false,dmg,color:color||0xff8a5a,life:3.5,kind:'mg'});
  sfx('gun',e.px,e.py,e.pz);
}
function fireBolt(e,y0,speed,dmg){
  const a=aimAtPlayer(e,0.15);
  spawnBullet(e.px,e.py+(y0||0),e.pz, a.dx*speed,a.dy*speed,a.dz*speed,
    {friendly:false,dmg,color:0x8aff6a,life:3.5,kind:'bolt'});
  sfx('bolt',e.px,e.py,e.pz);
}
function fireFlak(e,y0){
  const a=aimAtPlayer(e,rr(0.5,0.9));
  const sp=110, fuse=a.dist/sp*rr(0.9,1.05);
  spawnBullet(e.px,e.py+(y0||0),e.pz, a.dx*sp,a.dy*sp,a.dz*sp,
    {friendly:false,dmg:0,color:0xd8d2c2,life:4,kind:'flak',fuse,aoe:16});
  sfx('gun',e.px,e.py,e.pz);
}
function groundY(e){ return G.heightAt(e.px,e.pz); }

const ETYPES={
  fighter:{air:true,hp:22,score:150,ram:12,make:()=>makeUnit('biplane_enemy',()=>makeBiplane(ENEMY_PAINT)),
    init:e=>{e.state='pursue';e.st=rr(2,4);e.spd=rr(52,64);e.alt=rr(30,70);e.burst=0;},
    up:(e,dt)=>{
      e.st-=dt;
      const a=aimAtPlayer(e,0);
      if(e.state==='pursue'){
        e.thd=Math.atan2(a.dx,a.dz);
        if(e.st<=0||a.dist<40){e.state='extend';e.st=rr(1.6,2.8);e.thd=e.hd+rr(-1,1)+Math.PI;}
        e.burst-=dt;
        if(a.dist<220&&e.burst<=0&&Math.abs(wrapAngle(e.thd-e.hd))<0.4){
          fireEBullet(e,0,150,5,0.12); e.shots=(e.shots||0)+1;
          e.burst=e.shots%4===0?rr(0.9,1.5):0.13;
        }
      }else if(e.st<=0){e.state='pursue';e.st=rr(2.5,4.5);}
      e.hd+=clamp(wrapAngle(e.thd-e.hd),-1,1)*2.2*dt;
      e.talt=e.state==='pursue'?player.pos.y+rr(-2,2):e.alt;
      e.py+=clamp(e.talt-e.py,-24,24)*dt;
      e.px+=Math.sin(e.hd)*e.spd*dt; e.pz+=Math.cos(e.hd)*e.spd*dt;
      e.roll=clamp(wrapAngle(e.thd-e.hd),-0.9,0.9);
    }},
  bomber:{air:true,hp:60,score:300,ram:18,make:()=>makeUnit('bomber',makeBomber),
    init:e=>{e.hd=rr(0,TAU);e.spd=34;e.py=rr(45,80);e.cool=rr(1,3);e.tail=rr(0.5,1.5);},
    up:(e,dt)=>{
      e.px+=Math.sin(e.hd)*e.spd*dt; e.pz+=Math.cos(e.hd)*e.spd*dt;
      if(Math.abs(e.px)>WORLD||Math.abs(e.pz)>WORLD) e.hd+=Math.PI*(dt>0?1:0), e.hd=Math.atan2(-e.px,-e.pz)+rr(-0.4,0.4);
      e.cool-=dt;
      if(e.cool<=0){ // drop a bomb
        spawnBullet(e.px,e.py-2,e.pz, Math.sin(e.hd)*e.spd,0,Math.cos(e.hd)*e.spd,
          {friendly:false,dmg:20,life:6,kind:'bomb',aoe:20});
        e.cool=rr(2.5,4);
      }
      e.tail-=dt;
      const a=aimAtPlayer(e,0.1);
      if(e.tail<=0&&a.dist<180){fireEBullet(e,-1,130,4,0.1);e.tail=0.6;}
      e.roll=0;
    }},
  balloon:{air:true,hp:30,score:100,ram:16,make:()=>makeUnit('balloon',makeBalloon),
    init:e=>{e.py=rr(40,90);e.b=rr(0,TAU);},
    up:(e,dt)=>{e.b+=dt;e.py+=Math.sin(e.b*0.8)*0.8*dt;e.roll=0;}},
  tank:{air:false,hp:50,score:200,ram:0,make:()=>makeUnit('tank',makeTank),
    init:e=>{e.hd=rr(0,TAU);e.spd=7;e.cool=rr(1,3);},
    up:(e,dt)=>{
      e.hd+=rr(-0.3,0.3)*dt;
      e.px+=Math.sin(e.hd)*e.spd*dt; e.pz+=Math.cos(e.hd)*e.spd*dt;
      e.px=clamp(e.px,-WORLD,WORLD); e.pz=clamp(e.pz,-WORLD,WORLD);
      e.py=groundY(e)+1.2;
      e.cool-=dt;
      const a=aimAtPlayer(e,0);
      if(e.cool<=0&&a.dist<320){fireFlak(e,3);e.cool=rr(1.6,2.6);}
      if(e.mesh.userData.turret) e.tur=Math.atan2(a.dx,a.dz)-e.hd;
    }},
  truck:{air:false,hp:24,score:150,ram:0,make:()=>makeUnit('truck',makeTruck),
    init:e=>{e.hd=rr(0,TAU);e.spd=16;e.cool=rr(0.5,2);},
    up:(e,dt)=>{
      e.hd+=rr(-0.5,0.5)*dt;
      e.px+=Math.sin(e.hd)*e.spd*dt; e.pz+=Math.cos(e.hd)*e.spd*dt;
      e.px=clamp(e.px,-WORLD,WORLD); e.pz=clamp(e.pz,-WORLD,WORLD);
      e.py=groundY(e)+1;
      e.cool-=dt;
      const a=aimAtPlayer(e,0);
      if(e.cool<=0&&a.dist<240){
        for(let k=0;k<3;k++) setTimeout(()=>{if(e.hp>0)fireEBullet(e,2.5,140,3,0.12);},k*90);
        e.cool=rr(1.2,2);
      }
      if(e.mesh.userData.turret) e.tur=Math.atan2(a.dx,a.dz)-e.hd;
    }},
  boatS:{air:false,hp:20,score:150,ram:0,make:()=>makeUnit('boat_s',()=>makeBoat(1)),
    init:e=>{e.hd=rr(0,TAU);e.spd=18;e.cool=rr(0.5,2);},
    up:(e,dt)=>{
      e.hd+=rr(-0.4,0.4)*dt;
      const nx=e.px+Math.sin(e.hd)*e.spd*dt, nz=e.pz+Math.cos(e.hd)*e.spd*dt;
      if(G.heightAt(nx,nz)<=G.waterLevel+0.5){e.px=nx;e.pz=nz;}else e.hd+=2*dt;
      e.py=G.waterLevel+0.4;
      e.cool-=dt;
      const a=aimAtPlayer(e,0);
      if(e.cool<=0&&a.dist<230){fireEBullet(e,2,140,3,0.12);e.cool=0.5;}
      if(e.mesh.userData.turret) e.tur=Math.atan2(a.dx,a.dz)-e.hd;
    }},
  boatM:{air:false,hp:60,score:300,ram:0,make:()=>makeUnit('boat_m',()=>makeBoat(2)),
    init:e=>{e.hd=rr(0,TAU);e.spd=11;e.cool=rr(1,2);},
    up:(e,dt)=>{
      e.hd+=rr(-0.25,0.25)*dt;
      const nx=e.px+Math.sin(e.hd)*e.spd*dt, nz=e.pz+Math.cos(e.hd)*e.spd*dt;
      if(G.heightAt(nx,nz)<=G.waterLevel+0.5){e.px=nx;e.pz=nz;}else e.hd+=1.6*dt;
      e.py=G.waterLevel+0.6;
      e.cool-=dt;
      const a=aimAtPlayer(e,0);
      if(e.cool<=0&&a.dist<340){fireFlak(e,4);e.cool=rr(1.4,2.2);}
      if(e.mesh.userData.turret) e.tur=Math.atan2(a.dx,a.dz)-e.hd;
    }},
  saucerS:{air:true,hp:26,score:200,ram:14,make:()=>makeUnit('saucer_s',()=>makeSaucer(1)),
    init:e=>{e.py=rr(35,80);e.tx=e.px;e.tz=e.pz;e.ty=e.py;e.st=0;e.cool=rr(0.8,1.8);},
    up:(e,dt)=>{
      e.st-=dt;
      if(e.st<=0){ // pick a strafe target near player
        const a=rr(0,TAU),r=rr(80,170);
        e.tx=player.pos.x+Math.cos(a)*r; e.tz=player.pos.z+Math.sin(a)*r;
        e.ty=clamp(player.pos.y+rr(-8,15),15,180); e.st=rr(1.6,2.8);
      }
      e.px+=(e.tx-e.px)*1.6*dt; e.pz+=(e.tz-e.pz)*1.6*dt; e.py+=(e.ty-e.py)*1.6*dt;
      e.cool-=dt;
      const a2=aimAtPlayer(e,0);
      if(e.cool<=0&&a2.dist<260){fireBolt(e,-1,160,4);e.cool=rr(1.3,2.1);}
      e.hd+=4*dt; e.roll=0;
    }},
  saucerM:{air:true,hp:70,score:400,ram:20,make:()=>makeUnit('saucer_m',()=>makeSaucer(1.9)),
    init:e=>{e.py=rr(50,100);e.tx=e.px;e.tz=e.pz;e.ty=e.py;e.st=0;e.cool=rr(1,2);},
    up:(e,dt)=>{
      e.st-=dt;
      if(e.st<=0){
        const a=rr(0,TAU),r=rr(100,210);
        e.tx=player.pos.x+Math.cos(a)*r; e.tz=player.pos.z+Math.sin(a)*r;
        e.ty=clamp(player.pos.y+rr(0,25),25,190); e.st=rr(2.2,3.6);
      }
      e.px+=(e.tx-e.px)*1.1*dt; e.pz+=(e.tz-e.pz)*1.1*dt; e.py+=(e.ty-e.py)*1.1*dt;
      e.cool-=dt;
      const a2=aimAtPlayer(e,0);
      if(e.cool<=0&&a2.dist<320){
        for(let k=0;k<3;k++) setTimeout(()=>{if(e.hp>0)fireBolt(e,-2,150,5);},k*140);
        e.cool=rr(2.2,3.2);
      }
      e.hd+=2.5*dt; e.roll=0;
    }},
  tripod:{air:false,hp:110,score:500,ram:0,make:()=>makeUnit('tripod',makeTripod),
    init:e=>{e.hd=rr(0,TAU);e.spd=9;e.cool=rr(2,3);e.charge=0;e.step=0;},
    up:(e,dt)=>{
      const a=aimAtPlayer(e,0);
      if(e.charge>0){ // telegraphed heat ray
        e.charge-=dt;
        if(e.charge<=0){
          for(let k=0;k<4;k++) setTimeout(()=>{if(e.hp>0)fireBolt(e,16,190,5);},k*70);
          e.cool=rr(2.2,3.4);
        }
      }else{
        e.thd=Math.atan2(a.dx,a.dz);
        e.hd+=clamp(wrapAngle(e.thd-e.hd),-1,1)*0.8*dt;
        if(a.dist>90){e.px+=Math.sin(e.hd)*e.spd*dt;e.pz+=Math.cos(e.hd)*e.spd*dt;e.step+=dt*4;}
        e.cool-=dt;
        if(e.cool<=0&&a.dist<300){e.charge=0.8; if(e.mesh.userData.eye)e.mesh.userData.eye.material.color.set(0xff4a3a);}
      }
      e.py=groundY(e)+11;
      // leg shuffle on ticks handled in sync
    },
    sync:e=>{
      if(e.mesh.userData.legs) e.mesh.userData.legs.forEach((l,i)=>{l.rotation.x=Math.sin(e.step+i*2.1)*0.28;});
      if(e.charge<=0&&e.mesh.userData.eye)e.mesh.userData.eye.material.color.set(0x8aff6a);
    }},
  /* ---- bosses ---- */
  zeppelin:{air:true,boss:true,hp:1500,score:5000,ram:30,make:()=>makeUnit('zeppelin',makeZeppelin),name:'GRAF ZEPPELIN',
    init:e=>{e.py=95;e.hd=rr(0,TAU);e.spd=9;e.cool=1.5;e.adds=8;},
    up:(e,dt)=>{
      const a=aimAtPlayer(e,0);
      e.thd=Math.atan2(a.dx,a.dz);
      e.hd+=clamp(wrapAngle(e.thd-e.hd),-1,1)*0.25*dt;
      e.px+=Math.sin(e.hd)*e.spd*dt; e.pz+=Math.cos(e.hd)*e.spd*dt;
      e.cool-=dt;
      if(e.cool<=0){
        for(let k=0;k<4;k++) setTimeout(()=>{if(e.hp>0)fireFlak(e,rr(-8,4));},k*180);
        e.cool=e.hp<e.maxhp*0.5?1.4:2.2;
      }
      e.adds-=dt;
      if(e.adds<=0&&countType('fighter')<3){spawnEnemy('fighter',e.px,e.pz);popup(e.px,e.py,e.pz,'FIGHTERS SCRAMBLED!');e.adds=rr(9,13);}
      e.roll=0;
    }},
  battleship:{air:false,boss:true,hp:1800,score:6000,ram:0,make:()=>makeUnit('battleship',makeBattleship),name:'SMS THUNDERER',
    init:e=>{e.hd=rr(0,TAU);e.spd=5;e.cool=2;e.adds=8;e.volley=0;},
    up:(e,dt)=>{
      const nx=e.px+Math.sin(e.hd)*e.spd*dt, nz=e.pz+Math.cos(e.hd)*e.spd*dt;
      if(G.heightAt(nx,nz)<=G.waterLevel+0.5&&Math.abs(nx)<WORLD&&Math.abs(nz)<WORLD){e.px=nx;e.pz=nz;}else e.hd+=0.5*dt;
      e.py=G.waterLevel+0.8;
      e.cool-=dt;
      if(e.cool<=0){
        e.volley=3; e.vt=0;
        e.cool=e.hp<e.maxhp*0.5?2.6:3.8;
      }
      if(e.volley>0){
        e.vt-=dt;
        if(e.vt<=0){fireFlak(e,10);fireFlak(e,10);e.volley--;e.vt=0.35;}
      }
      const a=aimAtPlayer(e,0);
      if(a.dist<200&&R()<dt*1.5)fireEBullet(e,6,150,4,0.1);
      e.adds-=dt;
      if(e.adds<=0&&countType('boatS')<3){
        spawnEnemy('boatS',e.px+rr(-40,40),e.pz+rr(-40,40));popup(e.px,e.py+10,e.pz,'BOATS LAUNCHED!');e.adds=rr(8,12);
      }
      if(e.mesh.userData.turrets) e.tur=Math.atan2(a.dx,a.dz)-e.hd;
    }},
  robot:{air:false,boss:true,hp:2200,score:8000,ram:0,make:()=>makeUnit('robot',makeRobot),name:'THE COLOSSUS',
    init:e=>{e.hd=rr(0,TAU);e.spd=8;e.cool=2;e.step=0;e.wave=6;},
    up:(e,dt)=>{
      const a=aimAtPlayer(e,0);
      e.thd=Math.atan2(a.dx,a.dz);
      e.hd+=clamp(wrapAngle(e.thd-e.hd),-1,1)*0.5*dt;
      if(a.dist>70){e.px+=Math.sin(e.hd)*e.spd*dt;e.pz+=Math.cos(e.hd)*e.spd*dt;e.step+=dt*3;}
      e.py=groundY(e)+20;
      e.cool-=dt;
      if(e.cool<=0){
        const n=e.hp<e.maxhp*0.5?5:3;
        for(let k=0;k<n;k++) setTimeout(()=>{if(e.hp>0)fireBolt(e,14,180,8);},k*160);
        e.cool=rr(1.6,2.6);
      }
      e.wave-=dt;
      if(e.wave<=0&&player.pos.y<groundY(e)+45&&a.dist<160){ // low-altitude shockwave
        e.wave=rr(6,9);
        for(let k=0;k<24;k++){const an=k/24*TAU;
          spawnBullet(e.px,groundY(e)+8,e.pz,Math.cos(an)*90,10,Math.sin(an)*90,
            {friendly:false,dmg:14,color:0xffb84a,life:1.6,kind:'mg'});}
        sfx('bigboom'); shake=0.8;
        popup(e.px,e.py+20,e.pz,'SHOCKWAVE!');
      }
    },
    sync:e=>{
      if(e.mesh.userData.limbs){
        const L=e.mesh.userData.limbs;
        L[2].rotation.x=Math.sin(e.step)*0.4; L[3].rotation.x=Math.sin(e.step+Math.PI)*0.4;
        L[0].rotation.x=Math.sin(e.step+Math.PI)*0.25; L[1].rotation.x=Math.sin(e.step)*0.25;
      }
    }},
};
function countType(t){let n=0;for(const e of G.enemies)if(e.type===t&&e.hp>0)n++;return n;}

function spawnEnemy(type,x,z){
  const def=ETYPES[type];
  const mesh=def.make();
  const e={type,def,mesh,px:x,pz:z,py:0,hd:rr(0,TAU),thd:0,roll:0,tur:0,
           hp:def.hp,maxhp:def.hp,dying:0,vy:0,spin:0,t:0};
  e.py=def.air?rr(30,80):groundY(e)+2;
  def.init&&def.init(e);
  mesh.position.set(e.px,e.py,e.pz);
  entGroup.add(mesh);
  G.enemies.push(e);
  if(def.boss){G.boss=e;announce('WARNING','BOSS: '+def.name,3200);sfx('bigboom');}
  return e;
}
function hitEnemy(e,dmg,x,y,z){
  if(e.dying)return;
  e.hp-=dmg;
  sparks(x,y,z);
  sfx('ding',x,y,z);
  if(e.hp<=0) startDeath(e);
}
function startDeath(e){
  if(e.def.air&&!e.def.boss){
    e.dying=1; e.vy=rr(-5,5); e.spin=rr(4,9)*(R()<0.5?-1:1);
    explosion(e.px,e.py,e.pz,1.2,false);
  }else if(e.def.boss){
    e.dying=1; e.deathT=2.2; e.hp=0;
  }else{
    destroyEnemy(e);
  }
}
function destroyEnemy(e){
  const overWater=G.water&&G.heightAt(e.px,e.pz)<G.waterLevel&&e.py-G.waterLevel<10;
  if(overWater&&e.def.air)splash(e.px,e.pz,1.9);
  explosion(e.px,e.py,e.pz,e.def.boss?4.5:(e.def.air?3.5:1.6),e.def.boss||e.def.air||e.maxhp>50);
  G.score+=e.def.score;
  popup(e.px,e.py,e.pz,'+'+e.def.score);
  if(!e.def.boss) G.kills++;
  entGroup.remove(e.mesh);
  const i=G.enemies.indexOf(e); if(i>=0)G.enemies.splice(i,1);
  if(e.def.boss){G.boss=null; shake=1.2; setTimeout(()=>levelWon(),900);}
  else if(G.li<3&&G.kills>=G.quota&&G.state==='play') levelWon();
}
function updateEnemies(dt){
  for(let i=G.enemies.length-1;i>=0;i--){
    const e=G.enemies[i];
    if(e.dying){
      if(e.def.boss){ // boss death sequence: chained explosions
        e.deathT-=dt;
        if(R()<dt*9) explosion(e.px+rr(-14,14),e.py+rr(-8,8),e.pz+rr(-14,14),rr(0.8,1.8),true);
        if(e.def.air)e.py-=10*dt;
        if(e.deathT<=0) destroyEnemy(e);
      }else{ // tumbling air kill
        e.vy-=60*dt; e.py+=e.vy*dt;
        e.px+=Math.sin(e.hd)*30*dt; e.pz+=Math.cos(e.hd)*30*dt;
        e.roll+=e.spin*dt; e.spin*=1+dt*0.5;
        if(R()<dt*20) spawnP(PS_SOLID,e.px,e.py,e.pz,rr(-3,3),rr(2,6),rr(-3,3),rr(0.8,1.4),rr(0.8,1.4),0x3a3a3a,0x777777,0,0.98);
        const gy=Math.max(groundY(e),G.waterLevel);
        if(e.py<=gy+1){e.py=gy+1;destroyEnemy(e);continue;}
      }
      continue;
    }
    e.t+=dt;
    e.def.up(e,dt);
    // battle damage: smoke thickens as hp drops, flames when critical
    if(e.hp<e.maxhp*0.5){
      const dmg=1-e.hp/e.maxhp;
      if(R()<dt*(e.def.boss?30:14)*dmg)
        spawnP(PS_SOLID,e.px+rr(-2,2),e.py+rr(0,2.5),e.pz+rr(-2,2),
          rr(-1,1),rr(3,7),rr(-1,1),rr(1.1,2.1),rr(1,2.2)*(e.def.boss?1.8:1),
          0x2e2b28,0x6e6a62,-1.5,0.97);
      if(e.hp<e.maxhp*0.25&&R()<dt*6)
        spawnP(PS_GLOW,e.px+rr(-1.5,1.5),e.py+rr(-0.5,1.5),e.pz+rr(-1.5,1.5),
          rr(-0.5,0.5),rr(2,5),rr(-0.5,0.5),rr(0.3,0.6),rr(0.6,1.1),
          0xffc25a,0xff5a2a,0,0.9);
    }
    // boats churn the water: ripple wake + foam trail
    if(G.water&&(e.type==='boatS'||e.type==='boatM'||e.type==='battleship')){
      e.wkT=(e.wkT||0)-dt;
      if(e.wkT<=0){
        const bs=e.type==='battleship';
        e.wkT=bs?0.2:0.26;
        const sx=e.px-Math.sin(e.hd)*(bs?22:6), sz=e.pz-Math.cos(e.hd)*(bs?22:6);
        const surfY=G.water.position.y+0.6;
        addRipple(sx,sz,bs?0.95:0.55);
        for(let k=0;k<(bs?3:2);k++)
          spawnP(PS_SOLID,sx+rr(-3,3),surfY-0.15,sz+rr(-3,3),
            0,0,0,rr(1.6,2.6),rr(1.2,2)*(bs?1.6:1),
            0xf4fafc,0xa9c8cd,0,1,0.18);
      }
    }
    if(e.def.air){ // keep planes off the dirt
      const gy=Math.max(groundY(e),G.waterLevel)+8;
      if(e.py<gy)e.py=gy;
      if(e.py>240)e.py=240;
    }
    e.px=clamp(e.px,-WORLD-60,WORLD+60); e.pz=clamp(e.pz,-WORLD-60,WORLD+60);
    // ram damage vs player
    if(e.def.ram){
      const d=Math.hypot(e.px-player.pos.x,e.py-player.pos.y,e.pz-player.pos.z);
      if(d<e.def.ram*0.6&&player.hp>0){damagePlayer(18);hitEnemy(e,15,e.px,e.py,e.pz);}
    }
  }
}
function syncEnemies(){ // stop-motion visual snap
  for(const e of G.enemies){
    e.mesh.position.set(e.px,e.py,e.pz);
    e.mesh.rotation.set(0,e.hd,0);
    if(e.roll)e.mesh.rotateZ(-e.roll*0.6);
    if(e.dying&&!e.def.boss)e.mesh.rotateX(e.roll*0.5);
    const ud=e.mesh.userData;
    if(ud.prop)ud.prop.rotation.z+=rr(1.5,2.5);
    if(ud.props)ud.props.forEach(p=>p.rotation.z+=rr(1.5,2.5));
    if(ud.turret&&e.tur!==undefined)ud.turret.rotation.y=e.tur;
    if(ud.turrets&&e.tur!==undefined)ud.turrets.forEach(t=>t.rotation.y=e.tur);
    if(ud.ring)ud.ring.rotation.y+=0.7;
    e.def.sync&&e.def.sync(e);
  }
}

