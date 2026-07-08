'use strict';
/* ============================== TERRAIN HELPERS ============================== */
function solidBox(cx,cy,cz,sx,sy,sz){
  G.solids.push({x0:cx-sx/2,y0:cy-sy/2,z0:cz-sz/2,x1:cx+sx/2,y1:cy+sy/2,z1:cz+sz/2});
}
function stuntZone(cx,cy,cz,sx,sy,sz,msg,pts){
  G.stunts.push({x0:cx-sx/2,y0:cy-sy/2,z0:cz-sz/2,x1:cx+sx/2,y1:cy+sy/2,z1:cz+sz/2,msg,pts,cd:0});
}
function makeGround(fn){ // fn(x,z) -> {h, color}
  const seg=140, size=WORLD*2.3;
  const g=new THREE.PlaneGeometry(size,size,seg,seg);
  g.rotateX(-Math.PI/2);
  const pos=g.attributes.position;
  const cols=new Float32Array(pos.count*3);
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i);
    const r=fn(x,z);
    pos.setY(i,r.h);
    _col.set(r.color); _col.offsetHSL(0,0,(R()-0.5)*0.035);
    cols[i*3]=_col.r; cols[i*3+1]=_col.g; cols[i*3+2]=_col.b;
  }
  g.setAttribute('color',new THREE.BufferAttribute(cols,3));
  g.computeVertexNormals();
  const m=new THREE.Mesh(g,MAT_GROUND);
  m.receiveShadow=true;
  worldGroup.add(m);
  return m;
}
const WATER_VS=`
uniform float uTime; uniform float uSpeed;
varying vec3 vWp;
void main(){
  vec3 p=position;
  // gentle large swell only — fine ripples live in the fragment shader
  float t=uTime*uSpeed;
  p.y+=(sin(p.x*0.02+t*0.8)+sin(p.z*0.017-t*0.6))*0.35;
  vec4 wp=modelMatrix*vec4(p,1.0); vWp=wp.xyz;
  gl_Position=projectionMatrix*viewMatrix*wp;
}`;
const WATER_FS=`
uniform float uTime; uniform vec3 uColor; uniform vec3 uSky; uniform vec3 uSunDir;
uniform sampler2D uReflTex; uniform mat4 uReflMat;
uniform float uSpec; uniform float uAmp; uniform float uRefl; uniform float uFres; uniform float uSpeed; uniform float uAlpha;
uniform vec4 uRip[32]; // x,z,startTime,strength — impact & wake rings
varying vec3 vWp;
vec3 waveN(vec2 p,float t){
  // analytic normal of a sum of short waves (λ ≈ 6–13 units)
  vec2 g=vec2(0.0);
  g.x+=0.40*cos(p.x*1.05+t*2.6);
  g.y+=0.34*cos(p.y*0.78-t*2.0);
  vec2 d3=vec2(0.78,0.62);
  g+=d3*0.36*cos(dot(p,d3)*0.55+t*1.6);
  vec2 d4=vec2(-0.55,0.83);
  g+=d4*0.22*cos(dot(p,d4)*0.92-t*3.1);
  return normalize(vec3(-g.x*uAmp,1.0,-g.y*uAmp));
}
vec2 hash2(vec2 p){
  return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
}
void main(){
  // facet the water into small cells — jittered & desynced so no repeating pattern shows
  vec2 id=floor(vWp.xz/1.2);
  vec2 rnd=hash2(id);
  vec2 cell=(id+0.5)*1.2+(rnd-0.5)*1.5;
  vec3 n=waveN(cell,uTime*uSpeed+rnd.x*3.7);
  n.xz+=(rnd-0.5)*0.3*uAmp;
  // expanding impact/wake rings (full speed even on still water)
  vec2 grip=vec2(0.0);
  for(int i=0;i<32;i++){
    vec4 rw=uRip[i];
    float age=uTime-rw.z;
    if(rw.w<=0.0||age<0.0||age>1.5) continue;
    vec2 dv=vWp.xz-rw.xy;
    float d=length(dv)+0.001;
    float rad=1.5+age*24.0;
    float band=exp(-pow((d-rad)*0.5,2.0));
    float env=(1.0-age/1.5)*rw.w;
    grip+=(dv/d)*cos((d-rad)*1.7)*band*env*2.6;
  }
  n.xz-=grip;
  n=normalize(n);
  vec3 v=normalize(cameraPosition-vWp);
  float fres=pow(1.0-max(dot(n,v),0.0),2.0);
  // true planar reflection, distorted by the ripple facets
  vec4 rp=uReflMat*vec4(vWp,1.0);
  vec2 ruv=clamp(rp.xy/rp.w+n.xz*0.08,0.002,0.998);
  vec3 refl=texture2D(uReflTex,ruv).rgb;
  vec3 base=mix(uColor,uSky,0.18);
  vec3 col=mix(base,refl,uRefl+uFres*fres);
  vec3 h=normalize(normalize(uSunDir)+v);
  float sharp=pow(max(dot(n,h),0.0),140.0);
  float broad=pow(max(dot(n,h),0.0),22.0);
  col+=vec3(1.0,0.97,0.85)*(sharp*1.2+broad*0.15)*uSpec;
  gl_FragColor=vec4(col,uAlpha);
}`;
function addWater(color,level,kind){
  if(kind){ // 'sea': lively glitter · 'still': murky, calm reflection
    const sea=kind==='sea';
    const g=new THREE.PlaneGeometry(WORLD*2.3,WORLD*2.3,110,110);
    g.rotateX(-Math.PI/2);
    const mat=new THREE.ShaderMaterial({
      uniforms:{uTime:{value:0},uColor:{value:new THREE.Color(color)},
        uSky:{value:new THREE.Color(sea?0xbfd8de:0x9aa094)},uSunDir:{value:new THREE.Vector3(0.5,0.8,0.3)},
        uReflTex:{value:reflRT.texture},uReflMat:{value:new THREE.Matrix4()},
        uSpec:{value:sea?1:0},uAmp:{value:sea?1:0.3},uRefl:{value:sea?0.38:0.17},
        uFres:{value:sea?0.5:0.3},uSpeed:{value:sea?1:0.22},uAlpha:{value:sea?0.94:0.97},
        uRip:{value:Array.from({length:32},()=>new THREE.Vector4(0,0,-99,0))}},
      vertexShader:WATER_VS,fragmentShader:WATER_FS,transparent:true});
    mat.extensions={derivatives:true};
    const m=new THREE.Mesh(g,mat);
    m.position.y=level;
    worldGroup.add(m);
    G.water=m;
    return;
  }
  const g=new THREE.PlaneGeometry(WORLD*2.3,WORLD*2.3,40,40);
  g.rotateX(-Math.PI/2);
  const pos=g.attributes.position;
  const cols=new Float32Array(pos.count*3);
  for(let i=0;i<pos.count;i++){
    pos.setY(i,level+(R()-0.5)*0.7);
    _col.set(color); _col.offsetHSL(0,(R()-0.5)*0.03,(R()-0.5)*0.05);
    cols[i*3]=_col.r;cols[i*3+1]=_col.g;cols[i*3+2]=_col.b;
  }
  g.setAttribute('color',new THREE.BufferAttribute(cols,3));
  g.computeVertexNormals();
  const m=new THREE.Mesh(g,MAT);
  m.receiveShadow=true;
  worldGroup.add(m);
}
function buildBridge(B,bx,bz,ang,len,h,wid,stone){
  const c=stone?0x8d8577:0x5d534a, deck=stone?0x9a9284:0x6b6157;
  const cs=Math.cos(ang),sn=Math.sin(ang);
  const P=(u,v)=>({x:bx+cs*u-sn*v, z:bz+sn*u+cs*v});
  // deck
  B.prim('box',deck,bx,h,bz,len,1.6,wid,ang);
  B.prim('box',c,bx,h+1.3,bz,len,1.0,0.8,ang); // rails via two offset boxes
  const r1=P(0,wid/2-0.5), r2=P(0,-wid/2+0.5);
  B.prim('box',c,r1.x,h+1.3,r1.z,len,1.0,0.7,ang);
  B.prim('box',c,r2.x,h+1.3,r2.z,len,1.0,0.7,ang);
  // pylons
  const n=Math.max(2,Math.round(len/34));
  for(let i=0;i<=n;i++){
    const u=-len/2+ (len/n)*i;
    const p=P(u,0);
    const gy=G.heightAt(p.x,p.z);
    B.prim('box',c,p.x,(h+gy)/2,p.z,3.2,h-gy,wid*0.85,ang);
    // arch cutout illusion: darker inset
    if(i<n){
      const pm=P(u+len/n/2,0);
      B.prim('box',stone?0x6f685c:0x453d36,pm.x,(h+gy)/2-1,pm.z,len/n-6,h-gy-5,wid*0.5,ang);
    }
  }
  // solids: deck slab + pylon line approximated as segments
  const dx=Math.abs(cs*len)+Math.abs(sn*wid), dz=Math.abs(sn*len)+Math.abs(cs*wid);
  // deck as several small AABBs along its length (better fit for angled bridges)
  const segs=Math.max(3,Math.round(len/26));
  for(let i=0;i<segs;i++){
    const u=-len/2+len*(i+0.5)/segs;
    const p=P(u,0);
    G.solids.push({x0:p.x-14,y0:h-1.2,z0:p.z-14,x1:p.x+14,y1:h+2.6,z1:p.z+14});
  }
  stuntZone(bx,(h-3)/2+1,bz,Math.min(dx,len*0.8),h-5,Math.min(dz,len*0.8),'UNDER THE BRIDGE',500);
}
function addTreePine(B,x,z,s){
  const y=G.heightAt(x,z);
  B.prim('cyl',0x5a4630,x,y+1.6*s,z,0.8*s,3.2*s,0.8*s);
  B.prim('cone',0x3d5c33,x,y+4.6*s,z,3.6*s,5.5*s,3.6*s);
  B.prim('cone',0x466a3a,x,y+7*s,z,2.6*s,4*s,2.6*s);
}
function addPalm(B,x,z,s){
  const y=G.heightAt(x,z);
  B.prim('cyl',0x8a6b45,x,y+3*s,z,0.7*s,6*s,0.7*s,0,0,rr(-0.12,0.12));
  for(let i=0;i<5;i++){
    const a=i/5*TAU+rr(-0.3,0.3);
    B.prim('box',0x3f7a3c,x+Math.cos(a)*2.2*s,y+6.2*s,z+Math.sin(a)*2.2*s,4.4*s,0.3*s,1.2*s,-a,0,-0.35);
  }
}
function addBurntTree(B,x,z,s){
  const y=G.heightAt(x,z);
  B.prim('cyl',0x2b2622,x,y+2.4*s,z,0.6*s,4.8*s,0.6*s,0,0,rr(-0.15,0.15));
  B.prim('box',0x2b2622,x+0.8*s,y+4*s,z,2*s,0.3*s,0.3*s,rr(0,TAU),0,0.5);
}
function addHouse(B,x,z,ry,w,d,hgt,wall,roof){
  const y=G.heightAt(x,z);
  B.prim('box',wall,x,y+hgt/2,z,w,hgt,d,ry);
  B.prim('box',roof,x,y+hgt+w*0.16,z,w*0.78,w*0.36,d+0.6,ry,0, 0.72);
  B.prim('box',roof,x,y+hgt+w*0.16,z,w*0.78,w*0.36,d+0.6,ry,0,-0.72);
  solidBox(x,y+hgt/2+2,z,Math.max(w,d)+2,hgt+8,Math.max(w,d)+2);
}
function addWaterTower(B,x,z){
  const y=G.heightAt(x,z);
  for(let i=0;i<4;i++){
    const a=i/4*TAU+Math.PI/4;
    B.prim('box',0x6b5b44,x+Math.cos(a)*2.4,y+7,z+Math.sin(a)*2.4,0.6,14,0.6,0,0,Math.cos(a)*0.12);
  }
  B.prim('cyl',0x8f5b40,x,y+16.5,z,7,6,7);
  B.prim('cone',0x5c4630,x,y+21.2,z,7.6,3.6,7.6);
  solidBox(x,y+14,z,10,22,10);
}

