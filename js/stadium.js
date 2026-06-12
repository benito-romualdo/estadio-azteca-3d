// ════════════════════════════════════════════════════════════════
// stadium.js — El Coloso de Santa Úrsula, generado por procedimientos
//   bowl elíptico · techumbre voladiza · celosía de la fachada
//   cancha pintada a mano (canvas) · Piedra del Sol · El Sol Rojo
// ════════════════════════════════════════════════════════════════
import * as THREE from 'three';

export const SCALE_X = 1.28;            // elipse: estiramiento sobre el eje largo
export const TIERS = [
  // r0/r1 radio (espacio circular), y0/y1 altura, filas
  { r0: 64,  y0: 3.0,  r1: 96,  y1: 15.5, rows: 22 },
  { r0: 101, y0: 17.5, r1: 124, y1: 29.5, rows: 18 },
  { r0: 129, y0: 32.5, r1: 152, y1: 46.0, rows: 18 },
];

export class Stadium {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);

    this._bowl();
    this._roof();
    this._facade();
    this._pitch();
    this._goals();
    this._screens();
    this._floodlights(scene);
    this._sunStone();
    this._solRojo();
    this._pyramid();
  }

  // ── gradas: lathe del perfil, escalado a elipse ──
  _bowl() {
    const pts = [];
    pts.push(new THREE.Vector2(60, 0));
    pts.push(new THREE.Vector2(62, 2.6));        // muro interior
    for (const t of TIERS) {
      pts.push(new THREE.Vector2(t.r0 - 1.5, t.y0 - 0.6));
      // escalones del graderío
      for (let i = 0; i <= t.rows; i++) {
        const f = i / t.rows;
        const r = THREE.MathUtils.lerp(t.r0, t.r1, f);
        const y = THREE.MathUtils.lerp(t.y0, t.y1, f);
        pts.push(new THREE.Vector2(r, y));
      }
      pts.push(new THREE.Vector2(t.r1 + 3.5, t.y1 + 0.4)); // pasillo
    }
    pts.push(new THREE.Vector2(156, 47.5));      // pretil superior
    pts.push(new THREE.Vector2(157, 30));
    pts.push(new THREE.Vector2(157, 0));         // muro exterior

    const geo = new THREE.LatheGeometry(pts, 96);
    geo.scale(SCALE_X, 1, 1);
    geo.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ color: 0x4e4a52, roughness: 0.92, metalness: 0.04 });
    const bowl = new THREE.Mesh(geo, mat);
    this.group.add(bowl);

    // anillos de circulación (líneas de sombra entre tribunas)
    for (const t of TIERS) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(t.r1 + 1.8, 0.7, 6, 80),
        new THREE.MeshStandardMaterial({ color: 0x2c2930, roughness: 1 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = t.y1 + 0.2;
      ring.scale.x = SCALE_X;
      this.group.add(ring);
    }
  }

  // ── techumbre voladiza, el gesto del Azteca ──
  _roof() {
    const profile = [
      new THREE.Vector2(74, 47.0),
      new THREE.Vector2(158, 53.5),
      new THREE.Vector2(158, 55.6),
      new THREE.Vector2(74, 49.4),
      new THREE.Vector2(74, 47.0),
    ];
    const geo = new THREE.LatheGeometry(profile, 96);
    geo.scale(SCALE_X, 1, 1);
    geo.computeVertexNormals();
    this.roof = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
      color: 0x3a3640, roughness: 0.75, metalness: 0.25, side: THREE.DoubleSide,
    }));
    this.group.add(this.roof);

    // labio luminoso interior (se enciende de noche)
    this.roofLipMat = new THREE.MeshStandardMaterial({
      color: 0x16141a, emissive: 0xfff3d0, emissiveIntensity: 0.0, roughness: 0.6,
    });
    const lip = new THREE.Mesh(new THREE.TorusGeometry(75.5, 0.9, 8, 96), this.roofLipMat);
    lip.rotation.x = Math.PI / 2;
    lip.position.y = 47.6;
    lip.scale.x = SCALE_X;
    this.group.add(lip);
  }

  // ── celosía diagonal de concreto (fachada) ──
  _facade() {
    const N = 64;
    const beam = new THREE.BoxGeometry(1.6, 52, 2.6);
    beam.translate(0, 26, 0);
    const mat = new THREE.MeshStandardMaterial({ color: 0x6e6876, roughness: 0.85 });
    const inst = new THREE.InstancedMesh(beam, mat, N * 2);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    let k = 0;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2;
      const x = Math.cos(a) * 158 * SCALE_X;
      const z = Math.sin(a) * 158;
      const yaw = Math.atan2(x, z);
      for (const tilt of [0.22, -0.22]) {           // par cruzado → patrón en X
        e.set(0, yaw, tilt, 'YXZ');
        q.setFromEuler(e);
        m.compose(new THREE.Vector3(x, 0, z), q, new THREE.Vector3(1, 1, 1));
        inst.setMatrixAt(k++, m);
      }
    }
    this.group.add(inst);

    // muro cortina oscuro tras la celosía
    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(156.2, 156.2, 44, 96, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x2a2734, roughness: 0.45, metalness: 0.45, side: THREE.DoubleSide })
    );
    wall.position.y = 24;
    wall.scale.x = SCALE_X;
    this.group.add(wall);
  }

  // ── cancha pintada en canvas ──
  _pitch() {
    const c = document.createElement('canvas');
    c.width = 2100; c.height = 1360;
    const g = c.getContext('2d');
    const W = c.width, H = c.height, M = 70;     // margen
    // pasto a franjas
    const stripes = 14;
    for (let i = 0; i < stripes; i++) {
      g.fillStyle = i % 2 ? '#1f7a33' : '#27923f';
      g.fillRect((W / stripes) * i, 0, W / stripes + 1, H);
    }
    // moteado orgánico
    for (let i = 0; i < 9000; i++) {
      g.fillStyle = `rgba(${10+Math.random()*30|0},${70+Math.random()*60|0},${20+Math.random()*30|0},0.15)`;
      g.fillRect(Math.random() * W, Math.random() * H, 3, 3);
    }
    // marcaje
    g.strokeStyle = 'rgba(255,255,255,0.92)';
    g.lineWidth = 5;
    const px = (mx) => M + (mx / 105) * (W - 2 * M);
    const pz = (mz) => M + (mz / 68) * (H - 2 * M);
    g.strokeRect(px(0), pz(0), px(105) - px(0), pz(68) - pz(0));
    g.beginPath(); g.moveTo(px(52.5), pz(0)); g.lineTo(px(52.5), pz(68)); g.stroke();
    g.beginPath(); g.arc(px(52.5), pz(34), (9.15 / 105) * (W - 2*M), 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(px(52.5), pz(34), 7, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
    for (const side of [0, 1]) {
      const x0 = side ? px(105) : px(0);
      const dir = side ? -1 : 1;
      const bx = (m) => x0 + dir * (m / 105) * (W - 2 * M);
      g.strokeRect(Math.min(x0, bx(16.5)), pz(34 - 20.16), Math.abs(bx(16.5) - x0), pz(34 + 20.16) - pz(34 - 20.16));
      g.strokeRect(Math.min(x0, bx(5.5)), pz(34 - 9.16), Math.abs(bx(5.5) - x0), pz(34 + 9.16) - pz(34 - 9.16));
      g.beginPath(); g.arc(bx(11), pz(34), 6, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
      g.beginPath();
      g.arc(bx(11), pz(34), (9.15 / 105) * (W - 2*M), side ? Math.PI * 0.7 : -Math.PI * 0.3, side ? Math.PI * 1.3 : Math.PI * 0.3);
      g.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;

    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(121, 80),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })
    );
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0.05;
    this.group.add(pitch);

    // foso perimetral
    const moat = new THREE.Mesh(
      new THREE.RingGeometry(58, 64, 80),
      new THREE.MeshStandardMaterial({ color: 0x1c1a20, roughness: 1 })
    );
    moat.rotation.x = -Math.PI / 2;
    moat.position.y = 0.02;
    moat.scale.x = SCALE_X;
    this.group.add(moat);
  }

  _goals() {
    const mat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });
    for (const side of [-1, 1]) {
      const goal = new THREE.Group();
      const x = side * 52.5;
      const post = new THREE.CylinderGeometry(0.14, 0.14, 2.44, 8);
      for (const z of [-3.66, 3.66]) {
        const p = new THREE.Mesh(post, mat);
        p.position.set(x, 1.22, z);
        goal.add(p);
      }
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 7.32, 8), mat);
      bar.rotation.x = Math.PI / 2;
      bar.position.set(x, 2.44, 0);
      goal.add(bar);
      const net = new THREE.Mesh(
        new THREE.PlaneGeometry(7.32, 2.44, 10, 5),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.18 })
      );
      net.position.set(x + side * 1.4, 1.22, 0);
      net.rotation.y = Math.PI / 2;
      goal.add(net);
      this.group.add(goal);
    }
  }

  // ── pantallas gigantes en las cabeceras ──
  _screens() {
    this.screenCanvas = document.createElement('canvas');
    this.screenCanvas.width = 1024; this.screenCanvas.height = 448;
    this.screenTex = new THREE.CanvasTexture(this.screenCanvas);
    this.screenTex.colorSpace = THREE.SRGBColorSpace;
    this.screenMat = new THREE.MeshBasicMaterial({ map: this.screenTex, toneMapped: false });

    for (const side of [-1, 1]) {
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(30, 13), this.screenMat);
      scr.position.set(side * 122, 40, 0);
      scr.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(31.6, 14.6, 1.2),
        new THREE.MeshStandardMaterial({ color: 0x0d0c11, roughness: 0.5 })
      );
      frame.position.set(side * 122.7, 40, 0);
      frame.rotation.y = Math.PI / 2;
      this.group.add(frame, scr);
    }
    this.setScreen(['ESTADIO', 'AZTECA'], '#e8b33b');
  }

  setScreen(lines, accent = '#e8b33b', kicker = '') {
    const g = this.screenCanvas.getContext('2d');
    const W = 1024, H = 448;
    g.fillStyle = '#06060a'; g.fillRect(0, 0, W, H);
    const grd = g.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, 'rgba(255,255,255,0.06)'); grd.addColorStop(1, 'rgba(0,0,0,0.25)');
    g.fillStyle = grd; g.fillRect(0, 0, W, H);
    g.strokeStyle = accent; g.lineWidth = 7; g.strokeRect(14, 14, W - 28, H - 28);
    g.textAlign = 'center'; g.textBaseline = 'middle';
    if (kicker) {
      g.fillStyle = 'rgba(239,230,212,0.85)';
      g.font = '600 34px Archivo, sans-serif';
      g.fillText(kicker.toUpperCase(), W / 2, 78);
    }
    g.fillStyle = accent;
    const fs = lines.length > 1 ? 124 : 150;
    g.font = `900 ${fs}px Archivo, sans-serif`;
    const y0 = kicker ? 130 : 90;
    lines.forEach((l, i) => g.fillText(l.toUpperCase(), W / 2, y0 + 70 + i * (fs + 6)));
    this.screenTex.needsUpdate = true;
  }

  // ── iluminación nocturna ──
  _floodlights(scene) {
    this.spots = [];
    const positions = [
      [90 * SCALE_X, 49, 52], [-90 * SCALE_X, 49, 52],
      [90 * SCALE_X, 49, -52], [-90 * SCALE_X, 49, -52],
    ];
    const target = new THREE.Object3D();
    target.position.set(0, 0, 0);
    scene.add(target);
    for (const [x, y, z] of positions) {
      const s = new THREE.SpotLight(0xeaf2ff, 0, 0, 0.66, 0.5, 2);
      s.position.set(x, y, z);
      s.target = target;
      scene.add(s);
      this.spots.push(s);
    }
    // racimos de luminarias emisivas bajo el labio del techo
    this.lampMat = new THREE.MeshBasicMaterial({ color: 0xfff6dd, transparent: true, opacity: 0, toneMapped: false });
    const lampGeo = new THREE.BoxGeometry(3.2, 0.6, 1.0);
    const lamps = new THREE.InstancedMesh(lampGeo, this.lampMat, 60);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const x = Math.cos(a) * 77 * SCALE_X, z = Math.sin(a) * 77;
      e.set(0, -a, 0); q.setFromEuler(e);
      m.compose(new THREE.Vector3(x, 46.6, z), q, new THREE.Vector3(1, 1, 1));
      lamps.setMatrixAt(i, m);
    }
    this.lamps = lamps;
    this.group.add(lamps);
  }

  setFloodlights(v, gsapLib, dur = 1.6) {
    for (const s of this.spots) gsapLib.to(s, { intensity: v * 30000, duration: dur, ease: 'power2.out' });
    gsapLib.to(this.lampMat, { opacity: v * 0.8, duration: dur });
    gsapLib.to(this.roofLipMat, { emissiveIntensity: v * 0.5, duration: dur });
  }

  // ── Piedra del Sol sobre el césped (capítulos I y VI) ──
  _sunStone() {
    const c = document.createElement('canvas');
    c.width = c.height = 1024;
    const g = c.getContext('2d');
    const cx = 512, cy = 512;
    g.translate(cx, cy);
    g.strokeStyle = '#ffd97a'; g.fillStyle = '#ffd97a';
    // anillos
    for (const [r, w] of [[470, 9], [430, 3], [330, 7], [210, 4], [120, 6]]) {
      g.lineWidth = w; g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2); g.stroke();
    }
    // rayos del sol (los 8 puntales de Tonatiuh)
    for (let i = 0; i < 8; i++) {
      g.save(); g.rotate((i / 8) * Math.PI * 2 + Math.PI / 8);
      g.beginPath(); g.moveTo(-42, -330); g.lineTo(0, -452); g.lineTo(42, -330); g.closePath();
      g.globalAlpha = 0.9; g.fill(); g.restore();
    }
    // glifos del anillo (marcas abstractas de los 20 días)
    for (let i = 0; i < 20; i++) {
      g.save(); g.rotate((i / 20) * Math.PI * 2);
      g.globalAlpha = 0.8;
      g.fillRect(-16, -300, 32, 52);
      g.globalAlpha = 1;
      g.strokeStyle = '#07060a'; g.lineWidth = 5;
      g.strokeRect(-16, -300, 32, 52);
      g.restore();
    }
    // rostro central abstracto
    g.strokeStyle = '#ffd97a'; g.lineWidth = 8; g.globalAlpha = 1;
    g.beginPath(); g.arc(0, 0, 80, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.arc(-30, -18, 13, 0, Math.PI * 2); g.arc(30, -18, 13, 0, Math.PI * 2); g.fill();
    g.fillRect(-26, 30, 52, 14);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.sunStoneMat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
      depthWrite: false, toneMapped: false,
    });
    this.sunStone = new THREE.Mesh(new THREE.CircleGeometry(22, 64), this.sunStoneMat);
    this.sunStone.rotation.x = -Math.PI / 2;
    this.sunStone.position.y = 0.18;
    this.group.add(this.sunStone);
  }

  // ── "El Sol Rojo" de Calder, guardián de la explanada ──
  _solRojo() {
    const grp = new THREE.Group();
    const black = new THREE.MeshStandardMaterial({ color: 0x121013, roughness: 0.55, metalness: 0.3 });
    // patas arqueadas (estilizadas)
    for (const [a, len] of [[-0.5, 30], [0.5, 30], [Math.PI - 0.5, 26], [Math.PI + 0.5, 26]]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.6, len, 8), black);
      leg.position.set(Math.cos(a) * 9, len / 2, Math.sin(a) * 9);
      leg.rotation.z = Math.cos(a) * 0.32;
      leg.rotation.x = -Math.sin(a) * 0.32;
      grp.add(leg);
    }
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 16, 8), black);
    spine.position.y = 36;
    grp.add(spine);
    const disc = new THREE.Mesh(
      new THREE.CylinderGeometry(9, 9, 0.9, 48),
      new THREE.MeshStandardMaterial({ color: 0xc41f24, roughness: 0.45, emissive: 0x3a0608, emissiveIntensity: 0.6 })
    );
    disc.rotation.x = Math.PI / 2;
    disc.position.y = 46;
    grp.add(disc);
    grp.position.set(208 * SCALE_X * 0.82, 0, 95);
    this.group.add(grp);
    this.solRojo = grp;
  }

  // ── pirámide ancestral en el horizonte ──
  _pyramid() {
    const grp = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({ color: 0x35291f, roughness: 1, flatShading: true });
    const levels = 5;
    let w = 240, h = 26;
    for (let i = 0; i < levels; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), mat);
      b.position.y = i * h + h / 2;
      grp.add(b);
      w *= 0.74;
    }
    // escalinata
    const stairs = new THREE.Mesh(
      new THREE.BoxGeometry(46, levels * h, 130),
      new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 1 })
    );
    stairs.position.set(0, (levels * h) / 2, 0);
    stairs.rotation.x = 0.42;
    stairs.position.z = 105;
    stairs.position.y = 48;
    grp.add(stairs);
    // templo en la cima
    const temple = new THREE.Mesh(new THREE.BoxGeometry(52, 30, 44), mat);
    temple.position.y = levels * h + 15;
    grp.add(temple);
    // brasero encendido
    this.pyreMat = new THREE.MeshBasicMaterial({ color: 0xff8c2a, transparent: true, opacity: 0, toneMapped: false });
    const pyre = new THREE.Mesh(new THREE.SphereGeometry(7, 12, 10), this.pyreMat);
    pyre.position.y = levels * h + 36;
    grp.add(pyre);

    grp.position.set(950, 0, -1350);
    grp.rotation.y = 0.7;
    this.group.add(grp);
    this.pyramid = grp;
  }
}
