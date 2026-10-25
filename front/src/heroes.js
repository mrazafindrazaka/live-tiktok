// Catalogue des personnages : couleurs, tête, accessoires, niveau de jeu et monde (décor) de chaque personnage.
// skill = dispersion des pointés (plus petit = plus précis). stage = le monde dans lequel il gagne (voir stages.js).
export const HEROES = {
  batman: {
    name: 'BATMAN', color: '#f2c230', stage: 'gotham',
    torso: '#3b4252', arms: '#3b4252', legs: '#3b4252', gloves: '#15171d', boots: '#15171d',
    skin: '#e6c3a0', head: 'cowl', cowl: '#15171d', cape: '#15171d', belt: '#e8b923', emblem: 'bat',
    boule: { body: '#2f3542', ring: '#f2c230' }, skill: 0.34,
  },
  superman: {
    name: 'SUPERMAN', color: '#5b8cff', stage: 'metropolis',
    torso: '#2455b5', arms: '#2455b5', legs: '#2455b5', gloves: '#2455b5', boots: '#c8262e',
    skin: '#f0cfae', head: 'hair', hair: '#15171d', cape: '#c8262e', trunks: '#c8262e', belt: '#e8b923', emblem: 'diamond',
    boule: { body: '#3b73e0', ring: '#f2c230' }, skill: 0.32,
  },
  spiderman: {
    name: 'SPIDER-MAN', color: '#ff6a6a', stage: 'nyc',
    torso: '#c8262e', arms: '#c8262e', legs: '#2455b5', gloves: '#c8262e', boots: '#2455b5',
    skin: '#c8262e', head: 'full', web: true, emblem: 'spider',
    boule: { body: '#d7322f', ring: '#ffffff' }, skill: 0.38,
  },
  ironman: {
    name: 'IRON MAN', color: '#ffc84a', stage: 'tech',
    torso: '#b3222a', arms: '#b3222a', legs: '#b3222a', gloves: '#e5b23a', boots: '#e5b23a',
    skin: '#b3222a', head: 'iron', trunks: '#e5b23a', emblem: 'arc',
    boule: { body: '#e5b23a', ring: '#b3222a' }, skill: 0.36,
  },
  hulk: {
    name: 'HULK', color: '#7fd35f', big: true, stage: 'canyon',
    torso: '#62b34c', arms: '#62b34c', legs: '#6a3f98', gloves: '#62b34c', boots: '#62b34c',
    skin: '#62b34c', head: 'hulk', emblem: null,
    boule: { body: '#62b34c', ring: '#6a3f98' }, skill: 0.5,
  },
  flash: {
    name: 'FLASH', color: '#ff8c5a', stage: 'speed',
    torso: '#d1242b', arms: '#d1242b', legs: '#d1242b', gloves: '#f2c230', boots: '#f2c230',
    skin: '#e6c3a0', head: 'flash', belt: '#f2c230', emblem: 'bolt',
    boule: { body: '#ff7a3d', ring: '#ffffff' }, skill: 0.3,
  },
  wonderwoman: {
    name: 'WONDER WOMAN', color: '#ff5c7a', female: true, stage: 'greek',
    torso: '#c4262e', arms: '#e8c4a0', legs: '#e8c4a0', gloves: '#e5b23a', boots: '#b8242c',
    skin: '#e8c4a0', head: 'hair', hair: '#1b1410', hairStyle: 'long', tiara: true, trunks: '#2a4aa0', belt: '#e5b23a', emblem: 'crest',
    boule: { body: '#e5b23a', ring: '#c4262e' }, skill: 0.33,
  },
  supergirl: {
    name: 'SUPERGIRL', color: '#ff9bb0', female: true, stage: 'ice',
    torso: '#2455b5', arms: '#2455b5', legs: '#f0cfae', gloves: '#f0cfae', boots: '#c8262e',
    skin: '#f0cfae', head: 'hair', hair: '#f2d27a', hairStyle: 'long', cape: '#c8262e', skirt: '#c8262e', belt: '#e8b923', emblem: 'diamond',
    boule: { body: '#ff8fa3', ring: '#ffffff' }, skill: 0.34,
  },
  batgirl: {
    name: 'BATGIRL', color: '#b58cff', female: true, stage: 'gothamPurple',
    torso: '#2c2a38', arms: '#2c2a38', legs: '#2c2a38', gloves: '#6b3fa0', boots: '#2c2a38',
    skin: '#e6c3a0', head: 'cowl', cowl: '#2c2a38', hair: '#d9552b', hairStyle: 'long', cape: '#6b3fa0', belt: '#e8b923', emblem: 'bat',
    boule: { body: '#8d5bd1', ring: '#f2c230' }, skill: 0.35,
  },
  catwoman: {
    name: 'CATWOMAN', color: '#ff6fb5', female: true, stage: 'neon',
    torso: '#1a1a22', arms: '#1a1a22', legs: '#1a1a22', gloves: '#1a1a22', boots: '#1a1a22',
    skin: '#e6c3a0', head: 'cat', cowl: '#1a1a22', belt: '#e5b23a', emblem: null,
    boule: { body: '#2c2438', ring: '#ff4fa3' }, skill: 0.36,
  },
};

// À gauche, toujours un homme ; à droite, toujours une femme. Les challengers sont tirés dans le même groupe.
export const MALES = Object.keys(HEROES).filter((id) => !HEROES[id].female);
export const FEMALES = Object.keys(HEROES).filter((id) => HEROES[id].female);
