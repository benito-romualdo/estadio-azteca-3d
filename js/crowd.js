// ════════════════════════════════════════════════════════════════
// crowd.js — 45.000 almas en las gradas
//   InstancedMesh + shader propio: mosaicos (bandera, oro, velas),
//   La Ola (nacida aquí en el 86) y flashes de cámaras — todo en GPU
// ════════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { gsap } from 'gsap';
import { SCALE_X, TIERS } from './stadium.js';

// patrones: 0 multitud · 1 bandera MX · 2 oro 70 · 3 velas · 4 verde 86 · 5 fiesta tricolor
export const PATTERNS = { CROWD: 0, FLAG: 1, GOLD: 2, CANDLES: 3, VERDE: 4, FIESTA: 5 };

export class Crowd {
  constructor(scene) {
    const seatGap = 1.05;            // separación angular media (m de arco)
    const items = [];                // {x,y,z,yaw,angle,tier,rand}

    for (let ti = 0; ti < TIERS.length; ti++) {
      const t = TIERS[ti];
      for (let row = 0; row < t.rows; row += 1) {
        const f = (row + 0.5) / t.rows;
        const r = THREE.MathUtils.lerp(t.r0, t.r1, f);
        const y = THREE.MathUtils.lerp(t.y0, t.y1, f) + 0.55;
        const a = r * SCALE_X, b = r;
        // recorrido por longitud de arco para asientos uniformes
        const steps = 1024;
        let prev = new THREE.Vector2(a, 0), acc = 0;
        const target = seatGap * (0.92 + Math.random() * 0.16);
        for (let s = 1; s <= steps; s++) {
          const th = (s / steps) * Math.PI * 2;
          const p = new THREE.Vector2(Math.cos(th) * a, Math.sin(th) * b);
          acc += p.distanceTo(prev);
          prev = p;
          if (acc >= target) {
            acc = 0;
            if (Math.random() < 0.94) {   // huecos naturales
              items.push({
                x: p.x, y, z: p.y,
                yaw: Math.atan2(p.x, p.y) + Math.PI,
                angle: th, tier: ti, rand: Math.random(),
              });
            }
          }
        }
      }
    }

    const count = items.length;
    this.count = count;

    // cuerpo: caja con cabeza achatada (low-poly, lee como persona a distancia)
    const geo = new THREE.BoxGeometry(0.55, 1.0, 0.45);
    geo.translate(0, 0.5, 0);

    const aAngle = new Float32Array(count);
    const aRand  = new Float32Array(count);
    const aTier  = new Float32Array(count);

    this.uniforms = {
      uTime:      { value: 0 },
      uPatternA:  { value: 0 },
      uPatternB:  { value: 0 },
      uMix:       { value: 0 },
      uWaveHead:  { value: 0 },
      uWaveAmp:   { value: 0 },
      uFlash:     { value: 0 },
      uDim:       { value: 1 },     // atenuación global (noche)
      uSunDir:    { value: new THREE.Vector3(0.5, 0.8, 0.3) },
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    };

    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      fog: true,
      vertexShader: /* glsl */`
        attribute float aAngle;
        attribute float aRand;
        attribute float aTier;
        uniform float uTime, uWaveHead, uWaveAmp, uFlash, uMix, uDim;
        uniform float uPatternA, uPatternB;
        uniform vec3 uSunDir;
        varying vec3 vColor;
        varying float vLight;
        #include <common>
        #include <fog_pars_vertex>

        float hash(float n) { return fract(sin(n) * 43758.5453123); }

        // paleta por patrón --------------------------------------------------
        vec3 patternColor(float p, float ang, float tier, float rnd) {
          int id = int(p + 0.5);
          if (id == 1) {                       // bandera mexicana en 6 gajos
            float seg = mod(floor(ang / (3.14159265 / 3.0)), 3.0);
            if (seg < 0.5) return vec3(0.0, 0.42, 0.18);
            if (seg < 1.5) return vec3(0.93, 0.91, 0.85);
            return vec3(0.78, 0.05, 0.10);
          }
          if (id == 2) {                       // oro de México 70
            float v = 0.75 + 0.25 * hash(rnd * 91.7);
            return mix(vec3(0.95, 0.72, 0.18), vec3(1.0, 0.86, 0.42), hash(rnd * 17.3)) * v;
          }
          if (id == 3) {                       // velas: oscuridad + llamas dispersas
            if (rnd > 0.93) {
              float flick = 0.75 + 0.25 * sin(uTime * (6.0 + rnd * 7.0) + rnd * 80.0);
              return vec3(1.0, 0.62, 0.18) * (2.6 * flick);
            }
            return vec3(0.05, 0.035, 0.07);
          }
          if (id == 4) {                       // el verde del 86
            float v = 0.6 + 0.4 * hash(rnd * 53.1);
            return mix(vec3(0.0, 0.45, 0.22), vec3(0.93, 0.9, 0.84), step(0.86, hash(rnd * 7.7))) * v;
          }
          if (id == 5) {                       // fiesta tricolor por franjas de tribuna
            float band = mod(tier + floor(ang * 2.86), 3.0);
            vec3 c = band < 0.5 ? vec3(0.0, 0.55, 0.25) : (band < 1.5 ? vec3(0.95, 0.93, 0.88) : vec3(0.85, 0.08, 0.14));
            return c * (0.7 + 0.3 * hash(rnd * 31.7));
          }
          // multitud real: ropa variada con chispazos de color
          float h = hash(rnd * 23.7);
          vec3 c = vec3(0.16, 0.15, 0.18);
          if (h > 0.86) c = vec3(0.55, 0.1, 0.12);
          else if (h > 0.74) c = vec3(0.1, 0.2, 0.42);
          else if (h > 0.64) c = vec3(0.7, 0.65, 0.55);
          else if (h > 0.58) c = vec3(0.1, 0.35, 0.2);
          return c * (0.7 + 0.5 * hash(rnd * 5.3));
        }

        void main() {
          vec3 cA = patternColor(uPatternA, aAngle, aTier, aRand);
          vec3 cB = patternColor(uPatternB, aAngle, aTier, aRand);
          vec3 col = mix(cA, cB, uMix);

          // LA OLA: ventana angular que recorre el estadio
          float d = abs(mod(aAngle - uWaveHead + 3.14159265, 6.2831853) - 3.14159265);
          float lift = smoothstep(0.5, 0.0, d) * uWaveAmp;

          // flashes de cámaras
          float fl = step(0.997, hash(aRand * 311.7 + floor(uTime * 7.0))) * uFlash;
          col = mix(col, vec3(3.2), fl);
          col += vec3(0.9, 0.85, 0.7) * lift * 0.55;

          vec4 mPos = instanceMatrix * vec4(position * (1.0 + lift * 0.12), 1.0);
          mPos.y += lift * 1.1;

          // luz direccional falsa + oclusión por fila
          vec3 n = normalize(mat3(instanceMatrix) * normal);
          float l = 0.55 + 0.45 * max(dot(n, normalize(uSunDir)), 0.0);
          vLight = l * uDim + lift * 0.4 + fl;
          vColor = col;

          vec4 mvPosition = modelViewMatrix * mPos;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vColor;
        varying float vLight;
        #include <common>
        #include <fog_pars_fragment>
        void main() {
          gl_FragColor = vec4(vColor * vLight, 1.0);
          #include <fog_fragment>
        }`,
    });

    const mesh = new THREE.InstancedMesh(geo, mat, count);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const it = items[i];
      e.set(0, it.yaw, 0);
      q.setFromEuler(e);
      const s = 0.9 + it.rand * 0.25;
      m.compose(v.set(it.x, it.y, it.z), q, new THREE.Vector3(s, s * (0.92 + it.rand * 0.2), s));
      mesh.setMatrixAt(i, m);
      aAngle[i] = it.angle;
      aRand[i] = it.rand;
      aTier[i] = it.tier;
    }
    geo.setAttribute('aAngle', new THREE.InstancedBufferAttribute(aAngle, 1));
    geo.setAttribute('aRand',  new THREE.InstancedBufferAttribute(aRand, 1));
    geo.setAttribute('aTier',  new THREE.InstancedBufferAttribute(aTier, 1));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;

    this.mesh = mesh;
    scene.add(mesh);

    this._waveTween = null;
  }

  /** funde hacia un nuevo patrón de mosaico */
  setPattern(p, dur = 2.5) {
    const u = this.uniforms;
    u.uPatternA.value = u.uMix.value >= 0.5 ? u.uPatternB.value : u.uPatternA.value;
    u.uPatternB.value = p;
    u.uMix.value = 0;
    gsap.to(u.uMix, { value: 1, duration: dur, ease: 'power2.inOut' });
  }

  /** lanza La Ola: n vueltas completas */
  startWave(turns = 2, secsPerTurn = 7) {
    this.stopWave();
    const u = this.uniforms;
    u.uWaveHead.value = 0;
    gsap.to(u.uWaveAmp, { value: 1, duration: 0.8, ease: 'power2.out' });
    this._waveTween = gsap.to(u.uWaveHead, {
      value: Math.PI * 2 * turns,
      duration: secsPerTurn * turns,
      ease: 'none',
      onComplete: () => gsap.to(u.uWaveAmp, { value: 0, duration: 1.2 }),
    });
  }

  stopWave() {
    if (this._waveTween) this._waveTween.kill();
    gsap.to(this.uniforms.uWaveAmp, { value: 0, duration: 0.8 });
  }

  setFlash(v, dur = 1.5) { gsap.to(this.uniforms.uFlash, { value: v, duration: dur }); }
  setDim(v, dur = 3)     { gsap.to(this.uniforms.uDim,   { value: v, duration: dur }); }

  update(t, sunDir) {
    this.uniforms.uTime.value = t;
    if (sunDir) this.uniforms.uSunDir.value.copy(sunDir);
  }
}
