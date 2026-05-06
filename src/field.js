import * as THREE from 'three';

// ── Shared materials ──────────────────────────────────────────────────────────

const dirtMat = new THREE.MeshStandardMaterial({ color: 0xBB8860, roughness: 0.95, metalness: 0 });
const warnMat = new THREE.MeshStandardMaterial({ color: 0xC8906A, roughness: 0.95, metalness: 0 });
const whiteMat = new THREE.MeshStandardMaterial({ color: 0xEEEEE8, roughness: 0.6, metalness: 0 });
const concreteMat = new THREE.MeshStandardMaterial({ color: 0x888880, roughness: 0.95, metalness: 0 });

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// ── Grass field with diagonal stripe vertex colors ────────────────────────────

function buildGrass(scene) {
  const SEG = 180;
  const geo = new THREE.PlaneGeometry(900, 900, SEG, SEG);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colArr = new Float32Array(pos.count * 3);
  const light = new THREE.Color(0x3d7a3d);
  const dark  = new THREE.Color(0x2d6a2d);

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const stripe = Math.floor((z + 450) / 24) & 1;
    const c = stripe ? light : dark;
    colArr[i * 3]     = c.r;
    colArr[i * 3 + 1] = c.g;
    colArr[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));

  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.92,
    metalness: 0,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  scene.add(mesh);
}

// ── Outfield warning track (clay arc) ─────────────────────────────────────────

function buildWarningTrack(scene) {
  // Build as a flat ring of BoxGeometry segments following the outfield arc
  const SEGS = 48;
  const innerR = 295;
  const outerR = 318;
  const startA = Math.PI * 0.02;   // near RF foul pole
  const endA   = Math.PI * 0.98;   // near LF foul pole (going through CF)

  for (let i = 0; i < SEGS; i++) {
    const t0 = i / SEGS;
    const t1 = (i + 1) / SEGS;
    const a0 = startA + t0 * (endA - startA);
    const a1 = startA + t1 * (endA - startA);
    const mid = (a0 + a1) / 2;
    const midR = (innerR + outerR) / 2;
    const arcW = midR * (a1 - a0) * 1.05;

    const seg = new THREE.Mesh(new THREE.BoxGeometry(arcW, 0.12, outerR - innerR), warnMat);
    seg.position.set(Math.sin(mid) * midR, 0.06, Math.cos(mid) * midR);
    seg.rotation.y = -mid;
    seg.receiveShadow = true;
    scene.add(seg);
  }

  // Foul line warning strips (straight sections)
  [-1, 1].forEach(side => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(23, 0.12, 80), warnMat);
    strip.position.set(side * 225, 0.06, 175);
    strip.rotation.y = side * (Math.PI / 4);
    strip.receiveShadow = true;
    scene.add(strip);
  });
}

// ── Dirt infield ──────────────────────────────────────────────────────────────

function buildInfield(scene) {
  // Large infield dirt circle centered between home and 2nd base
  const geo = new THREE.CircleGeometry(100, 64);
  geo.rotateX(-Math.PI / 2);
  const infield = new THREE.Mesh(geo, dirtMat);
  infield.position.set(0, 0.05, 50);
  infield.receiveShadow = true;
  scene.add(infield);

  // Home plate area circle
  const hpCircle = new THREE.Mesh(new THREE.CircleGeometry(16, 32), dirtMat);
  hpCircle.rotateX(-Math.PI / 2);
  hpCircle.position.set(0, 0.06, 0);
  hpCircle.receiveShadow = true;
  scene.add(hpCircle);
}

// ── Diamond: bases, mound, foul lines ─────────────────────────────────────────

export function buildDiamond(scene) {
  const clickables = [];

  // Bases
  const basePositions = [
    [63.6, 63.6,  'First Base',  '90 feet from home plate along the right foul line.'],
    [0,    127.3, 'Second Base', 'The keystone bag. 127 feet 3 inches from home plate.'],
    [-63.6, 63.6, 'Third Base',  '90 feet from second base. "The hot corner."'],
  ];
  basePositions.forEach(([x, z, label, desc]) => {
    const base = shadow(new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.18, 1.25), whiteMat));
    base.position.set(x, 0.09, z);
    base.userData.partLabel = label;
    base.userData.partDesc = desc;
    scene.add(base);
    clickables.push(base);
  });

  // Home plate (pentagon)
  const plateShape = new THREE.Shape();
  plateShape.moveTo(-0.72, -0.5);
  plateShape.lineTo( 0.72, -0.5);
  plateShape.lineTo( 0.72,  0.4);
  plateShape.lineTo( 0,     0.85);
  plateShape.lineTo(-0.72,  0.4);
  plateShape.closePath();
  const plateGeo = new THREE.ShapeGeometry(plateShape);
  plateGeo.rotateX(-Math.PI / 2);
  const plate = new THREE.Mesh(plateGeo, whiteMat);
  plate.position.set(0, 0.08, 0);
  plate.userData.partLabel = 'Home Plate';
  plate.userData.partDesc = 'The five-sided rubber plate — 17 inches wide. Batters stand beside it; catchers squat behind it. The heart of the game.';
  scene.add(plate);
  clickables.push(plate);

  // Pitcher's mound
  const moundGeo = new THREE.CylinderGeometry(0.01, 9.5, 0.85, 32, 1, false);
  const mound = shadow(new THREE.Mesh(moundGeo, dirtMat));
  mound.position.set(0, 0.425, 60.5);
  mound.userData.partLabel = "Pitcher's Mound";
  mound.userData.partDesc = 'Elevated 10 inches above home plate per MLB rules. The pitching rubber sits 60 feet 6 inches from home plate — a quirk from an 1893 surveying error that became sacred.';
  scene.add(mound);
  clickables.push(mound);

  // Pitching rubber
  const rubber = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.5), whiteMat);
  rubber.position.set(0, 0.89, 60.5);
  scene.add(rubber);

  // Foul lines
  [-1, 1].forEach(side => {
    const line = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 330), whiteMat);
    line.position.set(side * 117, 0.06, 115);
    line.rotation.y = -side * Math.PI / 4;
    line.receiveShadow = true;
    scene.add(line);
  });

  return clickables;
}

// ── Surround: parking lot / grounds ───────────────────────────────────────────

function buildGrounds(scene) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800), concreteMat);
  ground.rotateX(-Math.PI / 2);
  ground.position.y = -0.05;
  ground.receiveShadow = true;
  scene.add(ground);
}

// ── Main export ───────────────────────────────────────────────────────────────

export function buildField(scene) {
  buildGrounds(scene);
  buildGrass(scene);
  buildWarningTrack(scene);
  buildInfield(scene);
  return buildDiamond(scene);
}
