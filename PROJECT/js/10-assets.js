'use strict';
/* ============================== GLB ASSET PIPELINE ============================== */
/* Authored GLB models override the procedural builders where a file exists in the
   manifest; anything missing or failing falls back to the builder above.
   Conventions (fixed with the author): Y-up, nose along +Z, colors baked as vertex
   colors, real game-unit scale, moving parts as named child objects (prop, turret…). */
const ASSETS={ biplane_player:'assets/biplane_player.glb' };
const ASSET_SPAN={ biplane_player:11.6 }; // expected bbox width (wingspan) in game units
const GLB={}; // key -> normalized template scene; cloned per spawn by makeUnit()
function normalizeGLB(key,root){
  root.traverse(o=>{
    if(o.isMesh){
      const src=o.material;
      o.material=new THREE.MeshPhongMaterial({
        flatShading:true,shininess:6,
        vertexColors:!!o.geometry.attributes.color,
        map:(src&&src.map)||null,
        color:src&&src.color?src.color.clone():new THREE.Color(0xffffff)
      });
      o.castShadow=true;o.receiveShadow=true;
    }
    o.userData={}; // Object3D.clone deep-copies userData via JSON; keep templates clean
  });
  const size=new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  console.info(`[assets] ${key}: bbox ${size.x.toFixed(2)} W x ${size.y.toFixed(2)} H x ${size.z.toFixed(2)} L (game units)`);
  const span=ASSET_SPAN[key];
  if(span){
    if(size.x<span*0.55||size.x>span*1.8)
      console.warn(`[assets] ${key}: width ${size.x.toFixed(2)} deviates wildly from expected wingspan ~${span}. Not auto-rescaling - fix the export.`);
    // aircraft sanity: wingspan along X should dominate, height along Y should be smallest
    if(size.y>=size.z||size.z>size.x)
      console.warn(`[assets] ${key}: proportions look rotated (expect W > L > H for an aircraft, got `
        +`${size.x.toFixed(1)}/${size.z.toFixed(1)}/${size.y.toFixed(1)}). Check the export: nose along +Z, up +Y `
        +`(Blender: model nose toward -Y, export glTF with +Y Up, transforms applied). Not auto-rotating - fix the export.`);
  }
  return root;
}
function mapParts(root){ // named nodes -> userData, matching the procedural builders
  const ud=root.userData,props=[],turrets=[],legs=[],limbs=[];
  root.traverse(o=>{
    const n=(o.name||'').toLowerCase();
    if(n==='prop')ud.prop=o;
    else if(/^prop[\d._]/.test(n))props.push(o);
    else if(n==='turret')ud.turret=o;
    else if(/^turret[\d._]/.test(n))turrets.push(o);
    else if(/^leg/.test(n))legs.push(o);
    else if(/^limb/.test(n))limbs.push(o);
    else if(n==='eye')ud.eye=o;
  });
  const byName=(a,b)=>a.name<b.name?-1:1;
  if(props.length)ud.props=props.sort(byName);
  if(turrets.length)ud.turrets=turrets.sort(byName);
  if(legs.length)ud.legs=legs.sort(byName);
  if(limbs.length)ud.limbs=limbs.sort(byName);
  return root;
}
function makeUnit(key,fallback){ // no skinning anywhere, so a plain deep clone is fine
  return GLB[key]?mapParts(GLB[key].clone(true)):fallback();
}
function loadAssets(done){
  const keys=Object.keys(ASSETS);
  if(!keys.length)return done();
  if(!THREE.GLTFLoader){console.warn('[assets] GLTFLoader unavailable - using procedural models.');return done();}
  const loader=new THREE.GLTFLoader();
  let left=keys.length;
  const fin=()=>{if(--left===0)done();};
  const bust='?v='+Date.now(); // authors re-export GLBs often; skip the HTTP cache
  for(const key of keys)
    loader.load(ASSETS[key]+bust,
      gltf=>{GLB[key]=normalizeGLB(key,gltf.scene);fin();},
      undefined,
      err=>{console.warn(`[assets] ${key}: failed to load ${ASSETS[key]} - using procedural model.`,(err&&err.message)||err);fin();});
}

