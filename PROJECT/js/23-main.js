'use strict';
/* ============================== MAIN LOOP ============================== */
let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  let dt=Math.min((now-last)/1000,0.05); last=now;
  G.time+=dt;
  if(G.state==='play'){
    updatePlayer(dt);
    updateEnemies(dt);
    updateSpawner(dt);
    updatePowerups(dt);
  }
  if(G.state==='play'||G.state==='won'||G.state==='dead'||G.state==='menu'){
    updateBullets(G.state==='pause'?0:dt);
  }
  // stop-motion ticks
  G.qacc+=dt;
  while(G.qacc>=STEP){
    G.qacc-=STEP;
    syncEnemies();
    tickPowerups();
    tickPSys(PS_GLOW); tickPSys(PS_SOLID);
    for(const s of G.spinners){
      if(s.ax==='z')s.obj.rotation.z+=s.sp*STEP*6;
      else s.obj.rotation.y+=s.sp*STEP*6;
    }
    for(const em of G.emitters){
      em.acc+=em.rate*STEP;
      while(em.acc>=1){
        em.acc-=1;
        if(em.kind==='fire'){
          spawnP(PS_GLOW,em.x+rr(-2,2),em.y,em.z+rr(-2,2),rr(-1,1),rr(4,9),rr(-1,1),rr(0.5,1),rr(0.9,1.7),0xffd76a,0xff5a2a,0,0.96);
          if(R()<0.5)spawnP(PS_SOLID,em.x,em.y+3,em.z,rr(-1,1),rr(3,6),rr(-1,1),rr(1.5,3),rr(1.2,2.4),0x2c2a28,0x555250,0,0.99);
        }else{
          spawnP(PS_SOLID,em.x+rr(-3,3),em.y,em.z+rr(-3,3),rr(-1,1),rr(2,5),rr(-1,1),rr(2,4),rr(1.4,2.8),0x6a675f,0x9a968c,0,0.995);
        }
      }
    }
    // player prop + visual snap happens smooth below; prop spins on ticks
    if(player.mesh.userData.prop)player.mesh.userData.prop.rotation.z+=2.1;
  }
  // player visual (smooth for control feel)
  player.mesh.position.copy(player.pos);
  player.mesh.quaternion.copy(player.quat);
  player.mesh.visible=player.hp>0||G.state!=='dead';
  // rippling water (quantized to the stop-motion tick)
  if(G.water)G.water.material.uniforms.uTime.value=Math.floor(G.time/STEP)*STEP;
  updateEngine();
  updateEnemyVoices();
  // flash lights decay
  for(const f of flashPool){f.life-=dt;if(f.life<=0)f.L.intensity=0;else f.L.intensity*=Math.pow(0.001,dt*3);}
  // camera
  camTarget.lerp(player.pos,Math.min(1,dt*4));
  shake=Math.max(0,shake-dt*1.6);
  const sh=shake*shake*6;
  camera.position.set(
    camTarget.x+CAMOFF.x+rr(-sh,sh),
    camTarget.y+CAMOFF.y+rr(-sh,sh),
    camTarget.z+CAMOFF.z+rr(-sh,sh));
  camera.lookAt(camTarget);
  camera.updateMatrixWorld();
  sun.position.set(player.pos.x+180,player.pos.y+260,player.pos.z+120);
  sun.target.position.copy(player.pos);
  updateHud();
  // reflection pass: mirror the camera across the water plane, clip below it
  if(G.water){
    const L=G.water.position.y;
    reflCam.position.set(camera.position.x,2*L-camera.position.y,camera.position.z);
    reflCam.up.set(0,1,0);
    _v.set(camTarget.x,2*L-camTarget.y,camTarget.z);
    reflCam.lookAt(_v);
    reflCam.projectionMatrix.copy(camera.projectionMatrix);
    reflCam.updateMatrixWorld();
    reflTexMat.set(0.5,0,0,0.5, 0,0.5,0,0.5, 0,0,0.5,0.5, 0,0,0,1);
    reflTexMat.multiply(reflCam.projectionMatrix);
    reflTexMat.multiply(reflCam.matrixWorldInverse);
    G.water.material.uniforms.uReflMat.value.copy(reflTexMat);
    G.water.visible=false;
    reflClip[0].normal.set(0,1,0); reflClip[0].constant=-(L+0.05);
    renderer.clippingPlanes=reflClip;
    renderer.setRenderTarget(reflRT);
    renderer.render(scene,reflCam);
    renderer.clippingPlanes=[];
    G.water.visible=true;
  }
  // two-pass render: scene → rt → tilt-shift post
  renderer.setRenderTarget(rt);
  renderer.render(scene,camera);
  renderer.setRenderTarget(null);
  renderer.render(postScene,postCam);
}
loadAssets(refreshPlayerMesh);
showMenu();
updateHudStatic();
requestAnimationFrame(frame);
