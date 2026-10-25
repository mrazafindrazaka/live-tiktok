// Particules (feux d'artifice, explosion, poussière) : de simples listes mises à jour à la main,
// dessinées ensuite en instances (voir scene/Fx.jsx).
const MAX = 900;
const rand = (a, b) => a + Math.random() * (b - a);

const hex = (c) => [parseInt(c.slice(1, 3), 16) / 255, parseInt(c.slice(3, 5), 16) / 255, parseInt(c.slice(5, 7), 16) / 255];
const PALETTE = ['#ff4d6d', '#ffd23f', '#4dd2ff', '#7dff7d', '#c77dff', '#ffffff'].map(hex);

export class Fx {
  parts = []; // sphères et cubes
  waves = []; // anneaux de choc au sol
  #timers = [];

  #add(p) {
    if (this.parts.length >= MAX) this.parts.shift();
    this.parts.push({ shape: 'sphere', grav: 0, drag: 0, grow: 0, size: 0.1, life: 1, spin: 0, rot: 0, ...p, max: p.life });
  }

  later(delay, fn) {
    this.#timers.push({ t: delay, fn });
  }

  dust(x, z) {
    for (let i = 0; i < 7; i++) {
      this.#add({ x, y: 0.05, z, vx: rand(-0.6, 0.6), vy: rand(0.3, 0.9), vz: rand(-0.6, 0.6), life: rand(0.35, 0.6), size: rand(0.05, 0.09), col: [0.8, 0.7, 0.52], drag: 2, grow: 1.5 });
    }
  }

  burst(x, y, z, { n = 40, speed = 4, life = 1, size = 0.08, grav = -5, drag = 0.8, colors = PALETTE, shape = 'sphere' } = {}) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const e = Math.acos(rand(-1, 1));
      const s = speed * rand(0.5, 1);
      this.#add({
        x, y, z, vx: Math.sin(e) * Math.cos(a) * s, vy: Math.cos(e) * s, vz: Math.sin(e) * Math.sin(a) * s,
        life: life * rand(0.7, 1.2), size, grav, drag, col: colors[Math.floor(Math.random() * colors.length)], shape, spin: rand(-8, 8),
      });
    }
  }

  // Une fusée qui monte puis éclate.
  rocket(x, z, delay = 0) {
    this.later(delay, () => {
      const color = [PALETTE[Math.floor(Math.random() * 5)]];
      this.#add({ x, y: 0.2, z, vx: rand(-0.3, 0.3), vy: rand(11, 14), vz: rand(-0.3, 0.3), life: rand(0.85, 1.1), size: 0.09, col: [1, 0.9, 0.6], drag: 0.2, rocket: color });
    });
  }

  fireworks(count = 7) {
    for (let i = 0; i < count; i++) this.rocket(rand(-2.2, 2.2), rand(-7, -1), i * 0.22);
  }

  explosion(x, y, z, colors) {
    const fire = [hex('#ffb03a'), hex('#ff6a2a'), hex('#fff1a8')];
    this.burst(x, y, z, { n: 90, speed: 7, life: 0.9, size: 0.2, grav: -2, drag: 1.4, colors: fire });
    this.burst(x, y, z, { n: 26, speed: 6.5, life: 1.8, size: 0.14, grav: -14, drag: 0.1, colors: colors.map(hex), shape: 'box' });
    this.burst(x, y, z, { n: 24, speed: 2.5, life: 1.8, size: 0.3, grav: 0.6, drag: 1.2, colors: [hex('#4a4a4a'), hex('#6a6a6a')] });
    this.waves.push({ x, y: 0.03, z, t: 0, max: 0.9 });
  }

  // Petite explosion colorée (une boule qui saute).
  blast(x, y, z, color = '#ff8a3a') {
    this.burst(x, y, z, { n: 34, speed: 5.5, life: 0.8, size: 0.16, grav: -2, drag: 1.4, colors: [hex('#ffb03a'), hex('#ff6a2a'), hex('#fff1a8')] });
    this.burst(x, y, z, { n: 10, speed: 5, life: 1.4, size: 0.1, grav: -14, drag: 0.1, colors: [hex(color)], shape: 'box' });
    this.waves.push({ x, y: 0.03, z, t: 0, max: 0.6 });
  }

  update(dt) {
    for (const tm of this.#timers) tm.t -= dt;
    for (let i = this.#timers.length - 1; i >= 0; i--) {
      if (this.#timers[i].t <= 0) this.#timers.splice(i, 1)[0].fn();
    }
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) {
        if (p.rocket) this.burst(p.x, p.y, p.z, { n: 55, speed: 4.2, life: 1.3, size: 0.075, grav: -4, drag: 0.9, colors: [...p.rocket, hex('#ffffff')] });
        this.parts.splice(i, 1);
        continue;
      }
      p.vy += p.grav * dt;
      const d = Math.exp(-p.drag * dt);
      p.vx *= d;
      p.vy *= d;
      p.vz *= d;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      p.rot += p.spin * dt;
      if (p.y < 0.03 && p.shape === 'box') {
        p.y = 0.03;
        p.vy = Math.abs(p.vy) * 0.3;
      }
      if (p.rocket && Math.random() < 0.6) this.#add({ x: p.x, y: p.y, z: p.z, vx: 0, vy: -0.5, vz: 0, life: 0.35, size: 0.04, col: [1, 0.8, 0.4] });
    }
    for (let i = this.waves.length - 1; i >= 0; i--) {
      this.waves[i].t += dt;
      if (this.waves[i].t > this.waves[i].max) this.waves.splice(i, 1);
    }
  }
}
