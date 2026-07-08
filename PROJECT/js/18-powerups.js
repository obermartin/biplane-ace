'use strict';
/* ============================== POWER-UPS ============================== */
const PU_TYPES={
  health:{c:0xe8433f,label:'REPAIRS +40'},
  rate:{c:0xffb84a,label:'DOUBLE FIRE RATE'},
  quad:{c:0xb14ae8,label:'QUAD DAMAGE'},
  speed:{c:0x4ad8e8,label:'SUPER SPEED'},
  inv:{c:0xffd76a,label:'INVULNERABLE'},
};
const PU_WEIGHTS=[['health',3],['rate',2],['quad',2],['speed',2],['inv',1]];
function makePowerup(type){
  const c=PU_TYPES[type].c;
  const b=new Builder();
  // spinning ring of studs
  for(let k=0;k<6;k++){
    const a=k/6*TAU;
    b.prim('box',c,Math.cos(a)*3.4,0,Math.sin(a)*3.4,0.9,0.9,0.9,0,0,0,0);
  }
  // center icon
  if(type==='health'){
    b.prim('box',0xffffff,0,0,0,3,1,1,0,0,0,0);
    b.prim('box',0xffffff,0,0,0,1,3,1,0,0,0,0);
  }else if(type==='rate'){
    b.prim('cyl',c,-0.8,0,0,0.55,2.8,0.55,0,0,0,0);
    b.prim('cyl',c,0.8,0,0,0.55,2.8,0.55,0,0,0,0);
  }else if(type==='quad'){
    b.prim('cone',c,0,0.9,0,1.6,1.8,1.6,0,0,0,0);
    b.prim('cone',c,0,-0.9,0,1.6,1.8,1.6,0,Math.PI,0,0);
  }else if(type==='speed'){
    b.prim('cone',c,0,0,0.9,1.5,2.4,1.5,0,Math.PI/2,0,0);
    b.prim('box',c,0,0,-1.2,1,1,1.6,0,0,0,0);
  }else{
    b.prim('sph',c,0,0,0,1.8,1.8,1.8,0,0,0,0);
  }
  return b.glowMesh();
}
function spawnPU(){
  let x=0,z=0,y=0,ok=false;
  for(let t=0;t<40&&!ok;t++){
    x=rr(-WORLD*0.9,WORLD*0.9); z=rr(-WORLD*0.9,WORLD*0.9);
    y=Math.max(G.heightAt(x,z),G.waterLevel)+rr(12,20);
    ok=Math.hypot(x-player.pos.x,z-player.pos.z)>220;
    if(ok)for(const s of G.solids){ // don't bury it inside a building
      if(x>s.x0-6&&x<s.x1+6&&y>s.y0-6&&y<s.y1+6&&z>s.z0-6&&z<s.z1+6){ok=false;break;}
    }
  }
  if(!ok)return;
  const type=(()=>{let tot=0;for(const[,w]of PU_WEIGHTS)tot+=w;let r=R()*tot;
    for(const[t,w]of PU_WEIGHTS){r-=w;if(r<=0)return t;}return 'health';})();
  const mesh=makePowerup(type);
  mesh.position.set(x,y,z);
  mesh.castShadow=true;
  entGroup.add(mesh);
  // beacon: vertical light beam + ground disc make the altitude readable
  const gy=Math.max(G.heightAt(x,z),G.waterLevel);
  const bm=new THREE.MeshBasicMaterial({color:PU_TYPES[type].c,transparent:true,opacity:0.4,
    blending:THREE.AdditiveBlending,depthWrite:false});
  const bmCore=new THREE.MeshBasicMaterial({color:PU_TYPES[type].c,transparent:true,opacity:0.95,depthWrite:false});
  const beam=new THREE.Group();
  const dy=G.water&&G.heightAt(x,z)<G.waterLevel?G.water.position.y+0.75:gy+0.3; // clear the swell
  const h=Math.max(y-dy,1);
  const cyl=new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.8,h,6,1,true),bm);
  cyl.position.set(x,dy+h/2,z);
  const core=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,h,5,1,true),bmCore);
  core.position.set(x,dy+h/2,z);
  const disc=new THREE.Mesh(new THREE.CircleGeometry(3,18),bm);
  disc.rotation.x=-Math.PI/2; disc.position.set(x,dy,z);
  beam.add(cyl); beam.add(core); beam.add(disc);
  entGroup.add(beam);
  G.pus.push({mesh,beam,type,x,y,z,bob:rr(0,TAU)});
}
function updatePowerups(dt){
  // timers
  for(const k of['rate','quad','speed','inv'])
    player.pu[k]=Math.max(0,player.pu[k]-dt);
  // pickup check
  for(let i=G.pus.length-1;i>=0;i--){
    const u=G.pus[i];
    const d=Math.hypot(u.x-player.pos.x,u.mesh.position.y-player.pos.y,u.z-player.pos.z);
    if(d<8){
      const T=PU_TYPES[u.type];
      if(u.type==='health')player.hp=Math.min(100,player.hp+40);
      else player.pu[u.type]=Math.min(player.pu[u.type]+30,60);
      popupCenter(T.label);
      sfx('stunt');
      for(let k=0;k<14;k++){ // sparkle burst in the powerup's color
        const a=R()*TAU,b2=R()*Math.PI-Math.PI/2,sp=rr(8,18);
        spawnP(PS_GLOW,u.x,u.mesh.position.y,u.z,
          Math.cos(a)*Math.cos(b2)*sp,Math.sin(b2)*sp,Math.sin(a)*Math.cos(b2)*sp,
          rr(0.4,0.7),rr(0.6,1.1),T.c,0xffffff,0,0.94);
      }
      entGroup.remove(u.mesh);
      entGroup.remove(u.beam);
      G.pus.splice(i,1);
      spawnPU(); // replacement appears elsewhere
    }
  }
}
function tickPowerups(){ // stop-motion bob & spin
  for(const u of G.pus){
    u.bob+=0.45;
    u.mesh.position.y=u.y+Math.sin(u.bob)*1.6;
    u.mesh.rotation.y+=0.3;
  }
}

