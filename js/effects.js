// ════════════════════════════════════════════════════════════════
// effects.js — la magia de México
//   Quetzalcóatl de partículas · lluvia de cempasúchil · papel picado
//   fuegos artificiales · haces tricolores · el Gol del Siglo
// ════════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { gsap } from 'gsap';
import { softSprite } from './world.js';
import { SCALE_X } from './stadium.js';

/* ────────────────────────────────────────────────────────────────
   QUETZALCÓATL — serpiente emplumada de 700 luces
   ──────────────────────────────────────────────────────────────── */
export class Quetzalcoatl {
  constructor(scene) {
    // ruta: rodea el coloso, se zambulle sobre el vaso y remonta
    const pts = [];
    const R = 215, n = 14;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      let r = R + Math.sin(a * 3) * 45;
      let y = 70 + Math.sin(a * 2 + 1) * 32;
      if (i === 4 || i === 5) { r = 70; y = 58; }       // pasa sobre el vaso
      if (i === 10) { y = 120; }                          // remonta al cielo
      pts.push(new THREE.Vector3(Math.cos(a) * r * SCALE_X, y, Math.sin(a) * r));
    }
    this.curve = new THREE.CatmullRomCurve3(pts, true, 'centripetal', 0.6);

    const N = this.N = 700;
    const pos = new Float32Array(N * 3);
    const col = new Float32Array(N * 3);
    const siz = new Float32Array(N);
    const jade = new THREE.Color(0x37e0a0), gold = new THREE.Color(0xffd05a), fire = new THREE.Color(0xff4a3a);
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const f = i / N;
      if (f < 0.12) c.copy(gold).lerp(fire, f / 0.12);          // cabeza ardiente
      else c.copy(jade).lerp(gold, Math.pow(1 - f, 2.2));       // cuerpo jade
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
      siz[i] = (1 - f * 0.85) * 7.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('size', new THREE.BufferAttribute(siz, 1));

    this.mat = new THREE.PointsMaterial({
      vertexColors: true, size: 5, sizeAttenuation: true, map: softSprite(),
      transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);

    this.light = new THREE.PointLight(0x4ee8a8, 0, 180, 1.6);
    scene.add(this.light);
    this.speed = 0.018;
  }

  setVisible(v, dur = 2.5) {
    gsap.to(this.mat, { opacity: v ? 0.95 : 0, duration: dur });
    gsap.to(this.light, { intensity: v ? 900 : 0, duration: dur });
  }

  update(t) {
    if (this.mat.opacity <= 0.01) return;
    const pos = this.points.geometry.attributes.position;
    const head = (t * this.speed) % 1;
    const tmp = new THREE.Vector3();
    for (let i = 0; i < this.N; i++) {
      const f = ((head - i * 0.00045) % 1 + 1) % 1;
      this.curve.getPointAt(f, tmp);
      // ondulación de plumas
      const w = Math.sin(t * 4 + i * 0.12) * (i * 0.004);
      pos.array[i*3] = tmp.x;
      pos.array[i*3+1] = tmp.y + w;
      pos.array[i*3+2] = tmp.z;
      if (i === 0) this.light.position.copy(tmp);
    }
    pos.needsUpdate = true;
  }
}

/* ────────────────────────────────────────────────────────────────
   LLUVIA DE PARTÍCULAS (GPU) — cempasúchil, confeti dorado, tricolor
   ──────────────────────────────────────────────────────────────── */
export class FallingRain {
  constructor(scene, { count = 2400, palette, area = 150, top = 95, size = 2.6, speed = 7 }) {
    const seeds = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      seeds[i*3]   = (Math.random() * 2 - 1);   // x: -1..1
      seeds[i*3+1] = Math.random();             // fase de caída
      seeds[i*3+2] = (Math.random() * 2 - 1);   // z
      c.set(palette[(Math.random() * palette.length) | 0]);
      col[i*3] = c.r; col[i*3+1] = c.g; col[i*3+2] = c.b;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(seeds, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));

    this.uniforms = {
      uTime: { value: 0 }, uOpacity: { value: 0 },
      uArea: { value: area }, uTop: { value: top },
      uSize: { value: size }, uSpeed: { value: speed },
      uMap: { value: softSprite() },
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true, depthWrite: false, fog: true,
      vertexShader: /* glsl */`
        attribute vec3 color;
        uniform float uTime, uArea, uTop, uSize, uSpeed;
        varying vec3 vColor;
        varying float vFade;
        #include <common>
        #include <fog_pars_vertex>
        void main() {
          vColor = color;
          float ph = position.y;
          float fall = mod(ph * uTop + uTime * uSpeed, uTop);
          float y = uTop - fall + 3.0;
          float sway = sin(uTime * 1.4 + ph * 60.0) * 5.0 * (fall / uTop);
          vec3 p = vec3(
            position.x * uArea * 1.28 + sway,
            y,
            position.z * uArea + cos(uTime * 1.1 + ph * 47.0) * 4.0
          );
          vFade = smoothstep(0.0, 6.0, y) * smoothstep(uTop, uTop - 8.0, y);
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_PointSize = uSize * (0.8 + 0.5 * fract(ph * 7.0)) * (240.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform sampler2D uMap;
        uniform float uOpacity;
        varying vec3 vColor;
        varying float vFade;
        #include <common>
        #include <fog_pars_fragment>
        void main() {
          float a = texture2D(uMap, gl_PointCoord).a;
          gl_FragColor = vec4(vColor, a * uOpacity * vFade);
          #include <fog_fragment>
        }`,
    });
    this.points = new THREE.Points(g, mat);
    this.points.frustumCulled = false;
    scene.add(this.points);
  }
  setVisible(v, dur = 2.5) { gsap.to(this.uniforms.uOpacity, { value: v ? 1 : 0, duration: dur }); }
  update(t) { this.uniforms.uTime.value = t; }
}

export const PALETTES = {
  cempasuchil: [0xff9a1f, 0xffb43b, 0xff7e0a, 0xffc964, 0xe66c12],
  oro70:       [0xffd34d, 0xffe79a, 0xf2b51d, 0xfff3c4],
  tricolor:    [0x1f9d55, 0xf3efe4, 0xd23c47, 0xffd34d],
};

/* ────────────────────────────────────────────────────────────────
   PAPEL PICADO — guirnaldas sobre el vaso
   ──────────────────────────────────────────────────────────────── */
export class PapelPicado {
  constructor(scene) {
    const colors = [0xe4007c, 0xff9a1f, 0x00b7c2, 0x8a3ffc, 0x2fbf8f, 0xffd34d];
    const strings = 9, flagsPer = 42;
    const count = strings * flagsPer;

    const geo = new THREE.PlaneGeometry(2.6, 2.0);
    geo.translate(0, -1.0, 0);   // cuelga desde el borde superior

    const aPhase = new Float32Array(count);
    const aColor = new Float32Array(count * 3);
    const matrices = [];
    const c = new THREE.Color();
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();

    let k = 0;
    for (let s = 0; s < strings; s++) {
      const a = (s / strings) * Math.PI;                  // cuerdas que cruzan el vaso
      const ax = Math.cos(a), az = Math.sin(a);
      const R1 = { x: ax * 74 * SCALE_X, z: az * 74 }, R2 = { x: -ax * 74 * SCALE_X, z: -az * 74 };
      for (let i = 0; i < flagsPer; i++) {
        const f = (i + 0.5) / flagsPer;
        const x = THREE.MathUtils.lerp(R1.x, R2.x, f);
        const z = THREE.MathUtils.lerp(R1.z, R2.z, f);
        const sag = Math.sin(f * Math.PI);                // catenaria simple
        const y = 47 - sag * 9;
        e.set(0, a + Math.PI / 2, 0);
        q.setFromEuler(e);
        m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1));
        matrices.push(m.clone());
        aPhase[k] = Math.random() * Math.PI * 2;
        c.set(colors[(s + i) % colors.length]);
        aColor[k*3] = c.r; aColor[k*3+1] = c.g; aColor[k*3+2] = c.b;
        k++;
      }
    }

    this.uniforms = {
      uTime: { value: 0 }, uOpacity: { value: 0 },
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    };
    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      side: THREE.DoubleSide, transparent: true, fog: true,
      vertexShader: /* glsl */`
        attribute float aPhase;
        attribute vec3 aColor;
        uniform float uTime;
        varying vec3 vColor;
        varying vec2 vUv;
        #include <common>
        #include <fog_pars_vertex>
        void main() {
          vColor = aColor; vUv = uv;
          vec3 p = position;
          // mece la banderita desde su borde superior (y=0 local)
          float bend = sin(uTime * 2.2 + aPhase) * 0.45 * (-p.y);
          p.x += bend;
          p.z += cos(uTime * 1.7 + aPhase) * 0.3 * (-p.y);
          vec4 mPos = instanceMatrix * vec4(p, 1.0);
          vec4 mvPosition = modelViewMatrix * mPos;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform float uOpacity;
        varying vec3 vColor;
        varying vec2 vUv;
        #include <common>
        #include <fog_pars_fragment>
        void main() {
          // troquelado: perforaciones del papel picado
          vec2 g = fract(vUv * vec2(5.0, 4.0)) - 0.5;
          float hole = step(length(g), 0.21);
          float zig = step(0.92 - abs(fract(vUv.x * 5.0) - 0.5) * 0.55, vUv.y);  // orilla dentada
          if (hole > 0.5 || zig > 0.5) discard;
          gl_FragColor = vec4(vColor, uOpacity * 0.96);
          #include <fog_fragment>
        }`,
    });

    this.mesh = new THREE.InstancedMesh(geo, mat, count);
    matrices.forEach((mm, i) => this.mesh.setMatrixAt(i, mm));
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(aPhase, 1));
    geo.setAttribute('aColor', new THREE.InstancedBufferAttribute(aColor, 3));
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }
  setVisible(v, dur = 2.5) { gsap.to(this.uniforms.uOpacity, { value: v ? 1 : 0, duration: dur }); }
  update(t) { this.uniforms.uTime.value = t; }
}

/* ────────────────────────────────────────────────────────────────
   FUEGOS ARTIFICIALES — pool de chispas con física simple
   ──────────────────────────────────────────────────────────────── */
export class Fireworks {
  constructor(scene) {
    const MAX = this.MAX = 5200;
    this.pos = new Float32Array(MAX * 3);
    this.vel = new Float32Array(MAX * 3);
    this.col = new Float32Array(MAX * 3);
    this.life = new Float32Array(MAX);       // 0 = muerta
    this.pos.fill(99999);

    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.PointsMaterial({
      vertexColors: true, size: 3.4, map: softSprite(), sizeAttenuation: true,
      transparent: true, opacity: 1, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    scene.add(this.points);

    this.rate = 0;       // descargas por segundo
    this._acc = 0;
    this._cursor = 0;
    this.palette = [0x1f9d55, 0xfff3e0, 0xd23c47, 0xffd34d, 0xe4007c];
    this.onBurst = null; // hook de audio
  }

  setRate(r) { this.rate = r; }

  burst(origin, color, n = 130, power = 26) {
    const c = new THREE.Color(color);
    for (let i = 0; i < n; i++) {
      const k = this._cursor = (this._cursor + 1) % this.MAX;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      const sp = power * (0.35 + Math.random() * 0.65);
      this.pos[k*3] = origin.x; this.pos[k*3+1] = origin.y; this.pos[k*3+2] = origin.z;
      this.vel[k*3]   = Math.sin(ph) * Math.cos(th) * sp;
      this.vel[k*3+1] = Math.cos(ph) * sp * 0.9;
      this.vel[k*3+2] = Math.sin(ph) * Math.sin(th) * sp;
      const shade = 0.7 + Math.random() * 0.5;
      this.col[k*3] = c.r * shade; this.col[k*3+1] = c.g * shade; this.col[k*3+2] = c.b * shade;
      this.life[k] = 1.6 + Math.random() * 1.3;
    }
    if (this.onBurst) this.onBurst();
  }

  update(dt) {
    if (this.rate > 0) {
      this._acc += dt * this.rate;
      while (this._acc >= 1) {
        this._acc -= 1;
        const a = Math.random() * Math.PI * 2;
        const r = 150 + Math.random() * 160;
        this.burst(
          new THREE.Vector3(Math.cos(a) * r * SCALE_X, 95 + Math.random() * 75, Math.sin(a) * r),
          this.palette[(Math.random() * this.palette.length) | 0]
        );
      }
    }
    let any = false;
    for (let i = 0; i < this.MAX; i++) {
      if (this.life[i] <= 0) continue;
      any = true;
      this.life[i] -= dt;
      this.vel[i*3+1] -= 9.8 * dt;                       // gravedad
      this.vel[i*3] *= 0.985; this.vel[i*3+1] *= 0.985; this.vel[i*3+2] *= 0.985;
      this.pos[i*3]   += this.vel[i*3] * dt;
      this.pos[i*3+1] += this.vel[i*3+1] * dt;
      this.pos[i*3+2] += this.vel[i*3+2] * dt;
      const f = Math.min(1, this.life[i]);
      this.col[i*3] *= (0.97 + f * 0.02);
      this.col[i*3+1] *= (0.96 + f * 0.02);
      this.col[i*3+2] *= (0.96 + f * 0.02);
      if (this.life[i] <= 0) { this.pos[i*3+1] = 99999; }
    }
    if (any || this.rate > 0) {
      this.points.geometry.attributes.position.needsUpdate = true;
      this.points.geometry.attributes.color.needsUpdate = true;
    }
  }
}

/* ────────────────────────────────────────────────────────────────
   HACES TRICOLORES — columnas de luz desde el anillo del techo
   ──────────────────────────────────────────────────────────────── */
export class TricolorBeams {
  constructor(scene) {
    this.group = new THREE.Group();
    const colors = [0x1f9d55, 0xf5f0e0, 0xd23c47];
    const N = 12;
    this.beams = [];
    const geo = new THREE.CylinderGeometry(1.6, 3.4, 240, 12, 1, true);
    geo.translate(0, 120, 0);
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const mat = new THREE.MeshBasicMaterial({
        color: colors[i % 3], transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        toneMapped: false,
      });
      const b = new THREE.Mesh(geo, mat);
      b.position.set(Math.cos(a) * 120 * SCALE_X, 50, Math.sin(a) * 120);
      b.rotation.z = Math.cos(a) * 0.16;
      b.rotation.x = -Math.sin(a) * 0.16;
      this.group.add(b);
      this.beams.push(b);
    }
    scene.add(this.group);
    this.on = false;
  }
  setVisible(v, dur = 2) {
    this.on = v;
    this.beams.forEach((b, i) => {
      gsap.to(b.material, { opacity: v ? 0.07 : 0, duration: dur, delay: v ? i * 0.12 : 0 });
    });
  }
  update(t) {
    if (!this.on) return;
    this.beams.forEach((b, i) => {
      b.rotation.z = Math.cos(t * 0.3 + i) * 0.22;
      b.rotation.x = Math.sin(t * 0.26 + i * 1.7) * 0.22;
    });
  }
}

/* ────────────────────────────────────────────────────────────────
   EL GOL DEL SIGLO — 22 de junio de 1986
   un cometa de luz repite la diagonal eterna; cinco sombras caen
   ──────────────────────────────────────────────────────────────── */
export class GolDelSiglo {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    // la diagonal: de su propia mitad hasta el área, dejando rivales atrás
    this.path = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-46, 0.8, 24),
      new THREE.Vector3(-30, 0.8, 12),
      new THREE.Vector3(-12, 0.8, 18),
      new THREE.Vector3(6, 0.8, 6),
      new THREE.Vector3(22, 0.8, 14),
      new THREE.Vector3(38, 0.8, 4),
      new THREE.Vector3(47, 0.8, 6),
      new THREE.Vector3(51.5, 0.8, 1.2),
    ], false, 'catmullrom', 0.35);

    // estela tubular que se va dibujando
    const tubeGeo = new THREE.TubeGeometry(this.path, 220, 0.42, 8, false);
    this.tube = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({
      color: 0x7fe8ff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    }));
    this.tube.geometry.setDrawRange(0, 0);
    this._tubeIndexCount = tubeGeo.index.count;
    this.group.add(this.tube);

    // el cometa
    this.ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.85, 20, 16),
      new THREE.MeshBasicMaterial({ color: 0xeafcff, toneMapped: false })
    );
    this.ball.visible = false;
    this.group.add(this.ball);
    this.light = new THREE.PointLight(0x9fe8ff, 0, 90, 1.8);
    this.group.add(this.light);

    // cinco sombras rivales que caen al ser superadas
    this.ghosts = [];
    const ghostPos = [[-31, 10], [-12, 16], [5, 8], [21, 12], [37, 6]];
    for (const [x, z] of ghostPos) {
      const g = new THREE.Mesh(
        new THREE.ConeGeometry(0.9, 2.6, 8),
        new THREE.MeshStandardMaterial({
          color: 0x2c4a8a, transparent: true, opacity: 0,
          emissive: 0x16306a, emissiveIntensity: 0.5,
        })
      );
      g.position.set(x, 1.3, z);
      this.group.add(g);
      this.ghosts.push({ mesh: g, x, fallen: false });
    }

    this.progress = { value: 0 };
    this.active = false;
  }

  /** reproduce la jugada; devuelve la duración total en segundos */
  play(onGoal) {
    this.active = true;
    this.progress.value = 0;
    this.ball.visible = true;
    this.ghosts.forEach(g => {
      g.fallen = false;
      g.mesh.rotation.set(0, 0, 0);
      g.mesh.position.y = 1.3;
      gsap.to(g.mesh.material, { opacity: 0.85, duration: 1.2 });
    });
    gsap.to(this.tube.material, { opacity: 0.85, duration: 0.8 });
    gsap.to(this.light, { intensity: 480, duration: 0.8 });

    const RUN = 10.5;   // los famosos ~10 segundos de carrera
    gsap.to(this.progress, {
      value: 1, duration: RUN, ease: 'power1.inOut',
      onUpdate: () => {
        const p = this.path.getPointAt(this.progress.value);
        this.ball.position.copy(p);
        this.ball.position.y = 0.8 + Math.abs(Math.sin(this.progress.value * 42)) * 0.5;
        this.light.position.copy(this.ball.position);
        this.tube.geometry.setDrawRange(0, Math.floor(this._tubeIndexCount * this.progress.value));
        // derriba sombras al pasar
        for (const g of this.ghosts) {
          if (!g.fallen && p.x > g.x - 1.5) {
            g.fallen = true;
            gsap.to(g.mesh.rotation, { z: (Math.random() > 0.5 ? 1 : -1) * 1.45, duration: 0.7, ease: 'bounce.out' });
            gsap.to(g.mesh.position, { y: 0.6, duration: 0.7, ease: 'bounce.out' });
          }
        }
      },
      onComplete: () => {
        if (onGoal) onGoal();
        gsap.to(this.ball.scale, { x: 4, y: 4, z: 4, duration: 0.5, ease: 'power2.out' });
        gsap.to(this.ball.material, { opacity: 0, duration: 0.9, onStart: () => { this.ball.material.transparent = true; } });
        gsap.to(this.light, { intensity: 2400, duration: 0.25, yoyo: true, repeat: 1 });
        gsap.delayedCall(1.0, () => this._reset());
      },
    });
    return RUN;
  }

  _reset() {
    this.active = false;
    this.ball.visible = false;
    this.ball.scale.setScalar(1);
    this.ball.material.opacity = 1;
    gsap.to(this.tube.material, { opacity: 0, duration: 2.5 });
    gsap.to(this.light, { intensity: 0, duration: 1.5 });
    this.ghosts.forEach(g => gsap.to(g.mesh.material, { opacity: 0, duration: 1.8 }));
  }
}
