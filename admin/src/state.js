const MAX_FEED = 300;

export const initialState = {
  seq: 0,
  feed: [], // commentaires + dons uniquement
  tiktok: 'unknown', // connected | disconnected | unknown
  viewers: 0,
  diamonds: 0,
  gifters: {}, // uniqueId -> { name, avatar, diamonds }
  // Personnes repérées dans le live. TikTok ne fournit pas la liste complète des spectateurs
  // ni les départs : on cumule les arrivées, l'activité et les "top viewers".
  present: {}, // uniqueId -> { name, avatar, joinedAt, lastSeen }
};

function seen(present, user, ts, joined = false) {
  const id = user?.uniqueId;
  if (!id) return present;
  const prev = present[id];
  return {
    ...present,
    [id]: {
      name: user.nickname || id,
      avatar: user.avatar ?? prev?.avatar,
      joinedAt: prev?.joinedAt ?? ts,
      lastSeen: Math.max(prev?.lastSeen ?? 0, ts),
      fresh: joined || prev?.fresh,
    },
  };
}

// Applique un événement du backend à l'état. Pur : permet de rejouer l'historique.
export function applyEvent(s, evt) {
  const d = evt.data ?? {};
  const ts = evt.ts ?? Date.now();
  const next = { ...s };

  if (evt.type === 'connected' || evt.type === 'disconnected') next.tiktok = evt.type;

  if (evt.type === 'roomUser') {
    next.viewers = d.viewerCount ?? s.viewers;
    next.present = (d.topViewers ?? []).reduce((p, t) => seen(p, t.user, ts), s.present);
    return next;
  }

  // Toute personne qui apparaît (arrivée, commentaire, like, don, follow, partage) est "présente".
  if (d.user) next.present = seen(s.present, d.user, ts, evt.type === 'member');

  if (evt.type === 'gift') {
    if (d.streaking) return next; // série en cours : on attend la fin pour ne pas compter double
    const value = (d.diamonds ?? 0) * (d.repeatCount || 1);
    next.diamonds = s.diamonds + value;
    const key = d.user?.uniqueId ?? '?';
    const prev = s.gifters[key] ?? { name: d.user?.nickname ?? key, avatar: d.user?.avatar, diamonds: 0 };
    next.gifters = { ...s.gifters, [key]: { ...prev, diamonds: prev.diamonds + value } };
    evt = { ...evt, value };
  }

  if (evt.type === 'chat' || evt.type === 'gift') {
    next.seq = s.seq + 1;
    next.feed = [{ ...evt, id: next.seq, kind: evt.type }, ...s.feed].slice(0, MAX_FEED);
  }
  return next;
}
