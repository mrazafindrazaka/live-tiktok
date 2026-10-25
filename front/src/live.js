import { io } from 'socket.io-client';
import { game } from './game.js';
import { findGift } from './gifts.js';

const BACKEND = 'http://localhost:3000';
const streaks = new Map(); // série en cours par donateur : { n, at } ; on ne compte que les cadeaux ajoutés depuis le dernier événement
const STREAK_IDLE = 8000; // une série sans nouvelle depuis 8 s est considérée comme terminée (sinon elle bloquerait les cadeaux suivants)

// Un cadeau reconnu (voir gifts.js) déclenche l'effet de son palier pour le personnage de son côté.
export function handleEvent(evt) {
  if (evt.type === 'like') {
    const u = evt.data?.user;
    game.addLike(u?.nickname || u?.uniqueId || 'ami', evt.data?.likeCount || 1);
    return;
  }
  if (evt.type === 'member') {
    const u = evt.data?.user;
    if (u) game.addWelcome(u.nickname || u.uniqueId || 'ami', u.avatar ?? null);
    return;
  }
  if (evt.type !== 'gift') return;
  const d = evt.data ?? {};
  const gift = findGift(d.giftName);
  if (!gift) return;
  const key = `${d.user?.uniqueId}:${d.giftName}`;
  const n = Math.max(1, d.repeatCount || 1);
  const now = Date.now();
  const prev = streaks.get(key);
  const last = prev && now - prev.at < STREAK_IDLE ? prev.n : 0;
  const delta = n > last ? n - last : 0; // l'événement de fin de série répète le même total : rien à ajouter
  if (d.streaking) streaks.set(key, { n, at: now });
  else streaks.delete(key);
  if (delta > 0) game.addGift(gift.side, gift.tier, d.user?.nickname || d.user?.uniqueId || 'ami', d.user?.avatar ?? null, Math.min(delta, 50));
}

export function connectLive() {
  const socket = io(BACKEND);
  socket.on('connect', () => game.setStatus('online'));
  socket.on('disconnect', () => game.setStatus('offline'));
  // On ignore "tiktok:history" : sinon les anciens cadeaux seraient rejoués à chaque connexion.
  socket.on('tiktok:event', handleEvent);
  return () => socket.close();
}
