// Les 4 paliers de cadeaux (en pièces TikTok) et les cadeaux de chaque côté : à gauche pour le personnage de gauche, à droite pour celui de droite.
// Les noms, les valeurs et les images sont ceux des vrais cadeaux TikTok (valeurs vérifiées sur la fiche de chaque cadeau, images dans front/public/gifts).
// Pour changer de cadeau : modifier le nom ci-dessous et ajouter son image et sa valeur dans GIFT_INFO.
export const TIERS = [1, 10, 100, 1000];

export const TIER_INFO = {
  1: { label: 'Tir', short: 'tir', tag: 'TIR' },
  10: { label: 'Tir à effet', short: 'effet', tag: 'EFFET' },
  100: { label: 'Carreau + balayage', short: 'carreau', tag: 'BALAYAGE' },
  1000: { label: 'Bombe · +3 pts', short: 'bombe', tag: 'BOMBE +3' },
};

export const SIDE_GIFTS = {
  A: { 1: 'Rose', 10: 'Tiny Diny', 100: 'Hand Heart', 1000: 'Galaxy' },
  B: { 1: 'GG', 10: 'Rosa', 100: 'Confetti', 1000: 'Disco ball' },
};

// Valeur réelle en pièces et image de chaque cadeau.
export const GIFT_INFO = {
  Rose: { coins: 1, image: '/gifts/rose.png' },
  GG: { coins: 1, image: '/gifts/gg.png' },
  'Tiny Diny': { coins: 10, image: '/gifts/tiny-diny.png' },
  Rosa: { coins: 10, image: '/gifts/rosa.png' },
  'Hand Heart': { coins: 100, image: '/gifts/hand-heart.png' },
  Confetti: { coins: 100, image: '/gifts/confetti.png' },
  Galaxy: { coins: 1000, image: '/gifts/galaxy.png' },
  'Disco ball': { coins: 1000, image: '/gifts/disco-ball.png' },
};

// Autres écritures possibles d'un même cadeau (pluriel, langue…).
const ALIASES = { Confettis: 'Confetti', Galaxie: 'Galaxy', 'Boule disco': 'Disco ball', 'Tiny Dino': 'Tiny Diny' };

const norm = (s) => String(s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// nom normalisé -> { side, tier }
const LOOKUP = new Map();
for (const side of ['A', 'B']) for (const tier of TIERS) LOOKUP.set(norm(SIDE_GIFTS[side][tier]), { side, tier });
for (const [alias, name] of Object.entries(ALIASES)) LOOKUP.set(norm(alias), LOOKUP.get(norm(name)));

export const findGift = (giftName) => LOOKUP.get(norm(giftName)) ?? null;
export const giftInfo = (name) => GIFT_INFO[name] ?? null;
