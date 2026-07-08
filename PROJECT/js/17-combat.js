'use strict';
/* ============================== DAMAGE & BULLET SIM ============================== */

function damagePlayer(d){
  if(player.hp<=0||G.state!=='play')return;
  if(player.pu.inv>0)return;
  if(player.iT>0)return;
  player.hp-=d; player.iT=0.25;
  const a=clamp(0.25+d*0.02,0,0.7);
  dmgEl.style.boxShadow=`inset 0 0 120px 40px rgba(200,30,20,${a})`;
  setTimeout(()=>dmgEl.style.boxShadow='inset 0 0 120px 40px rgba(200,30,20,0)',220);
  shake=Math.max(shake,0.35);
  sfx('hit');
  if(player.hp<=0){player.hp=0;playerDown();}
}
function bombBoom(b){
  const gy=Math.max(G.heightAt(b.px,b.pz),G.waterLevel);
  explosion(b.px,gy+1,b.pz,1.6,true);
  shake=Math.max(shake,0.3);
  for(const e of G.enemies){
    const d=Math.hypot(e.px-b.px,e.pz-b.pz)+Math.abs(e.py-gy)*0.5;
    if(d<(b.aoe||22)+8) hitEnemy(e,b.friendly?45:25,e.px,e.py,e.pz);
  }
  if(!b.friendly){
    const d=Math.hypot(player.pos.x-b.px,player.pos.y-gy,player.pos.z-b.pz);
    if(d<(b.aoe||20)) damagePlayer(16);
  }
}
function updateBullets(dt){
  for(let i=bullets.length-1;i>=0;i--){
    const b=bullets[i];
    if(b.kind==='bomb'){b.vy=(b.vy||0)-70*dt;b.py+=b.vy*dt;}
    if(b.kind==='flak'){
      b.fuse-=dt;
      if(b.fuse<=0){
        explosion(b.px,b.py,b.pz,0.8,false);
        const d=Math.hypot(player.pos.x-b.px,player.pos.y-b.py,player.pos.z-b.pz);
        if(d<b.aoe)damagePlayer(12);
        killBullet(i);continue;
      }
    }
    b.px+=b.vx*dt; b.py+=b.vy*dt; b.pz+=b.vz*dt;
    b.life-=dt;
    b.mesh.position.set(b.px,b.py,b.pz);
    // ground / water
    const gy=Math.max(G.heightAt(b.px,b.pz),G.waterLevel);
    if(b.py<=gy){
      const overWater=G.water&&G.heightAt(b.px,b.pz)<G.waterLevel;
      if(b.kind==='bomb'){bombBoom(b);if(overWater)splash(b.px,b.pz,1.4);}
      else if(overWater)splash(b.px,b.pz,0.35);
      else if(b.friendly&&R()<0.4)sparks(b.px,gy+0.5,b.pz);
      killBullet(i);continue;
    }
    if(b.life<=0){killBullet(i);continue;}
    if(b.friendly){
      let hit=false;
      for(const e of G.enemies){
        if(e.dying)continue;
        const rad=e.def.boss?26:(e.def.ram||10);
        if(Math.abs(e.px-b.px)<rad&&Math.abs(e.py-b.py)<rad&&Math.abs(e.pz-b.pz)<rad){
          if(b.kind==='bomb'){bombBoom(b);}
          else hitEnemy(e,b.dmg,b.px,b.py,b.pz);
          hit=true;break;
        }
      }
      if(hit){killBullet(i);continue;}
    }else{
      const d=Math.hypot(player.pos.x-b.px,player.pos.y-b.py,player.pos.z-b.pz);
      if(d<4.5){damagePlayer(b.dmg||6);killBullet(i);continue;}
    }
  }
}

