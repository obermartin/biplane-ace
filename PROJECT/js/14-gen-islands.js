'use strict';
/* ============================== CAMPAIGN 2: ISLANDS ============================== */
function genIslands(li){
  scene.background=new THREE.Color(0x79b6c9);
  hemi.color.set(0xdff2ff); hemi.groundColor.set(0x3f7a8a); hemi.intensity=0.95;
  sun.color.set(0xfff4da); sun.intensity=1.25;
  const isles=[];
  const N=7+li*2;
  // two guaranteed close islands for a bridge
  isles.push({x:-90,z:0,r:rr(120,160),h:rr(10,16)});
  isles.push({x:150,z:60,r:rr(90,130),h:rr(8,14)});
  for(let i=0;i<N;i++){
    let ok=false,x,z,r;
    for(let t=0;t<20&&!ok;t++){
      x=rr(-WORLD+150,WORLD-150); z=rr(-WORLD+150,WORLD-150); r=rr(60,170);
      ok=true;
      for(const o of isles){const d=Math.hypot(x-o.x,z-o.z); if(d<r+o.r+60) ok=false;}
    }
    if(ok) isles.push({x,z,r,h:rr(7,18)});
  }
  const gY=(x,z)=>{
    let h=-8;
    for(const o of isles){
      const d=Math.hypot(x-o.x,z-o.z);
      if(d<o.r){
        const t=1-d/o.r;
        h=Math.max(h,-8+ (o.h+8)*t*t*(3-2*t)*1.15);
      }
    }
    return Math.min(h,20);
  };
  G.heightAt=(x,z)=>gY(x,z); // seafloor goes negative — water gates depend on it
  G.waterLevel=0;
  makeGround((x,z)=>{
    const h=gY(x,z);
    let c;
    if(h<-3) c=0x1f5e78;
    else if(h<0.4) c=0x2f7d92;
    else if(h<2.2) c=0xd8c48a;   // sand
    else if(h<9) c=0x5a9648;
    else c=0x4a7f3c;
    return {h,color:c};
  });
  addWater(0x2f8aa6,0.25,'sea');
  const B=new Builder();
  for(const o of isles){
    const nP=Math.floor(o.r/12);
    for(let i=0;i<nP;i++){
      const a=rr(0,TAU),d=rr(0.2,0.85)*o.r,x=o.x+Math.cos(a)*d,z=o.z+Math.sin(a)*d;
      if(gY(x,z)>1.5) addPalm(B,x,z,rr(0.8,1.5));
    }
    // huts
    if(o.r>90){
      for(let i=0;i<3;i++){
        const a=rr(0,TAU),d=rr(0.1,0.5)*o.r,x=o.x+Math.cos(a)*d,z=o.z+Math.sin(a)*d;
        if(gY(x,z)>2) addHouse(B,x,z,rr(0,TAU),rr(5,8),rr(5,8),3.5,0xb59b6d,0x7a5c3a);
      }
      // dock
      const a=rr(0,TAU);
      const dx=o.x+Math.cos(a)*(o.r*0.92),dz=o.z+Math.sin(a)*(o.r*0.92);
      B.prim('box',0x8a6b45,dx,1.2,dz,4,0.5,26,-a+Math.PI/2);
    }
  }
  // bridge between the two guaranteed islands
  const i0=isles[0],i1=isles[1];
  const ang=Math.atan2(i1.z-i0.z,i1.x-i0.x);
  const mx=(i0.x+i1.x)/2,mz=(i0.z+i1.z)/2;
  buildBridge(B,mx,mz,ang,Math.hypot(i1.x-i0.x,i1.z-i0.z)*0.8,16+li*2,10,true);
  if(li>=1){
    // a long causeway viaduct across open water
    buildBridge(B,rr(-300,300),rr(-500,500),rr(0,TAU),260,20,9,true);
  }
  worldGroup.add(B.mesh());
  for(let i=0;i<4;i++)
    G.emitters.push({x:rr(-WORLD,WORLD),y:1,z:rr(-WORLD,WORLD),rate:0.8,acc:R(),kind:'smoke'});
}

