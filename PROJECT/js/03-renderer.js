'use strict';
/* ============================== RENDERER / CAMERA / TILT-SHIFT ============================== */
const canvas=document.getElementById('c');
const renderer=new THREE.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFShadowMap;
renderer.outputEncoding=THREE.sRGBEncoding;

const scene=new THREE.Scene();
const worldGroup=new THREE.Group();  // static level scenery (rebuilt per level)
const entGroup=new THREE.Group();    // enemies (rebuilt per level)
const fxGroup=new THREE.Group();     // persistent: particles, bullets, player
scene.add(worldGroup); scene.add(entGroup); scene.add(fxGroup);

const VIEW=175;                       // vertical world units visible
const CAM_DIST=700;
const CAMOFF=V3(1,1,1).normalize().multiplyScalar(CAM_DIST); // true isometric
const camera=new THREE.OrthographicCamera(-1,1,1,-1,1,2200);
const camTarget=V3(0,40,0);
let shake=0;

const hemi=new THREE.HemisphereLight(0xcfe0ff,0x63523d,0.85);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff1d6,1.15);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-320; sun.shadow.camera.right=320;
sun.shadow.camera.top=320; sun.shadow.camera.bottom=-320;
sun.shadow.camera.near=10; sun.shadow.camera.far=1600;
sun.shadow.bias=-0.0015;
scene.add(sun); scene.add(sun.target);

/* --- flash lights pool (explosions) --- */
const flashPool=[];
for(let i=0;i<6;i++){const L=new THREE.PointLight(0xffa03c,0,280,2); scene.add(L); flashPool.push({L,life:0});}
function flash(x,y,z,power){
  let f=flashPool[0];
  for(const c of flashPool) if(c.life<f.life) f=c;
  f.L.position.set(x,y,z); f.L.intensity=power; f.life=0.3;
}

/* --- tilt-shift post pass --- */
const rt=new THREE.WebGLRenderTarget(2,2,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
/* planar water reflection: mirrored ortho camera renders into this texture */
const reflRT=new THREE.WebGLRenderTarget(1024,1024,{minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter});
const reflCam=camera.clone();
const reflClip=[new THREE.Plane(new THREE.Vector3(0,1,0),0)];
const reflTexMat=new THREE.Matrix4();
const postScene=new THREE.Scene();
const postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
const postMat=new THREE.ShaderMaterial({
  uniforms:{ tD:{value:rt.texture}, uAspect:{value:1}, uFocusY:{value:0.5}, uMax:{value:0.020}, uBoost:{value:5.0} },
  vertexShader:`varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }`,
  fragmentShader:`
    uniform sampler2D tD; uniform float uAspect; uniform float uFocusY; uniform float uMax; uniform float uBoost;
    varying vec2 vUv;
    float lum(vec3 c){ return max(c.r,max(c.g,c.b)); }
    void main(){
      vec2 T[12];
      T[0]=vec2( 1.0, 0.0);  T[1]=vec2( 0.5, 0.866); T[2]=vec2(-0.5, 0.866);
      T[3]=vec2(-1.0, 0.0);  T[4]=vec2(-0.5,-0.866); T[5]=vec2( 0.5,-0.866);
      T[6]=vec2( 0.45, 0.13);T[7]=vec2( 0.13, 0.45); T[8]=vec2(-0.35, 0.31);
      T[9]=vec2(-0.45,-0.13);T[10]=vec2(-0.13,-0.45);T[11]=vec2( 0.35,-0.31);
      float d=abs(vUv.y-uFocusY);
      float r=uMax*pow(smoothstep(0.02,0.55,d),1.2);
      vec3 c0=texture2D(tD,vUv).rgb;
      float w0=1.0+pow(lum(c0),4.0)*uBoost;
      vec3 acc=c0*w0; float ws=w0;
      for(int i=0;i<12;i++){
        vec2 o=T[i]*r; o.x/=uAspect;
        vec3 c=texture2D(tD,vUv+o).rgb;
        float w=1.0+pow(lum(c),4.0)*uBoost;
        acc+=c*w; ws+=w;
      }
      vec3 col=acc/ws;
      float g=dot(col,vec3(0.299,0.587,0.114));
      col=mix(vec3(g),col,1.22);              // miniature saturation punch
      col=pow(col,vec3(0.96));
      float vig=smoothstep(1.3,0.35,length(vUv-0.5)*1.7);
      col*=mix(0.72,1.0,vig);
      gl_FragColor=vec4(col,1.0);
    }`
});
postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),postMat));

function resize(){
  const w=window.innerWidth,h=window.innerHeight,a=w/h;
  renderer.setSize(w,h);
  const pr=renderer.getPixelRatio();
  rt.setSize(Math.floor(w*pr),Math.floor(h*pr));
  camera.left=-VIEW*a/2; camera.right=VIEW*a/2; camera.top=VIEW/2; camera.bottom=-VIEW/2;
  camera.updateProjectionMatrix();
  postMat.uniforms.uAspect.value=a;
}
window.addEventListener('resize',resize); resize();

