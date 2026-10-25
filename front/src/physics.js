// Mini-physique des boules : lancers en cloche calculés à la main, rebonds, frottement, collisions.
export const R = 0.13; // rayon d'une boule (grossi pour être lisible en vertical)
export const JACK_R = 0.065;
export const FIELD = { xMin: -2.1, xMax: 2.1, zMin: -6.7, zMax: 2.4 };
const G = -17;

const rand = (a, b) => a + Math.random() * (b - a);

export class World {
  bodies = new Map();
  version = 0;
  onLand = () => {};
  onCarreau = () => {};
  onFireHit = () => {};
  #id = 1;
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

  add(kind, owner, pos, style) {
    const jack = kind === 'jack';
    const b = {
      id: this.#id++, kind, owner, style, r: jack ? JACK_R : R, mass: jack ? 0.12 : 1,
      pos: [...pos], vel: [0, 0, 0], mode: 'roll', fric: jack ? 2.0 : 2.6,
      rotX: 0, rotZ: 0, fade: 0, out: false, ghost: false,
    };
    this.bodies.set(b.id, b);
    this.#emit();
    return b;
  }

  get jack() {
    for (const b of this.bodies.values()) if (b.kind === 'jack' && !b.out) return b;
    return null;
  }

  // Boules encore en jeu (ni éliminées, ni en train de disparaître).
  live(kind) {
    return [...this.bodies.values()].filter((b) => !b.out && (!kind || b.kind === kind));
  }

  allAtRest() {
    return this.live().every((b) => b.mode === 'rest');
  }

  clear() {
    for (const b of this.bodies.values()) Object.assign(b, { out: true, ghost: true, leave: 0 });
  }

  // plan : { landing:[x,z], T, H, roll:[vx,vz], fric, exact, targetId }
  launchThrow({ kind, owner, from, style, plan }) {
    const b = this.add(kind, owner, from, style);
    const r = b.r;
    Object.assign(b, {
      mode: 'throw', plan, p0: [...from], p1: [plan.landing[0], r, plan.landing[1]], s: 0, landed: false,
    });
    return b;
  }

  update(dt) {
    let removed = false;
    for (const b of this.bodies.values()) {
      this.#step(b, dt);
      if (b.out && b.leave !== undefined) {
        b.leave -= dt;
        if (b.leave < 0) {
          b.fade += dt / 0.5;
          if (b.fade >= 1) {
            this.bodies.delete(b.id);
            removed = true;
          }
        }
      }
    }
    this.#collide();
    for (const b of this.bodies.values()) {
      if (b.out || b.mode === 'throw') continue;
      const [x, , z] = b.pos;
      if (x < FIELD.xMin - 0.15 || x > FIELD.xMax + 0.15 || z < FIELD.zMin || z > FIELD.zMax + 0.3) {
        Object.assign(b, { out: true, ghost: true, leave: 1.2 }); // boule morte : sortie du terrain
      }
    }
    if (removed) this.#emit();
  }

  #step(b, dt) {
    if (b.mode === 'rest') return;
    if (b.mode === 'throw') {
      b.s = Math.min(1, b.s + dt / b.plan.T);
      const s = b.s;
      for (let i = 0; i < 3; i++) b.pos[i] = b.p0[i] + (b.p1[i] - b.p0[i]) * s;
      b.pos[1] += b.plan.H * 4 * s * (1 - s);
      if (b.plan.curve) {
        // tir "à effet" : la trajectoire se courbe puis revient exactement sur le point d'atterrissage
        const dx = b.p1[0] - b.p0[0];
        const dz = b.p1[2] - b.p0[2];
        const l = Math.hypot(dx, dz) || 1;
        const c = b.plan.curve * Math.sin(Math.PI * s);
        b.pos[0] += (-dz / l) * c;
        b.pos[2] += (dx / l) * c;
      }
      b.rotX -= dt * (b.plan.curve ? 22 : 9);
      if (s >= 1) this.#land(b);
      return;
    }
    b.vel[1] += G * dt;
    for (let i = 0; i < 3; i++) b.pos[i] += b.vel[i] * dt;
    let ground = false;
    if (b.pos[1] <= b.r) {
      b.pos[1] = b.r;
      b.vel[1] = b.vel[1] < -0.6 ? -b.vel[1] * 0.3 : 0;
      const f = Math.exp(-b.fric * dt);
      b.vel[0] *= f;
      b.vel[2] *= f;
      ground = true;
    }
    b.rotZ -= (b.vel[0] / b.r) * dt;
    b.rotX += (b.vel[2] / b.r) * dt;
    if (ground && b.vel[1] === 0 && Math.hypot(b.vel[0], b.vel[2]) < 0.05) {
      b.vel = [0, 0, 0];
      b.mode = 'rest';
      b.fiery = false;
    }
  }

  // Détruit une boule sur place (elle disparaît en fondu, l'effet visuel est géré par l'appelant).
  destroy(b) {
    Object.assign(b, { out: true, ghost: true, leave: 0, vel: [0, 0, 0], mode: 'rest', fiery: false });
  }

  #land(b) {
    const plan = b.plan;
    const target = plan.exact ? this.bodies.get(plan.targetId) : null;
    b.landed = true;
    if (target && !target.out) {
      // Carreau : la boule tombe pile sur la cible, qui est éjectée ; la nôtre reste sur place.
      b.pos = [target.pos[0], b.r, target.pos[2]];
      let dx = b.pos[0] - b.p0[0];
      let dz = b.pos[2] - b.p0[2];
      const len = Math.hypot(dx, dz) || 1;
      dx /= len;
      dz /= len;
      Object.assign(target, {
        mode: 'roll', ghost: true, out: true, leave: 1.6, fric: 1.4,
        vel: [dx * rand(5.5, 7.5) + rand(-1.8, 1.8), rand(3.2, 4.4), dz * rand(5.5, 7.5) + rand(-1, 1)],
      });
      Object.assign(b, { mode: 'roll', vel: [0, 1.1, 0], fric: 14, carreau: true });
      this.onCarreau(b, target);
      return;
    }
    b.pos = [...b.p1];
    Object.assign(b, { mode: 'roll', vel: [plan.roll[0], 1.0, plan.roll[1]], fric: plan.fric ?? b.fric });
    this.onLand(b);
  }

  #fireHit(att, vic, nx, nz) {
    att.fiery = false;
    att.vel = [att.vel[0] * 0.1, 0, att.vel[2] * 0.1];
    Object.assign(vic, {
      mode: 'roll', ghost: true, out: true, leave: 1.4, fric: 1.2,
      vel: [nx * 7 + rand(-1, 1), rand(3.5, 4.5), nz * 7 + rand(-1, 1)],
    });
    for (const o of this.bodies.values()) {
      if (o === att || o === vic || o.ghost || o.mode === 'throw') continue;
      const dx = o.pos[0] - vic.pos[0];
      const dz = o.pos[2] - vic.pos[2];
      const d = Math.hypot(dx, dz);
      if (d > 0 && d < 0.8) {
        o.vel[0] += (dx / d) * 2.2;
        o.vel[2] += (dz / d) * 2.2;
        if (o.mode === 'rest') o.mode = 'roll';
      }
    }
    this.onFireHit(att, vic);
  }

  #collide() {
    const list = [...this.bodies.values()].filter((b) => !b.ghost && b.mode !== 'throw');
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const c = list[j];
        if (a.ghost || c.ghost) continue;
        const dx = c.pos[0] - a.pos[0];
        const dz = c.pos[2] - a.pos[2];
        const d = Math.hypot(dx, dz);
        const min = a.r + c.r;
        if (d >= min || d === 0 || Math.abs(a.pos[1] - c.pos[1]) > min) continue;
        const nx = dx / d;
        const nz = dz / d;
        // Boule enflammée (tir à effet) qui touche une boule adverse : elle l'éjecte et bouscule les voisines.
        const att = a.fiery && c.kind === 'boule' && c.owner !== a.owner ? a : c.fiery && a.kind === 'boule' && a.owner !== c.owner ? c : null;
        if (att) {
          const vic = att === a ? c : a;
          this.#fireHit(att, vic, att === a ? nx : -nx, att === a ? nz : -nz);
          continue;
        }
        const ia = 1 / a.mass;
        const ic = 1 / c.mass;
        const sum = ia + ic;
        const overlap = min - d;
        a.pos[0] -= nx * overlap * (ia / sum);
        a.pos[2] -= nz * overlap * (ia / sum);
        c.pos[0] += nx * overlap * (ic / sum);
        c.pos[2] += nz * overlap * (ic / sum);
        const vn = (a.vel[0] - c.vel[0]) * nx + (a.vel[2] - c.vel[2]) * nz;
        if (vn > 0) {
          const j2 = (1.5 * vn) / sum; // restitution 0.5
          a.vel[0] -= j2 * ia * nx;
          a.vel[2] -= j2 * ia * nz;
          c.vel[0] += j2 * ic * nx;
          c.vel[2] += j2 * ic * nz;
        }
        for (const b of [a, c]) if (b.mode === 'rest' && Math.hypot(b.vel[0], b.vel[2]) > 0.02) b.mode = 'roll';
      }
    }
  }
}
