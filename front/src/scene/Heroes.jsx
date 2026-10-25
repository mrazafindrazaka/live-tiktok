import { useSyncExternalStore } from 'react';
import { game } from '../game.js';
import Hero from './Hero.jsx';

// Recrée un personnage quand le challenger remplace le perdant.
export default function Heroes() {
  useSyncExternalStore(game.subscribe, game.getVersion);
  return ['A', 'B'].map((slot) => <Hero key={slot + game.players[slot].heroId} slot={slot} heroId={game.players[slot].heroId} />);
}
