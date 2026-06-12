// ════════════════════════════════════════════════════════════════
// main.js — EL COLOSO · Estadio Azteca
//   render, composición, rig de cámara y arranque de la travesía
// ════════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import { World } from './world.js';
import { Stadium } from './stadium.js';
import { Crowd } from './crowd.js';
import {
  Quetzalcoatl, FallingRain, PapelPicado, Fireworks, TricolorBeams, GolDelSiglo, PALETTES,
} from './effects.js';
import { Guardians } from './guardians.js';
import { SoundScape } from './audio.js';
import { Director } from './chapters.js';
import { UI } from './ui.js';
import { gsap } from 'gsap';

// tweens posteriores sobre la misma propiedad matan a los anteriores
// (evita que un fade de reset apague reflectores recién encendidos)
gsap.defaults({ overwrite: 'auto' });

// ── escena base ──
const container = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 9000);
camera.position.set(700, 80, -900);

// ── post-proceso: bloom cinematográfico ──
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight), 0.85, 0.6, 0.82
);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// ── construcción del mundo ──
const world = new World(scene);
const stadium = new Stadium(scene);
const crowd = new Crowd(scene);

const fx = {
  quetzal: new Quetzalcoatl(scene),
  petals: new FallingRain(scene, { palette: PALETTES.cempasuchil, count: 2600, area: 130, top: 80, size: 3.0, speed: 5.5 }),
  confetti: new FallingRain(scene, { palette: PALETTES.oro70, count: 2000, area: 160, top: 90, size: 2.4, speed: 8 }),
  rainTricolor: new FallingRain(scene, { palette: PALETTES.tricolor, count: 2600, area: 170, top: 100, size: 2.6, speed: 9 }),
  papel: new PapelPicado(scene),
  fireworks: new Fireworks(scene),
  beams: new TricolorBeams(scene),
  gol: new GolDelSiglo(scene),
  guardians: new Guardians(scene),
};

const audio = new SoundScape();
fx.fireworks.onBurst = () => audio.boom();

// ── rig de cámara: posición + mirada con deriva "handheld" ──
const cam = {
  pos: new THREE.Vector3(700, 80, -900),
  target: new THREE.Vector3(0, 40, 0),
};

// ── cámara libre ──
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.maxDistance = 1200;
controls.minDistance = 20;
controls.maxPolarAngle = Math.PI * 0.495;
controls.target.set(0, 20, 0);
controls.enabled = false;
let freecam = false;

// ── dirección ──
let director = null;
const ui = new UI({
  onSeek: (i, delta) => {
    if (!director) return;
    if (i === null) i = (director.current + delta + 6) % 6;
    director.goTo(i);
  },
  onPlayToggle: () => {
    if (!director) return true;
    director.setPlaying(!director.playing);
    return director.playing;
  },
  onCamToggle: () => {
    freecam = !freecam;
    controls.enabled = freecam;
    if (freecam) {
      controls.target.copy(cam.target);
      director?.setPlaying(false);
    } else {
      director?.setPlaying(true);
    }
    return freecam;
  },
  onAudioToggle: () => audio.toggle(),
});

// ── arranque ──
const loader = document.getElementById('loader');
// modo verificación: #auto salta la portada (y #cap=N entra al capítulo N)
if (location.hash.includes('auto')) {
  setTimeout(() => document.getElementById('btn-start').click(), 600);
}
document.getElementById('btn-start').addEventListener('click', () => {
  loader.classList.add('hidden');
  document.body.classList.add('live', 'cinema');
  // el gesto del usuario habilita el audio
  if (audio.toggle()) document.getElementById('btn-audio').classList.add('on');
  director = new Director({ world, stadium, crowd, fx, audio, ui, cam, bloom });
  const capMatch = location.hash.match(/cap=(\d)/);
  director.goTo(capMatch ? Math.min(5, +capMatch[1]) : 0);
}, { once: true });

// ── resize ──
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// hooks de inspección para verificación headless
window.__SETCAM__ = (p, t) => {
  director?.setPlaying(false);
  cam.pos.set(p[0], p[1], p[2]);
  cam.target.set(t[0], t[1], t[2]);
};
window.__DEBUG__ = () => ({
  spots: stadium.spots.map(s => ({ i: Math.round(s.intensity), pos: s.position.toArray().map(Math.round) })),
  hemi: world.hemi.intensity.toFixed(2),
  amb: world.ambient.intensity.toFixed(2),
  sun: world.sun.intensity.toFixed(2),
  cam: camera.position.toArray().map(Math.round),
  target: cam.target.toArray().map(Math.round),
  skyTop: world.skyUniforms.uTop.value.getHexString(),
  skyHor: world.skyUniforms.uHorizon.value.getHexString(),
  fog: [scene.fog.near, scene.fog.far, scene.fog.color.getHexString()],
  crowd: {
    dim: crowd.uniforms.uDim.value.toFixed(2),
    mix: crowd.uniforms.uMix.value.toFixed(2),
    pA: crowd.uniforms.uPatternA.value,
    pB: crowd.uniforms.uPatternB.value,
  },
  bloomStrength: bloom.strength.toFixed(2),
  draws: renderer.info.render.calls,
  tris: renderer.info.render.triangles,
});

// ── bucle ──
const clock = new THREE.Clock();
const _sunDir = new THREE.Vector3();

function loop() {
  requestAnimationFrame(loop);
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  world.update(t);
  _sunDir.copy(world.sun.position).normalize();
  crowd.update(t, _sunDir);
  fx.quetzal.update(t);
  fx.petals.update(t);
  fx.confetti.update(t);
  fx.rainTricolor.update(t);
  fx.papel.update(t);
  fx.beams.update(t);
  fx.fireworks.update(dt);
  fx.guardians.update(t);

  if (freecam) {
    controls.update();
  } else {
    // deriva de mano: la cámara respira
    const bx = Math.sin(t * 0.31) * 1.6 + Math.sin(t * 0.83) * 0.5;
    const by = Math.sin(t * 0.42) * 1.1 + Math.cos(t * 0.71) * 0.4;
    const bz = Math.cos(t * 0.27) * 1.4;
    camera.position.set(cam.pos.x + bx, cam.pos.y + by, cam.pos.z + bz);
    camera.lookAt(cam.target);
  }

  composer.render();
}
loop();
