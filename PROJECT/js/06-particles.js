'use strict';
/* ============================== PARTICLES (stop-motion, instanced) ============================== */
const STEP=1/12; // stop-motion tick
const PMAX=2000;
function makePSys(material){
  const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),material,PMAX);
  im.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  im.frustumCulled=false;
  im.count=PMAX;
  fxGroup.add(im);
  const parts=[];
  for(let i=0;i<PMAX;i++){
    parts.push({on:false,px:0,py:0,pz:0,vx:0,vy:0,vz:0,life:0,max:1,size:1,grav:0,drag:1,c0:new THREE.Color(),c1:new THREE.Color()});
    im.setMatrixAt(i,_m.makeScale(0,0,0));
    im.setColorAt(i,_col.set(0));
  }
  return {im,parts,idx:0};
}
const glowMat=new THREE.MeshBasicMaterial({blending:THREE.AdditiveBlending,depthWrite:false,transparent:true});
const PS_GLOW=makePSys(glowMat);
const PS_SOLID=makePSys(new THREE.MeshBasicMaterial({}));
function spawnP(sys,x,y,z,vx,vy,vz,life,size,c0,c1,grav,drag,flat){
  const p=sys.parts[sys.idx]; sys.idx=(sys.idx+1)%PMAX;
  p.on=true;p.px=x;p.py=y;p.pz=z;p.vx=vx;p.vy=vy;p.vz=vz;
  p.life=life;p.max=life;p.size=size;p.grav=grav||0;p.drag=drag===undefined?1:drag;
  p.flat=flat||0;
  p.c0.set(c0);p.c1.set(c1===undefined?c0:c1);
}
function tickPSys(sys){
  const dt=STEP;
  for(let i=0;i<PMAX;i++){
    const p=sys.parts[i];
    if(!p.on) continue;
    p.life-=dt;
    if(p.life<=0){p.on=false;sys.im.setMatrixAt(i,_m.makeScale(0,0,0));continue;}
    p.vx*=p.drag;p.vy*=p.drag;p.vz*=p.drag;
    p.vy-=p.grav*dt;
    p.px+=p.vx*dt;p.py+=p.vy*dt;p.pz+=p.vz*dt;
    const t=1-p.life/p.max;
    const s=p.size*(t<0.15?t/0.15:1-((t-0.15)/0.85)*0.9);
    if(p.flat){const sh=p.size*(1.5-t*1.15);_m.makeScale(sh,p.flat,sh);}
    else _m.makeScale(s,s,s);
    _m.setPosition(p.px,p.py,p.pz);
    sys.im.setMatrixAt(i,_m);
    sys.im.setColorAt(i,_col.copy(p.c0).lerp(p.c1,t));
  }
  sys.im.instanceMatrix.needsUpdate=true;
  if(sys.im.instanceColor) sys.im.instanceColor.needsUpdate=true;
}
function addRipple(x,z,str){
  if(!G.water)return;
  const arr=G.water.material.uniforms.uRip.value;
  G.ripI=(G.ripI+1)%32;
  arr[G.ripI].set(x,z,Math.floor(G.time/STEP)*STEP,str);
}
function splash(x,z,pw){
  if(!G.water)return;
  const y=G.water.position.y+0.6; // above the plane + its swell, so spray reads clearly
  const n=Math.round(5+pw*8);
  for(let i=0;i<n;i++){
    const a=Math.random()*TAU,sp=rr(2,6)*pw+2;
    spawnP(PS_SOLID,x,y+0.3,z,Math.cos(a)*sp,rr(8,18)*Math.min(pw,1.6)+3,Math.sin(a)*sp,
      rr(0.5,0.9),rr(0.7,1.5)*Math.min(pw+0.4,1.8),0xeaf2f4,0x9fc3c9,26,0.93);
  }
  if(pw>1){ // tall central column for heavy impacts
    for(let i=0;i<Math.round(6*pw);i++)
      spawnP(PS_SOLID,x+rr(-1.5,1.5),y+0.3,z+rr(-1.5,1.5),
        rr(-2,2),rr(14,26)*Math.min(pw,2)+6,rr(-2,2),
        rr(0.7,1.2),rr(0.9,1.9),0xf4fafc,0x9fc3c9,30,0.95);
  }
  addRipple(x,z,Math.min(pw,1.8));
}
function explosion(x,y,z,power,big){
  const P=power*(big?1.5:1);
  // core bloom: a few huge, very short-lived flashes
  for(let i=0;i<3+Math.round(P);i++)
    spawnP(PS_GLOW,x,y,z,rr(-3,3),rr(-1,5),rr(-3,3),rr(0.14,0.26),rr(4,7)*Math.min(P,2.2),0xfff3c0,0xffb03a,0,0.9);
  // fireballs
  const n=Math.min(60,Math.round(8+P*12));
  for(let i=0;i<n;i++){
    const a=Math.random()*TAU,b=Math.random()*Math.PI-Math.PI/2,sp=rr(10,20)*(big?2:1)*(0.4+Math.random());
    spawnP(PS_GLOW,x,y,z,Math.cos(a)*Math.cos(b)*sp,Math.sin(b)*sp+rr(4,14),Math.sin(a)*Math.cos(b)*sp,
      rr(0.5,1.1)*(big?1.6:1), rr(1.6,3.6)*(big?2:1), Math.random()<0.5?0xffd25e:0xff7a1f, 0xb3271b, 18, 0.92);
  }
  // shockwave ring: flat, fast, whitish
  const rn=big?18:12;
  for(let i=0;i<rn;i++){
    const a=i/rn*TAU+rr(-0.12,0.12),sp=rr(30,42)*(big?1.4:1);
    spawnP(PS_GLOW,x,y+0.5,z,Math.cos(a)*sp,rr(-0.5,1.5),Math.sin(a)*sp,rr(0.22,0.34),rr(1,1.8),0xfff0d0,0xff9a4a,0,0.86);
  }
  // debris chunks
  const dn=Math.min(26,Math.round(4+P*6));
  for(let i=0;i<dn;i++){
    const a=Math.random()*TAU,sp=rr(8,22)*(big?1.5:1);
    spawnP(PS_SOLID,x,y+1,z,Math.cos(a)*sp,rr(14,30),Math.sin(a)*sp,rr(0.9,1.8),rr(0.6,1.6),0x2c2825,0x5a544c,42,0.97);
  }
  // lingering smoke
  const ns=Math.min(30,Math.round(6+P*8));
  for(let i=0;i<ns;i++){
    const a=Math.random()*TAU,sp=rr(2,7)*(big?1.6:1);
    spawnP(PS_SOLID,x,y+2,z,Math.cos(a)*sp,rr(5,13),Math.sin(a)*sp,
      rr(1.6,3.2)*(big?1.5:1), rr(2.2,5)*(big?1.9:1), 0x3a3632, 0x8b857c, -2, 0.94);
  }
  flash(x,y+3,z,4+P*3.5);
  // punch scales with proximity to the player
  const d=Math.hypot(x-player.pos.x,y-player.pos.y,z-player.pos.z);
  shake=Math.max(shake,clamp(P*0.55*(1-d/260),0,1.3));
  if(G.water&&y-G.waterLevel<8&&G.heightAt(x,z)<G.waterLevel)addRipple(x,z,Math.min(P*0.7,1.5));
  sfx(big?'bigboom':'boom',x,y,z);
}
function sparks(x,y,z){
  for(let i=0;i<4;i++){
    const a=Math.random()*TAU;
    spawnP(PS_GLOW,x,y,z,Math.cos(a)*rr(6,14),rr(2,10),Math.sin(a)*rr(6,14),rr(0.2,0.45),rr(0.7,1.3),0xffe08a,0xff6a2a,20,0.9);
  }
}

