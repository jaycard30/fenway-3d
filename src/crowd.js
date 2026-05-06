import * as THREE from 'three';

export function buildCrowd(scene) {
  // Each crowd "person" is a small plane billboarding a seated fan
  const geo = new THREE.PlaneGeometry(2.2, 3.5);
  geo.translate(0, 1.75, 0);  // pivot at feet

  const mat = new THREE.MeshStandardMaterial({
    side: THREE.DoubleSide,
    roughness: 1.0,
    metalness: 0,
  });

  const TOTAL = 4200;
  const crowd = new THREE.InstancedMesh(geo, mat, TOTAL);
  crowd.castShadow = false;
  crowd.receiveShadow = false;
  crowd.frustumCulled = false;

  const dummy = new THREE.Object3D();
  let idx = 0;

  // Grandstand arc — mirror of buildGrandstands arc
  const ARC = 38;
  const startA = THREE.MathUtils.degToRad(-72);
  const endA   = THREE.MathUtils.degToRad(202);

  const ROWS_PER_TIER = [9, 7, 5];
  const TIER_INNER_R  = [100, 138, 166];
  const TIER_ROW_STEP = [3.5, 3.8, 4.0];
  const TIER_Y_BASE   = [0.5, 21, 43];

  const fenwayRed = new THREE.Color(0xBB1A1A);
  const cream     = new THREE.Color(0xEEE8D8);

  for (let tier = 0; tier < 3 && idx < TOTAL; tier++) {
    const segsInTier = Math.floor(ARC * (1.0 - tier * 0.05));
    for (let s = 0; s < segsInTier && idx < TOTAL; s++) {
      const tPos = s / ARC;
      const angle = startA + tPos * (endA - startA);
      for (let row = 0; row < ROWS_PER_TIER[tier] && idx < TOTAL; row++) {
        const r = TIER_INNER_R[tier] + row * TIER_ROW_STEP[tier] + 4;
        const fansPerSeg = Math.max(3, Math.floor(r * (endA - startA) / ARC / 2.4));

        for (let f = 0; f < fansPerSeg && idx < TOTAL; f++) {
          const spread = (endA - startA) / ARC;
          const fanAngle = angle + (f / fansPerSeg - 0.5) * spread;

          dummy.position.set(
            Math.sin(fanAngle) * r,
            TIER_Y_BASE[tier] + row * TIER_ROW_STEP[tier] + 0.5,
            Math.cos(fanAngle) * r
          );
          // Face toward home plate center
          dummy.lookAt(0, dummy.position.y, 0);
          dummy.updateMatrix();
          crowd.setMatrixAt(idx, dummy.matrix);

          // Color: ~90% Fenway red, ~8% cream, ~2% other
          const roll = Math.random();
          let color;
          if (roll < 0.88)       color = fenwayRed;
          else if (roll < 0.96)  color = cream;
          else                   color = new THREE.Color().setHSL(0, 0, 0.2 + Math.random() * 0.4);

          // Slight per-instance brightness variation
          const bright = 0.85 + Math.random() * 0.3;
          crowd.setColorAt(idx, new THREE.Color(color.r * bright, color.g * bright, color.b * bright));
          idx++;
        }
      }
    }
  }

  // RF bleachers crowd
  const rfArcStart = THREE.MathUtils.degToRad(-72);
  const rfArcEnd   = THREE.MathUtils.degToRad(-30);
  for (let s = 0; s < 10 && idx < TOTAL; s++) {
    const a = rfArcStart + (s / 10) * (rfArcEnd - rfArcStart);
    for (let row = 0; row < 6 && idx < TOTAL; row++) {
      for (let f = 0; f < 5 && idx < TOTAL; f++) {
        const fa = a + (f - 2) * 0.018;
        const r = 230 + row * 3.5;
        dummy.position.set(Math.sin(fa) * r, row * 3.5 + 1, Math.cos(fa) * r);
        dummy.lookAt(0, dummy.position.y, 0);
        dummy.updateMatrix();
        crowd.setMatrixAt(idx, dummy.matrix);
        crowd.setColorAt(idx, new THREE.Color(fenwayRed.r * (0.8 + Math.random() * 0.4), 0, 0));
        idx++;
      }
    }
  }

  crowd.instanceMatrix.needsUpdate = true;
  if (crowd.instanceColor) crowd.instanceColor.needsUpdate = true;

  scene.add(crowd);
  return crowd;
}
