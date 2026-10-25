import { useSyncExternalStore } from 'react';
import { game, TARGET } from './game.js';
import { HEROES } from './heroes.js';
import { SIDE_GIFTS, TIERS, giftInfo } from './gifts.js';
import { arrowIcon, effectIcon, giftIcon } from './GiftIcons.jsx';
import { STAGES } from './stages.js';
import { audio } from './audio.js';

function Side({ slot }) {
  const p = game.players[slot];
  const hero = HEROES[p.heroId];
  const turn = game.thrower === slot;
  return (
    <div className={`side ${slot} ${turn ? 'turn' : ''}`} style={{ '--c': hero.color }}>
      <div className="name">{hero.name}</div>
      <div className="score">{p.score}</div>
      <div className="bar"><i style={{ width: `${Math.min(100, (p.score / TARGET) * 100)}%` }} /></div>
      <div className="balls">
        {Array.from({ length: 3 }, (_, i) => <b key={i} className={i < Math.max(0, p.left) ? 'on' : ''} />)}
      </div>
    </div>
  );
}

// Les dons d'un côté, en icônes seulement : le cadeau TikTok à envoyer, une flèche, puis l'effet obtenu.
// Les 4 barres à gauche de chaque ligne montrent le palier (1, 10, 100, 1000). Le côté de la carte = le personnage concerné.
const coinLabel = (n) => (n >= 1000 ? `${n / 1000}K` : String(n));

function GiftCard({ slot }) {
  const hero = HEROES[game.players[slot].heroId];
  const last = game.lastGift;
  return (
    <section className={`gifts ${slot}`} style={{ '--c': hero.color }}>
      <ul>
        {TIERS.map((tier) => {
          const waiting = game.gifts.filter((g) => g.side === slot && g.tier === tier).length;
          const hit = last && last.side === slot && last.tier === tier;
          return (
            <li key={hit ? `hit${last.key}` : tier} className={`${hit ? 'hit' : ''} t${tier}`}>
              <span className="gift">
                {giftIcon(SIDE_GIFTS[slot][tier])}
                <b className="val">{coinLabel(giftInfo(SIDE_GIFTS[slot][tier])?.coins ?? tier)}</b>
              </span>
              {arrowIcon}
              {effectIcon(tier)}
              {waiting > 0 && <em>{waiting}</em>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// Pastille ronde avec la photo (ou l'initiale si elle ne charge pas).
function Face({ name, src }) {
  return (
    <span className="av">
      {src ? <img src={src} alt="" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.remove(); }} /> : null}
      <b>{(name[0] ?? '?').toUpperCase()}</b>
    </span>
  );
}

// Notifications au centre, sous le terrain : chaque don montre son état (reçu → n° dans la file → en cours → exécuté),
// pour que le donateur sache que son don est bien pris en compte.
function GiftNote({ n }) {
  const hero = HEROES[game.players[n.side].heroId];
  const done = n.entries.filter((e) => e.state === 'done').length;
  const left = n.entries.length - done;
  const playing = n.entries.some((e) => e.state === 'playing');
  const pos = game.queuePosition(n);
  const [cls, label] = left === 0 ? ['done', '✓ Exécuté'] : playing ? ['playing', '▶ En cours'] : pos <= 0 ? ['queued', 'Reçu · prochain'] : ['queued', `Reçu · n°${pos + 1}`];
  return (
    <div className={`note gift ${n.side}`} style={{ '--c': hero.color }}>
      <Face name={n.name} src={n.avatar} />
      <span className="who">{n.name}</span>
      {giftIcon(SIDE_GIFTS[n.side][n.tier])}
      {arrowIcon}
      {effectIcon(n.tier)}
      {n.entries.length > 1 && <em>×{left || n.entries.length}</em>}
      <span className={`st ${cls}`}>{label}</span>
    </div>
  );
}

function Feed({ items }) {
  const gifts = items.filter((n) => n.kind === 'gift');
  const shown = gifts.slice(0, 3); // les plus anciens = ceux qui vont être joués en premier
  const hidden = gifts.slice(3).reduce((sum, n) => sum + n.entries.filter((e) => e.state !== 'done').length, 0);
  const welcome = items.filter((n) => n.kind === 'welcome').slice(-1)[0];
  return (
    <div className="feed">
      {shown.map((n) => <GiftNote key={n.key} n={n} />)}
      {hidden > 0 && <div className="more">+ {hidden} don{hidden > 1 ? 's' : ''} en file</div>}
      {welcome && (
        <div className="note welcome" key={welcome.key}>
          {welcome.all ? (
            <span className="faces">{welcome.faces.map((f) => <Face key={f.name} name={f.name} src={f.avatar} />)}</span>
          ) : (
            <Face name={welcome.name} src={welcome.avatar} />
          )}
          <span>{welcome.all ? <b>Bienvenue à tous !</b> : <>Bienvenue <b>{welcome.name}</b></>} 👋</span>
        </div>
      )}
    </div>
  );
}

export default function Overlay() {
  useSyncExternalStore(game.subscribe, game.getVersion);
  useSyncExternalStore(audio.subscribe, audio.getVersion);
  const { banner, queues, streak, mene, status, vs, feed, fast } = game;
  return (
    <div className="hud">
      <header className="board">
        <Side slot="A" />
        <div className="mid">
          <span>MÈNE</span>
          <b>{mene}</b>
          <small>premier à {TARGET}</small>
        </div>
        <Side slot="B" />
      </header>

      <div className="cards">
        <GiftCard slot="A" />
        <GiftCard slot="B" />
      </div>
      <div className="king">
        📍 {STAGES[game.stageId].label}
        {streak > 0 && game.champion ? ` · 👑 ${game.name(game.champion)} ×${streak}` : ''} · prochains : {HEROES[queues.A[0]].name} / {HEROES[queues.B[0]].name}
      </div>

      {vs && (
        <div className="vs" key={vs.key} style={{ animationDuration: game.introDance ? "3.8s" : "2.6s" }}>
          <div className="band a" style={{ '--c': HEROES[vs.a].color }}><b>{HEROES[vs.a].name}</b></div>
          <div className="mark">VS</div>
          <div className="band b" style={{ '--c': HEROES[vs.b].color }}><b>{HEROES[vs.b].name}</b></div>
        </div>
      )}

      {banner && (
        <div className={`banner ${banner.kind}`} key={banner.key}>
          <b>{banner.text}</b>
          {banner.sub && <span>{banner.sub}</span>}
        </div>
      )}
      <Feed items={feed} />
      {fast && <div className="fast">⏩ rattrapage des dons</div>}
      <div className={`link ${status}`} />
      <button className="sound" onClick={() => (audio.status === 'blocked' ? audio.start() : audio.toggleMute())}>
        {audio.status === 'blocked' ? '🔊 Touchez pour le son' : audio.muted ? '🔇' : '🔊'}
      </button>
    </div>
  );
}
