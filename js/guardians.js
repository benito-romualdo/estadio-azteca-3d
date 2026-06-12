// ════════════════════════════════════════════════════════════════
// guardians.js — los guardianes del Coloso
//   estética neón-blacklight: dioses y alebrijes delineados en luz
//   · cabezas de Quetzalcóatl flanqueando la entrada (Templo Mayor)
//   · estelas con grecas (xicalcoliuhqui) que respiran
//   · alebrijes de líneas de neón patrullando la explanada
// ════════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { gsap } from 'gsap';
import { SCALE_X } from './stadium.js';

const STONE = new THREE.MeshStandardMaterial({ color: 0x16121e, roughness: 0.9 });

// textura de grecas neón pintada en canvas (una por color)
function grecaTexture(hex) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 1024;
  const g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 1024);
  g.strokeStyle = hex; g.lineWidth = 7; g.lineCap = 'square';
  // xicalcoliuhqui: greca escalonada en bandas
  for (let band = 0; band < 6; band++) {
    const y0 = 60 + band * 160;
    g.beginPath();
    for (let x = 14; x < 250; x += 56) {
      g.moveTo(x, y0 + 44);
      g.lineTo(x, y0);
      g.lineTo(x + 28, y0);
      g.lineTo(x + 28, y0 + 26);
      g.lineTo(x + 48, y0 + 26);
    }
    g.stroke();
    // ojo de dios entre bandas
    if (band % 2) {
      g.beginPath(); g.arc(128, y0 + 102, 22, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.arc(128, y0 + 102, 9, 0, Math.PI * 2); g.stroke();
    } else {
      g.strokeRect(96, y0 + 78, 64, 48);
      g.beginPath();
      g.moveTo(96, y0 + 78); g.lineTo(160, y0 + 126);
      g.moveTo(160, y0 + 78); g.lineTo(96, y0 + 126);
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// líneas de neón sobre una geometría (alambre del alebrije)
function neonEdges(geo, color, threshold = 12) {
  return new THREE.LineSegments(
    new THREE.EdgesGeometry(geo, threshold),
    new THREE.LineBasicMaterial({
      color: new THREE.Color(color).multiplyScalar(2.4),   // > 1: el bloom lo enciende
      transparent: true, opacity: 0, toneMapped: false,
    })
  );
}

export class Guardians {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.glow = { value: 0 };
    this._neonMats = [];   // materiales de línea / puntos que siguen al glow
    this._pulseMats = [];  // emissive que late
    this._lights = [];
    this._alebrijes = [];
    this._eyes = [];

    this._estelas();
    this._serpentHeads();
    this._alebrije({
      pos: new THREE.Vector3(238, 0, 52), rotY: -2.2, scale: 1.0,
      neon: 0xff2e9d, accent: 0x29e6ff, kind: 'lobo',
    });
    this._alebrije({
      pos: new THREE.Vector3(-215, 0, 168), rotY: 0.9, scale: 1.25,
      neon: 0xff8a1f, accent: 0x39f0a4, kind: 'jaguar',
    });
    this._alebrije({
      pos: new THREE.Vector3(-70, 0, -242), rotY: 2.6, scale: 1.1,
      neon: 0xa05cff, accent: 0xffd34d, kind: 'aguila',
    });
  }

  // ── estelas con grecas alrededor de la explanada ──
  _estelas() {
    const colors = ['#2fe6a8', '#ffd34d', '#ff2e9d', '#29e6ff', '#ff8a1f', '#a05cff'];
    const N = 6;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 + Math.PI / 6;
      const x = Math.cos(a) * 215 * SCALE_X;
      const z = Math.sin(a) * 215;
      const tex = grecaTexture(colors[i]);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x14101c, roughness: 0.85,
        emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0,
      });
      this._pulseMats.push({ mat, phase: i * 1.1 });
      const stela = new THREE.Mesh(new THREE.BoxGeometry(7, 30, 3), mat);
      stela.position.set(x, 15, z);
      stela.rotation.y = -a + Math.PI / 2;
      // remate: orbe que flota sobre la estela
      const orbMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(colors[i]).multiplyScalar(2.2), transparent: true, opacity: 0, toneMapped: false,
      });
      this._neonMats.push(orbMat);
      const orb = new THREE.Mesh(new THREE.SphereGeometry(1.3, 12, 10), orbMat);
      orb.position.set(x, 33.5, z);
      orb.userData.baseY = 33.5;
      orb.userData.phase = i;
      this._orbs = this._orbs || [];
      this._orbs.push(orb);
      const base = new THREE.Mesh(new THREE.BoxGeometry(10, 2.2, 6), STONE);
      base.position.set(x, 1.1, z);
      base.rotation.y = stela.rotation.y;
      this.group.add(stela, orb, base);
    }
  }

  // ── cabezas de Quetzalcóatl flanqueando la puerta oriente ──
  _serpentHeads() {
    for (const side of [-1, 1]) {
      const head = new THREE.Group();

      // cráneo y hocico
      const skull = new THREE.Mesh(new THREE.SphereGeometry(6.5, 10, 8), STONE);
      skull.scale.set(1.15, 0.95, 1);
      skull.position.y = 7.5;
      const snout = new THREE.Mesh(new THREE.BoxGeometry(9, 5.2, 7.6), STONE);
      snout.position.set(7.5, 6.2, 0);
      const jaw = new THREE.Mesh(new THREE.BoxGeometry(8.5, 1.6, 7), STONE);
      jaw.position.set(7, 3.0, 0);
      head.add(skull, snout, jaw);

      // colmillos
      const fangMat = new THREE.MeshStandardMaterial({ color: 0xd8d2c4, roughness: 0.6 });
      for (const fz of [-2.4, 2.4]) {
        const fang = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.4, 6), fangMat);
        fang.position.set(10.5, 4.2, fz);
        fang.rotation.x = Math.PI;
        head.add(fang);
      }

      // ojos de brasa
      const eyeMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffd34d).multiplyScalar(2.6), transparent: true, opacity: 0, toneMapped: false,
      });
      this._neonMats.push(eyeMat);
      for (const ez of [-3.3, 3.3]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(1.25, 10, 8), eyeMat);
        eye.position.set(5.5, 8.6, ez);
        head.add(eye);
        this._eyes.push(eye);
      }

      // penacho de plumas en abanico (jade → fuego)
      const featherColors = [0x2fe6a8, 0x2fe6a8, 0x39f0a4, 0xffd34d, 0xff8a1f, 0xff8a1f, 0xffd34d, 0x39f0a4, 0x2fe6a8, 0x2fe6a8];
      const nF = featherColors.length;
      for (let i = 0; i < nF; i++) {
        const t = i / (nF - 1);
        const ang = THREE.MathUtils.lerp(-1.25, 1.25, t);    // abanico vertical tras el cráneo
        const fMat = new THREE.MeshStandardMaterial({
          color: 0x101018, roughness: 0.7,
          emissive: featherColors[i], emissiveIntensity: 0,
        });
        this._pulseMats.push({ mat: fMat, phase: i * 0.45 + (side > 0 ? 0 : 1.7) });
        const feather = new THREE.Mesh(new THREE.ConeGeometry(1.5, 9.5, 6), fMat);
        feather.scale.z = 0.35;
        feather.position.set(
          -5.5 - Math.abs(Math.sin(ang)) * 1.2,
          7.5 + Math.sin(ang) * 7.2,
          Math.cos(ang) * (side > 0 ? 1 : -1) * 0.001 // plano del abanico
        );
        feather.position.z += Math.sin(ang) * 0; // abanico en plano XY local
        feather.rotation.z = -Math.PI / 2 - ang * 0.85;
        head.add(feather);
      }

      // anillo del cuello
      const collar = new THREE.Mesh(new THREE.TorusGeometry(6.2, 1.1, 8, 18), STONE);
      collar.rotation.y = Math.PI / 2;
      collar.position.set(-4.5, 7.5, 0);
      head.add(collar);

      // pedestal
      const base = new THREE.Mesh(new THREE.BoxGeometry(16, 2.6, 12), STONE);
      base.position.y = 1.3;
      head.add(base);

      head.position.set(212, 0, side * 46);
      head.rotation.y = 0;                       // miran hacia el oriente (+x)
      head.scale.setScalar(1.25);
      this.group.add(head);

      // brasa interior: luz cálida tenue
      const l = new THREE.PointLight(0xffaa3d, 0, 70, 2);
      l.position.set(212 + 8, 9, side * 46);
      this.group.add(l);
      this._lights.push({ light: l, max: 900 });
    }
  }

  // ── alebrije de neón: cuerpo oscuro + alambre luminoso + lunares ──
  _alebrije({ pos, rotY, scale, neon, accent, kind }) {
    const grp = new THREE.Group();
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x120e1a, roughness: 0.65 });

    // cuerpo
    const bodyGeo = new THREE.IcosahedronGeometry(4.2, 1);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.scale.set(1.6, 1.0, 0.95);
    body.position.y = 7.2;
    grp.add(body);
    body.add(neonEdges(bodyGeo, neon, 1));

    // cabeza
    const headGeo = new THREE.IcosahedronGeometry(2.4, 1);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(6.6, 10.4, 0);
    grp.add(head);
    head.add(neonEdges(headGeo, accent, 1));

    // hocico y orejas
    const snoutGeo = new THREE.ConeGeometry(1.1, 2.8, 6);
    const snout = new THREE.Mesh(snoutGeo, bodyMat);
    snout.rotation.z = -Math.PI / 2;
    snout.position.set(2.9, -0.2, 0);
    head.add(snout);
    snout.add(neonEdges(snoutGeo, neon, 8));
    for (const ez of [-1.1, 1.1]) {
      const earGeo = new THREE.ConeGeometry(0.8, 2.6, 5);
      const ear = new THREE.Mesh(earGeo, bodyMat);
      ear.position.set(-0.6, 2.4, ez);
      ear.rotation.x = ez * 0.3;
      head.add(ear);
      ear.add(neonEdges(earGeo, accent, 8));
    }

    // patas
    for (const [lx, lz] of [[-3.4, -2.1], [-3.4, 2.1], [3.6, -2.1], [3.6, 2.1]]) {
      const legGeo = new THREE.CylinderGeometry(0.55, 0.8, 7.2, 6);
      const leg = new THREE.Mesh(legGeo, bodyMat);
      leg.position.set(lx, 3.6, lz);
      grp.add(leg);
      leg.add(neonEdges(legGeo, neon, 14));
    }

    // cola: cadena de esferas que ondula
    const tail = [];
    for (let i = 0; i < 5; i++) {
      const r = 1.4 - i * 0.22;
      const sGeo = new THREE.IcosahedronGeometry(r, 0);
      const s = new THREE.Mesh(sGeo, bodyMat);
      s.userData.idx = i;
      grp.add(s);
      s.add(neonEdges(sGeo, i % 2 ? accent : neon, 1));
      tail.push(s);
    }

    // alas (si es águila o lobo)
    const wings = [];
    if (kind !== 'jaguar') {
      for (const wz of [-1, 1]) {
        const wingGeo = new THREE.ConeGeometry(3.4, 9.5, 4);
        const wing = new THREE.Mesh(wingGeo, bodyMat);
        wing.scale.set(0.22, 1, 1.0);
        wing.position.set(-1.2, 11.6, wz * 3.6);
        wing.rotation.x = wz * 0.85;
        wing.userData.wz = wz;
        grp.add(wing);
        wing.add(neonEdges(wingGeo, accent, 8));
        wings.push(wing);
      }
    }

    // lunares de pintura fluorescente sobre el lomo
    const dotColors = [neon, accent, 0xffd34d];
    for (let i = 0; i < 22; i++) {
      const dMat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(dotColors[i % 3]).multiplyScalar(2.0), transparent: true, opacity: 0, toneMapped: false,
      });
      this._neonMats.push(dMat);
      const d = new THREE.Mesh(new THREE.SphereGeometry(0.22 + Math.random() * 0.2, 6, 5), dMat);
      const th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1);
      d.position.set(
        Math.sin(ph) * Math.cos(th) * 4.3 * 1.6,
        Math.cos(ph) * 4.3,
        Math.sin(ph) * Math.sin(th) * 4.3 * 0.95
      );
      body.add(d);
    }

    // aura: luz de color del alebrije
    const l = new THREE.PointLight(neon, 0, 60, 2);
    l.position.set(0, 10, 0);
    grp.add(l);
    this._lights.push({ light: l, max: 600 });

    grp.position.copy(pos);
    grp.rotation.y = rotY;
    grp.scale.setScalar(scale);
    this.group.add(grp);
    this._alebrijes.push({ grp, body, head, tail, wings, phase: Math.random() * Math.PI * 2 });
  }

  /** intensidad del neón 0..1 según el capítulo */
  setGlow(v, dur = 3) {
    gsap.to(this.glow, { value: v, duration: dur, ease: 'power2.inOut' });
    for (const m of this._neonMats) gsap.to(m, { opacity: v, duration: dur });
    for (const { light, max } of this._lights) gsap.to(light, { intensity: max * v, duration: dur });
  }

  update(t) {
    const g = this.glow.value;

    // grecas y plumas que respiran
    for (const { mat, phase } of this._pulseMats) {
      mat.emissiveIntensity = g * (0.75 + 0.35 * Math.sin(t * 1.8 + phase));
    }
    // orbes flotando
    if (this._orbs) for (const o of this._orbs) {
      o.position.y = o.userData.baseY + Math.sin(t * 1.2 + o.userData.phase) * 0.8;
    }
    // ojos de serpiente: parpadeo de brasa
    for (let i = 0; i < this._eyes.length; i++) {
      const s = 1 + 0.15 * Math.sin(t * 5 + i * 2.1);
      this._eyes[i].scale.setScalar(s);
    }
    // alebrijes vivos: respiración, cola, alas, cabeza
    for (const a of this._alebrijes) {
      const p = a.phase;
      a.body.position.y = 7.2 + Math.sin(t * 1.6 + p) * 0.35;
      a.body.rotation.z = Math.sin(t * 0.8 + p) * 0.04;
      a.head.position.y = 10.4 + Math.sin(t * 1.6 + p + 0.6) * 0.45;
      a.head.rotation.y = Math.sin(t * 0.45 + p) * 0.35;
      a.head.rotation.z = Math.sin(t * 0.9 + p * 2) * 0.1;
      for (const s of a.tail) {
        const i = s.userData.idx;
        s.position.set(
          -7.2 - i * 1.55,
          8.2 + Math.sin(t * 2.0 + p - i * 0.55) * (0.5 + i * 0.28),
          Math.sin(t * 1.3 + p - i * 0.4) * (0.4 + i * 0.3)
        );
      }
      for (const w of a.wings) {
        w.rotation.x = w.userData.wz * (0.85 + Math.sin(t * 1.1 + p) * 0.28);
      }
    }
  }
}
