// Le match : règles de la pétanque (1 contre 1, 3 boules, 13 points), déroulement des mènes,
// danse du vainqueur, K.O. final et arrivée du challenger. Les composants 3D lisent cet état à chaque image.
import { World, FIELD, JACK_R, R } from './physics.js';
import { Fx } from './effects.js';
import { FEMALES, HEROES, MALES } from './heroes.js';
import { TIER_INFO } from './gifts.js';
import { envOf } from './stages.js';
import { DANCE_TIME } from './dances.js';

export const CIRCLE = { x: 0, z: 0.6 }; // cercle de lancer
export const SLOT_X = { A: -1.45, B: 1.45 };
const SLOT_Z = 0.95;
export const TARGET = 13;
const BOULES = 3;
const TAU = Math.PI * 2;

const rand = (a, b) => a + Math.random() * (b - a);
const gauss = () => (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 1.2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (k) => k * k * (3 - 2 * k);
const ap = (o, key, to, rate, dt) => { o[key] += (to - o[key]) * (1 - Math.exp(-rate * dt)); };
const other = (s) => (s === 'A' ? 'B' : 'A');

const NEUTRAL = { crouch: 0, arm: 0.05, elbow: 0.1, lean: 0, twist: 0 };
const AIM = { crouch: 0.35, arm: 0.5, elbow: 0.6, lean: 0.18, twist: 0 };
const WIND = { crouch: 0.6, arm: -1.15, elbow: 0.15, lean: -0.05, twist: -0.25 };
const SWING = { crouch: 0.15, arm: 1.3, elbow: 0.05, lean: 0.55, twist: 0.25 };
const FOLLOW = { crouch: 0.1, arm: 1.1, elbow: 0.1, lean: 0.45, twist: 0.2 };
const POSE_KEYS = Object.keys(NEUTRAL);

const newRig = (slot) => ({
  x: SLOT_X[slot], z: SLOT_Z, tx: SLOT_X[slot], speed: 0, walkPhase: 0,
  ...NEUTRAL, poseTarget: { ...NEUTRAL },
  face: 0, faceTarget: 0, dance: null, spinning: false, spinSpeed: 0, hop: 0,
  armsUp: 0, armsTarget: 0, slump: 0, slumpTarget: 0, glow: 0, glowTarget: 0,
  flyY: 0, scale: 1, visible: true, holding: false, hand: [SLOT_X[slot], 1.2, SLOT_Z],
});

class Game {
  world = new World();
  fx = new Fx();
  players = {
    A: { heroId: MALES[0], score: 0, left: BOULES }, // tirés au hasard dans le constructeur
    B: { heroId: FEMALES[0], score: 0, left: BOULES },
  };
  rig = { A: newRig('A'), B: newRig('B') };
  queues = { A: [], B: [] }; // prochains challengers : à gauche un homme, à droite une femme ; le perdant repart au bout de sa file
  gifts = []; // dons en attente d'être joués : { id, side, tier, name, state: 'queued' | 'playing' | 'done', batch }
  giftNow = null; // don en train d'être joué
  lastGift = null; // dernier don reçu (pour l'affichage)
  state = 'intro';
  t = 0;
  mene = 1;
  streak = 0;
  starter = Math.random() < 0.5 ? 'A' : 'B';
  thrower = null;
  throwKind = 'jack';
  cur = null; // lancer en cours : { plan, body }
  from = { ...NEUTRAL };
  banner = null; // { key, text, sub, kind }
  feed = []; // notifications affichées en bas : dons et bienvenues, { key, kind, name, avatar, side, tier, until }
  #feedCheck = 0;
  #giftSeq = 1;
  #welcomed = new Map();
  #arrivals = []; // arrivées récentes, regroupées avant d'être affichées
  #arrivalsAt = 0;
  carreaux = 0;
  status = 'offline';
  flash = 0; // 0..1, flash blanc plein écran
  shake = 0;
  space = 0; // 0..1, ciel -> espace
  koInfo = null;
  stageId = 'gotham'; // choisi au hasard dans le constructeur
  env = envOf(this.stageId); // ciel / sol / lumière actuels (ils fondent vers le monde visé)
  envTarget = envOf('gotham');
  likers = new Map(); // pseudo -> { name, count } ; l'ordre d'insertion = du plus ancien au plus récent
  likeVersion = 0;
  vs = null; // écran « VS » de début de partie
  introDance = true;
  introTurned = false;
  champion = null; // slot du vainqueur qui reste sur le terrain
  lastMene = null;
  fast = false; // vrai quand le jeu accélère pour rattraper des dons
  timeScale = 1; // vitesse du jeu : il accélère tout seul quand des dons attendent d'être joués
  version = 0;
  camLook = [0, 0.3, -3];
  camPos = [0, 4.6, 8.9];
  #listeners = new Set();
  #key = 1;

  constructor() {
    this.world.onLand = (b) => this.fx.dust(b.pos[0], b.pos[2]);
    this.world.onCarreau = (b) => this.#onCarreau(b);
    this.world.onFireHit = (att, vic) => this.#onFireHit(att, vic);
    // Chaque lancement : un homme au hasard à gauche, une femme au hasard à droite, et un décor au hasard parmi leurs deux mondes.
    const shuffled = (list) => { // mélange de Fisher-Yates (un simple tri au hasard favorise le premier de la liste)
      const a = [...list];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const males = shuffled(MALES);
    const females = shuffled(FEMALES);
    this.players.A.heroId = males[0];
    this.players.B.heroId = females[0];
    this.queues = { A: males.slice(1), B: females.slice(1) };
    this.stageId = HEROES[Math.random() < 0.5 ? males[0] : females[0]].stage;
    this.env = envOf(this.stageId);
    this.envTarget = envOf(this.stageId);
    this.#startIntro(true);
  }

  subscribe = (fn) => {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  };
  getVersion = () => this.version;
  emit() {
    this.version++;
    this.#listeners.forEach((fn) => fn());
  }
  setStatus(s) {
    this.status = s;
    this.emit();
  }

  #announce(text, sub = '', kind = 'info') {
    this.banner = { key: this.#key++, text, sub, kind };
    this.emit();
  }

  name = (slot) => HEROES[this.players[slot].heroId].name;

  // ---------- cadeaux ----------
  // Un don d'un palier (1, 10, 100, 1000) pour le personnage de gauche (A) ou de droite (B).
  addGift(side, tier, name, avatar = null, count = 1) {
    const batch = { key: this.#key++, kind: 'gift', name, avatar, side, tier, entries: [], until: Infinity };
    for (let i = 0; i < count; i++) {
      const e = { id: this.#giftSeq++, side, tier, name, avatar, state: 'queued', batch };
      batch.entries.push(e);
      this.gifts.push(e); // aucun plafond : un don reçu n'est jamais ignoré
    }
    this.feed.push(batch); // la notification apparaît tout de suite : « reçu »
    this.lastGift = { key: this.#key++, side, tier, name };
    this.emit();
  }

  // Un don passe à « en cours » puis « fait » ; sa notification reste affichée un instant après.
  #giftState(e, state) {
    e.state = state;
    const b = e.batch;
    if (state === 'done' && b.entries.every((x) => x.state === 'done')) b.until = Date.now() + 2200;
    this.emit();
  }

  // Un don est remis en tête de file s'il n'a pas pu être joué.
  #requeue(e) {
    e.state = 'queued';
    this.gifts.unshift(e);
  }

  // Position d'un don dans la file (0 = le prochain).
  queuePosition(batch) {
    const e = batch.entries.find((x) => x.state === 'queued');
    return e ? this.gifts.indexOf(e) : -1;
  }

  // Un nouveau spectateur. Les arrivées sont regroupées pendant ~1 s : 1 ou 2 personnes = un message par personne,
  // plus de 2 d'un coup = un seul « Bienvenue à tous ! » (et jamais deux fois la même personne en 2 minutes).
  addWelcome(name, avatar = null) {
    const now = Date.now();
    if (now - (this.#welcomed.get(name) ?? 0) < 120000) return;
    this.#welcomed.set(name, now);
    if (!this.#arrivals.length) this.#arrivalsAt = now + 900;
    this.#arrivals.push({ name, avatar });
  }

  #flushArrivals() {
    const list = this.#arrivals;
    this.#arrivals = [];
    if (list.length > 2) {
      const old = this.feed.find((n) => n.kind === 'welcome' && n.all && n.until > Date.now());
      if (old) old.until = Date.now() + 2600; // déjà affiché : on le prolonge au lieu d'en empiler un autre
      else this.#notify({ kind: 'welcome', all: true, faces: list.slice(0, 3), name: 'tous' });
    } else for (const p of list) this.#notify({ kind: 'welcome', name: p.name, avatar: p.avatar });
    this.emit();
  }

  // Les notifications s'empilent en bas de l'écran : les plus récentes en dernier, les plus anciennes remontent puis disparaissent.
  #notify(n) {
    this.feed.push({ ...n, key: this.#key++, until: Date.now() + 2600 });
    const welcomes = this.feed.filter((x) => x.kind === 'welcome');
    if (welcomes.length > 3) this.feed.splice(this.feed.indexOf(welcomes[0]), 1); // seules les bienvenues sont limitées
  }

  // Change de monde (le décor 3D est remplacé, le ciel et la lumière fondent doucement).
  setStage(id) {
    if (id === this.stageId) return;
    this.stageId = id;
    this.envTarget = envOf(id);
    this.emit();
  }

  #envStep(dt) {
    const k = 1 - Math.exp(-3 * dt);
    for (const key in this.env) for (let i = 0; i < this.env[key].length; i++) this.env[key][i] += (this.envTarget[key][i] - this.env[key][i]) * k;
  }

  // Écran « VS » ; les deux personnages se tournent vers la caméra et font leur danse d'entrée (au début d'une partie).
  #startIntro(dance) {
    this.introDance = dance;
    this.introTurned = false;
    this.vs = { key: this.#key++, a: this.players.A.heroId, b: this.players.B.heroId };
    for (const slot of ['A', 'B']) {
      const r = this.rig[slot];
      r.faceTarget = Math.PI;
      if (dance) r.dance = { id: this.players[slot].heroId, t: 0 };
    }
    this.#go('intro');
    this.emit();
  }

  // Raccourci de test : lance directement la séquence finale.
  debugKO() {
    if (this.state === 'ko') return;
    const winner = this.players.A.score >= this.players.B.score ? 'A' : 'B';
    this.players[winner].score = TARGET;
    this.#startKO(winner);
  }

  // ---------- boucle ----------
  // La simulation avance en sous-pas : si l'affichage ralentit (PC sans carte graphique), le rythme du jeu reste normal.
  update(dt) {
    dt = Math.min(dt, 0.25);
    // Rattrapage : plus il y a de dons en attente, plus le jeu accélère (jusqu'à x3), sauf pendant les scènes spectaculaires.
    const cinematic = this.state === 'ko' || this.state === 'intro';
    const backlog = this.gifts.length + (this.giftNow ? 1 : 0);
    const target = cinematic ? 1 : Math.min(3, 1 + Math.max(0, backlog - 1) * 0.3);
    this.timeScale += (target - this.timeScale) * Math.min(1, dt * 2);
    const fast = this.timeScale > 1.3;
    if (fast !== this.fast) {
      this.fast = fast;
      this.emit();
    }
    dt *= this.timeScale;
    const steps = Math.max(1, Math.ceil(dt / 0.033));
    for (let i = 0; i < steps; i++) this.#advance(dt / steps);
  }

  #advance(dt) {
    this.t += dt;
    this.world.update(dt);
    this.fx.update(dt);
    for (const b of this.world.bodies.values()) {
      if (b.fiery) this.fx.burst(b.pos[0], b.pos[1], b.pos[2], { n: 2, speed: 0.8, life: 0.4, size: 0.1, grav: 0, drag: 2, colors: [[1, 0.55, 0.1], [1, 0.85, 0.3]] });
    }
    this.flash = Math.max(0, this.flash - dt * 1.6);
    this.shake *= Math.exp(-5 * dt);
    this.#envStep(dt);
    this.#feedCheck += dt;
    if (this.#feedCheck > 0.25) {
      this.#feedCheck = 0;
      if (this.#arrivals.length && Date.now() >= this.#arrivalsAt) this.#flushArrivals();
      const keep = this.feed.filter((n) => n.until > Date.now());
      if (keep.length !== this.feed.length) {
        this.feed = keep;
        this.emit();
      }
    }
    this.#tick(dt);
    this.#rigs(dt);
  }

  // Quand des dons attendent, on raccourcit les temps morts (visée, pauses, danse de fin de mène).
  #k() {
    return this.gifts.length ? 0.6 : 1;
  }

  #go(state) {
    this.state = state;
    this.t = 0;
    const r = this.thrower && this.rig[this.thrower];
    if (r) this.from = Object.fromEntries(POSE_KEYS.map((k) => [k, r[k]]));
  }

  #blend(to, k) {
    const r = this.rig[this.thrower];
    for (const key of POSE_KEYS) r[key] = this.from[key] + (to[key] - this.from[key]) * k;
  }

  #tick(dt) {
    const t = this.t;
    switch (this.state) {
      case 'intro':
        if (t > (this.introDance ? 3.1 : 1.9) && !this.introTurned) {
          this.introTurned = true;
          for (const r of Object.values(this.rig)) r.faceTarget = 0;
          this.#announce('À VOS BOULES !', '', 'intro');
        }
        if (t > (this.introDance ? 4.0 : 2.7)) this.#beginMene();
        break;
      case 'mene-start':
        if (t > 0.8 * this.#k()) {
          if (this.#bombStep()) break;
          this.throwKind = 'jack';
          this.thrower = this.starter;
          this.emit();
          this.#go('turn');
        }
        break;
      case 'mene-void':
        if (t > 1.8) this.#beginMene();
        break;
      case 'turn': {
        const r = this.rig[this.thrower];
        if (Math.abs(r.x - r.tx) < 0.05 && t > 0.35) {
          this.cur = { plan: this.#plan(), body: null };
          r.holding = true;
          this.#go('prep');
        }
        break;
      }
      case 'prep':
        this.#blend(AIM, smooth(clamp(t / 0.45, 0, 1)));
        if (t >= 0.7 * this.#k()) this.#go('windup');
        break;
      case 'windup':
        this.#blend(WIND, smooth(clamp(t / 0.4, 0, 1)));
        if (t >= 0.4) this.#go('swing');
        break;
      case 'swing':
        this.#blend(SWING, smooth(clamp(t / 0.22, 0, 1)));
        if (t >= 0.15 && !this.cur.body) this.#release();
        if (t >= 0.22) this.#go('flight');
        break;
      case 'flight':
        this.#blend(FOLLOW, smooth(clamp(t / 0.6, 0, 1)));
        if (this.cur.body?.landed || t > 5) this.#go('settle');
        break;
      case 'settle':
        if ((this.world.allAtRest() && t > 0.8 * this.#k()) || t > 5) this.#afterThrow();
        break;
      case 'mene-end':
        this.#dance();
        if (t > 3.4 * this.#k()) this.#afterMene();
        break;
      case 'ko':
        this.#koStep(dt);
        break;
    }
  }

  #beginMene() {
    for (const p of Object.values(this.players)) p.left = BOULES;
    if (this.giftNow) {
      this.#requeue(this.giftNow);
      this.giftNow = null;
    }
    this.world.clear();
    for (const r of Object.values(this.rig)) Object.assign(r, { armsTarget: 0, slumpTarget: 0, faceTarget: 0, spinning: false, hop: 0 });
    this.#announce(`MÈNE ${this.mene}`, `${this.name(this.starter)} lance le cochonnet`, 'info');
    this.#go('mene-start');
  }

  // ---------- lancers ----------
  #best(slot) {
    const jack = this.world.jack;
    let best = { d: Infinity, body: null };
    if (!jack) return best;
    for (const b of this.world.live('boule')) {
      if (b.owner !== slot) continue;
      const d = Math.hypot(b.pos[0] - jack.pos[0], b.pos[2] - jack.pos[2]);
      if (d < best.d) best = { d, body: b };
    }
    return best;
  }

  #plan() {
    if (this.giftNow) {
      const g = this.giftNow;
      this.giftNow = null;
      const plan = this.#giftPlan(g);
      if (plan) return { ...plan, entry: g };
      this.#requeue(g); // plus de cible : le don n'est pas perdu, il repasse en tête de file
    }
    return this.#pointPlan();
  }

  // Lancer normal : on pointe vers le cochonnet, avec un peu d'aléatoire.
  #pointPlan() {
    const slot = this.thrower;
    const hero = HEROES[this.players[slot].heroId];
    const jack = this.world.jack;
    if (this.throwKind === 'jack' || !jack) {
      const D = rand(4.2, 5.4);
      return { type: 'jack', landing: [rand(-0.5, 0.5), CIRCLE.z - D + 0.15], roll: [0, -0.7], fric: 2.0, T: 1.0, H: 1.5 };
    }
    const sigma = hero.skill;
    const dx = jack.pos[0] - CIRCLE.x;
    const dz = jack.pos[2] - CIRCLE.z;
    const len = Math.hypot(dx, dz);
    const nx = dx / len;
    const nz = dz / len;
    const rollDist = rand(0.25, 0.6);
    const lat = gauss() * sigma * 0.8;
    const dep = gauss() * sigma;
    const lx = clamp(jack.pos[0] - nx * (rollDist - dep) - nz * lat, FIELD.xMin + 0.2, FIELD.xMax - 0.2);
    const lz = clamp(jack.pos[2] - nz * (rollDist - dep) + nx * lat, FIELD.zMin + 0.3, CIRCLE.z - 1.5);
    return { type: 'point', T: 1.0 + len * 0.03, H: 2.2, fric: 2.6, roll: [nx * rollDist * 2.6, nz * rollDist * 2.6], landing: [lx, lz] };
  }

  // Lancer déclenché par un don : toujours un tir sur la boule adverse qui a le point.
  #giftPlan(g) {
    const opp = this.#best(other(g.side));
    if (!opp.body) return null;
    const tp = opp.body.pos;
    const dx = tp[0] - CIRCLE.x;
    const dz = tp[2] - CIRCLE.z;
    const len = Math.hypot(dx, dz);
    const nx = dx / len;
    const nz = dz / len;
    const base = { donor: g.name, tier: g.tier, targetId: opp.body.id };
    const label = TIER_INFO[g.tier].label.toUpperCase();
    if (g.tier === 1) {
      // Tir normal : physique, il peut rater.
      const lat = gauss() * 0.34;
      const dep = gauss() * 0.3;
      this.#announce(label, `merci ${g.name}`, 'info');
      return { ...base, type: 'tir', T: 0.9, H: 1.3, fric: 3.0, roll: [nx * 6, nz * 6], landing: [tp[0] - nx * (0.75 - dep) - nz * lat, tp[2] - nz * (0.75 - dep) + nx * lat] };
    }
    if (g.tier === 10) {
      // Tir à effet : boule enflammée qui se courbe, touche presque à coup sûr et éjecte la boule visée.
      const lat = gauss() * 0.05;
      this.#announce(label, `merci ${g.name}`, 'gg');
      return {
        ...base, type: 'effet', fiery: true, curve: (Math.random() < 0.5 ? -1 : 1) * rand(0.5, 0.9), T: 1.05, H: 1.7, fric: 3.0,
        roll: [nx * 7.5, nz * 7.5], landing: [tp[0] - nx * 0.55 - nz * lat, tp[2] - nz * 0.55 + nx * lat],
      };
    }
    // 100 : carreau parfait, puis toutes les autres boules de l'adversaire sont éliminées.
    this.#announce(label, `merci ${g.name}`, 'gg');
    return { ...base, type: 'carreau', exact: true, wipe: true, landing: [tp[0], tp[2]], T: 1.25, H: 2.9, roll: [0, 0] };
  }

  // Une bombe (1000) passe toujours, dès que tout est immobile.
  #bombStep() {
    const i = this.gifts.findIndex((g) => g.tier === 1000);
    if (i < 0) return false;
    const [g] = this.gifts.splice(i, 1);
    this.#giftState(g, 'playing');
    this.#bomb(g);
    return true;
  }

  // Un tir (1, 10, 100) ne se joue que pendant le tour du personnage concerné, jamais hors tour : un personnage qui a le point
  // ne rejoue donc pas. Il demande une cible adverse et une boule en stock (3 par mène) ; sinon il attend un prochain tour.
  #takeGift(side) {
    if (!this.world.jack || this.players[side].left <= 0 || !this.#best(other(side)).body) return;
    const i = this.gifts.findIndex((g) => g.side === side && g.tier !== 1000);
    if (i < 0) return;
    this.giftNow = this.gifts.splice(i, 1)[0];
    this.#giftState(this.giftNow, 'playing');
  }

  // 1000 : la mène s'arrête, toutes les boules explosent et le bénéficiaire marque 3 points d'un coup.
  #bomb(g) {
    for (const b of this.world.live()) this.fx.blast(b.pos[0], b.pos[1], b.pos[2], b.style?.body ?? '#ffcf40');
    this.world.clear();
    this.shake = 0.7;
    this.flash = 0.8;
    this.fx.fireworks(6);
    this.#giftState(g, 'done');
    this.players[g.side].score += 3;
    for (const p of Object.values(this.players)) p.left = 0; // plus aucune boule : la mène est finie
    this.lastMene = { winner: g.side, pts: 3 };
    this.thrower = null;
    this.#announce(`BOMBE ! +3 ${this.name(g.side)}`, `merci ${g.name}`, 'gg');
    this.#go('mene-end');
  }

  #release() {
    const slot = this.thrower;
    const rig = this.rig[slot];
    const plan = this.cur.plan;
    const jack = plan.type === 'jack';
    const body = this.world.launchThrow({
      kind: jack ? 'jack' : 'boule', owner: slot, from: [...rig.hand], plan,
      style: jack ? null : HEROES[this.players[slot].heroId].boule, // chaque personnage garde toujours la couleur de ses boules
    });
    this.cur.body = body;
    if (plan.fiery) body.fiery = true;
    if (plan.entry) this.#giftState(plan.entry, 'done');
    rig.holding = false;
    if (!jack) this.players[slot].left = Math.max(0, this.players[slot].left - 1); // 3 boules par mène au maximum, tirs des dons compris
    this.emit();
  }

  #onCarreau(b) {
    const plan = b.plan;
    this.carreaux++;
    this.shake = 0.3;
    this.fx.burst(b.pos[0], 0.2, b.pos[2], { n: 30, speed: 4, life: 0.8, size: 0.07, grav: -9, colors: [[1, 0.85, 0.3], [1, 1, 1]] });
    this.fx.waves.push({ x: b.pos[0], y: 0.03, z: b.pos[2], t: 0, max: 0.6 });
    if (plan.wipe) {
      // Balayage : toutes les autres boules de l'adversaire explosent.
      const victim = other(b.owner);
      for (const o of this.world.live('boule')) {
        if (o.owner !== victim) continue;
        this.fx.blast(o.pos[0], o.pos[1], o.pos[2], o.style?.body);
        this.world.destroy(o);
      }
      this.shake = 0.55;
      this.flash = 0.4;
    }
    this.#announce(plan.wipe ? 'CARREAU + BALAYAGE !' : 'CARREAU !', plan.donor ? `merci ${plan.donor}` : '', plan.wipe ? 'gg' : 'carreau');
  }

  #onFireHit(att, vic) {
    this.shake = 0.35;
    this.fx.blast(vic.pos[0], vic.pos[1], vic.pos[2], vic.style?.body);
    this.#announce('TOUCHÉ !', '', 'carreau');
  }

  #afterThrow() {
    const plan = this.cur.plan;
    if (plan.type === 'jack') {
      const j = this.world.jack;
      const dist = j ? Math.hypot(j.pos[0] - CIRCLE.x, j.pos[2] - CIRCLE.z) : 0;
      if (!j || dist < 3.8 || dist > 7.6) {
        this.#announce('COCHONNET NUL', 'on le relance', 'info');
        this.world.clear();
        this.#go('turn');
        return;
      }
      if (this.#bombStep()) return;
      this.throwKind = 'boule';
      this.thrower = this.starter;
      this.#takeGift(this.thrower);
      this.emit();
      this.#go('turn');
      return;
    }
    if (!this.world.jack) {
      this.#announce('MÈNE NULLE', 'cochonnet sorti du terrain', 'info');
      this.#go('mene-void');
      return;
    }
    if (this.#bombStep()) return;
    const nxt = this.#next();
    if (!nxt) {
      this.#endMene();
      return;
    }
    this.thrower = nxt;
    this.#takeGift(nxt);
    this.emit();
    this.#go('turn');
  }

  // Celui qui n'a pas le point rejoue ; s'il ne lui reste rien, l'autre termine seul.
  #next() {
    const a = this.players.A.left;
    const b = this.players.B.left;
    if (!a && !b) return null;
    if (!a) return 'B';
    if (!b) return 'A';
    const dA = this.#best('A').d;
    const dB = this.#best('B').d;
    if (dA === dB) return other(this.thrower);
    return dA > dB ? 'A' : 'B';
  }

  // ---------- fin de mène ----------
  #endMene() {
    const dA = this.#best('A');
    const dB = this.#best('B');
    if (dA.d === Infinity && dB.d === Infinity) {
      this.#announce('MÈNE NULLE', 'plus aucune boule en jeu', 'info');
      this.#go('mene-void');
      return;
    }
    const winner = dA.d <= dB.d ? 'A' : 'B';
    const oppD = (winner === 'A' ? dB : dA).d;
    const jack = this.world.jack;
    let pts = 0;
    for (const b of this.world.live('boule')) {
      if (b.owner !== winner) continue;
      if (Math.hypot(b.pos[0] - jack.pos[0], b.pos[2] - jack.pos[2]) < oppD) pts++;
    }
    this.players[winner].score += pts;
    this.lastMene = { winner, pts };
    this.#announce(`MÈNE ${this.name(winner)}`, `+${pts} point${pts > 1 ? 's' : ''}`, 'mene');
    this.thrower = null;
    this.#go('mene-end');
  }

  // Le vainqueur de la mène danse (un tour sur lui-même) ; l'autre est dépité.
  #dance() {
    const { winner } = this.lastMene;
    const w = this.rig[winner];
    const l = this.rig[other(winner)];
    const k = smooth(clamp(this.t / 1.5, 0, 1));
    w.spinning = this.t < 1.5;
    w.face = w.spinning ? k * TAU : 0;
    w.hop = w.spinning ? Math.abs(Math.sin(k * Math.PI)) * 0.4 : 0;
    w.armsTarget = 1;
    l.slumpTarget = 1;
  }

  #afterMene() {
    const { winner } = this.lastMene;
    const w = this.rig[winner];
    w.spinning = false;
    w.face = 0;
    if (this.players[winner].score >= TARGET) {
      this.#startKO(winner);
      return;
    }
    this.mene++;
    this.starter = winner;
    this.#beginMene();
  }

  // ---------- K.O. final ----------
  #startKO(winner) {
    if (this.giftNow) {
      this.#requeue(this.giftNow);
      this.giftNow = null;
    }
    this.koInfo = { winner, loser: other(winner), vy: 0 };
    // Le vainqueur reste : sa série continue s'il gagnait déjà, sinon elle repart à 1.
    this.streak = this.champion === winner ? this.streak + 1 : 1;
    this.champion = winner;
    this.thrower = null;
    this.world.clear();
    for (const r of Object.values(this.rig)) Object.assign(r, { holding: false, spinning: false, hop: 0, faceTarget: Math.PI, armsTarget: 0, slumpTarget: 0 });
    this.#announce(`${this.name(winner)} GAGNE`, `${this.players.A.score} – ${this.players.B.score}`, 'win');
    this.#go('ko');
  }

  #koStep(dt) {
    const k = this.koInfo;
    const w = this.rig[k.winner];
    const l = this.rig[k.loser];
    const t = this.t;
    const wSpec = HEROES[this.players[k.winner].heroId];
    const lSpec = HEROES[this.players[k.loser].heroId];

    if (t > 1.2 && !k.charged) {
      k.charged = true;
      w.glowTarget = 1;
      w.poseTarget = { ...NEUTRAL, crouch: 0.6, lean: 0.1 };
    }
    if (t > 2.4 && !k.boom) {
      k.boom = true;
      l.visible = false;
      this.fx.explosion(l.x, 1.0, l.z, [lSpec.torso, lSpec.legs, lSpec.boots, lSpec.skin]);
      this.shake = 0.8;
      this.flash = 1;
      this.#announce('K.O. !', '', 'ko');
    }
    if (t > 3.3 && !k.launched) {
      k.launched = true;
      k.vy = 5;
      w.armsTarget = 1;
      w.poseTarget = { ...NEUTRAL };
      this.shake = 0.35;
      this.fx.waves.push({ x: w.x, y: 0.03, z: w.z, t: 0, max: 0.8 });
    }
    if (k.launched && !k.gone) {
      k.vy += 40 * dt;
      w.flyY += k.vy * dt;
      this.space = clamp((w.flyY - 6) / 55, 0, 1);
      this.fx.burst(w.x, w.flyY + 0.6, w.z, { n: 2, speed: 1.5, life: 0.5, size: 0.14, grav: 0, colors: [[1, 0.9, 0.5], [1, 0.6, 0.2]] });
      if (w.flyY > 140) {
        k.gone = t;
        w.visible = false;
        this.flash = 1;
        this.setStage(wSpec.stage); // le vainqueur revient dans SON monde
      }
    }
    if (k.gone && !k.back && t > k.gone + 1.4) {
      k.back = true;
      w.visible = true;
      w.flyY = 26;
      k.vy = 0;
      w.glowTarget = 0.5;
    }
    if (k.back && !k.landed) {
      k.vy -= 46 * dt;
      w.flyY += k.vy * dt;
      this.space = clamp(w.flyY / 26, 0, 1);
      if (w.flyY <= 0) {
        w.flyY = 0;
        k.landed = t;
        this.space = 0;
        w.glowTarget = 0;
        w.armsTarget = 0;
        this.shake = 0.6;
        this.fx.dust(w.x, w.z);
        this.fx.burst(w.x, 0.1, w.z, { n: 36, speed: 3.5, life: 0.7, size: 0.1, grav: -3, drag: 1.5, colors: [[0.85, 0.75, 0.55]] });
        this.fx.waves.push({ x: w.x, y: 0.03, z: w.z, t: 0, max: 0.8 });
        this.#announce(`${wSpec.name} RESTE !`, `${this.streak} victoire${this.streak > 1 ? 's' : ''} d'affilée`, 'win');
      }
    }
    if (k.landed && !k.entered && t > k.landed + 2.2) {
      k.entered = t;
      this.#replaceLoser();
    }
    if (k.entered && !k.entering) {
      l.flyY -= (k.vyIn = (k.vyIn ?? 0) + 34 * dt) * dt;
      if (l.flyY <= 0) {
        l.flyY = 0;
        k.entering = true;
        l.dance = { id: this.players[k.loser].heroId, t: 0 };
        this.shake = 0.4;
        this.fx.dust(l.x, l.z);
        this.fx.burst(l.x, 0.1, l.z, { n: 30, speed: 3, life: 0.7, size: 0.1, grav: -3, drag: 1.5, colors: [[0.85, 0.75, 0.55]] });
      }
    }
    if (k.entering && !k.done && t > k.entered + 3.1) {
      k.done = true;
      this.mene = 1;
      this.starter = Math.random() < 0.5 ? 'A' : 'B';
      for (const r of Object.values(this.rig)) Object.assign(r, { glowTarget: 0, poseTarget: { ...NEUTRAL } });
      this.#startIntro(false);
    }
  }

  #replaceLoser() {
    const k = this.koInfo;
    const loser = this.players[k.loser];
    const queue = this.queues[k.loser]; // le remplaçant est du même groupe : homme à gauche, femme à droite
    queue.push(loser.heroId);
    const next = queue.shift();
    loser.heroId = next;
    for (const p of Object.values(this.players)) Object.assign(p, { score: 0, left: BOULES });
    const l = this.rig[k.loser];
    Object.assign(l, { ...NEUTRAL, visible: true, flyY: 12, face: Math.PI, faceTarget: Math.PI, slump: 0, slumpTarget: 0, armsUp: 0, glow: 0, scale: 1 });
    this.#announce('NOUVEAU CHALLENGER', HEROES[next].name, 'challenger');
  }

  // ---------- animation des personnages ----------
  #rigs(dt) {
    const throwing = ['turn', 'prep', 'windup', 'swing', 'flight', 'settle'].includes(this.state);
    const active = ['prep', 'windup', 'swing', 'flight'];
    for (const slot of ['A', 'B']) {
      const r = this.rig[slot];
      r.tx = throwing && this.thrower === slot ? CIRCLE.x : SLOT_X[slot];
      const dx = r.tx - r.x;
      const sp = clamp(dx * 6, -2, 2);
      r.x += sp * dt;
      r.speed = Math.abs(sp);
      r.walkPhase += r.speed * dt * 7;
      if (r.dance) {
        r.dance.t += dt;
        if (r.dance.t > DANCE_TIME) r.dance = null;
      }

      if (!(this.thrower === slot && active.includes(this.state))) {
        for (const key of POSE_KEYS) ap(r, key, r.poseTarget[key], 8, dt);
      }
      ap(r, 'armsUp', r.armsTarget, 8, dt);
      ap(r, 'slump', r.slumpTarget, 6, dt);
      ap(r, 'glow', r.glowTarget, 4, dt);
      if (!r.spinning) {
        const prev = r.face;
        ap(r, 'face', r.faceTarget, 8, dt);
        r.spinSpeed = (r.face - prev) / dt;
        ap(r, 'hop', 0, 12, dt);
      } else r.spinSpeed = TAU / 1.5;
    }
  }
}

export const game = new Game();
export { R, JACK_R };
