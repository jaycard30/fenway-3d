import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { buildField } from './field.js';
import { buildStadium } from './stadium.js';
import { buildCrowd } from './crowd.js';
import { setupAtmosphere, updateAtmosphere } from './atmosphere.js';
import { setupUI } from './ui.js';

// ── Renderer ──────────────────────────────────────────────────────────────────

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);

// ── Scene & Camera ────────────────────────────────────────────────────────────

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x90c8ee, 0.00055);

const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.5, 3000);
camera.position.set(0, 85, -175);
camera.lookAt(0, 5, 120);

// ── Post-processing ────────────────────────────────────────────────────────────

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));

const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.35,   // initial strength (day)
  0.4,    // radius
  0.85    // threshold
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// ── Build Scene ────────────────────────────────────────────────────────────────

const fieldClickables = buildField(scene);
const { clickables: stadiumClickables, towerMeshes, towerGlows } = buildStadium(scene);
const clickables = [...fieldClickables, ...stadiumClickables];
const crowdMesh = buildCrowd(scene);
const { sun, towerLights, ambientLight, hemiLight, updateLighting } = setupAtmosphere(scene);

// ── UI / Controls ─────────────────────────────────────────────────────────────

const { controls, cameraAnim, getTimeValue, onFrame } = setupUI({
  camera, scene, renderer,
  clickables,
  crowdMesh,
  bloomPass,
  towerGlows,
});

// ── Scoreboard state (shared with ui.js via module-level export) ───────────────

export const scoreState = {
  away: [0,0,0,0,0,0,0,0,0],
  home: [0,0,0,0,0,0,0,0,0],
};

// ── Clock ─────────────────────────────────────────────────────────────────────

const clock = new THREE.Clock();

// ── Animation Loop ─────────────────────────────────────────────────────────────

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.05);
  const elapsed = clock.elapsedTime;

  // Update controls & camera tween
  controls.update();
  cameraAnim.update(delta);

  // Update atmosphere from time slider
  const t = getTimeValue();
  updateAtmosphere(t, { scene, sun, towerLights, ambientLight, hemiLight, bloomPass, towerGlows });

  onFrame(elapsed);

  composer.render();
}

animate();

// ── Resize ────────────────────────────────────────────────────────────────────

window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  composer.setSize(w, h);
});

// ── Hide loading screen ───────────────────────────────────────────────────────

setTimeout(() => {
  document.getElementById('loading').classList.add('hidden');
}, 600);
