'use strict';
/* ============================== CAMPAIGN 1: VERDUN ============================== */
function genVerdun(li){
  scene.background=new THREE.Color(0x8b8172);
  hemi.color.set(0xcfd6e4); hemi.groundColor.set(0x6b5c46); hemi.intensity=0.8;
  sun.color.set(0xffe8c4); sun.intensity=1.05;
  const craters=[], trenches=[];
  const NC=40+li*14;
  for(let i=0;i<NC;i++) craters.push({x:rr(-WORLD,WORLD),z:rr(-WORLD,WORLD),r:rr(9,30),d:rr(2,5)});
  for(let i=0;i<7;i++){
    const zz=-WORLD+i*(WORLD*2/7)+rr(-40,40);
    trenches.push({z:zz,w:rr(4,7),wig:rr(0.004,0.009),amp:rr(10,30)});
  }
  const riverX=rr(-300,300);
  const gY=(x,z)=>{
    let h=rr===null?0:0;
    for(const c of craters){
      const dx=x-c.x,dz=z-c.z,dd=Math.sqrt(dx*dx+dz*dz);
      if(dd<c.r){const t=dd/c.r; h-=c.d*(1-t*t)*(1-t*t);}
    }
    for(const t of trenches){
      const tz=t.z+Math.sin(x*t.wig)*t.amp;
      if(Math.abs(z-tz)<t.w) h-=2.6;
    }
    const dr=Math.abs(x-riverX);
    if(dr<26) h-=6*(1-dr/26);
    return h;
  };
  G.heightAt=(x,z)=>Math.max(gY(x,z),Math.abs(x-riverX)<20?-3:-999);
  G.waterLevel=-2.6;
  makeGround((x,z)=>{
    const h=gY(x,z);
    let c=0x77664b;
    if(h<-2.2) c=0x4e4232;
    else if(h<-0.8) c=0x5f5140;
    if(Math.abs(x-riverX)<22) c=0x44392c;
    return {h,color:c};
  });
  addWater(0x4f6152,-2.6,'still'); // stagnant river / flooded shell holes
  const B=new Builder();
  // ruined village
  const vx=rr(-500,500),vz=rr(-500,500);
  for(let i=0;i<10;i++){
    const x=vx+rr(-90,90),z=vz+rr(-90,90),ry=rr(0,TAU),w=rr(7,13),hgt=rr(4,9);
    B.prim('box',0x9a8f7c,x,hgt/2,z,w,hgt,1.4,ry);
    B.prim('box',0x9a8f7c,x+Math.sin(ry)*w/2,hgt*0.35,z+Math.cos(ry)*w/2,1.4,hgt*0.7,w*0.7,ry);
    for(let j=0;j<3;j++) B.prim('box',0x8a8070,x+rr(-6,6),0.8,z+rr(-6,6),rr(1,3),rr(1,2),rr(1,3),rr(0,TAU));
    solidBox(x,hgt/2,z,w+2,hgt+3,w+2);
  }
  // scattered ruins + stumps + wire posts + crates
  for(let i=0;i<26;i++) addBurntTree(B,rr(-WORLD,WORLD),rr(-WORLD,WORLD),rr(0.8,1.6));
  for(let i=0;i<40;i++){
    const x=rr(-WORLD,WORLD),z=rr(-WORLD,WORLD);
    B.prim('box',0x4a3f30,x,0.8,z,0.4,1.6,0.4,rr(0,TAU),0,rr(-0.3,0.3));
  }
  for(let i=0;i<14;i++){
    const x=rr(-WORLD,WORLD),z=rr(-WORLD,WORLD);
    B.prim('box',0x6e5b3f,x,1,z,2.4,2,2.4,rr(0,TAU));
  }
  // sandbag lines along trenches
  for(const t of trenches){
    for(let x=-WORLD;x<WORLD;x+=rr(60,120)){
      const tz=t.z+Math.sin(x*t.wig)*t.amp;
      B.prim('box',0x8a7a5c,x,gY(x,tz-t.w-2)+0.7,tz-t.w-2,rr(6,12),1.4,2,rr(-0.2,0.2));
    }
  }
  // bridges over the river
  for(const bz of [rr(-700,-200),rr(200,700)])
    buildBridge(B,riverX,bz,Math.PI/2,110,17+li*2,12,false);
  worldGroup.add(B.mesh());
  // fires + smoke
  for(let i=0;i<10+li*3;i++){
    const c=pick(craters);
    G.emitters.push({x:c.x,y:gY(c.x,c.z)+1,z:c.z,rate:rr(2,5),acc:R(),kind:'fire'});
  }
  for(let i=0;i<6;i++)
    G.emitters.push({x:rr(-WORLD,WORLD),y:1,z:rr(-WORLD,WORLD),rate:1.6,acc:R(),kind:'smoke'});
}

