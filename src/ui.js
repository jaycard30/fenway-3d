import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { getTODLabel } from './atmosphere.js';

// ── Camera Presets ────────────────────────────────────────────────────────────

const PRESETS = {
  pressbox:    { pos: [0, 90, -185],    target: [0, 8, 120] },
  homeplate:   { pos: [0, 42, -145],    target: [0, 5, 120] },
  greenmonster:{ pos: [-300, 55, 10],   target: [0, 18, 110] },
  centerfield: { pos: [8, 28, 395],     target: [0, 10, 0]  },
  aerial:      { pos: [0, 520, 60],     target: [0, 0, 90]  },
};

// ── Camera animation state ────────────────────────────────────────────────────

function makeCameraAnim(camera, controls) {
  let active = false;
  let startPos = new THREE.Vector3();
  let endPos   = new THREE.Vector3();
  let startTgt = new THREE.Vector3();
  let endTgt   = new THREE.Vector3();
  let progress = 0;
  const DURATION = 1.6; // seconds

  function goTo(preset) {
    startPos.copy(camera.position);
    startTgt.copy(controls.target);
    endPos.set(...preset.pos);
    endTgt.set(...preset.target);
    progress = 0;
    active = true;
    controls.enabled = false;
  }

  function update(delta) {
    if (!active) return;
    progress = Math.min(progress + delta / DURATION, 1);
    // Smooth step easing
    const t = progress * progress * (3 - 2 * progress);
    camera.position.lerpVectors(startPos, endPos, t);
    controls.target.lerpVectors(startTgt, endTgt, t);
    controls.update();
    if (progress >= 1) {
      active = false;
      controls.enabled = true;
    }
  }

  return { goTo, update };
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

const tooltip     = document.getElementById('tooltip');
const tooltipTitle = document.getElementById('tooltip-title');
const tooltipBody  = document.getElementById('tooltip-body');

function showTooltip(label, desc, x, y) {
  tooltipTitle.textContent = label;
  tooltipBody.textContent  = desc;
  tooltip.style.display = 'block';
  tooltip.style.left = `${Math.min(x + 16, window.innerWidth - 260)}px`;
  tooltip.style.top  = `${Math.min(y + 16, window.innerHeight - 140)}px`;
}

function hideTooltip() {
  tooltip.style.display = 'none';
}

// ── Raycaster & Click Interaction ─────────────────────────────────────────────

function setupRaycaster(camera, renderer, clickables) {
  const raycaster = new THREE.Raycaster();
  const mouse     = new THREE.Vector2();
  let highlighted = null;
  let origMat     = null;
  let mouseDownPos = { x: 0, y: 0 };

  renderer.domElement.addEventListener('mousedown', e => {
    mouseDownPos.x = e.clientX;
    mouseDownPos.y = e.clientY;
  });

  renderer.domElement.addEventListener('mouseup', e => {
    const dx = Math.abs(e.clientX - mouseDownPos.x);
    const dy = Math.abs(e.clientY - mouseDownPos.y);
    if (dx > 5 || dy > 5) return;  // was a drag, not a click

    mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // Collect all meshes from clickables (which may be Groups)
    const meshes = [];
    clickables.forEach(c => {
      if (c.isMesh) meshes.push(c);
      else if (c.isGroup || c.isObject3D) c.traverse(ch => { if (ch.isMesh) meshes.push(ch); });
    });

    const hits = raycaster.intersectObjects(meshes, false);

    // Clear previous highlight
    if (highlighted && origMat) {
      highlighted.material = origMat;
      highlighted = null;
      origMat = null;
    }

    if (hits.length === 0) {
      hideTooltip();
      return;
    }

    // Walk up to find partLabel
    let obj = hits[0].object;
    let label = null, desc = null;
    while (obj) {
      if (obj.userData.partLabel) {
        label = obj.userData.partLabel;
        desc  = obj.userData.partDesc || '';
        break;
      }
      obj = obj.parent;
    }

    if (!label) { hideTooltip(); return; }

    // Highlight
    const mesh = hits[0].object;
    if (mesh.isMesh && !mesh.userData._isInstanced) {
      origMat = mesh.material;
      const clone = mesh.material.clone();
      clone.emissive = new THREE.Color(0x1a0000);
      clone.emissiveIntensity = 0.6;
      mesh.material = clone;
      highlighted = mesh;
    }

    showTooltip(label, desc, e.clientX, e.clientY);

    // Scoreboard slot interaction
    if (hits[0].object.userData.scoreRow !== undefined) {
      const { scoreRow, scoreInn } = hits[0].object.userData;
      updateScoreCell(hits[0].object, scoreRow, scoreInn);
    }
  });

  // Hide tooltip on canvas right-click / drag
  renderer.domElement.addEventListener('mousemove', e => {
    if (tooltip.style.display === 'block') {
      tooltip.style.left = `${Math.min(e.clientX + 16, window.innerWidth - 260)}px`;
      tooltip.style.top  = `${Math.min(e.clientY + 16, window.innerHeight - 140)}px`;
    }
  });
}

// ── Scoreboard ────────────────────────────────────────────────────────────────

const scoreState = {
  away: [0,0,0,0,0,0,0,0,0],
  home: [0,0,0,0,0,0,0,0,0],
};

function initScoreboardUI() {
  const innings = 9;

  // Inning labels
  const lblContainer = document.getElementById('inning-labels');
  for (let i = 1; i <= innings; i++) {
    const span = document.createElement('span');
    span.className = 'sb-inn-num';
    span.textContent = i;
    lblContainer.appendChild(span);
  }

  // Score cells
  ['score-away', 'score-home'].forEach((id, team) => {
    const container = document.getElementById(id);
    for (let inn = 0; inn < innings; inn++) {
      const cell = document.createElement('div');
      cell.className = 'sb-cell';
      cell.dataset.team = team;
      cell.dataset.inn  = inn;
      cell.textContent = '0';
      cell.addEventListener('click', () => {
        const arr = team === 0 ? scoreState.away : scoreState.home;
        arr[inn] = (arr[inn] + 1) % 10;
        cell.textContent = arr[inn];
      });
      container.appendChild(cell);
    }
  });
}

function updateScoreCell(mesh, row, inn) {
  const arr = row === 0 ? scoreState.away : scoreState.home;
  arr[inn] = (arr[inn] + 1) % 10;
  // Update HTML panel too
  const id = row === 0 ? 'score-away' : 'score-home';
  const cells = document.getElementById(id).querySelectorAll('.sb-cell');
  if (cells[inn]) cells[inn].textContent = arr[inn];
}

// ── Main setup export ─────────────────────────────────────────────────────────

export function setupUI({ camera, scene, renderer, clickables, crowdMesh, bloomPass, towerGlows }) {
  // Orbit controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.minDistance   = 40;
  controls.maxDistance   = 750;
  controls.maxPolarAngle = Math.PI * 0.492;
  controls.target.set(0, 8, 120);
  controls.update();

  const cameraAnim = makeCameraAnim(camera, controls);

  // Camera preset buttons
  document.querySelectorAll('.cam-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const key = btn.dataset.cam;
      if (PRESETS[key]) cameraAnim.goTo(PRESETS[key]);
    });
  });

  // Set default active button
  document.querySelector('[data-cam="pressbox"]').classList.add('active');

  // Time slider
  const slider    = document.getElementById('time-slider');
  const timeLabel = document.getElementById('time-label');
  slider.addEventListener('input', () => {
    timeLabel.textContent = getTODLabel(Number(slider.value));
  });
  timeLabel.textContent = getTODLabel(Number(slider.value));

  // Crowd toggle
  const crowdBtn = document.getElementById('crowd-btn');
  crowdBtn.addEventListener('click', () => {
    crowdMesh.visible = !crowdMesh.visible;
    crowdBtn.textContent = crowdMesh.visible ? 'Hide Crowd' : 'Show Crowd';
  });

  // Keyboard shortcut T = toggle crowd
  window.addEventListener('keydown', e => {
    if (e.key === 't' || e.key === 'T') crowdBtn.click();
  });

  // Raycaster
  setupRaycaster(camera, renderer, clickables);

  // Scoreboard HTML
  initScoreboardUI();

  // getTimeValue for animation loop
  function getTimeValue() { return Number(slider.value); }

  // onFrame (called each tick — reserved for future per-frame UI updates)
  function onFrame(elapsed) {
    // subtle crowd shimmer (optional — skipped for perf)
  }

  return { controls, cameraAnim, getTimeValue, onFrame };
}
