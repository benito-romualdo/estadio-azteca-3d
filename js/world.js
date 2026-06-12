// ════════════════════════════════════════════════════════════════
// world.js — Valle de México: cielo, volcanes, ciudad, luz y ánimo
// ════════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { gsap } from 'gsap';

export class World {
  constructor(scene) {
    this.scene = scene;

    // ── niebla del valle ──
    scene.fog = new THREE.Fog(0x1a1430, 300, 2600);

    // ── cúpula celeste (shader) ──
    this.skyUniforms = {
      uTop:     { value: new THREE.Color(0x1a1635) },
      uHorizon: { value: new THREE.Color(0xe8763a) },
      uSunDir:  { value: new THREE.Vector3(0.6, 0.08, -0.78).normalize() },
      uSunColor:{ value: new THREE.Color(0xffc777) },
      uSunSize: { value: 0.9 },
    };
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: this.skyUniforms,
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uTop; uniform vec3 uHorizon;
        uniform vec3 uSunDir; uniform vec3 uSunColor; uniform float uSunSize;
        varying vec3 vDir;
        void main() {
          float h = clamp(vDir.y, 0.0, 1.0);
          vec3 col = mix(uHorizon, uTop, pow(h, 0.62));
          float s = max(dot(normalize(vDir), normalize(uSunDir)), 0.0);
          col += uSunColor * pow(s, 320.0) * 3.2 * uSunSize;   // disco
          col += uSunColor * pow(s, 14.0) * 0.42 * uSunSize;   // halo
          col += uSunColor * pow(s, 3.5) * 0.12 * uSunSize;    // bruma
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(4200, 32, 18), skyMat);
    scene.add(this.sky);

    // ── estrellas ──
    {
      const n = 1600, pos = new Float32Array(n * 3), sz = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const t = Math.random() * Math.PI * 2;
        const p = Math.acos(THREE.MathUtils.lerp(0.12, 0.999, Math.random())); // hemisferio
        const r = 3900;
        pos[i*3]   = r * Math.sin(p) * Math.cos(t);
        pos[i*3+1] = r * Math.cos(p);
        pos[i*3+2] = r * Math.sin(p) * Math.sin(t);
        sz[i] = 4 + Math.random() * 9;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('size', new THREE.BufferAttribute(sz, 1));
      this.starMat = new THREE.PointsMaterial({
        color: 0xcdd8ff, size: 6, sizeAttenuation: true,
        transparent: true, opacity: 0, depthWrite: false,
      });
      this.stars = new THREE.Points(g, this.starMat);
      scene.add(this.stars);
    }

    // ── suelo del valle ──
    this.groundMat = new THREE.MeshStandardMaterial({ color: 0x141119, roughness: 1 });
    const ground = new THREE.Mesh(new THREE.CircleGeometry(4200, 64), this.groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.4;
    ground.receiveShadow = true;
    scene.add(ground);

    // explanada del estadio
    const plaza = new THREE.Mesh(
      new THREE.RingGeometry(150, 260, 64),
      new THREE.MeshStandardMaterial({ color: 0x232028, roughness: 0.95 })
    );
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.y = -0.2;
    scene.add(plaza);

    // ── volcanes: Popocatépetl e Iztaccíhuatl ──
    this._volcano(scene, 2600, 760, 620, -0.45);  // Popo (cono, fumarola)
    this._iztaccihuatl(scene, 2900, -0.95);       // Izta (la mujer dormida)

    // fumarola del Popo
    {
      const n = 90, pos = new Float32Array(n * 3), seed = new Float32Array(n);
      for (let i = 0; i < n; i++) { seed[i] = Math.random(); pos[i*3+1] = 99999; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      this._smokeSeed = seed;
      this.smoke = new THREE.Points(g, new THREE.PointsMaterial({
        color: 0xb9aebf, size: 60, transparent: true, opacity: 0.16,
        depthWrite: false, map: softSprite(), sizeAttenuation: true,
      }));
      this.smoke.userData.origin = new THREE.Vector3(
        Math.cos(-0.45) * 2600, 620, Math.sin(-0.45) * 2600);
      scene.add(this.smoke);
    }

    // ── luces de la ciudad (CDMX nocturna) ──
    {
      const n = 4200, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
      const c1 = new THREE.Color(0xffc66b), c2 = new THREE.Color(0xfff2cf), c3 = new THREE.Color(0x9fd2ff);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = 320 + Math.pow(Math.random(), 0.6) * 2400;
        pos[i*3] = Math.cos(a) * r;
        pos[i*3+1] = 1.5 + Math.random() * 14;
        pos[i*3+2] = Math.sin(a) * r;
        const c = Math.random() < 0.72 ? c1 : (Math.random() < 0.6 ? c2 : c3);
        col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      this.cityMat = new THREE.PointsMaterial({
        size: 4.2, vertexColors: true, transparent: true, opacity: 0,
        depthWrite: false, map: softSprite(), sizeAttenuation: true,
      });
      this.city = new THREE.Points(g, this.cityMat);
      scene.add(this.city);
    }

    // ── luces maestras ──
    this.hemi = new THREE.HemisphereLight(0x8a7bb8, 0x2a1f18, 0.55);
    scene.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xffc777, 1.4);
    this.sun.position.set(900, 140, -1100);
    this.sun.castShadow = false;
    scene.add(this.sun);

    this.ambient = new THREE.AmbientLight(0x221a30, 0.7);
    scene.add(this.ambient);
  }

  _volcano(scene, dist, baseR, height, angle) {
    const x = Math.cos(angle) * dist, z = Math.sin(angle) * dist;
    const cone = new THREE.Mesh(
      new THREE.ConeGeometry(baseR, height, 9, 4),
      new THREE.MeshStandardMaterial({ color: 0x241f2e, roughness: 1, flatShading: true })
    );
    cone.position.set(x, height / 2 - 30, z);
    scene.add(cone);
    const snow = new THREE.Mesh(
      new THREE.ConeGeometry(baseR * 0.32, height * 0.32, 9, 2),
      new THREE.MeshStandardMaterial({ color: 0xd8dbe8, roughness: 0.8, flatShading: true })
    );
    snow.position.set(x, height - height * 0.16 - 30, z);
    scene.add(snow);
  }

  _iztaccihuatl(scene, dist, angle) {
    // la "mujer dormida": tres lomos sucesivos
    const x = Math.cos(angle) * dist, z = Math.sin(angle) * dist;
    const humps = [[0, 520, 880], [620, 430, 760], [-600, 380, 700]];
    for (const [off, h, r] of humps) {
      const m = new THREE.Mesh(
        new THREE.ConeGeometry(r, h, 8, 3),
        new THREE.MeshStandardMaterial({ color: 0x262134, roughness: 1, flatShading: true })
      );
      m.position.set(x + off * Math.cos(angle + Math.PI/2), h / 2 - 40, z + off * Math.sin(angle + Math.PI/2));
      m.scale.y = 0.75;
      scene.add(m);
      const s = new THREE.Mesh(
        new THREE.ConeGeometry(r * 0.3, h * 0.26, 8, 2),
        new THREE.MeshStandardMaterial({ color: 0xcfd3e4, roughness: 0.85, flatShading: true })
      );
      s.position.copy(m.position); s.position.y = h * 0.75 - 40;
      scene.add(s);
    }
  }

  /**
   * Transición de ánimo lumínico (amanecer, día, oro, noche, rosa, fiesta).
   */
  setMood(m, dur = 4) {
    const u = this.skyUniforms;
    const ease = 'power2.inOut';
    gsap.to(u.uTop.value,     { r: m.top.r, g: m.top.g, b: m.top.b, duration: dur, ease });
    gsap.to(u.uHorizon.value, { r: m.horizon.r, g: m.horizon.g, b: m.horizon.b, duration: dur, ease });
    gsap.to(u.uSunColor.value,{ r: m.sunColor.r, g: m.sunColor.g, b: m.sunColor.b, duration: dur, ease });
    gsap.to(u.uSunSize,       { value: m.sunSize, duration: dur, ease });
    const sd = m.sunDir.clone().normalize();
    gsap.to(u.uSunDir.value,  { x: sd.x, y: sd.y, z: sd.z, duration: dur, ease });

    gsap.to(this.sun.position, { x: sd.x * 1400, y: Math.max(sd.y, 0.02) * 1400, z: sd.z * 1400, duration: dur, ease });
    gsap.to(this.sun.color,    { r: m.sunColor.r, g: m.sunColor.g, b: m.sunColor.b, duration: dur, ease });
    gsap.to(this.sun,          { intensity: m.sunIntensity, duration: dur, ease });
    gsap.to(this.hemi,         { intensity: m.hemiIntensity, duration: dur, ease });
    gsap.to(this.hemi.color,   { r: m.hemiColor.r, g: m.hemiColor.g, b: m.hemiColor.b, duration: dur, ease });
    gsap.to(this.ambient,      { intensity: m.ambient, duration: dur, ease });

    gsap.to(this.groundMat.color, { r: m.ground.r, g: m.ground.g, b: m.ground.b, duration: dur, ease });
    gsap.to(this.scene.fog.color, { r: m.fogColor.r, g: m.fogColor.g, b: m.fogColor.b, duration: dur, ease });
    gsap.to(this.scene.fog, { near: m.fogNear, far: m.fogFar, duration: dur, ease });

    gsap.to(this.starMat, { opacity: m.stars, duration: dur, ease });
    gsap.to(this.cityMat, { opacity: m.city, duration: dur, ease });
  }

  update(t) {
    // fumarola
    const pos = this.smoke.geometry.attributes.position;
    const o = this.smoke.userData.origin;
    for (let i = 0; i < this._smokeSeed.length; i++) {
      const s = this._smokeSeed[i];
      const life = (t * 0.022 + s) % 1;
      pos.array[i*3]   = o.x + Math.sin(s * 40 + t * 0.1) * 70 * life + life * 240;
      pos.array[i*3+1] = o.y + life * 480;
      pos.array[i*3+2] = o.z + Math.cos(s * 31) * 60 * life;
    }
    pos.needsUpdate = true;
    // titileo urbano leve
    this.city.rotation.y = Math.sin(t * 0.01) * 0.002;
  }
}

// ── sprite suave compartido ──
let _soft = null;
export function softSprite() {
  if (_soft) return _soft;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.35, 'rgba(255,255,255,.6)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  _soft = new THREE.CanvasTexture(c);
  return _soft;
}

// ── paleta de ánimos ──
const C = (hex) => new THREE.Color(hex);
export const MOODS = {
  dawn: {
    top: C(0x141033), horizon: C(0xe8763a), sunColor: C(0xffb45e), sunSize: 1.0,
    sunDir: new THREE.Vector3(0.82, 0.07, -0.55), sunIntensity: 0.9,
    hemiColor: C(0x6f5fa8), hemiIntensity: 0.4, ambient: 0.45,
    ground: C(0x1c1622), fogColor: C(0x2a1c38), fogNear: 220, fogFar: 2100, stars: 0.35, city: 0.25, bloom: 0.85,
  },
  day: {
    top: C(0x2766b6), horizon: C(0xc9e4f2), sunColor: C(0xfff3d8), sunSize: 0.85,
    sunDir: new THREE.Vector3(0.35, 0.75, -0.4), sunIntensity: 2.1,
    hemiColor: C(0xbcd4ef), hemiIntensity: 0.95, ambient: 0.7,
    ground: C(0x55504a), fogColor: C(0xa9c4d9), fogNear: 600, fogFar: 4400, stars: 0, city: 0, bloom: 0.32,
  },
  golden: {
    top: C(0x46286b), horizon: C(0xff9633), sunColor: C(0xffc04d), sunSize: 1.25,
    sunDir: new THREE.Vector3(-0.85, 0.12, 0.35), sunIntensity: 1.5,
    hemiColor: C(0xc08a5a), hemiIntensity: 0.55, ambient: 0.5,
    ground: C(0x3a2c26), fogColor: C(0x53304a), fogNear: 380, fogFar: 3000, stars: 0.1, city: 0.1, bloom: 0.55,
  },
  night: {
    top: C(0x04050e), horizon: C(0x0e1830), sunColor: C(0x223457), sunSize: 0.0,
    sunDir: new THREE.Vector3(0, -0.4, 1), sunIntensity: 0.12,
    hemiColor: C(0x2c3c66), hemiIntensity: 0.42, ambient: 0.46,
    ground: C(0x0e0e16), fogColor: C(0x070a16), fogNear: 320, fogFar: 2700, stars: 1.0, city: 0.9, bloom: 0.8,
  },
  rosa: {
    top: C(0x2c0e44), horizon: C(0xff4f9e), sunColor: C(0xff7eb6), sunSize: 0.75,
    sunDir: new THREE.Vector3(-0.6, 0.05, -0.78), sunIntensity: 0.7,
    hemiColor: C(0x8a4a8e), hemiIntensity: 0.45, ambient: 0.5,
    ground: C(0x251628), fogColor: C(0x3a1340), fogNear: 260, fogFar: 2300, stars: 0.5, city: 0.55, bloom: 0.85,
  },
  fiesta: {
    top: C(0x030610), horizon: C(0x0d3030), sunColor: C(0x1a2a4a), sunSize: 0.0,
    sunDir: new THREE.Vector3(0, -0.3, 1), sunIntensity: 0.1,
    hemiColor: C(0x2f4a6e), hemiIntensity: 0.52, ambient: 0.52,
    ground: C(0x0d0f16), fogColor: C(0x05101a), fogNear: 340, fogFar: 3000, stars: 1.0, city: 1.0, bloom: 0.8,
  },
};
