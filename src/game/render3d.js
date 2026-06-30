// ── 3D RENDERER ──────────────────────────────────────────────
// Replaces the 2D canvas world-view with a real Three.js scene. Tanks are
// procedural low-poly meshes (hull/turret/barrel) built from the same
// color/size data the 2D renderer used -- there's no 3D asset pipeline
// here, so this is geometric shading/lighting realism, not sculpted
// models. The minimap stays a 2D canvas (mmx, from canvas.js) and the
// DOM-based HUD is untouched -- only the main battlefield view changed.
import * as THREE from 'three';
import {gc} from '../canvas.js';
import {W, H, COCKPIT_ZOOM} from '../constants.js';
import {MAPS} from '../data/maps.js';
import {AMMO} from '../data/ammo.js';
import {$} from '../dom.js';
import {G} from './state.js';
import {pal} from '../theme.js';
import {getDecal} from '../customization.js';
import {drawMinimap} from './render.js';
import {shakeOffset} from './shake.js';
import {getQualityTier} from '../graphicsQuality.js';
import {onSettingsChange} from '../settings.js';

// World mapping: 3D (x,z) = game (x - W/2, y - H/2); 3D y is "up".
export const toWorldX = gx => gx - W/2;
export const toWorldZ = gy => gy - H/2;
export const toGameX = wx => wx + W/2;
export const toGameY = wz => wz + H/2;

let renderer, scene, camTop, camCockpit, sunLight;
const groundPlane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
const raycaster = new THREE.Raycaster();

let groundMesh, gridHelper;
let terrainGroup, zoneGroup, crateGroup, craterGroup;
const vehicleMeshes = new Map(); // entity -> {hull,turret,...}
const projectileMeshes = new Map();
const smokeMeshes = new Map();
let particlePoints, particleGeom, particlePositions, particleColors;
const MAX_PARTICLES = 400;

export function initRender3D(){
  renderer = new THREE.WebGLRenderer({canvas:gc, antialias:true});
  renderer.setSize(W,H,false);
  renderer.shadowMap.enabled = true;
  renderer.setClearColor(0x06080a);

  scene = new THREE.Scene();

  camTop = new THREE.PerspectiveCamera(50, W/H, 1, 2000);
  camCockpit = new THREE.PerspectiveCamera(38, W/H, 0.5, 2000);

  const ambient = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight(0xfff4d8, 1.05);
  sunLight = sun;
  sun.position.set(-220,360,160);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024,1024);
  sun.shadow.camera.left=-420;sun.shadow.camera.right=420;
  sun.shadow.camera.top=320;sun.shadow.camera.bottom=-320;
  sun.shadow.camera.far=900;
  scene.add(sun);
  scene.add(sun.target);

  groundMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(W*1.4,H*1.4),
    new THREE.MeshStandardMaterial({color:0x1e2010, roughness:0.95})
  );
  groundMesh.rotation.x=-Math.PI/2;
  groundMesh.receiveShadow=true;
  scene.add(groundMesh);

  gridHelper = new THREE.GridHelper(Math.max(W,H)*1.3, 36, 0x2a2a18, 0x202213);
  gridHelper.position.y=0.05;
  scene.add(gridHelper);

  terrainGroup = new THREE.Group();scene.add(terrainGroup);
  zoneGroup = new THREE.Group();scene.add(zoneGroup);
  crateGroup = new THREE.Group();scene.add(crateGroup);
  craterGroup = new THREE.Group();scene.add(craterGroup);

  particleGeom = new THREE.BufferGeometry();
  particlePositions = new Float32Array(MAX_PARTICLES*3);
  particleColors = new Float32Array(MAX_PARTICLES*3);
  particleGeom.setAttribute('position', new THREE.BufferAttribute(particlePositions,3));
  particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors,3));
  particlePoints = new THREE.Points(particleGeom, new THREE.PointsMaterial({size:3.2, vertexColors:true, transparent:true, opacity:0.9, sizeAttenuation:true}));
  scene.add(particlePoints);

  applyGraphicsQuality();
  onSettingsChange(applyGraphicsQuality);
}

// Camera far-plane and shadow rendering are cheap to flip at runtime (no
// renderer/geometry rebuild needed), so the graphics-quality setting
// applies live the moment the player changes it, not just on next match.
function applyGraphicsQuality(){
  const tier = getQualityTier();
  camTop.far = tier.drawDistance; camTop.updateProjectionMatrix();
  camCockpit.far = tier.drawDistance; camCockpit.updateProjectionMatrix();
  renderer.shadowMap.enabled = tier.shadows;
  if(sunLight) sunLight.castShadow = tier.shadows;
}

// ── World rebuild (called when buildScene() sets new terrain/zones) ──
export function rebuildWorld3D(){
  while(terrainGroup.children.length) disposeObj(terrainGroup.children.pop());
  while(zoneGroup.children.length) disposeObj(zoneGroup.children.pop());
  while(craterGroup.children.length) disposeObj(craterGroup.children.pop());

  const m = MAPS[G.mapIdx];
  groundMesh.material.color.set(m.ground);
  scene.fog = G.fogOfWar ? new THREE.Fog(0x06080a, 80, 320) : null;

  G.terrain.forEach(t=>{
    const grp = buildTerrainMesh(t);
    grp.userData.terrainRef = t;
    terrainGroup.add(grp);
  });

  G.captureZones.forEach(z=>{
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(z.r-1.5, z.r, 48),
      new THREE.MeshBasicMaterial({color:0xc8b870, side:THREE.DoubleSide, transparent:true, opacity:0.7})
    );
    ring.rotation.x=-Math.PI/2;
    ring.position.set(toWorldX(z.x),0.2,toWorldZ(z.y));
    ring.userData.zoneRef=z;
    zoneGroup.add(ring);
    const fill = new THREE.Mesh(
      new THREE.CircleGeometry(z.r,48),
      new THREE.MeshBasicMaterial({color:0xc8b870, transparent:true, opacity:0.08})
    );
    fill.rotation.x=-Math.PI/2;
    fill.position.set(toWorldX(z.x),0.15,toWorldZ(z.y));
    fill.userData.zoneFillFor=z;
    zoneGroup.add(fill);
  });
}

function disposeObj(obj){
  obj.traverse(n=>{if(n.geometry)n.geometry.dispose();if(n.material){(Array.isArray(n.material)?n.material:[n.material]).forEach(mt=>mt.dispose());}});
}

function buildTerrainMesh(t){
  const grp = new THREE.Group();
  grp.position.set(toWorldX(t.x), 0, toWorldZ(t.y));
  const solidCol = t.type==='snowrock'?0x6a6a58:0x3a3828;
  if(t.type==='rock'||t.type==='snowrock'){
    const mesh=new THREE.Mesh(new THREE.DodecahedronGeometry(Math.max(t.w,t.h)/2.6,0), new THREE.MeshStandardMaterial({color:t.type==='snowrock'?0x8a9098:0x6a6a58,roughness:0.9}));
    mesh.position.y=t.h/4;mesh.castShadow=true;mesh.receiveShadow=true;grp.add(mesh);
  } else if(t.type==='bunker'||t.type==='building'){
    const update=()=>{
      while(grp.children.length)disposeObj(grp.children.pop());
      if(t.hp<=0){
        const mesh=new THREE.Mesh(new THREE.ConeGeometry(Math.max(t.w,t.h)/2,t.h*0.3,6), new THREE.MeshStandardMaterial({color:0x1e1c14,roughness:1}));
        mesh.position.y=t.h*0.15;mesh.rotation.y=Math.random()*Math.PI;mesh.castShadow=true;mesh.receiveShadow=true;grp.add(mesh);
        return;
      }
      const dmg=1-(Math.max(0,t.hp)/3);
      const col=t.type==='bunker'?0x3a3828:0x342e22;
      const h=t.h*0.9*(1-dmg*0.15);
      const mesh=new THREE.Mesh(new THREE.BoxGeometry(t.w,h,t.h), new THREE.MeshStandardMaterial({color:col,roughness:0.85}));
      mesh.position.y=h/2;mesh.rotation.y=(dmg>0?(Math.random()-0.5)*dmg*0.12:0);mesh.castShadow=true;mesh.receiveShadow=true;grp.add(mesh);
    };
    grp.userData.update=update;
    update();
  } else if(t.type==='rubble'){
    const mesh=new THREE.Mesh(new THREE.ConeGeometry(t.w/2,t.h*0.6,5), new THREE.MeshStandardMaterial({color:0x2e2c1e,roughness:1}));
    mesh.position.y=t.h*0.3;mesh.castShadow=true;mesh.receiveShadow=true;grp.add(mesh);
  } else if(t.type==='tree'){
    const trunk=new THREE.Mesh(new THREE.CylinderGeometry(1.4,1.8,8,6), new THREE.MeshStandardMaterial({color:0x12280a}));
    trunk.position.y=4;trunk.castShadow=true;grp.add(trunk);
    const top=new THREE.Mesh(new THREE.SphereGeometry(8,8,6), new THREE.MeshStandardMaterial({color:G.fogOfWar?0x0e2008:0x1a3010,roughness:1}));
    top.position.y=12;top.castShadow=true;top.receiveShadow=true;grp.add(top);
  }
  return grp;
}

// ── Vehicle models ───────────────────────────────────────────
function vehicleMatColor(v){return v.col||0x5a6040;}

function buildVehicleModel(v){
  const hull = new THREE.Group();
  const turret = new THREE.Group();
  const hullMat = new THREE.MeshStandardMaterial({color:vehicleMatColor(v), roughness:0.65, metalness:0.15});
  const drkMat = new THREE.MeshStandardMaterial({color:v.drk||0x303020, roughness:0.8});

  if(v.cat==='helo'){
    const body=new THREE.Mesh(new THREE.CapsuleGeometry(v.h/2.4,v.w*0.5,4,8), hullMat);
    body.rotation.z=Math.PI/2;body.position.y=14;body.castShadow=true;hull.add(body);
    const rotor=new THREE.Mesh(new THREE.BoxGeometry(v.w*1.8,0.6,1.6), drkMat);
    rotor.position.y=20;hull.add(rotor);
    hull.userData.rotor=rotor;
  } else if(v.cat==='drone'){
    const body=new THREE.Mesh(new THREE.OctahedronGeometry(v.h/1.6,0), hullMat);
    body.position.y=10;body.castShadow=true;hull.add(body);
  } else if(v.cat==='infantry'){
    for(let i=0;i<3;i++){
      const s=new THREE.Mesh(new THREE.SphereGeometry(2.2,6,6), hullMat);
      s.position.set((i-1)*4,3,(i%2)*3-1.5);s.castShadow=true;hull.add(s);
    }
  } else {
    const hullH=Math.max(6,v.h*0.45);
    const body=new THREE.Mesh(new THREE.BoxGeometry(v.w,hullH,v.h), hullMat);
    body.position.y=hullH/2+2;body.castShadow=true;body.receiveShadow=true;hull.add(body);
    const trackGeom=new THREE.BoxGeometry(v.w+6, 4, 4);
    const tL=new THREE.Mesh(trackGeom, drkMat);tL.position.set(0,3,v.h/2+1);tL.castShadow=true;hull.add(tL);
    const tR=new THREE.Mesh(trackGeom, drkMat);tR.position.set(0,3,-v.h/2-1);tR.castShadow=true;hull.add(tR);
    if(v.isTracked){const dmgMark=new THREE.Mesh(new THREE.BoxGeometry(v.w+6,1.5,1.5), new THREE.MeshBasicMaterial({color:0xe05050}));dmgMark.position.set(0,1,v.h/2+1);hull.add(dmgMark);hull.userData.trackDmg=dmgMark;}

    const turretBody=new THREE.Mesh(new THREE.CylinderGeometry(v.h/2.1,v.h/2.3,5,10), hullMat);
    turretBody.position.y=hullH+4.5;turretBody.castShadow=true;turret.add(turretBody);
    const barrel=new THREE.Mesh(new THREE.CylinderGeometry(0.9,1.1,v.w/2+14,8), drkMat);
    barrel.rotation.z=Math.PI/2;barrel.position.set(v.w/2+7-v.w/2,hullH+4.5,0);barrel.castShadow=true;turret.add(barrel);
    // decal (player tank only)
    if(v.decal&&v.decal!=='none'){
      const dd=getDecal(v.decal);
      if(dd.key==='stripe'){
        const stripe=new THREE.Mesh(new THREE.BoxGeometry(v.w*0.9,0.3,1.2), new THREE.MeshBasicMaterial({color:0xe8d880}));
        stripe.position.y=hullH+0.5;stripe.rotation.y=Math.PI/4;body.add(stripe);
      }
    }
  }

  hull.castShadow=true;
  scene.add(hull);
  if(v.cat!=='infantry'&&v.cat!=='helo'&&v.cat!=='drone'){scene.add(turret);}
  return {hull, turret, hasTurret: v.cat!=='infantry'&&v.cat!=='helo'&&v.cat!=='drone'};
}

function syncVehicle(v){
  let m = vehicleMeshes.get(v);
  if(!m){m=buildVehicleModel(v);vehicleMeshes.set(v,m);}
  const wx=toWorldX(v.x), wz=toWorldZ(v.y);
  const visible=!v.dead;
  m.hull.visible=visible;
  if(m.turret)m.turret.visible=visible;
  if(!visible)return;
  m.hull.position.set(wx, v.cat==='helo'?14+Math.sin((v.bobPhase||0))*3:0, wz);
  m.hull.rotation.y=-v.angle;
  if(m.hull.userData.rotor)m.hull.userData.rotor.rotation.y+=0.9;
  if(m.hasTurret){
    m.turret.position.set(wx,0,wz);
    m.turret.rotation.y=-v.tAngle;
  }
}

function cleanupVehicles(live){
  for(const [ent,m] of vehicleMeshes){
    if(!live.has(ent)){
      scene.remove(m.hull);disposeObj(m.hull);
      if(m.turret){scene.remove(m.turret);disposeObj(m.turret);}
      vehicleMeshes.delete(ent);
    }
  }
}

function syncProjectiles(){
  const live=new Set(G.projectiles);
  for(const [p,mesh] of projectileMeshes){
    if(!live.has(p)){scene.remove(mesh);disposeObj(mesh);projectileMeshes.delete(p);}
  }
  G.projectiles.forEach(p=>{
    let mesh=projectileMeshes.get(p);
    const am=AMMO[p.ammoType]||AMMO['APFSDS-T'];
    if(!mesh){
      mesh=new THREE.Mesh(new THREE.CylinderGeometry(0.8,0.8,6,6), new THREE.MeshBasicMaterial({color:am.col}));
      mesh.rotation.x=Math.PI/2;
      scene.add(mesh);projectileMeshes.set(p,mesh);
    }
    mesh.position.set(toWorldX(p.x),4,toWorldZ(p.y));
    mesh.rotation.z=Math.atan2(p.vy,p.vx);
  });
}

function syncSmokes(){
  const live=new Set(G.smokes);
  for(const [s,mesh] of smokeMeshes){
    if(!live.has(s)){scene.remove(mesh);disposeObj(mesh);smokeMeshes.delete(s);}
  }
  G.smokes.forEach(s=>{
    let mesh=smokeMeshes.get(s);
    if(!mesh){
      mesh=new THREE.Mesh(new THREE.SphereGeometry(1,10,8), new THREE.MeshStandardMaterial({color:0x8c8c82, transparent:true, roughness:1}));
      scene.add(mesh);smokeMeshes.set(s,mesh);
    }
    mesh.position.set(toWorldX(s.x),Math.max(4,s.r*0.4),toWorldZ(s.y));
    mesh.scale.setScalar(Math.max(0.1,s.r));
    mesh.material.opacity=s.life*0.6;
  });
}

function syncParticles(){
  const n=Math.min(MAX_PARTICLES, G.particles.length);
  for(let i=0;i<n;i++){
    const p=G.particles[i];
    particlePositions[i*3]=toWorldX(p.x);
    particlePositions[i*3+1]=6;
    particlePositions[i*3+2]=toWorldZ(p.y);
    const c=new THREE.Color(p.col);
    particleColors[i*3]=c.r;particleColors[i*3+1]=c.g;particleColors[i*3+2]=c.b;
  }
  for(let i=n;i<MAX_PARTICLES;i++){particlePositions[i*3+1]=-999;}
  particleGeom.setDrawRange(0, MAX_PARTICLES);
  particleGeom.attributes.position.needsUpdate=true;
  particleGeom.attributes.color.needsUpdate=true;
  particlePoints.material.opacity = G.particles.length?0.9:0;
}

function syncCrates(){
  while(crateGroup.children.length>G.ammoCrates.length){
    const c=crateGroup.children.pop();disposeObj(c);
  }
  while(crateGroup.children.length<G.ammoCrates.length){
    const grp=new THREE.Group();
    const box=new THREE.Mesh(new THREE.BoxGeometry(8,6,8), new THREE.MeshStandardMaterial({color:0x5a4a18,roughness:0.8}));
    box.castShadow=true;grp.add(box);
    const edge=new THREE.Mesh(new THREE.BoxGeometry(8.4,6.4,8.4), new THREE.MeshBasicMaterial({color:0xe8d870,wireframe:true}));
    grp.add(edge);
    crateGroup.add(grp);
  }
  G.ammoCrates.forEach((c,i)=>{
    const grp=crateGroup.children[i];
    grp.position.set(toWorldX(c.x), 4+Math.sin(Date.now()/300)*1.5, toWorldZ(c.y));
  });
}

function syncCraters(){
  while(craterGroup.children.length<G.craters.length){
    const i=craterGroup.children.length;
    const c=G.craters[i];
    const mesh=new THREE.Mesh(new THREE.CircleGeometry(c.r,12), new THREE.MeshBasicMaterial({color:0x060605, transparent:true, opacity:0.5}));
    mesh.rotation.x=-Math.PI/2;
    mesh.position.set(toWorldX(c.x),0.1,toWorldZ(c.y));
    craterGroup.add(mesh);
  }
}

function syncZones(){
  zoneGroup.children.forEach(obj=>{
    const z=obj.userData.zoneRef||obj.userData.zoneFillFor;
    if(!z)return;
    const col = z.owner==='blue'?0x3a7ade : z.owner==='red'?parseInt(pal().red.slice(1),16) : 0xc8b870;
    obj.material.color.setHex(col);
  });
}

// ── Camera ───────────────────────────────────────────────────
function updateCamera(){
  const sh = shakeOffset(); // screen-space shake becomes a small camera jitter in 3D
  if(G.viewMode==='cockpit'&&G.p1&&!G.p1.dead){
    const wx=toWorldX(G.p1.x), wz=toWorldZ(G.p1.y);
    const eyeH=14;
    camCockpit.position.set(wx+sh.x*0.3,eyeH+sh.y*0.15,wz);
    const lookX=wx+Math.cos(G.p1.tAngle)*40, lookZ=wz+Math.sin(G.p1.tAngle)*40;
    camCockpit.lookAt(lookX, eyeH-2, lookZ);
    return camCockpit;
  }
  camTop.position.set(sh.x*0.6, 360, 230+sh.y*0.4);
  camTop.lookAt(0,0,-10);
  return camTop;
}

export function screenToGround(px,py){
  const cam = G.viewMode==='cockpit'&&G.p1&&!G.p1.dead ? camCockpit : camTop;
  const ndc = new THREE.Vector2((px/W)*2-1, -(py/H)*2+1);
  raycaster.setFromCamera(ndc, cam);
  const out = new THREE.Vector3();
  const hit = raycaster.ray.intersectPlane(groundPlane, out);
  if(!hit) return null;
  return {x: toGameX(out.x), y: toGameY(out.z)};
}

export function draw3D(){
  G.terrain.forEach(t=>{
    const grp=terrainGroup.children.find(g=>g.userData.terrainRef===t);
    if(grp&&grp.userData.update)grp.userData.update();
  });
  syncZones();
  syncCrates();
  syncCraters();

  const live=new Set([G.p1,G.p2,...G.enemies].filter(Boolean));
  live.forEach(syncVehicle);
  cleanupVehicles(live);

  syncProjectiles();
  syncSmokes();
  syncParticles();

  const cam = updateCamera();
  renderer.render(scene, cam);

  $('dmglog').innerHTML=G.dmgLog.map(d=>`<div style="color:${d.col}">${d.txt}</div>`).join('');
  drawMinimap();
}
