// Musique de fond en boucle, sans interruption.
// - Si vous déposez un fichier `front/public/music.mp3` (par exemple un titre dont vous avez les droits), c'est lui qui tourne en boucle.
// - Sinon, une boucle de jazz « félin » 100 % originale est jouée par le navigateur (WebAudio) : basse qui marche, balais, accords étouffés, saxo discret.
// Les navigateurs bloquent le son tant qu'on n'a pas touché la page : un bouton apparaît alors. Dans OBS, cochez « Contrôler l'audio via OBS ».
const BPM = 104;
const BEAT = 60 / BPM;
const SWING = 0.64; // le second demi-temps arrive un peu en retard : le swing
const VOLUME = 0.3;

const BASS = [38, 41, 45, 44, 43, 47, 50, 49, 48, 52, 55, 51, 45, 49, 52, 46]; // 4 mesures, une note par temps
const CHORDS = [[62, 65, 69, 72], [59, 62, 65, 67], [60, 64, 67, 71], [61, 64, 67, 69]]; // Dm7, G7, Cmaj7, A7
const LEAD = [ // [temps, note, durée en temps]
  [2.5, 69, 0.4], [3, 67, 0.4], [3.5, 65, 0.8],
  [4.5, 67, 0.4], [5, 65, 0.4], [5.5, 62, 0.9],
  [8, 71, 0.9], [9.5, 69, 0.4], [10, 67, 0.4], [10.5, 64, 1.2],
  [12.5, 61, 0.4], [13, 62, 0.4], [13.5, 64, 0.4], [14, 65, 0.4], [14.5, 69, 1.4],
];
const LOOP_BEATS = 16;

const hz = (m) => 440 * 2 ** ((m - 69) / 12);

class AudioPlayer {
  status = 'idle'; // idle | blocked | playing
  muted = false;
  version = 0;
  #ctx = null;
  #master = null;
  #next = 0;
  #timer = null;
  #el = null;
  #noise = null;
  #listeners = new Set();

  subscribe = (fn) => {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  };
  getVersion = () => this.version;
  #emit() {
    this.version++;
    this.#listeners.forEach((fn) => fn());
  }

  async start() {
    if (this.#ctx) return;
    const ctx = new AudioContext();
    this.#ctx = ctx;
    this.#master = ctx.createGain();
    this.#master.gain.value = this.muted ? 0 : VOLUME;
    this.#master.connect(ctx.destination);

    let file = false;
    try {
      const res = await fetch('/music.mp3');
      file = res.ok && (res.headers.get('content-type') ?? '').startsWith('audio');
    } catch { /* pas de fichier : on joue la boucle intégrée */ }

    if (file) {
      const el = new Audio('/music.mp3');
      el.loop = true;
      this.#el = el;
      ctx.createMediaElementSource(el).connect(this.#master);
      el.play().catch(() => {});
    } else {
      this.#noise = this.#makeNoise();
      this.#next = ctx.currentTime + 0.1;
      this.#timer = setInterval(() => this.#schedule(), 250);
      this.#schedule();
    }

    this.#sync();
    // Autoplay bloqué : on réessaie au premier geste de l'utilisateur.
    const unlock = () => ctx.resume().then(() => { this.#el?.play().catch(() => {}); this.#sync(); });
    ['pointerdown', 'keydown'].forEach((e) => window.addEventListener(e, unlock, { once: true }));
    ctx.addEventListener('statechange', () => this.#sync());
  }

  #sync() {
    const next = this.#ctx?.state === 'running' ? 'playing' : 'blocked';
    if (next !== this.status) {
      this.status = next;
      this.#emit();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.#master) this.#master.gain.value = this.muted ? 0 : VOLUME;
    this.#emit();
  }

  // ---------- boucle synthétisée ----------
  #makeNoise() {
    const ctx = this.#ctx;
    const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  #schedule() {
    const ctx = this.#ctx;
    while (this.#next < ctx.currentTime + 2.5) {
      this.#loop(this.#next);
      this.#next += LOOP_BEATS * BEAT;
    }
  }

  #tone(freq, t, dur, { type = 'triangle', gain = 0.3, lp = 2000, attack = 0.01, vibrato = 0 } = {}) {
    const ctx = this.#ctx;
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    f.type = 'lowpass';
    f.frequency.value = lp;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (vibrato) {
      const l = ctx.createOscillator();
      const lg = ctx.createGain();
      l.frequency.value = 5.2;
      lg.gain.value = vibrato;
      l.connect(lg).connect(o.frequency);
      l.start(t);
      l.stop(t + dur + 0.05);
    }
    o.connect(f).connect(g).connect(this.#master);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  #hit(t, { gain = 0.1, hp = 5000, dur = 0.06 } = {}) {
    const ctx = this.#ctx;
    const s = ctx.createBufferSource();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    s.buffer = this.#noise;
    f.type = 'highpass';
    f.frequency.value = hp;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f).connect(g).connect(this.#master);
    s.start(t);
    s.stop(t + dur + 0.02);
  }

  #loop(t0) {
    for (let i = 0; i < LOOP_BEATS; i++) {
      const t = t0 + i * BEAT;
      this.#tone(hz(BASS[i]), t, BEAT * 0.9, { type: 'triangle', gain: 0.55, lp: 700, attack: 0.012 }); // basse qui marche
      this.#hit(t, { gain: 0.05, hp: 7000, dur: 0.05 });                                                  // cymbale sur le temps
      this.#hit(t + SWING * BEAT, { gain: 0.035, hp: 7500, dur: 0.04 });                                  // et sur le contretemps swingué
      if (i % 2 === 1) this.#hit(t, { gain: 0.1, hp: 2200, dur: 0.14 });                                  // balai sur 2 et 4
    }
    for (let bar = 0; bar < 4; bar++) {
      for (const off of [0.5, 2.5]) { // accords étouffés, en syncope
        const t = t0 + (bar * 4 + off) * BEAT + (off % 1 ? (SWING - 0.5) * BEAT : 0);
        for (const n of CHORDS[bar]) this.#tone(hz(n), t, BEAT * 0.35, { type: 'triangle', gain: 0.09, lp: 1800, attack: 0.005 });
      }
    }
    for (const [beat, note, dur] of LEAD) { // petit saxo, discret et un peu mystérieux
      const t = t0 + beat * BEAT + (beat % 1 ? (SWING - 0.5) * BEAT : 0);
      this.#tone(hz(note), t, dur * BEAT, { type: 'sawtooth', gain: 0.1, lp: 1500, attack: 0.04, vibrato: 4 });
    }
  }
}

export const audio = new AudioPlayer();
