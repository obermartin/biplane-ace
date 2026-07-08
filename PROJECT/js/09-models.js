'use strict';
/* ============================== MODELS ============================== */
function makeProp(len,color){
  const b=new Builder();
  b.prim('box',color||0x2a2624,0,0,0,0.3,len,0.12,0,0,0,0);
  b.prim('sph',0x777066,0,0,0.18,0.5,0.5,0.5,0,0,0,0);
  const m=b.glowMesh?b.mesh(false,false):b.mesh(false,false);
  return m;
}
function makeBiplane(P){ // P: {body,wing,accent,tail}
  const g=new THREE.Group();
  const b=new Builder();
  // fuselage (nose toward +Z)
  b.prim('box',P.body,0,0,0.4,1.5,1.5,4.6);
  b.prim('box',P.body,0,0.12,-2.9,1.0,1.0,2.2);
  b.prim('cyl',0x55504a,0,0,2.85,1.5,0.9,1.5,0,Math.PI/2,0,0); // cowl
  // wings
  b.prim('box',P.wing,0,1.55,0.6,10.4,0.32,2.3);
  b.prim('box',P.wing,0,-0.55,0.9,9.0,0.32,2.1);
  // roundels
  b.prim('cyl',P.accent,-3.4,1.75,0.6,1.3,0.1,1.3,0,0,0,0);
  b.prim('cyl',P.accent, 3.4,1.75,0.6,1.3,0.1,1.3,0,0,0,0);
  // struts
  for(const sx of [-3.2,-1.1,1.1,3.2]) b.prim('box',0x6e5b3f,sx,0.5,0.7,0.16,1.9,0.16);
  // tail
  b.prim('box',P.wing,0,0.35,-3.9,3.6,0.22,1.3);
  b.prim('box',P.tail,0,1.0,-4.0,0.2,1.5,1.4);
  // pilot + scarf
  b.prim('sph',0x9a6a44,0,1.15,-0.7,0.8,0.8,0.8,0,0,0,0);
  b.prim('box',P.accent,0,0.95,-1.15,0.9,0.25,0.6,0,0,0,0);
  // wheels + skid
  b.prim('cyl',0x232120,-1.0,-1.35,1.3,1.0,0.35,1.0,0,0,Math.PI/2,0);
  b.prim('cyl',0x232120, 1.0,-1.35,1.3,1.0,0.35,1.0,0,0,Math.PI/2,0);
  b.prim('box',0x6e5b3f,-1.0,-0.85,1.3,0.15,1.0,0.15);
  b.prim('box',0x6e5b3f, 1.0,-0.85,1.3,0.15,1.0,0.15);
  g.add(b.mesh());
  const prop=makeProp(3.2); prop.position.set(0,0,3.55);
  g.add(prop); g.userData.prop=prop;
  return g;
}
const PLAYER_PAINT={body:0xd8b06a,wing:0xcaa35d,accent:0xd23b30,tail:0xd23b30};
const ENEMY_PAINT ={body:0x4b5058,wing:0x3f444b,accent:0xc9342c,tail:0x23262b};
function makeBomber(){
  const g=new THREE.Group();
  const b=new Builder();
  b.prim('box',0x474d54,0,0,0,2.0,2.0,9.0);
  b.prim('box',0x474d54,0,0.2,-5.2,1.4,1.4,2.4);
  b.prim('box',0x3c4147,0,1.9,0.8,16.0,0.4,3.0);
  b.prim('box',0x3c4147,0,-0.8,1.0,14.0,0.4,2.7);
  b.prim('cyl',0xb8342c,-6.8,2.15,0.8,1.6,0.14,1.6,0,0,0,0);
  b.prim('cyl',0xb8342c, 6.8,2.15,0.8,1.6,0.14,1.6,0,0,0,0);
  for(const sx of [-5,-2.6,2.6,5]) b.prim('box',0x2c2f33,sx,0.55,0.9,0.2,2.6,0.2);
  b.prim('box',0x3c4147,0,0.5,-6.2,5.0,0.25,1.6);
  b.prim('box',0x23262b,-2.2,1.3,-6.2,0.2,1.6,1.5);
  b.prim('box',0x23262b, 2.2,1.3,-6.2,0.2,1.6,1.5);
  // engine nacelles
  b.prim('box',0x2c2f33,-3.6,0.5,1.6,1.2,1.2,2.6);
  b.prim('box',0x2c2f33, 3.6,0.5,1.6,1.2,1.2,2.6);
  g.add(b.mesh());
  const p1=makeProp(2.6),p2=makeProp(2.6);
  p1.position.set(-3.6,0.5,3.0); p2.position.set(3.6,0.5,3.0);
  g.add(p1);g.add(p2); g.userData.props=[p1,p2];
  return g;
}
function makeBalloon(){
  const g=new THREE.Group();
  const b=new Builder();
  b.prim('sph',0xb9a465,0,0,0,13,10,22,0,0,0,0);
  b.prim('sph',0xa8955a,0,-1.5,0,12.6,8.5,21,0,0,0,0);
  for(const a of [0.7,-0.7]) b.prim('box',0x8f7c48,0,a*3.4,-10.5,0.5,3.4,4.5,0,a*0.6,0);
  b.prim('box',0x8f7c48,0,0,-11,4.5,0.5,4.0);
  b.prim('box',0x5c4d33,0,-6.6,1,2.2,2.0,3.2);
  b.prim('box',0x3a332a,0,-5.4,1,0.12,2.6,0.12);
  g.add(b.mesh());
  return g;
}
function makeTank(){
  const g=new THREE.Group();
  const b=new Builder();
  b.prim('box',0x5c5a45,0,1.5,0,3.6,1.4,6.4);
  b.prim('box',0x4a483a,-2.3,1.3,0,1.1,2.6,7.6);
  b.prim('box',0x4a483a, 2.3,1.3,0,1.1,2.6,7.6);
  b.prim('box',0x35342c,-2.3,1.3,3.4,1.2,1.8,1.2,0,0.5,0);
  b.prim('box',0x35342c, 2.3,1.3,3.4,1.2,1.8,1.2,0,0.5,0);
  g.add(b.mesh());
  const tb=new Builder();
  tb.prim('box',0x6a684f,0,0,0,2.2,1.1,2.4);
  tb.prim('cyl',0x35342c,0,0.1,2.2,0.45,0.45,2.6,0,Math.PI/2,0,0);
  const tur=tb.mesh(); tur.position.set(0,2.8,0);
  g.add(tur); g.userData.turret=tur;
  return g;
}
function makeTruck(){
  const g=new THREE.Group();
  const b=new Builder();
  b.prim('box',0x5f5a3f,0,1.7,1.8,2.4,1.7,2.2);       // cab
  b.prim('box',0x55503a,0,1.35,3.4,2.2,1.0,1.3);      // hood
  b.prim('box',0x6b6547,0,1.7,-1.5,2.6,1.2,4.2);      // bed
  b.prim('box',0x3c3830,0,2.6,-1.5,0.7,0.9,0.7);      // gunner
  for(const s of [[-1.2,2.6],[1.2,2.6],[-1.2,-2.6],[1.2,-2.6]])
    b.prim('cyl',0x232120,s[0],0.7,s[1],1.1,0.5,1.1,0,0,Math.PI/2,0);
  g.add(b.mesh());
  const gb=new Builder();
  gb.prim('cyl',0x232120,0,0.2,1.0,0.22,0.22,2.0,0,Math.PI/2,0,0);
  const gun=gb.mesh(false,false); gun.position.set(0,3.2,-1.5);
  g.add(gun); g.userData.turret=gun;
  return g;
}
function makeBoat(size){ // 1 small, 2 medium
  const g=new THREE.Group();
  const b=new Builder();
  const L=size===1?9:16, W=size===1?3:5;
  b.prim('box',0x5b636b,0,0.6,0,W,1.4,L);
  b.prim('box',0x5b636b,0,0.6,L*0.56,W*0.6,1.2,L*0.22,0,0,0);
  b.prim('box',0x767e86,0,1.8,-L*0.15,W*0.7,1.4,L*0.3);
  if(size===2){
    b.prim('cyl',0x33373c,0,3.0,-L*0.2,1.2,2.2,1.2);
    b.prim('box',0x767e86,0,1.6,L*0.18,W*0.55,1.0,L*0.2);
    b.prim('box',0x2c2f33,0,1.2,-L*0.42,0.15,3.4,0.15);
  }
  g.add(b.mesh());
  const tb=new Builder();
  tb.prim('box',0x484d53,0,0.3,0,1.4,0.8,1.4);
  tb.prim('cyl',0x26292d,0,0.5,1.4,0.3,0.3,2.0,0,Math.PI/2,0,0);
  const t=tb.mesh(); t.position.set(0,1.6,size===1?2.2:5.2);
  g.add(t); g.userData.turret=t;
  return g;
}
function makeBattleship(){
  const g=new THREE.Group();
  const b=new Builder();
  b.prim('box',0x646b73,0,1.6,0,13,4.2,62);
  b.prim('box',0x646b73,0,1.8,36,7,3.4,14);
  b.prim('box',0x646b73,0,1.8,-34,9,3.4,10);
  b.prim('box',0x7b828a,0,5.2,-4,8,3.2,22);          // superstructure
  b.prim('box',0x7b828a,0,8.2,-2,5,3.0,10);
  b.prim('box',0x8a9199,0,11.2,-1,3,3.0,4);
  b.prim('cyl',0x33373c,0,8.4,-12,2.4,5,2.4);        // stacks
  b.prim('cyl',0x33373c,0,8.4,-18,2.4,5,2.4);
  b.prim('box',0x2c2f33,0,9,10,0.3,9,0.3);           // mast
  g.add(b.mesh());
  g.userData.turrets=[];
  for(const tz of [24,14,-27]){
    const tb=new Builder();
    tb.prim('box',0x545a61,0,0.8,0,5.5,1.8,6.5);
    tb.prim('cyl',0x26292d,-1.2,1.0,5.4,0.5,0.5,5.5,0,Math.PI/2,0,0);
    tb.prim('cyl',0x26292d, 1.2,1.0,5.4,0.5,0.5,5.5,0,Math.PI/2,0,0);
    const t=tb.mesh(); t.position.set(0,4.0,tz);
    if(tz<0) t.rotation.y=Math.PI;
    g.add(t); g.userData.turrets.push(t);
  }
  return g;
}
function makeZeppelin(){
  const g=new THREE.Group();
  const b=new Builder();
  b.prim('cyl',0xbdb8ab,0,0,0,19,52,19,0,Math.PI/2,0,0);
  b.prim('sph',0xbdb8ab,0,0,27,19,19,26,0,0,0,0);
  b.prim('sph',0xb2ad9f,0,0,-27,19,19,30,0,0,0,0);
  // panel lines
  b.prim('cyl',0x9d9789,0,0,10,19.3,1.2,19.3,0,Math.PI/2,0,0);
  b.prim('cyl',0x9d9789,0,0,-10,19.3,1.2,19.3,0,Math.PI/2,0,0);
  // fins
  b.prim('box',0x8f897b,0,10,-34,0.7,12,11);
  b.prim('box',0x8f897b,0,-10,-34,0.7,12,11);
  b.prim('box',0x8f897b,-10,0,-34,12,0.7,11);
  b.prim('box',0x8f897b, 10,0,-34,12,0.7,11);
  b.prim('box',0xb8342c,0,0,-38,0.9,7,5);
  // gondola + gun pods
  b.prim('box',0x4a463c,0,-10.6,8,3.4,2.6,12);
  b.prim('box',0x4a463c,-8,-8.2,-6,2.2,2,4);
  b.prim('box',0x4a463c, 8,-8.2,-6,2.2,2,4);
  g.add(b.mesh());
  const p1=makeProp(2.4),p2=makeProp(2.4);
  p1.position.set(-8,-8.2,-3.8); p2.position.set(8,-8.2,-3.8);
  g.add(p1);g.add(p2); g.userData.props=[p1,p2];
  return g;
}
function makeSaucer(s){
  const g=new THREE.Group();
  const b=new Builder();
  b.prim('cyl',0x9aa4ad,0,0,0,10*s,1.6*s,10*s);
  b.prim('cyl',0x848e97,0,-1.0*s,0,6.5*s,1.2*s,6.5*s);
  b.prim('sph',0xb9c3cc,0,1.1*s,0,5*s,3.4*s,5*s,0,0,0,0);
  for(let i=0;i<6;i++){
    const a=i/6*TAU;
    b.prim('sph',0x30343a,Math.cos(a)*7.6*s,0.4*s,Math.sin(a)*7.6*s,1.2*s,1.2*s,1.2*s,0,0,0,0);
  }
  g.add(b.mesh());
  const rb=new Builder();
  rb.prim('cyl',0x7cff5a,0,0,0,9.2*s,0.5*s,9.2*s,0,0,0,0);
  const ring=rb.glowMesh(); ring.position.y=-0.9*s;
  g.add(ring); g.userData.ring=ring;
  return g;
}
function makeTripod(){
  const g=new THREE.Group();
  const b=new Builder();
  b.prim('sph',0x6d7680,0,17,0,9,6.5,10.5,0,0,0,0);
  b.prim('sph',0x596069,0,15.4,0,8,5,9,0,0,0,0);
  b.prim('box',0x30343a,0,16.5,5,3.5,2,1.5);
  g.add(b.mesh());
  const eb=new Builder();
  eb.prim('box',0xff4433,0,0,0,2.6,1.0,0.6,0,0,0,0);
  const eye=eb.glowMesh(); eye.position.set(0,16.5,5.6);
  g.add(eye); g.userData.eye=eye;
  g.userData.legs=[];
  for(let i=0;i<3;i++){
    const a=i/3*TAU+Math.PI/6;
    const lb=new Builder();
    lb.prim('box',0x596069,0,-5,2.6,1.1,10,1.1,0,0.5,0);
    lb.prim('box',0x4a5058,0,-12.5,4.9,0.9,7,0.9,0,-0.2,0);
    lb.prim('sph',0x30343a,0,-15.8,4.4,1.8,1,1.8,0,0,0,0);
    const leg=lb.mesh();
    leg.position.set(Math.cos(a)*3,15,Math.sin(a)*3);
    leg.rotation.y=-a+Math.PI/2;
    g.add(leg); g.userData.legs.push(leg);
  }
  return g;
}
function makeRobot(){
  const g=new THREE.Group();
  const S=1.7;
  const b=new Builder();
  b.prim('box',0x8a6f4d,0,15*S,0,9*S,8.5*S,5.5*S);           // torso (brass age)
  b.prim('box',0x9d8158,0,15.5*S,3*S,6*S,5*S,0.6*S);          // chest plate
  b.prim('box',0x6e5940,0,10*S,0,7*S,2.5*S,4.5*S);            // hips
  b.prim('box',0x8a6f4d,-6.2*S,15.8*S,0,3*S,3*S,3.5*S);       // shoulders
  b.prim('box',0x8a6f4d, 6.2*S,15.8*S,0,3*S,3*S,3.5*S);
  b.prim('box',0x9d8158,0,21*S,0,4.2*S,3.4*S,4.2*S);          // head
  b.prim('box',0x30343a,0,23.2*S,0,0.4*S,2.5*S,0.4*S);        // antenna
  b.prim('sph',0xc9342c,0,24.6*S,0,0.9*S,0.9*S,0.9*S,0,0,0,0);
  g.add(b.mesh());
  const eb=new Builder();
  eb.prim('box',0xff4433,0,0,0,3.2*S,0.8*S,0.5*S,0,0,0,0);
  const eye=eb.glowMesh(); eye.position.set(0,21.2*S,2.2*S);
  g.add(eye); g.userData.eye=eye;
  function limb(w,h){
    const lb=new Builder();
    lb.prim('box',0x7a6244,0,-h/2,0,w,h,w);
    lb.prim('box',0x574733,0,-h+0.8,0,w*1.25,1.8,w*1.25);
    return lb.mesh();
  }
  const lArm=limb(2.4*S,9*S); lArm.position.set(-6.2*S,15*S,0);
  const rArm=limb(2.4*S,9*S); rArm.position.set( 6.2*S,15*S,0);
  const lLeg=limb(3*S,9.5*S); lLeg.position.set(-2.6*S,9.5*S,0);
  const rLeg=limb(3*S,9.5*S); rLeg.position.set( 2.6*S,9.5*S,0);
  g.add(lArm);g.add(rArm);g.add(lLeg);g.add(rLeg);
  g.userData.limbs=[lArm,rArm,lLeg,rLeg];
  return g;
}

