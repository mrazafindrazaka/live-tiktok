import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { game } from '../game.js';

// Panneaux publicitaires autour du terrain, dessinés dans des canvas animés (~24 images/s) :
// - deux panneaux permanents au fond : « MADE BY THE UNIKK » et « ATIMILOG »,
// - un panneau devant le terrain où défilent les personnes qui likent,
// - des effets de lumière en continu (chenille de LED, balayage lumineux, bord qui pulse, grille de LED).
const FONT = "'Barlow Condensed', 'Arial Narrow', sans-serif";
const NEON = ['#ff5fa8', '#52e6ff', '#ffd23f', '#9dff7a', '#c79bff'];
const FPS = 24;

let ledGrid;
function ledPattern(g) {
  if (!ledGrid) {
    const c = document.createElement('canvas');
    c.width = c.height = 4;
    const x = c.getContext('2d');
    x.fillStyle = 'rgba(0,0,0,0.38)';
    x.fillRect(3, 0, 1, 4);
    x.fillRect(0, 3, 4, 1);
    ledGrid = g.createPattern(c, 'repeat');
  }
  return ledGrid;
}

// Effets de lumière communs à tous les panneaux.
function lightFx(g, w, h, t, hue) {
  const n = Math.max(8, Math.floor(w / (h * 0.3)));
  const gap = w / n;
  for (let i = 0; i < n; i++) {
    const k = (((i / n) - t * 0.35) % 1 + 1) % 1; // chenille qui court le long du bord
    const on = Math.max(0, 1 - k * 3);
    g.fillStyle = `hsla(${(hue + i * 7) % 360},100%,${55 + on * 25}%,${0.25 + on * 0.75})`;
    const r = h * 0.035 + on * h * 0.035;
    g.beginPath();
    g.arc(i * gap + gap / 2, h * 0.07, r, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(w - (i * gap + gap / 2), h * 0.93, r, 0, Math.PI * 2);
    g.fill();
  }
  const x = (((t * 0.3) % 1.5) - 0.25) * w; // bande de lumière qui traverse
  const sweep = g.createLinearGradient(x - h * 2.2, 0, x + h * 2.2, 0);
  sweep.addColorStop(0, 'rgba(255,255,255,0)');
  sweep.addColorStop(0.5, 'rgba(255,255,255,0.3)');
  sweep.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = sweep;
  g.fillRect(0, 0, w, h);
  const pulse = 0.5 + 0.5 * Math.sin(t * 4); // bord qui pulse
  g.lineWidth = Math.max(3, h * 0.05);
  g.strokeStyle = `hsla(${hue},100%,60%,${0.3 + 0.45 * pulse})`;
  g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, w - g.lineWidth, h - g.lineWidth);
  g.fillStyle = ledPattern(g); // grille de LED
  g.fillRect(0, 0, w, h);
}

// Fond sombre avec une lueur colorée qui tourne.
function backdrop(g, w, h, t, hue) {
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, `hsl(${hue},60%,10%)`);
  bg.addColorStop(1, `hsl(${(hue + 80) % 360},60%,14%)`);
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
}

function drawText(g, w, h, t, st) {
  const hue = (t * 40 + st.hue) % 360;
  backdrop(g, w, h, t, hue);
  let size = h * 0.62;
  g.font = `700 ${size}px ${FONT}`;
  if ('letterSpacing' in g) g.letterSpacing = `${size * 0.06}px`;
  const tw = g.measureText(st.text).width;
  if (tw > w * 0.9) {
    size *= (w * 0.9) / tw;
    g.font = `700 ${size}px ${FONT}`;
    if ('letterSpacing' in g) g.letterSpacing = `${size * 0.06}px`;
  }
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const grad = g.createLinearGradient(((t * 0.35) % 1) * w - w * 0.5, 0, ((t * 0.35) % 1) * w + w * 0.5, 0);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, `hsl(${hue},100%,70%)`);
  grad.addColorStop(1, '#ffffff');
  g.shadowColor = `hsl(${hue},100%,60%)`;
  g.shadowBlur = size * (0.35 + 0.2 * Math.sin(t * 5));
  g.fillStyle = grad;
  g.fillText(st.text, w / 2, h / 2 + size * 0.04);
  g.shadowBlur = 0;
  lightFx(g, w, h, t, hue);
}

// Les personnes qui likent défilent sur le panneau, les plus récentes d'abord.
function drawLikes(g, w, h, t, st) {
  const hue = (t * 40 + st.hue) % 360;
  backdrop(g, w, h, t, hue);
  const size = h * 0.5;
  g.font = `700 ${size}px ${FONT}`;
  g.textAlign = 'left';
  g.textBaseline = 'middle';
  if (st.version !== game.likeVersion || !st.items) {
    st.version = game.likeVersion;
    const likers = game.recentLikers(14);
    const segs = likers.length
      ? likers.flatMap((l, i) => [{ text: `♥ ${l.name.toUpperCase()} ×${l.count}`, color: NEON[i % 5] }, ...(i % 3 === 2 ? [{ text: 'UNIK', color: '#ffffff' }] : [])])
      : [{ text: '♥ ENVOYEZ DES LIKES POUR APPARAÎTRE ICI', color: NEON[0] }, { text: 'UNIK', color: '#ffffff' }];
    let x = 0;
    st.items = segs.map((s) => {
      const wd = g.measureText(s.text).width;
      const it = { ...s, x, wd };
      x += wd + size * 1.2;
      return it;
    });
    st.total = x;
  }
  const off = (t * h * 1.8 + st.hue * 9) % st.total;
  for (let rep = 0; rep * st.total - off < w; rep++) {
    for (const it of st.items) {
      const x = it.x - off + rep * st.total;
      if (x > w || x + it.wd < 0) continue;
      g.shadowColor = it.color;
      g.shadowBlur = size * 0.3;
      g.fillStyle = it.color;
      g.fillText(it.text, x, h / 2 + size * 0.04);
    }
  }
  g.shadowBlur = 0;
  lightFx(g, w, h, t, hue);
}

// Bande LED basse autour du terrain : uniquement des lumières qui courent.
function drawStrip(g, w, h, t, st) {
  const hue = (t * 50 + st.hue) % 360;
  g.fillStyle = '#0a0c18';
  g.fillRect(0, 0, w, h);
  const n = Math.floor(w / (h * 1.6));
  for (let i = 0; i < n; i++) {
    const k = (((i / n) * st.dir - t * 0.5) % 1 + 1) % 1;
    const on = Math.max(0, 1 - k * 4);
    g.fillStyle = `hsla(${(hue + i * 9) % 360},100%,${50 + on * 30}%,${0.2 + on * 0.8})`;
    g.fillRect((i + 0.15) * (w / n), h * 0.2, (w / n) * 0.7, h * 0.6);
  }
}

function useCanvasTexture(w, h, draw, state) {
  const { c, g, tex } = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const tex = new CanvasTexture(c);
    tex.colorSpace = SRGBColorSpace;
    return { c, g: c.getContext('2d'), tex };
  }, [w, h]);
  const acc = useRef(1);
  useFrame((s, dt) => {
    acc.current += dt;
    if (acc.current < 1 / FPS) return;
    acc.current = 0;
    draw(g, w, h, s.clock.elapsedTime, state);
    tex.needsUpdate = true;
  });
  return tex;
}

const Screen = ({ tex, w, h }) => (
  <mesh>
    <planeGeometry args={[w, h]} />
    <meshBasicMaterial map={tex} toneMapped={false} fog={false} />
  </mesh>
);

// Petit panneau fixe avec cadre : texte permanent ou défilement des likes.
function Sign({ kind, text, hue, x, y, z, w, h, px }) {
  const state = useMemo(() => ({ text, hue }), [text, hue]);
  const tex = useCanvasTexture(px, Math.round(px * (h / w)), kind === 'text' ? drawText : drawLikes, state);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0, -0.06]}>
        <boxGeometry args={[w + 0.1, h + 0.1, 0.1]} />
        <meshStandardMaterial color="#14161f" roughness={0.6} metalness={0.4} />
      </mesh>
      <Screen tex={tex} w={w} h={h} />
    </group>
  );
}

function Strip({ pos, size, hue, dir }) {
  const long = size[2] > size[0];
  const tex = useCanvasTexture(long ? 1536 : 704, 32, drawStrip, useMemo(() => ({ hue, dir }), [hue, dir]));
  return (
    <mesh position={pos}>
      <boxGeometry args={size} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

export default function Boards() {
  return (
    <>
      {/* au fond du terrain : deux panneaux permanents */}
      <Sign kind="text" text="MADE BY THE UNIKK" hue={200} x={-0.95} y={0.52} z={-7.05} w={2.9} h={0.86} px={780} />
      <Sign kind="text" text="ATIMILOG" hue={300} x={1.95} y={0.52} z={-7.05} w={1.8} h={0.86} px={500} />

      {/* devant le terrain : les personnes qui likent défilent */}
      <Sign kind="likes" hue={0} x={0} y={0.3} z={2.5} w={4.7} h={0.6} px={1000} />

      {/* bandes LED le long du terrain : lumières qui courent */}
      <Strip pos={[-2.42, 0.13, -2.3]} size={[0.1, 0.26, 9.5]} hue={0} dir={1} />
      <Strip pos={[2.42, 0.13, -2.3]} size={[0.1, 0.26, 9.5]} hue={180} dir={-1} />
    </>
  );
}
