// ════════════════════════════════════════════════════════════════
// ui.js — tarjetas de capítulo, línea de tiempo y controles
// ════════════════════════════════════════════════════════════════
import { CHAPTERS } from './chapters.js';

export class UI {
  constructor({ onSeek, onPlayToggle, onCamToggle, onAudioToggle }) {
    this.card = document.getElementById('title-card');
    this.cardNum = this.card.querySelector('.tc-num');
    this.cardTitle = this.card.querySelector('.tc-title');
    this.cardSub = this.card.querySelector('.tc-sub');
    this.progress = document.querySelector('.tl-progress');

    // puntos de la línea de tiempo
    const dotsWrap = document.querySelector('.tl-dots');
    this.dots = CHAPTERS.map((c, i) => {
      const b = document.createElement('button');
      b.className = 'tl-dot';
      b.innerHTML = `<i></i><span>${c.label}</span>`;
      b.title = c.title;
      b.addEventListener('click', () => onSeek(i));
      dotsWrap.appendChild(b);
      return b;
    });

    // controles
    this.btnPlay = document.getElementById('btn-play');
    this.btnCam = document.getElementById('btn-cam');
    this.btnAudio = document.getElementById('btn-audio');

    this.btnPlay.addEventListener('click', () => {
      const playing = onPlayToggle();
      this.btnPlay.textContent = playing ? '❚❚' : '▶';
    });
    this.btnCam.addEventListener('click', () => {
      const free = onCamToggle();
      this.btnCam.classList.toggle('on', free);
      document.body.classList.toggle('freecam', free);
      document.body.classList.toggle('cinema', !free);
    });
    this.btnAudio.addEventListener('click', () => {
      const on = onAudioToggle();
      this.btnAudio.classList.toggle('on', on);
    });

    // atajos
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') { e.preventDefault(); this.btnPlay.click(); }
      if (e.code === 'KeyC') this.btnCam.click();
      if (e.code === 'KeyM') this.btnAudio.click();
      if (e.code === 'ArrowRight') onSeek(null, +1);
      if (e.code === 'ArrowLeft') onSeek(null, -1);
    });
  }

  setChapter(i) {
    this.dots.forEach((d, k) => d.classList.toggle('active', k === i));
  }

  setProgress(f) {
    this.progress.style.width = `${(f * 100).toFixed(2)}%`;
  }

  showTitle(c) {
    this.cardNum.textContent = c.num;
    this.cardTitle.textContent = c.title;
    this.cardSub.textContent = c.sub;
    this.card.classList.add('show');
  }

  hideTitle() {
    this.card.classList.remove('show');
  }
}
