'use strict';
/* ============================== GEOMETRY BUILDER ============================== */
const MAT=new THREE.MeshPhongMaterial({vertexColors:true,flatShading:true,shininess:6});
/* ground variant: static per-cell color noise in world space (matches the water facets) */
const MAT_GROUND=MAT.clone();
MAT_GROUND.onBeforeCompile=(sh)=>{
  sh.vertexShader=sh.vertexShader
    .replace('#include <common>','#include <common>\nvarying vec3 vGWp;')
    .replace('#include <begin_vertex>','#include <begin_vertex>\nvGWp=(modelMatrix*vec4(transformed,1.0)).xyz;');
  sh.fragmentShader=sh.fragmentShader
    .replace('#include <common>','#include <common>\nvarying vec3 vGWp;\nvec2 gh2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}')
    .replace('#include <color_fragment>',
`#include <color_fragment>
{
  vec2 g1=gh2(floor(vGWp.xz/1.2));
  vec2 g2=gh2(floor(vGWp.xz/7.3)+13.7);
  diffuseColor.rgb*=(0.88+0.24*g1.x)*(0.94+0.12*g2.x);
  diffuseColor.rgb+=(g1.y-0.5)*0.015;
}`);
};
const MAT_GLOW=new THREE.MeshBasicMaterial({vertexColors:true});
const GEO={};
{
  const src={
    box:new THREE.BoxGeometry(1,1,1),
    cyl:new THREE.CylinderGeometry(0.5,0.5,1,7),
    cyl4:new THREE.CylinderGeometry(0.5,0.5,1,4),
    cone:new THREE.CylinderGeometry(0.02,0.5,1,6),
    sph:new THREE.SphereGeometry(0.5,7,5)
  };
  for(const k in src) GEO[k]=src[k].toNonIndexed();
}
const _col=new THREE.Color();
function Builder(){this.p=[];this.n=[];this.c=[];}
Builder.prototype.prim=function(kind,color,x,y,z,sx,sy,sz,ry,rx,rz,jit){
  const g=GEO[kind];
  _e.set(rx||0,ry||0,rz||0);
  _m.compose(_v.set(x,y,z),_q.setFromEuler(_e),_v2.set(sx,sy,sz));
  _col.set(color);
  if(jit!==0) _col.offsetHSL(0,0,(R()-0.5)*(jit===undefined?0.05:jit));
  const pos=g.attributes.position.array, nor=g.attributes.normal.array, n=pos.length;
  for(let i=0;i<n;i+=3){
    _v.set(pos[i],pos[i+1],pos[i+2]).applyMatrix4(_m);
    this.p.push(_v.x,_v.y,_v.z);
    this.n.push(nor[i],nor[i+1],nor[i+2]);
    this.c.push(_col.r,_col.g,_col.b);
  }
  return this;
};
Builder.prototype.mesh=function(cast,recv){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));
  g.setAttribute('normal',new THREE.Float32BufferAttribute(this.n,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));
  const m=new THREE.Mesh(g,MAT);
  m.castShadow=cast!==false; m.receiveShadow=recv!==false;
  return m;
};
Builder.prototype.glowMesh=function(){
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(this.p,3));
  g.setAttribute('color',new THREE.Float32BufferAttribute(this.c,3));
  return new THREE.Mesh(g,MAT_GLOW);
};
function disposeGroup(gr){
  gr.traverse(o=>{if(o.geometry) o.geometry.dispose();});
  while(gr.children.length) gr.remove(gr.children[0]);
}

