import * as THREE from 'three';

// ── Shared Materials ──────────────────────────────────────────────────────────

const monsterMat  = new THREE.MeshStandardMaterial({ color: 0x3d6b4a, roughness: 0.82, metalness: 0 });
const scoreMat    = new THREE.MeshStandardMaterial({ color: 0x111a11, roughness: 0.9, metalness: 0 });
const seatMat     = new THREE.MeshStandardMaterial({ color: 0xBB1A1A, roughness: 0.88, metalness: 0 });
const concreteMat = new THREE.MeshStandardMaterial({ color: 0x7a7a72, roughness: 0.95, metalness: 0 });
const metalMat    = new THREE.MeshStandardMaterial({ color: 0x888890, roughness: 0.35, metalness: 0.75 });
const yellowMat   = new THREE.MeshStandardMaterial({ color: 0xFFDD00, roughness: 0.4, metalness: 0.4 });
const brickMat    = new THREE.MeshStandardMaterial({ color: 0x9e4e2e, roughness: 0.95, metalness: 0 });
const whiteMat    = new THREE.MeshStandardMaterial({ color: 0xEEEEE8, roughness: 0.6, metalness: 0 });
const darkGreenMat= new THREE.MeshStandardMaterial({ color: 0x2d4d35, roughness: 0.9, metalness: 0 });
const glassMat    = new THREE.MeshStandardMaterial({ color: 0x4a6070, roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.7 });
const netMat      = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.5, metalness: 0, transparent: true, opacity: 0.28, side: THREE.DoubleSide, wireframe: true });
const dirtMat     = new THREE.MeshStandardMaterial({ color: 0xBB8860, roughness: 0.95, metalness: 0 });

const SLOT_MAT = () => new THREE.MeshStandardMaterial({ color: 0x080e08, roughness: 0.95, metalness: 0 });

function shadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function tag(mesh, label, desc) {
  mesh.userData.partLabel = label;
  mesh.userData.partDesc  = desc;
  return mesh;
}

// ── Green Monster ─────────────────────────────────────────────────────────────

function buildGreenMonster(scene) {
  const clickables = [];
  const group = new THREE.Group();

  // Main wall — 37ft tall, ~228ft wide, angled to face the field
  // We split it into a main straight run + a short angled return near home
  const wallBody = shadow(tag(
    new THREE.Mesh(new THREE.BoxGeometry(215, 37, 4), monsterMat),
    'Green Monster',
    'The iconic 37-foot left field wall. Built in 1912, it was originally constructed to block the view from buildings on Lansdowne Street. The ladder on the left is in play — balls that hit it remain live.'
  ));
  wallBody.position.set(0, 18.5, 0);
  group.add(wallBody);
  clickables.push(wallBody);

  // Short return wall (angles toward home plate from the LF corner)
  const returnWall = shadow(new THREE.Mesh(new THREE.BoxGeometry(35, 37, 4), monsterMat));
  returnWall.position.set(-118, 18.5, -22);
  returnWall.rotation.y = Math.PI / 6;
  group.add(returnWall);

  // Scoreboard panel — embedded in lower-left section
  const boardBg = shadow(tag(
    new THREE.Mesh(new THREE.BoxGeometry(78, 20, 1.5), scoreMat),
    'Manual Scoreboard',
    'The hand-operated scoreboard, virtually unchanged since 1934. Workers inside the wall manually update scores using heavy metal number plates. The scoreboard shows all MLB games, not just the Red Sox.'
  ));
  boardBg.position.set(-55, 12, 2.5);
  group.add(boardBg);
  clickables.push(boardBg);

  // Inning header labels (thin white strips)
  for (let i = 0; i < 9; i++) {
    const lbl = new THREE.Mesh(new THREE.BoxGeometry(5.5, 1.2, 0.4), whiteMat);
    lbl.position.set(-88 + i * 7.8 + 3.9, 20.5, 3.5);
    group.add(lbl);
  }

  // Score slots — away row + home row
  for (let row = 0; row < 2; row++) {
    for (let inn = 0; inn < 9; inn++) {
      const slot = new THREE.Mesh(new THREE.BoxGeometry(5.5, 5, 0.6), SLOT_MAT());
      slot.position.set(-88 + inn * 7.8 + 3.9, 14 - row * 6.5, 3.5);
      slot.userData.scoreRow = row;  // 0=away, 1=home
      slot.userData.scoreInn = inn;
      slot.userData.partLabel = `Inning ${inn + 1} Score`;
      slot.userData.partDesc = `Click to cycle the ${row === 0 ? 'visitor' : 'Red Sox'} score for inning ${inn + 1}.`;
      group.add(slot);
      clickables.push(slot);
    }
  }

  // "R H E" area
  const rheMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a });
  ['R','H','E'].forEach((_, i) => {
    const cell = new THREE.Mesh(new THREE.BoxGeometry(5.5, 5, 0.6), rheMat);
    cell.position.set(14 + i * 7, 14, 3.5);
    group.add(cell);
    const cell2 = new THREE.Mesh(new THREE.BoxGeometry(5.5, 5, 0.6), rheMat);
    cell2.position.set(14 + i * 7, 7.5, 3.5);
    group.add(cell2);
  });

  // Ladder (left side of wall)
  const ladderGroup = new THREE.Group();
  [-0.45, 0.45].forEach(x => {
    const rail = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 39, 6), metalMat));
    rail.position.set(x, 19.5, 0);
    ladderGroup.add(rail);
  });
  for (let i = 0; i < 26; i++) {
    const rung = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 6), metalMat);
    rung.rotation.z = Math.PI / 2;
    rung.position.set(0, 1.5 + i * 1.5, 0.15);
    ladderGroup.add(rung);
  }
  ladderGroup.position.set(-103, 0, 2.5);
  tag(ladderGroup, 'Green Monster Ladder', 'This ladder is officially in play — any batted ball that strikes it remains live. Grounds crew use it to retrieve baseballs that land atop the wall.');
  group.add(ladderGroup);
  clickables.push(ladderGroup);

  // Net above the Monster
  const netGeo = new THREE.PlaneGeometry(215, 22, 18, 4);
  const net = new THREE.Mesh(netGeo, netMat);
  net.position.set(0, 48, 0);
  group.add(net);

  // Monster Seats atop the wall
  const seatGroup = tag(
    buildSimpleSeatRow(215, 5),
    'Green Monster Seats',
    'Added in 2003, these 269 seats atop the Green Monster are among baseball\'s most sought-after. At 37 feet above the field, they offer a unique birds-eye view down the left field line.'
  );
  seatGroup.position.set(0, 38.5, -2.5);
  group.add(seatGroup);
  clickables.push(seatGroup);

  // Position the whole Monster group
  // LF foul line runs at 45° from home; Monster face is at x ~ -127, z ~ 219 going diagonally
  group.position.set(-105, 0, 225);
  group.rotation.y = Math.PI / 4 + 0.12;  // ~57° — along left field line

  scene.add(group);
  return clickables;
}

function buildSimpleSeatRow(width, rows) {
  const g = new THREE.Group();
  for (let r = 0; r < rows; r++) {
    const row = new THREE.Mesh(new THREE.BoxGeometry(width, 1.5, 2.5), seatMat);
    row.position.set(0, r * 2.2, -r * 1.5);
    g.add(row);
  }
  return g;
}

// ── Outfield Walls ────────────────────────────────────────────────────────────

function buildOutfieldWalls(scene) {
  const clickables = [];
  const wallSegs = [
    // [x, z, ry, w, h] — approximate Fenway wall segments
    // LF corner wall
    { x: -248, z: 120, ry: Math.PI / 2 + 0.18, w: 60, h: 8 },
    // CF left
    { x: -200, z: 300, ry: 0.55, w: 110, h: 8 },
    // Deep CF / triangle area
    { x: -60,  z: 365, ry: 0.15, w: 140, h: 8 },
    { x: 60,   z: 365, ry: -0.15, w: 140, h: 8 },
    // CF right
    { x: 200,  z: 300, ry: -0.55, w: 110, h: 8 },
    // RF corner
    { x: 248,  z: 120, ry: -Math.PI / 2 - 0.18, w: 60, h: 8 },
    // RF wall (lower, with bullpen beyond)
    { x: 258,  z: 10,  ry: Math.PI / 2, w: 120, h: 5 },
  ];

  wallSegs.forEach(({ x, z, ry, w, h }) => {
    const wall = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, 3), darkGreenMat));
    wall.position.set(x, h / 2, z);
    wall.rotation.y = ry;
    scene.add(wall);
  });

  // Pesky's Pole (RF foul pole)
  const peskyPole = shadow(tag(
    new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 50, 8), yellowMat),
    "Pesky's Pole",
    "Named for Red Sox shortstop Johnny Pesky. At only 302 feet from home plate, it's the shortest distance in any MLB ballpark. Countless controversial home runs have hugged this pole over the decades."
  ));
  peskyPole.position.set(214, 25, 88);
  scene.add(peskyPole);
  clickables.push(peskyPole);

  // LF foul pole
  const lfPole = shadow(tag(
    new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 55, 8), yellowMat),
    'Left Field Foul Pole',
    'The Foulke Pole marks the 310-foot left field line. Home runs must pass inside — or hit — this pole to be fair. It stands just in front of the Green Monster.'
  ));
  lfPole.position.set(-222, 27.5, 90);
  scene.add(lfPole);
  clickables.push(lfPole);

  // Triangle / center field nook
  const triangle = shadow(tag(
    new THREE.Mesh(new THREE.BoxGeometry(20, 10, 3), concreteMat),
    'The Triangle',
    "Fenway's deepest point at 420 feet — one of the deepest in baseball. The unusual triangular shape in center field has produced strange caroms that have befuddled outfielders for over a century."
  ));
  triangle.position.set(0, 5, 363);
  scene.add(triangle);
  clickables.push(triangle);

  return clickables;
}

// ── Grandstands (Seating Bowl) ────────────────────────────────────────────────

function buildGrandstands(scene) {
  const clickables = [];

  // The grandstand arc runs from ~RF corner (angle ~-70°) around home plate to LF (~200°)
  // Angles are measured from the +Z axis (toward CF), going clockwise from above
  // Note: sin(angle)*r = X,  cos(angle)*r = Z  (with Z going toward CF = positive)

  const ARC = 38;
  const startA = THREE.MathUtils.degToRad(-72);
  const endA   = THREE.MathUtils.degToRad(202);

  const tiers = [
    { innerR: 100, depth: 38, height: 22, mat: seatMat, yBase: 0 },
    { innerR: 138, depth: 32, height: 24, mat: seatMat, yBase: 20 },
    { innerR: 166, depth: 28, height: 18, mat: concreteMat, yBase: 42 },
  ];

  tiers.forEach(({ innerR, depth, height, mat, yBase }) => {
    for (let i = 0; i < ARC; i++) {
      const t0 = i / ARC, t1 = (i + 1) / ARC;
      const a0 = startA + t0 * (endA - startA);
      const a1 = startA + t1 * (endA - startA);
      const mid = (a0 + a1) / 2;
      const midR = innerR + depth / 2;
      const arcW = midR * (a1 - a0) * 1.06;

      const seg = shadow(new THREE.Mesh(new THREE.BoxGeometry(arcW, height, depth), mat));
      seg.position.set(
        Math.sin(mid) * midR,
        yBase + height / 2,
        Math.cos(mid) * midR
      );
      seg.rotation.y = -mid;
      scene.add(seg);
    }
  });

  // Press box / luxury suites behind home plate
  const pressBox = shadow(tag(
    new THREE.Mesh(new THREE.BoxGeometry(130, 20, 24), glassMat),
    'Press Box & Luxury Suites',
    "The press box sits 70 feet above the field directly behind home plate — the best sightline in the park. The luxury suites flanking it were added during Fenway's early-2000s renovations."
  ));
  pressBox.position.set(0, 62, -185);
  scene.add(pressBox);
  clickables.push(pressBox);

  // Press box roof overhang
  const roof = shadow(new THREE.Mesh(new THREE.BoxGeometry(150, 3, 30), concreteMat));
  roof.position.set(0, 74, -185);
  scene.add(roof);

  // Facade below the press box — distinctive Fenway red steel
  const facade = new THREE.Mesh(new THREE.BoxGeometry(160, 8, 4), seatMat);
  facade.position.set(0, 55, -183);
  scene.add(facade);

  // Upper grandstand back wall
  for (let side = -1; side <= 1; side += 2) {
    const backWall = shadow(new THREE.Mesh(new THREE.BoxGeometry(50, 60, 8), concreteMat));
    backWall.position.set(side * 100, 30, -188);
    scene.add(backWall);
  }

  return clickables;
}

// ── Right Field Bleachers ────────────────────────────────────────────────────

function buildBleachers(scene) {
  const clickables = [];

  // RF bleachers
  const rfBleach = shadow(tag(
    new THREE.Mesh(new THREE.BoxGeometry(110, 35, 55), seatMat),
    'Right Field Bleachers',
    "Fenway's bleacher seats in right field offer some of the most affordable tickets in baseball. The section runs from the RF foul pole toward center field, with a direct view of both bullpens and the Green Monster."
  ));
  rfBleach.position.set(232, 17.5, 160);
  rfBleach.rotation.y = -0.48;
  scene.add(rfBleach);
  clickables.push(rfBleach);

  // CF bleachers
  const cfBleach = shadow(tag(
    new THREE.Mesh(new THREE.BoxGeometry(90, 28, 45), seatMat),
    'Center Field Bleachers',
    "The center field bleachers provide baseball's signature 'batter's eye' — a dark background that helps hitters pick up the pitch. Sitting here means staring directly at the pitcher from 420 feet away."
  ));
  cfBleach.position.set(0, 14, 340);
  scene.add(cfBleach);
  clickables.push(cfBleach);

  return clickables;
}

// ── Dugouts ───────────────────────────────────────────────────────────────────

function buildDugouts(scene) {
  const clickables = [];
  const dugouts = [
    { x:  52, z: -20, label: 'Home Dugout (Red Sox)',   desc: "The Red Sox dugout sits on the first base side. The dugout is partially recessed below field level, protecting players from line drives. Generations of Boston legends have sat on this bench." },
    { x: -52, z: -20, label: 'Visitor Dugout',           desc: "The visiting team occupies the third base side dugout. Every opposing player in baseball history has passed through here — from Babe Ruth (as a Yankee) to modern superstars." },
  ];
  dugouts.forEach(({ x, z, label, desc }) => {
    const dug = shadow(tag(new THREE.Mesh(new THREE.BoxGeometry(42, 4.5, 14), concreteMat), label, desc));
    dug.position.set(x, -0.5, z);
    scene.add(dug);
    clickables.push(dug);

    // Dugout roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(44, 1, 15), concreteMat);
    roof.position.set(x, 2.3, z);
    scene.add(roof);
  });
  return clickables;
}

// ── Bullpens ──────────────────────────────────────────────────────────────────

function buildBullpens(scene) {
  const clickables = [];
  const pens = [
    { x: 252, z: 200, ry: -0.3, label: 'Home Bullpen',    desc: "The Red Sox bullpen sits in right field fair territory — one of baseball's most unusual placements. Relief pitchers warm up just feet from where outfielders patrol, and heckling from the bleachers is part of the experience." },
    { x: 270, z: 240, ry: -0.3, label: 'Visitor Bullpen', desc: "The visiting team's bullpen shares right field with the home pen. The proximity to fans made it notorious for heckling in earlier eras." },
  ];
  pens.forEach(({ x, z, ry, label, desc }) => {
    const pen = shadow(tag(new THREE.Mesh(new THREE.BoxGeometry(18, 0.4, 85), dirtMat), label, desc));
    pen.position.set(x, 0.2, z);
    pen.rotation.y = ry;
    scene.add(pen);
    clickables.push(pen);

    // Pen mound
    const mound = shadow(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 7, 0.6, 16), dirtMat));
    mound.position.set(x - 3, 0.3, z - 20);
    mound.rotation.y = ry;
    scene.add(mound);
  });
  return clickables;
}

// ── Light Towers ──────────────────────────────────────────────────────────────

export const TOWER_POSITIONS = [
  { x: -160, z: -90,  label: 'Light Tower A' },
  { x: -235, z:  55,  label: 'Light Tower B' },
  { x: -140, z: 250,  label: 'Light Tower C' },
  { x:  140, z: 280,  label: 'Light Tower D' },
  { x:  225, z:  55,  label: 'Light Tower E' },
  { x:  160, z: -90,  label: 'Light Tower F' },
];

const TOWER_HEIGHT = 155;

function buildLightTowers(scene) {
  const towerMeshes = [];
  const towerGlows  = [];

  TOWER_POSITIONS.forEach(({ x, z }) => {
    // Main shaft — tapered
    const shaft = shadow(new THREE.Mesh(new THREE.BoxGeometry(5, TOWER_HEIGHT, 5), metalMat));
    shaft.position.set(x, TOWER_HEIGHT / 2, z);
    scene.add(shaft);
    towerMeshes.push(shaft);

    // Cross-arm brace
    const brace = new THREE.Mesh(new THREE.BoxGeometry(22, 2.5, 5), metalMat);
    brace.position.set(x, TOWER_HEIGHT - 2, z);
    scene.add(brace);

    // Light bank heads (3 banks per tower)
    for (let i = 0; i < 3; i++) {
      const bank = new THREE.Mesh(new THREE.BoxGeometry(16, 5, 9), new THREE.MeshStandardMaterial({
        color: 0xCCCCBB, roughness: 0.4, metalness: 0.5
      }));
      bank.position.set(x + (i - 1) * 9, TOWER_HEIGHT + 3, z);
      scene.add(bank);
    }

    // Glow sprite (for bloom at night)
    const glowMat = new THREE.SpriteMaterial({
      color: 0xFFFAE0,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const glow = new THREE.Sprite(glowMat);
    glow.scale.set(55, 55, 1);
    glow.position.set(x, TOWER_HEIGHT + 4, z);
    scene.add(glow);
    towerGlows.push(glow);
  });

  return { towerMeshes, towerGlows };
}

// ── Exterior Brick Facade ─────────────────────────────────────────────────────

function buildExterior(scene) {
  // Fenway's irregular outer wall — 9 brick segments forming the stadium silhouette
  const segs = [
    { x:   0,   z: -215, ry: 0,     w: 195, h: 58 },
    { x: -128,  z: -178, ry:  0.52, w: 115, h: 58 },
    { x: -225,  z: -82,  ry:  1.05, w: 130, h: 58 },
    { x: -280,  z:  75,  ry:  1.52, w: 160, h: 55 },
    { x: -230,  z: 300,  ry:  2.30, w: 160, h: 42 },
    { x:   0,   z: 390,  ry:  0,    w: 180, h: 38 },
    { x:  230,  z: 300,  ry: -2.30, w: 160, h: 42 },
    { x:  275,  z:  75,  ry: -1.52, w: 160, h: 55 },
    { x:  128,  z: -178, ry: -0.52, w: 115, h: 58 },
  ];

  segs.forEach(({ x, z, ry, w, h }) => {
    const wall = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, 5), brickMat));
    wall.position.set(x, h / 2, z);
    wall.rotation.y = ry;
    scene.add(wall);
  });

  // Main entrance gate (Yawkey Way / Jersey Street side)
  const gateArch = shadow(new THREE.Mesh(new THREE.BoxGeometry(40, 20, 8), brickMat));
  gateArch.position.set(0, 10, -220);
  scene.add(gateArch);

  // Gate opening
  const gateOpen = new THREE.Mesh(new THREE.BoxGeometry(18, 15, 10), new THREE.MeshStandardMaterial({ color: 0x020502 }));
  gateOpen.position.set(0, 7.5, -220);
  scene.add(gateOpen);

  // Concourse roof
  const concRoof = shadow(new THREE.Mesh(new THREE.BoxGeometry(190, 3, 28), concreteMat));
  concRoof.position.set(0, 60, -195);
  scene.add(concRoof);
}

// ── Backstop Net ──────────────────────────────────────────────────────────────

function buildBackstop(scene) {
  // The netting behind home plate protecting fans from foul balls
  const geo = new THREE.CylinderGeometry(55, 55, 22, 20, 1, true, -Math.PI * 0.45, Math.PI * 0.9);
  const net = new THREE.Mesh(geo, netMat);
  net.position.set(0, 11, -10);
  scene.add(net);

  // Top arch
  const arch = new THREE.Mesh(new THREE.TorusGeometry(55, 0.5, 6, 28, Math.PI * 0.9), metalMat);
  arch.position.set(0, 22, -10);
  arch.rotation.y = -Math.PI * 0.45;
  scene.add(arch);
}

// ── Main Export ───────────────────────────────────────────────────────────────

export function buildStadium(scene) {
  const clickables = [];

  clickables.push(...buildGreenMonster(scene));
  clickables.push(...buildOutfieldWalls(scene));
  clickables.push(...buildGrandstands(scene));
  clickables.push(...buildBleachers(scene));
  clickables.push(...buildDugouts(scene));
  clickables.push(...buildBullpens(scene));
  buildExterior(scene);
  buildBackstop(scene);

  const { towerMeshes, towerGlows } = buildLightTowers(scene);

  return { clickables, towerMeshes, towerGlows };
}
