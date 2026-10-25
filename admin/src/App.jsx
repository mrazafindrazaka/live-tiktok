import { useEffect, useMemo, useReducer, useState } from 'react';
import { io } from 'socket.io-client';
import Icon from './icons.jsx';
import { EVENT_TYPES } from './events.js';
import { applyEvent, initialState } from './state.js';

const BACKEND = 'http://localhost:3000';
const ACTIVE_MS = 2 * 60 * 1000;

function reducer(s, a) {
  if (a.kind === 'reset') return a.events.reduce(applyEvent, initialState); // l'historique arrive du plus ancien au plus récent
  return applyEvent(s, a.evt);
}

const fmt = (n) => new Intl.NumberFormat('fr-FR').format(n);
const clock = (ts) => new Date(ts).toLocaleTimeString('fr-FR');

function Panel({ title, tag, children, className = '' }) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-h">
        <span>{title}</span>
        {tag && <span className="panel-tag">{tag}</span>}
      </header>
      {children}
    </section>
  );
}

// Pastille d'avatar ; repli sur l'initiale si l'image manque ou est bloquée.
function Avatar({ name, src, size = 28 }) {
  const [broken, setBroken] = useState(false);
  const hue = [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 0);
  return (
    <span className="avatar" style={{ width: size, height: size, '--h': hue }}>
      {src && !broken ? <img src={src} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} /> : (name[0] ?? '?').toUpperCase()}
    </span>
  );
}

function Row({ e }) {
  const meta = EVENT_TYPES[e.kind];
  const u = e.data?.user ?? {};
  const name = u.nickname || u.uniqueId || '?';
  const d = e.data;
  return (
    <li className={`row row-${e.kind}`} style={{ '--c': meta.color }}>
      <time>{clock(e.ts)}</time>
      <span className="ico"><Icon name={e.kind} size={18} /></span>
      <Avatar name={name} src={u.avatar} />
      <div className="row-body">
        <b className="who">{name}</b>
        {e.kind === 'chat' ? (
          <span className="msg">{d.comment}</span>
        ) : (
          <span className="act">{d.giftName ?? 'cadeau'}{d.repeatCount > 1 ? ` ×${d.repeatCount}` : ''}</span>
        )}
      </div>
      {e.value > 0 && <span className="val">{fmt(e.value)}<small>◆</small></span>}
    </li>
  );
}

export default function App() {
  const [s, dispatch] = useReducer(reducer, initialState);
  const [socketUp, setSocketUp] = useState(false);
  const [username, setUsername] = useState('');
  const [frozen, setFrozen] = useState(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetch(`${BACKEND}/health`).then((r) => r.json()).then((j) => setUsername(j.username)).catch(() => {});
    const socket = io(BACKEND);
    socket.on('connect', () => setSocketUp(true));
    socket.on('disconnect', () => setSocketUp(false));
    socket.on('tiktok:history', (events) => dispatch({ kind: 'reset', events }));
    socket.on('tiktok:event', (evt) => dispatch({ kind: 'evt', evt }));
    return () => socket.close();
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const list = frozen ?? s.feed;
  const pending = frozen ? s.seq - (frozen[0]?.id ?? s.seq) : 0;
  const top = useMemo(() => Object.values(s.gifters).sort((a, b) => b.diamonds - a.diamonds).slice(0, 5), [s.gifters]);
  const people = useMemo(() => Object.values(s.present).sort((a, b) => b.lastSeen - a.lastSeen), [s.present]);
  const live = socketUp && s.tiktok === 'connected';

  return (
    <div className="hud">
      <header className="top">
        <div className="brand">
          <span className={`lamp ${live ? 'on' : ''}`} />
          <h1>LIVE<i>/</i>HUD</h1>
          {username && <span className="handle">@{username}</span>}
        </div>
        <div className="status">
          <span className={socketUp ? 'ok' : 'ko'}>BACKEND {socketUp ? 'OK' : 'HORS LIGNE'}</span>
          <span className={s.tiktok === 'connected' ? 'ok' : 'ko'}>
            TIKTOK {s.tiktok === 'connected' ? 'CONNECTÉ' : s.tiktok === 'disconnected' ? 'COUPÉ' : '—'}
          </span>
          <span className="clock">{clock(now)}</span>
        </div>
      </header>

      <main className="col-c">
        <Panel className="feed-panel" title="Commentaires & dons" tag={`${fmt(s.diamonds)} ◆ reçus`}>
          <div className="toolbar">
            <button onClick={() => setFrozen(frozen ? null : s.feed)} className={frozen ? 'active' : ''}>
              {frozen ? `▶ Reprendre${pending > 0 ? ` (+${pending})` : ''}` : '❚❚ Figer le flux'}
            </button>
          </div>
          {list.length === 0 ? (
            <div className="idle">
              <div className="radar" />
              <p>En attente de commentaires et de dons…</p>
              <small>Le streamer doit être en live et le backend lancé.</small>
            </div>
          ) : (
            <ul className="feed">{list.map((e) => <Row key={e.id} e={e} />)}</ul>
          )}
        </Panel>
      </main>

      <aside className="col-r">
        <Panel title="Top donateurs" tag="session">
          {top.length === 0 ? (
            <p className="empty">Aucun don pour l'instant.</p>
          ) : (
            <ol className="rank">
              {top.map((g, i) => (
                <li key={g.name + i}>
                  <span className="rk">{String(i + 1).padStart(2, '0')}</span>
                  <Avatar name={g.name} src={g.avatar} size={24} />
                  <span className="nm">{g.name}</span>
                  <span className="dm">{fmt(g.diamonds)}<small>◆</small></span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel className="people-panel" title="Présents" tag={s.viewers ? `${fmt(s.viewers)} spectateurs · ${people.length} repérés` : `${people.length} repérés`}>
          {people.length === 0 ? (
            <p className="empty">Personne repéré pour l'instant.</p>
          ) : (
            <ul className="people">
              {people.map((p) => {
                const active = now - p.lastSeen < ACTIVE_MS;
                return (
                  <li key={p.name} className={active ? 'active' : ''}>
                    <Avatar name={p.name} src={p.avatar} size={26} />
                    <span className="nm">{p.name}</span>
                    <time>{active ? 'actif' : clock(p.lastSeen).slice(0, 5)}</time>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </aside>
    </div>
  );
}
