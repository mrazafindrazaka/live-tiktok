import { EventEmitter } from 'node:events';

const NAMES = ['lea_music', 'tom.k', 'sakura', 'nico_92', 'mada_fan', 'jules.b', 'ambre', 'kevin_off', 'zoe.lv', 'rakoto'];
const COMMENTS = ['trop fort !!', 'salut tout le monde', '🔥🔥🔥', "tu viens d'où ?", 'on veut la suite', 'incroyable', 'haha 😂', 'premier !', 'bonne soirée à tous', 'tu peux me dire bonjour ?'];
// Cadeaux "décoratifs" : leurs noms n'existent pas dans le jeu (voir front/src/gifts.js), ils ne déclenchent rien.
const GIFTS = [
  { name: 'TikTok', diamonds: 1 },
  { name: 'Finger Heart', diamonds: 5 },
  { name: 'Doughnut', diamonds: 30 },
  { name: 'Lion', diamonds: 29999 },
];

// Cadeaux du jeu, un par palier et par côté : mêmes noms que front/src/gifts.js.
// Le côté est tiré à pile ou face et le palier au hasard pondéré : les deux personnages reçoivent la même chose en moyenne.
const GAME_GIFTS = {
  A: { 1: 'Rose', 10: 'Tiny Diny', 100: 'Hand Heart', 1000: 'Galaxy' },
  B: { 1: 'GG', 10: 'Rosa', 100: 'Confetti', 1000: 'Disco ball' },
};
const TIER_WEIGHTS = [[1, 64], [10, 25], [100, 9], [1000, 2]]; // les gros dons sont rares

function gameGift() {
  const side = Math.random() < 0.5 ? 'A' : 'B';
  let r = Math.random() * TIER_WEIGHTS.reduce((n, [, w]) => n + w, 0);
  const [tier] = TIER_WEIGHTS.find(([, w]) => (r -= w) < 0);
  return { name: GAME_GIFTS[side][tier], coins: tier };
}

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const int = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
// Petite tête dessinée en SVG (pas de vraie photo en mode test).
const avatarFor = (name) => {
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128'><rect width='128' height='128' fill='hsl(${hue},70%,72%)'/><circle cx='64' cy='62' r='36' fill='#f5d0a9'/><circle cx='51' cy='56' r='5' fill='#222'/><circle cx='77' cy='56' r='5' fill='#222'/><path d='M48 74 Q64 90 80 74' stroke='#222' stroke-width='5' fill='none' stroke-linecap='round'/><path d='M30 50 Q64 6 98 50 Q64 28 30 50Z' fill='hsl(${(hue + 40) % 360},50%,30%)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};
const user = () => {
  const uniqueId = pick(NAMES);
  return { userId: uniqueId, uniqueId, nickname: uniqueId, avatar: avatarFor(uniqueId) };
};

// Tirage pondéré : [poids, générateur]
const generators = [
  [30, () => ({ type: 'chat', data: { user: user(), comment: pick(COMMENTS) } })],
  [28, (m) => {
    const likeCount = int(1, 15);
    return { type: 'like', data: { user: user(), likeCount, totalLikeCount: (m.likes += likeCount) } };
  }],
  [20, () => ({ type: 'member', data: { user: user() } })],
  [3, () => {
    const g = pick(GIFTS);
    return { type: 'gift', data: { user: user(), giftId: g.name.length * 1000, giftName: g.name, diamonds: g.diamonds, repeatCount: pick([1, 1, 1, 3, 5, 10]), streaking: false } };
  }],
  [4, () => {
    const g = gameGift();
    return { type: 'gift', data: { user: user(), giftId: g.name.length, giftName: g.name, diamonds: g.coins, repeatCount: g.coins === 1 ? pick([1, 1, 2, 3]) : 1, streaking: false } };
  }],
  [5, () => ({ type: 'follow', data: { user: user() } })],
  [3, () => ({ type: 'share', data: { user: user() } })],
  [1, () => ({ type: 'subNotify', data: { user: user() } })],
  [3, () => ({ type: 'emote', data: { user: user() } })],
  [6, (m) => ({ type: 'roomUser', data: { viewerCount: (m.viewers = Math.max(1, m.viewers + int(-8, 12))), topViewers: [user(), user(), user()].map((u) => ({ user: u, coins: int(0, 5000) })) } })],
];
const TOTAL = generators.reduce((n, [w]) => n + w, 0);

// Même interface que TikTokLive, mais les événements sont inventés.
export class MockLive extends EventEmitter {
  likes = 0;
  viewers = 120;
  mood = 1; // ambiance du live : calme (0.5) ou en folie (2), change au hasard

  #emit(type, data = {}) {
    this.emit('event', { type, ts: Date.now(), data });
  }

  async connect() {
    this.#emit('connected', { roomId: 'mock-room' });
    const tick = () => {
      let r = Math.random() * TOTAL;
      const [, gen] = generators.find(([w]) => (r -= w) < 0);
      const { type, data } = gen(this);
      this.#emit(type, data);
      if (Math.random() < 0.03) this.mood = 0.5 + Math.random() * 1.5;
      this.timer = setTimeout(tick, int(150, 1200) / this.mood);
    };
    tick();
  }

  stop() {
    clearTimeout(this.timer);
  }
}
