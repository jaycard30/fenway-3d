import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { TOWER_POSITIONS } from './stadium.js';

const TOWER_HEIGHT = 155;

// ── Time-of-day keyframes (t: 0–100) ─────────────────────────────────────────

const KEYFRAMES = [
  {
    t: 0,
    label: 'Afternoon',
    turbidity: 2.5,
    rayleigh: 1.0,
    mie: 0.003,
    sunElevation: 55,   // degrees above horizon
    sunAzimuth: -130,   // degrees (SW direction)
    fogColor: new THREE.Color(0x90c8ee),
    fogDensity: 0.00055,
    ambientColor: new THREE.Color(0x607090),
    ambientIntensity: 0.55,
    sunIntensity: 2.8,
    hemiSky: new THREE.Color(0x6BB8E8),
    hemiGround: new THREE.Color(0x3D7A3D),
    towerIntensity: 0,
    bloomStrength: 0.35,
    exposure: 1.1,
  },
  {
    t: 38,
    label: 'Golden Hour',
    turbidity: 9,
    rayleigh: 2.2,
    mie: 0.005,
    sunElevation: 12,
    sunAzimuth: -110,
    fogColor: new THREE.Color(0xE8903A),
    fogDensity: 0.00065,
    ambientColor: new THREE.Color(0x503020),
    ambientIntensity: 0.42,
    sunIntensity: 1.0,
    hemiSky: new THREE.Color(0xFF8C40),
    hemiGround: new THREE.Color(0x3A2210),
    towerIntensity: 0,
    bloomStrength: 0.5,
    exposure: 1.0,
  },
  {
    t: 68,
    label: 'Dusk',
    turbidity: 16,
    rayleigh: 3.5,
    mie: 0.004,
    sunElevation: -5,
    sunAzimuth: -100,
    fogColor: new THREE.Color(0x2a1550),
    fogDensity: 0.0007,
    ambientColor: new THREE.Color(0x0e0618),
    ambientIntensity: 0.22,
    sunIntensity: 0.05,
    hemiSky: new THREE.Color(0x3A1A60),
    hemiGround: new THREE.Color(0x08050a),
    towerIntensity: 180,
    bloomStrength: 0.75,
    exposure: 0.95,
  },
  {
    t: 100,
    label: 'Night Game',
    turbidity: 20,
    rayleigh: 0.4,
    mie: 0.001,
    sunElevation: -30,
    sunAzimuth: -90,
    fogColor: new THREE.Color(0x04040c),
    fogDensity: 0.0006,
    ambientColor: new THREE.Color(0x040408),
    ambientIntensity: 0.07,
    sunIntensity: 0,
    hemiSky: new THREE.Color(0x03030c),
    hemiGround: new THREE.Color(0x010101),
    towerIntensity: 380,
    bloomStrength: 1.25,
    exposure: 0.9,
  },
];

function lerpColor(a, b, t, out) {
  out.r = a.r + (b.r - a.r) * t;
  out.g = a.g + (b.g - a.g) * t;
  out.b = a.b + (b.b - a.b) * t;
}

function lerp(a, b, t) { return a + (b - a) * t; }

function getKeyframes(tVal) {
  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    const a = KEYFRAMES[i], b = KEYFRAMES[i + 1];
    if (tVal <= b.t) {
      const alpha = (tVal - a.t) / (b.t - a.t);
      return { a, b, alpha };
    }
  }
  return { a: KEYFRAMES.at(-1), b: KEYFRAMES.at(-1), alpha: 0 };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

export function setupAtmosphere(scene) {
  // Sky
  const sky = new Sky();
  sky.scale.setScalar(10000);
  scene.add(sky);

  const skyUniforms = sky.material.uniforms;
  skyUniforms['mieDirectionalG'].value = 0.82;

  // Sun helper (used by Sky shader)
  const sunVec = new THREE.Vector3();

  // Directional sun light
  const sun = new THREE.DirectionalLight(0xfffcee, 2.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.camera.left   = -400;
  sun.shadow.camera.right  =  400;
  sun.shadow.camera.top    =  400;
  sun.shadow.camera.bottom = -400;
  sun.shadow.camera.far    =  900;
  sun.shadow.bias = -0.0003;
  scene.add(sun);
  scene.add(sun.target);
  sun.target.position.set(0, 0, 120);
  sun.target.updateMatrixWorld();

  // Ambient + hemi
  const ambientLight = new THREE.AmbientLight(0x607090, 0.55);
  scene.add(ambientLight);

  const hemiLight = new THREE.HemisphereLight(0x6BB8E8, 0x3D7A3D, 0.4);
  scene.add(hemiLight);

  // Stadium SpotLights (one per tower)
  const towerLights = TOWER_POSITIONS.map(({ x, z }) => {
    const spot = new THREE.SpotLight(0xFFF8E0, 0, 600, 0.38, 0.35, 1.0);
    spot.position.set(x, TOWER_HEIGHT + 4, z);
    spot.castShadow = false;  // only 2 cast shadows (perf)
    scene.add(spot);
    const target = new THREE.Object3D();
    target.position.set(x * 0.3, 0, 120);
    scene.add(target);
    spot.target = target;
    target.updateMatrixWorld();
    return spot;
  });

  // Two central towers cast shadows
  towerLights[2].castShadow = true;
  towerLights[3].castShadow = true;
  towerLights[2].shadow.mapSize.set(1024, 1024);
  towerLights[3].shadow.mapSize.set(1024, 1024);

  // Apply initial keyframe
  applyKeyframe(KEYFRAMES[0], sky, skyUniforms, sunVec, sun, ambientLight, hemiLight, towerLights, scene, null, null);

  return { sky, sun, sunVec, towerLights, ambientLight, hemiLight, updateLighting: updateAtmosphere };
}

function applyKeyframe(kf, sky, skyUniforms, sunVec, sun, ambientLight, hemiLight, towerLights, scene, bloomPass, towerGlows) {
  // Sky uniforms
  skyUniforms['turbidity'].value = kf.turbidity;
  skyUniforms['rayleigh'].value  = kf.rayleigh;
  skyUniforms['mieCoefficient'].value = kf.mie;

  // Sun position on sky sphere
  const elRad = THREE.MathUtils.degToRad(kf.sunElevation);
  const azRad = THREE.MathUtils.degToRad(kf.sunAzimuth);
  sunVec.setFromSphericalCoords(1, Math.PI / 2 - elRad, azRad);
  skyUniforms['sunPosition'].value.copy(sunVec);

  // Sun light
  sun.position.copy(sunVec).multiplyScalar(300);
  sun.intensity = kf.sunIntensity;

  // Fog
  if (scene.fog) {
    scene.fog.color.copy(kf.fogColor);
    scene.fog.density = kf.fogDensity;
  }

  ambientLight.color.copy(kf.ambientColor);
  ambientLight.intensity = kf.ambientIntensity;
  hemiLight.color.copy(kf.hemiSky);
  hemiLight.groundColor.copy(kf.hemiGround);

  towerLights.forEach(l => { l.intensity = kf.towerIntensity; });

  if (bloomPass) bloomPass.strength = kf.bloomStrength;
  if (towerGlows) {
    const glowOpacity = kf.towerIntensity > 0 ? Math.min(kf.towerIntensity / 380, 1) * 0.7 : 0;
    towerGlows.forEach(g => { g.material.opacity = glowOpacity; });
  }
}

// ── Per-frame update ──────────────────────────────────────────────────────────

const _fogColor  = new THREE.Color();
const _ambColor  = new THREE.Color();
const _hemiSky   = new THREE.Color();
const _hemiGnd   = new THREE.Color();
const _sunColor  = new THREE.Color();

let _sky, _skyUniforms, _sunVec;
let _initialized = false;

export function updateAtmosphere(tVal, { scene, sun, towerLights, ambientLight, hemiLight, bloomPass, towerGlows }) {
  // Lazy-init sky refs on first call
  if (!_initialized) {
    scene.traverse(obj => {
      if (obj.isMesh && obj.material && obj.material.uniforms && obj.material.uniforms['turbidity']) {
        _sky = obj;
        _skyUniforms = obj.material.uniforms;
      }
    });
    _sunVec = new THREE.Vector3();
    _initialized = true;
  }
  if (!_skyUniforms) return;

  const { a, b, alpha } = getKeyframes(tVal);

  // Sky uniforms interpolation
  _skyUniforms['turbidity'].value     = lerp(a.turbidity, b.turbidity, alpha);
  _skyUniforms['rayleigh'].value      = lerp(a.rayleigh,  b.rayleigh,  alpha);
  _skyUniforms['mieCoefficient'].value= lerp(a.mie,       b.mie,       alpha);

  const el  = lerp(a.sunElevation, b.sunElevation, alpha);
  const az  = lerp(a.sunAzimuth,   b.sunAzimuth,   alpha);
  const elR = THREE.MathUtils.degToRad(el);
  const azR = THREE.MathUtils.degToRad(az);
  _sunVec.setFromSphericalCoords(1, Math.PI / 2 - elR, azR);
  _skyUniforms['sunPosition'].value.copy(_sunVec);
  sun.position.copy(_sunVec).multiplyScalar(300);
  sun.intensity = lerp(a.sunIntensity, b.sunIntensity, alpha);

  // Fog
  if (scene.fog) {
    lerpColor(a.fogColor, b.fogColor, alpha, _fogColor);
    scene.fog.color.copy(_fogColor);
    scene.fog.density = lerp(a.fogDensity, b.fogDensity, alpha);
  }

  // Ambient
  lerpColor(a.ambientColor, b.ambientColor, alpha, _ambColor);
  ambientLight.color.copy(_ambColor);
  ambientLight.intensity = lerp(a.ambientIntensity, b.ambientIntensity, alpha);

  // Hemi
  lerpColor(a.hemiSky, b.hemiSky, alpha, _hemiSky);
  lerpColor(a.hemiGround, b.hemiGround, alpha, _hemiGnd);
  hemiLight.color.copy(_hemiSky);
  hemiLight.groundColor.copy(_hemiGnd);

  // Tower lights
  const tInt = lerp(a.towerIntensity, b.towerIntensity, alpha);
  towerLights.forEach(l => { l.intensity = tInt; });

  // Bloom
  if (bloomPass) {
    bloomPass.strength = lerp(a.bloomStrength, b.bloomStrength, alpha);
  }

  // Tower glows
  if (towerGlows) {
    const glowOp = Math.pow(Math.max(0, tInt / 380), 0.6) * 0.65;
    towerGlows.forEach(g => { g.material.opacity = glowOp; });
  }
}

// ── Label for UI ──────────────────────────────────────────────────────────────

export function getTODLabel(tVal) {
  const { a, b, alpha } = getKeyframes(tVal);
  return alpha < 0.5 ? a.label : b.label;
}
