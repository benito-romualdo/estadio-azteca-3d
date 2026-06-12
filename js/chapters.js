// ════════════════════════════════════════════════════════════════
// chapters.js — el director de cine
//   seis capítulos · coreografía de cámara · luz · efectos · sonido
// ════════════════════════════════════════════════════════════════
import * as THREE from 'three';
import { gsap } from 'gsap';
import { MOODS } from './world.js';
import { PATTERNS } from './crowd.js';
import { SCALE_X } from './stadium.js';

export const CHAPTERS = [
  {
    id: 'raices', label: 'Raíces', num: 'Capítulo I · antes del tiempo',
    title: 'RAÍCES',
    sub: 'Antes del estadio hubo piedra, fuego y serpientes de luz. Esta tierra ya sabía rugir.',
    dur: 24,
  },
  {
    id: 'coloso', label: '1966', num: 'Capítulo II · 29 de mayo de 1966',
    title: 'EL COLOSO DE SANTA ÚRSULA',
    sub: 'Sobre lava del Xitle se levantó un templo moderno. Cien mil voces aprendieron a caber en él.',
    dur: 21,
  },
  {
    id: 'mexico70', label: '1970', num: 'Capítulo III · México 70',
    title: 'EL PRIMER SOL',
    sub: 'Pelé y el Brasil dorado. El Partido del Siglo. Aquí el fútbol descubrió su catedral.',
    dur: 20,
  },
  {
    id: 'noche86', label: '1986', num: 'Capítulo IV · 22 de junio de 1986',
    title: 'LA NOCHE DEL 86',
    sub: 'Diez segundos, cincuenta y dos metros, cinco sombras vencidas. El Gol del Siglo vive aquí.',
    dur: 27,
  },
  {
    id: 'alma', label: 'Alma', num: 'Capítulo V · siempre',
    title: 'ALMA DE MÉXICO',
    sub: 'Papel picado, cempasúchil y velas: los que ya no están también tienen su asiento.',
    dur: 23,
  },
  {
    id: 'amanecer', label: '2026', num: 'Capítulo VI · 11 de junio de 2026 — hoy',
    title: 'EL TERCER SOL',
    sub: 'Ningún estadio había abierto tres Mundiales. Hoy, el Coloso vuelve a encender al mundo.',
    dur: 28,
  },
];

export class Director {
  /**
   * ctx: { world, stadium, crowd, fx, audio, ui, cam, bloom }
   * fx:  { quetzal, petals, confetti, rainTricolor, papel, fireworks, beams, gol }
   */
  constructor(ctx) {
    this.ctx = ctx;
    this.current = -1;
    this.tl = null;
    this.playing = true;
  }

  start() { this.goTo(0); }

  next() { this.goTo((this.current + 1) % CHAPTERS.length); }

  goTo(i) {
    const c = this.ctx;
    if (this.tl) this.tl.kill();
    this._resetTransient();
    this.current = i;
    c.ui.setChapter(i);

    const chapter = CHAPTERS[i];
    const tl = gsap.timeline({
      onComplete: () => this.next(),
      onUpdate: () => c.ui.setProgress((i + tl.progress()) / CHAPTERS.length),
    });
    this.tl = tl;
    if (!this.playing) tl.pause();

    this['_' + chapter.id](tl);

    // tarjeta de título
    tl.call(() => c.ui.showTitle(chapter), [], 1.2);
    tl.call(() => c.ui.hideTitle(), [], Math.min(chapter.dur - 3, 10.5));
    // relleno hasta la duración total
    tl.to({}, { duration: chapter.dur }, 0);
  }

  _mood(name, dur = 4) {
    this.ctx.world.setMood(MOODS[name], dur);
    gsap.to(this.ctx.bloom, { strength: MOODS[name].bloom, duration: dur });
  }

  _resetTransient() {
    const { fx, crowd, audio, stadium } = this.ctx;
    crowd.stopWave();
    crowd.setFlash(0, 1);
    fx.quetzal.setVisible(false, 2);
    fx.petals.setVisible(false, 2);
    fx.confetti.setVisible(false, 2);
    fx.rainTricolor.setVisible(false, 2);
    fx.papel.setVisible(false, 2);
    fx.beams.setVisible(false, 1.5);
    fx.fireworks.setRate(0);
    stadium.setFloodlights(0, gsap, 2.5);
    audio.stopDrums();
    gsap.to(stadium.sunStoneMat, { opacity: 0, duration: 2 });
    gsap.to(stadium.pyreMat, { opacity: 0, duration: 2 });
  }

  // ════ I · RAÍCES — amanecer prehispánico ════
  _raices(tl) {
    const { cam, fx, crowd, audio, stadium } = this.ctx;
    this._mood('dawn', 3);
    crowd.setPattern(PATTERNS.CROWD, 1);
    crowd.setDim(0.45, 2);
    fx.quetzal.setVisible(true, 4);
    gsap.to(stadium.pyreMat, { opacity: 1, duration: 3, delay: 1 });
    gsap.to(stadium.sunStoneMat, { opacity: 0.9, duration: 5, delay: 8 });
    audio.setScene({ crowd: 0.04, pad: 0.05, wind: 0.1 });
    audio.startDrums();

    // de la pirámide al coloso
    cam.pos.set(820, 38, -1080);
    cam.target.set(950, 90, -1350);
    tl.to(cam.pos, { x: 560, y: 95, z: -640, duration: 9, ease: 'power1.inOut' }, 0);
    tl.to(cam.target, { x: 0, y: 40, z: 0, duration: 9, ease: 'power1.inOut' }, 1.5);
    tl.to(cam.pos, { x: 150, y: 130, z: -220, duration: 8, ease: 'power1.inOut' }, 9);
    tl.to(cam.pos, { x: 0, y: 165, z: -16, duration: 7, ease: 'power2.inOut' }, 17);
    tl.to(cam.target, { x: 0, y: 0, z: 0, duration: 7, ease: 'power2.inOut' }, 17);
    this.ctx.stadium.setScreen(['IN', 'TLILLI IN TLAPALLI'], '#37e0a0', 'la tinta negra y roja · sabiduría');
  }

  // ════ II · EL COLOSO — día de inauguración ════
  _coloso(tl) {
    const { cam, crowd, audio, stadium } = this.ctx;
    this._mood('day', 4.5);
    crowd.setPattern(PATTERNS.CROWD, 3);
    crowd.setDim(1, 3);
    audio.setScene({ crowd: 0.35, pad: 0.015, wind: 0.05 });
    stadium.setScreen(['29 · V · 1966'], '#e8b33b', 'nace el coloso de santa úrsula');

    // paseo exterior: El Sol Rojo → celosía → ascenso al anillo
    cam.pos.set(255 * SCALE_X, 6, 150);
    cam.target.set(208 * SCALE_X * 0.82, 40, 95);
    tl.to(cam.pos, { x: 235 * SCALE_X, y: 14, z: -40, duration: 7, ease: 'power1.inOut' }, 0);
    tl.to(cam.target, { x: 0, y: 30, z: 0, duration: 7, ease: 'power1.inOut' }, 2);
    tl.to(cam.pos, { x: 150 * SCALE_X, y: 30, z: -150, duration: 7, ease: 'power1.inOut' }, 7);
    tl.to(cam.pos, { x: 30, y: 120, z: -190, duration: 6.5, ease: 'power2.inOut' }, 14);
    tl.to(cam.target, { x: 0, y: 10, z: 0, duration: 6.5, ease: 'power2.inOut' }, 14);
  }

  // ════ III · MÉXICO 70 — la hora dorada ════
  _mexico70(tl) {
    const { cam, crowd, fx, audio, stadium } = this.ctx;
    this._mood('golden', 4.5);
    crowd.setPattern(PATTERNS.GOLD, 4);
    crowd.setDim(1, 3);
    fx.confetti.setVisible(true, 3);
    audio.setScene({ crowd: 0.55, pad: 0.02, wind: 0.04 });
    stadium.setScreen(['MÉXICO 70'], '#ffd34d', 'pelé · el partido del siglo');

    // órbita lenta y elevada, el vaso bañado en oro
    cam.pos.set(-130, 70, 95);
    cam.target.set(0, 8, 0);
    tl.to(cam.pos, { x: -40, y: 55, z: 135, duration: 10, ease: 'none' }, 0);
    tl.to(cam.pos, { x: 70, y: 48, z: 105, duration: 10, ease: 'none' }, 10);
    tl.to(cam.target, { x: 0, y: 16, z: 0, duration: 20, ease: 'none' }, 0);
  }

  // ════ IV · LA NOCHE DEL 86 — el Gol del Siglo ════
  _noche86(tl) {
    const { cam, crowd, fx, audio, stadium } = this.ctx;
    this._mood('night', 3.5);
    crowd.setPattern(PATTERNS.VERDE, 3);
    crowd.setDim(0.85, 2);
    audio.setScene({ crowd: 0.5, pad: 0.03, wind: 0.03 });
    stadium.setScreen(['22 · VI · 1986'], '#2fbf8f', 'cuartos de final · 114.580 almas');

    // las torres se encienden con parpadeo
    tl.call(() => {
      stadium.setFloodlights(0.4, gsap, 0.15);
      gsap.delayedCall(0.3, () => stadium.setFloodlights(0.1, gsap, 0.1));
      gsap.delayedCall(0.6, () => stadium.setFloodlights(1, gsap, 0.9));
    }, [], 0.8);

    // picado nocturno hacia el césped
    cam.pos.set(0, 150, -170);
    cam.target.set(0, 0, 0);
    tl.to(cam.pos, { x: -70, y: 26, z: 60, duration: 6.5, ease: 'power2.inOut' }, 0);
    tl.to(cam.target, { x: -40, y: 1, z: 22, duration: 6.5, ease: 'power2.inOut' }, 0);

    // la jugada: cámara que persigue al cometa a ras de pasto
    tl.call(() => {
      const run = fx.gol.play(() => {
        audio.roar();
        crowd.setFlash(1, 0.6);
        crowd.startWave(2, 6.5);
        stadium.setScreen(['GOOOOL'], '#ffd34d', 'el gol del siglo');
        fx.fireworks.burst(new THREE.Vector3(60, 90, 40), 0x2fbf8f, 160, 30);
        fx.fireworks.burst(new THREE.Vector3(-50, 100, -30), 0xffd34d, 160, 30);
        gsap.delayedCall(5, () => crowd.setFlash(0.35, 2));
      });
      // travelling paralelo a la diagonal
      gsap.to(cam.pos, { x: 55, y: 9, z: 38, duration: run, ease: 'power1.inOut' });
      gsap.to(cam.target, { x: 51, y: 1, z: 1, duration: run, ease: 'power1.inOut' });
    }, [], 7);

    // grúa final: el estadio rugiendo
    tl.to(cam.pos, { x: 40, y: 95, z: 150, duration: 7, ease: 'power2.inOut' }, 19.5);
    tl.to(cam.target, { x: 0, y: 12, z: 0, duration: 7, ease: 'power2.inOut' }, 19.5);
  }

  // ════ V · ALMA DE MÉXICO — ofrenda en el coloso ════
  _alma(tl) {
    const { cam, crowd, fx, audio, stadium } = this.ctx;
    this._mood('rosa', 4.5);
    crowd.setPattern(PATTERNS.CANDLES, 4);
    crowd.setDim(0.8, 3);
    stadium.setFloodlights(0.12, gsap, 4);
    fx.papel.setVisible(true, 3.5);
    fx.petals.setVisible(true, 4);
    audio.setScene({ crowd: 0.07, pad: 0.06, wind: 0.08 });
    audio.startDrums();
    stadium.setScreen(['XOCHITL IN CUICATL'], '#e4007c', 'flor y canto · los que volvieron');
    gsap.to(stadium.sunStoneMat, { opacity: 0.5, duration: 6, delay: 4 });

    // deriva lenta entre pétalos, por debajo del papel picado
    cam.pos.set(-95, 34, -60);
    cam.target.set(0, 20, 10);
    tl.to(cam.pos, { x: -30, y: 28, z: 75, duration: 11, ease: 'sine.inOut' }, 0);
    tl.to(cam.pos, { x: 55, y: 40, z: 40, duration: 11, ease: 'sine.inOut' }, 11);
    tl.to(cam.target, { x: 0, y: 14, z: -10, duration: 22, ease: 'sine.inOut' }, 0);
  }

  // ════ VI · EL TERCER SOL — 11.06.2026, hoy ════
  _amanecer(tl) {
    const { cam, crowd, fx, audio, stadium } = this.ctx;
    this._mood('fiesta', 4);
    crowd.setPattern(PATTERNS.FLAG, 4);
    crowd.setDim(1, 2);
    stadium.setFloodlights(1, gsap, 3);
    fx.beams.setVisible(true, 3);
    fx.rainTricolor.setVisible(true, 4);
    fx.fireworks.setRate(1.4);
    crowd.setFlash(0.5, 3);
    audio.setScene({ crowd: 0.75, pad: 0.04, wind: 0.03 });
    stadium.setScreen(['11 · 06 · 2026'], '#ffd34d', 'bienvenido, mundo · tercera inauguración');
    gsap.to(stadium.sunStoneMat, { opacity: 0.85, duration: 5, delay: 2 });

    tl.call(() => crowd.startWave(3, 6), [], 6);
    tl.call(() => crowd.setPattern(PATTERNS.FIESTA, 3), [], 14);
    tl.call(() => stadium.setScreen(['EL TERCER', 'SOL'], '#ffd34d', 'méxico · estados unidos · canadá'), [], 14);

    // ascenso triunfal: del césped al cielo del valle
    cam.pos.set(0, 7, 95);
    cam.target.set(0, 25, 0);
    tl.to(cam.pos, { x: -90, y: 48, z: 130, duration: 8, ease: 'power1.inOut' }, 0);
    tl.to(cam.pos, { x: -210, y: 130, z: 240, duration: 9, ease: 'power1.inOut' }, 8);
    tl.to(cam.target, { x: 0, y: 30, z: 0, duration: 9, ease: 'power1.inOut' }, 8);
    tl.to(cam.pos, { x: -340, y: 230, z: 430, duration: 10, ease: 'power1.inOut' }, 17);
    tl.to(cam.target, { x: 0, y: 45, z: 0, duration: 10, ease: 'power1.inOut' }, 17);
  }

  setPlaying(v) {
    this.playing = v;
    if (!this.tl) return;
    v ? this.tl.resume() : this.tl.pause();
  }
}
