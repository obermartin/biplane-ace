'use strict';
/* ============================== CAMPAIGN 3: VISITORS (1920s AMERICA) ============================== */
function genVisitors(li){
  scene.background=new THREE.Color(li>=2?0xc9a76a:0xa8c4d8);
  hemi.color.set(0xe8ecf4); hemi.groundColor.set(0x7a6b4d); hemi.intensity=0.9;
  sun.color.set(li>=2?0xffdba8:0xfff2d8); sun.intensity=1.15;
  G.heightAt=(x,z)=>0;
  G.waterLevel=-999;
  const B=new Builder();
  if(li===0){ /* --- rural midwest --- */
    const patches=[];
    for(let i=0;i<60;i++) patches.push({x:rr(-WORLD,WORLD),z:rr(-WORLD,WORLD),w:rr(60,160),d:rr(60,160),c:pick([0xa8923f,0x6a8a3a,0x527a34,0x93753c,0x5e854a])});
    makeGround((x,z)=>{
      let c=0x5f7a3c;
      for(const p of patches)
        if(Math.abs(x-p.x)<p.w/2&&Math.abs(z-p.z)<p.d/2) c=p.c;
      // dirt roads
      if(Math.abs(x%420)<5||Math.abs(z%420)<5) c=0x9a8259;
      return {h:0,color:c};
    });
    for(let i=0;i<9;i++){
      // farmstead: barn (fly-through!) + house + silo + water tower
      const fx=rr(-WORLD+120,WORLD-120),fz=rr(-WORLD+120,WORLD-120),ry=ri(0,3)*Math.PI/2;
      const bw=16,bh=11,bd=26;
      const cs=Math.cos(ry),sn=Math.sin(ry);
      B.prim('box',0xa8352c,fx,bh/2,fz,bw,bh,bd,ry);
      B.prim('box',0x7c2a23,fx,bh+1.8,fz,bw*0.7,3.6,bd+0.8,ry,0,0.6);
      B.prim('box',0x7c2a23,fx,bh+1.8,fz,bw*0.7,3.6,bd+0.8,ry,0,-0.6);
      // big dark door openings both ends
      B.prim('box',0x241f1c,fx+sn*(bd/2),3.6,fz+cs*(bd/2),9,7.2,0.6,ry);
      B.prim('box',0x241f1c,fx-sn*(bd/2),3.6,fz-cs*(bd/2),9,7.2,0.6,ry);
      B.prim('box',0xe8e2d2,fx+sn*(bd/2+0.1),8.6,fz+cs*(bd/2+0.1),3,2,0.5,ry); // hayloft window
      // solids: two side walls + roof slab (tunnel stays open!)
      const wallX=Math.abs(Math.cos(ry))*2.5+Math.abs(Math.sin(ry))*bd;
      const wallZ=Math.abs(Math.sin(ry))*2.5+Math.abs(Math.cos(ry))*bd;
      const px=Math.cos(ry),pz=-Math.sin(ry); // perpendicular to barn axis
      solidBox(fx+px*(bw/2),bh/2,fz+pz*(bw/2),wallX,bh,wallZ);
      solidBox(fx-px*(bw/2),bh/2,fz-pz*(bw/2),wallX,bh,wallZ);
      const roofX=Math.abs(Math.cos(ry))*bw+Math.abs(Math.sin(ry))*bd;
      const roofZ=Math.abs(Math.sin(ry))*bw+Math.abs(Math.cos(ry))*bd;
      solidBox(fx,(8.2+bh+5)/2,fz,roofX,bh+5-8.2,roofZ);
      stuntZone(fx,3.8,fz,
        Math.abs(Math.cos(ry))*bw*0.45+Math.abs(Math.sin(ry))*bd*0.85,
        6.4,
        Math.abs(Math.sin(ry))*bw*0.45+Math.abs(Math.cos(ry))*bd*0.85,
        'THROUGH THE BARN',400);
      // farmhouse + silo + water tower nearby
      addHouse(B,fx+px*34+sn*10,fz+pz*34+cs*10,rr(0,TAU),9,11,5.5,0xe8e2d2,0x596b4a);
      B.prim('cyl',0xb8b2a4,fx-px*26,7,fz-pz*26,4.2,14,4.2);
      B.prim('sph',0x8f8a7c,fx-px*26,14.5,fz-pz*26,4.2,3,4.2);
      solidBox(fx-px*26,8,fz-pz*26,9,18,9);
      if(R()<0.6) addWaterTower(B,fx+px*20-sn*24,fz+pz*20-cs*24);
    }
    // windmills (spinning!)
    for(let i=0;i<7;i++){
      const x=rr(-WORLD,WORLD),z=rr(-WORLD,WORLD);
      B.prim('box',0x9c9284,x,7,z,1.4,14,1.4,rr(0,TAU));
      const rotor=new THREE.Group();
      const rb=new Builder();
      for(let k=0;k<4;k++) rb.prim('box',0xd8d2c2,Math.cos(k*Math.PI/2)*3,Math.sin(k*Math.PI/2)*3,0,
        Math.abs(Math.cos(k*Math.PI/2))*5+0.5,Math.abs(Math.sin(k*Math.PI/2))*5+0.5,0.25,0,0,0,0);
      rb.prim('sph',0x6b5b44,0,0,0,0.9,0.9,0.9,0,0,0,0);
      const rm=rb.mesh(true,false);
      rotor.add(rm); rotor.position.set(x,14.5,z);
      worldGroup.add(rotor);
      G.spinners.push({obj:rotor,ax:'z',sp:1.6});
      solidBox(x,7,z,4,15,4);
    }
    // scattered trees + a long rail viaduct and a road bridge over a creek
    for(let i=0;i<30;i++) addTreePine(B,rr(-WORLD,WORLD),rr(-WORLD,WORLD),rr(0.7,1.3));
    buildBridge(B,rr(-350,350),rr(-350,350),rr(0,TAU),300,22,9,true);
    buildBridge(B,rr(-500,500),rr(-500,500),rr(0,TAU),150,16,10,false);
  }else if(li===1){ /* --- small town / suburbia --- */
    makeGround((x,z)=>{
      let c=0x5e8040;
      const gx=Math.abs(((x%86)+86)%86-43), gz=Math.abs(((z%86)+86)%86-43);
      if(gx<4.5||gz<4.5) c=0x6e6a62;             // street grid
      else if(gx<7||gz<7) c=0x9a958a;            // sidewalks
      return {h:0,color:c};
    });
    // houses fill the blocks
    for(let bx=-WORLD+60;bx<WORLD-60;bx+=86){
      for(let bz=-WORLD+60;bz<WORLD-60;bz+=86){
        if(R()<0.18) continue;
        const n=ri(2,4);
        for(let k=0;k<n;k++){
          const hx=bx+rr(-24,24),hz=bz+rr(-24,24);
          addHouse(B,hx,hz,ri(0,3)*Math.PI/2,rr(7,10),rr(8,12),rr(4,6),
            pick([0xe8e2d2,0xd8c8a8,0xc8d8c8,0xd4b8a8,0xbcc8d8]),pick([0x596b4a,0x6b4a3a,0x4a5a6b,0x5c5248]));
        }
        if(R()<0.15) addTreePine(B,bx+rr(-30,30),bz+rr(-30,30),rr(0.6,1));
      }
    }
    // main street: church + a few brick shops
    B.prim('box',0xd8d2c2,0,7,-40,14,14,20);
    B.prim('box',0x8b3a2f,0,15.6,-40,10,4,21,0,0,0.7);
    B.prim('box',0x8b3a2f,0,15.6,-40,10,4,21,0,0,-0.7);
    B.prim('box',0xd8d2c2,0,13,-26,5,26,5);
    B.prim('cone',0x596b4a,0,28.5,-26,4.2,7,4.2);
    solidBox(0,10,-40,18,22,24); solidBox(0,16,-26,7,34,7);
    for(let i=0;i<8;i++){
      const sx=-160+i*44;
      B.prim('box',pick([0x9c5a42,0xa86b4c,0x8a5240]),sx,5.5,60,16,11,14);
      B.prim('box',0x5c5248,sx,11.4,60,17,0.8,15);
      solidBox(sx,6,60,18,13,16);
    }
    addWaterTower(B,120,-120); addWaterTower(B,-200,180);
    // a highway overpass + rail bridge
    buildBridge(B,0,150,0,340,20,13,false);
    buildBridge(B,-220,-80,Math.PI/2,220,26,9,true);
    for(let i=0;i<4;i++) G.emitters.push({x:rr(-WORLD,WORLD),y:1,z:rr(-WORLD,WORLD),rate:0.5,acc:R(),kind:'smoke'});
  }else{ /* --- art deco metropolis --- */
    makeGround((x,z)=>{
      let c=0x5e5a54;
      const gx=Math.abs(((x%90)+90)%90-45), gz=Math.abs(((z%90)+90)%90-45);
      if(gx<6||gz<6) c=0x46433f;
      else if(gx<9||gz<9) c=0x807a70;
      return {h:0,color:c};
    });
    const park=(x,z)=>Math.hypot(x-60,z+120)<130; // central park stays low & green
    for(let bx=-WORLD+90;bx<WORLD-90;bx+=90){
      for(let bz=-WORLD+90;bz<WORLD-90;bz+=90){
        if(park(bx,bz)){ if(R()<0.5) addTreePine(B,bx+rr(-25,25),bz+rr(-25,25),rr(0.8,1.4)); continue; }
        if(R()<0.2) continue;
        const dist=Math.hypot(bx,bz)/WORLD;
        let h=rr(28,92)*(1.25-dist*0.8)*(li===3?1.25:1);
        h=Math.max(20,h);
        const base=rr(26,34);
        const wall=pick([0xb8a888,0xc4b492,0x9c8e74,0xa89a80,0xbcae94]);
        let w=base,y=0,tiers=ri(2,4);
        for(let t=0;t<tiers;t++){
          const th=h*(t===tiers-1?0.28:0.72/(tiers-1||1))+rr(-3,3);
          B.prim('box',wall,bx,y+th/2,bz,w,th,w);
          // facade strips
          B.prim('box',0x6b6154,bx,y+th/2,bz,w*0.35,th+0.5,w+0.4);
          B.prim('box',0x6b6154,bx,y+th/2,bz,w+0.4,th+0.5,w*0.35);
          y+=th; w*=rr(0.62,0.75);
        }
        if(R()<0.5){ B.prim('cyl',0xd8c8a0,bx,y+5,bz,1.1,10,1.1); y+=10; }
        solidBox(bx,y/2,bz,base+2,y+4,base+2);
      }
    }
    // elevated viaducts threading between towers — prime stunt territory
    buildBridge(B,45,0,0,760,34,11,false);
    buildBridge(B,-45,45,Math.PI/2,760,46,11,false);
    buildBridge(B,200,-200,rr(0,TAU),240,24,10,true);
    for(let i=0;i<6;i++) G.emitters.push({x:rr(-WORLD,WORLD),y:rr(10,40),z:rr(-WORLD,WORLD),rate:0.7,acc:R(),kind:'smoke'});
  }
  worldGroup.add(B.mesh(true,true));
}
const GENS=[genVerdun,genIslands,genVisitors];

