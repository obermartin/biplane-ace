'use strict';
/* ============================== PROJECTILES ============================== */
const bullets=[]; // {mesh,pos,vel,life,friendly,dmg,kind} kind: mg|bolt|flak|bomb
const bulletGeo=new THREE.BoxGeometry(0.7,0.7,3.4);
const bombGeoB=new Builder().prim('sph',0x2c2f33,0,0,0,1.4,1.4,3,0,0,0,0)
                            .prim('box',0x8b2f2a,0,0,-1.6,1.2,1.2,0.35,0,0,Math.PI/4,0);
const _lookDummy=new THREE.Object3D();
function spawnBullet(x,y,z,vx,vy,vz,opts){
  let mesh;
  if(opts.kind==='bomb'){
    mesh=bombGeoB.mesh(true,false);
    mesh.geometry=mesh.geometry; // pooled? bombs are rare enough — clone group cheaply
  }else{
    mesh=new THREE.Mesh(bulletGeo,new THREE.MeshBasicMaterial({color:opts.color||0xffe9a0}));
  }
  mesh.position.set(x,y,z);
  _lookDummy.position.set(x,y,z);
  _lookDummy.lookAt(x+vx,y+vy,z+vz);
  mesh.quaternion.copy(_lookDummy.quaternion);
  fxGroup.add(mesh);
  bullets.push({mesh,px:x,py:y,pz:z,vx,vy,vz,life:opts.life||2,friendly:!!opts.friendly,dmg:opts.dmg||8,kind:opts.kind||'mg',fuse:opts.fuse||0,aoe:opts.aoe||0});
}
function killBullet(i){
  const b=bullets[i];
  fxGroup.remove(b.mesh);
  if(b.mesh.material && b.kind!=='bomb') b.mesh.material.dispose();
  if(b.kind==='bomb') b.mesh.geometry.dispose();
  bullets.splice(i,1);
}
function clearBullets(){ while(bullets.length) killBullet(0); }

