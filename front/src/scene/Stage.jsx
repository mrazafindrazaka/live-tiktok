import { memo, useMemo } from 'react';
import { CanvasTexture, DoubleSide, SRGBColorSpace } from 'three';

// Générateur pseudo-aléatoire fixe : un décor a toujours la même disposition.
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const texCache = new Map();
function windows(lit, dark = '#0d1020') {
  const key = lit + dark;
  if (texCache.has(key)) return texCache.get(key);
  const c = document.createElement('canvas');
  c.width = 64; c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = dark; g.fillRect(0, 0, 64, 128);
  const r = rng(7);
  for (let y = 4; y < 124; y += 10) for (let x = 4; x < 60; x += 12) {
    g.fillStyle = r() < 0.45 ? lit : 'rgba(255,255,255,0.05)';
    g.fillRect(x, y, 7, 6);
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  texCache.set(key, t);
  return t;
}

const M = (color, extra) => <meshStandardMaterial color={color} roughness={0.9} {...extra} />;
const E = (c, i = 1.2) => ({ emissive: c, emissiveIntensity: i });

// Appelle fn(x, z, i, rand) de chaque côté du terrain, d'avant en arrière.
// La disposition est calculée UNE SEULE fois par décor : sinon le tirage au hasard recommence à chaque affichage de l'interface
// (don, bandeau, lancer…) et les immeubles changent de forme et de place en cours de partie.
function Sides({ seed, zs, x0 = 3.6, x1 = 8, fn }) {
  const nodes = useMemo(() => {
    const r = rng(seed);
    return zs.flatMap((z, i) => [-1, 1].map((s) => <group key={`${i}${s}`}>{fn(s * (x0 + r() * (x1 - x0)), z + r() * 0.8, i, r)}</group>));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);
  return nodes;
}
const ZS = [0, -2.2, -4.4, -6.6, -8.8, -11, -13.5, -16.5, -20];

function Tower({ x, z, w, h, d = w, color, lit, glow }) {
  const tex = windows(lit);
  return (
    <mesh position={[x, h / 2, z]}>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} map={tex} emissive={glow ?? '#000'} emissiveMap={glow ? tex : null} emissiveIntensity={glow ? 0.9 : 0} roughness={0.8} />
    </mesh>
  );
}

const Tree = ({ x, z, s = 1 }) => (
  <group position={[x, 0, z]} scale={s}>
    <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.2, 0.3, 2.4, 8]} />{M('#8a6f50')}</mesh>
    {[[0, 3.2, 0, 1.4], [0.8, 2.8, 0.3, 1], [-0.7, 2.9, -0.3, 1.1]].map(([a, b, c, r], i) => (
      <mesh key={i} position={[a, b, c]}><sphereGeometry args={[r, 9, 8]} />{M('#6aa85a', { flatShading: true })}</mesh>
    ))}
  </group>
);

// ---------- les mondes ----------
function Gotham({ purple }) {
  const body = purple ? '#3a2a5c' : '#2a3558';
  const lit = purple ? '#ff9be8' : '#ffd47a';
  return (
    <>
      <Sides seed={purple ? 21 : 11} zs={ZS} fn={(x, z, i, r) => <Tower x={x} z={z} w={2 + r() * 1.6} h={9 + r() * 14} color={body} lit={lit} glow={lit} />} />
      {/* réverbères le long du terrain */}
      {[1, -3, -7, -11].flatMap((z) => [-2.85, 2.85].map((x) => (
        <group key={`${z}${x}`} position={[x, 0, z]}>
          <mesh position={[0, 1.2, 0]}><cylinderGeometry args={[0.04, 0.05, 2.4, 6]} />{M('#22252e')}</mesh>
          <mesh position={[0, 2.45, 0]}><sphereGeometry args={[0.14, 8, 8]} />{M('#fff1b0', E('#ffd36b', 2))}</mesh>
        </group>
      )))}
      <mesh position={[-6, 15, -30]}><sphereGeometry args={[3, 16, 12]} />{M('#fff6d8', E('#fff6d8', 1.2))}</mesh>
      {purple && [[-5, 5, -9], [5.5, 7, -13]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]}><boxGeometry args={[2.4, 0.5, 0.15]} />{M('#ff4fa3', E('#ff4fa3', 2))}</mesh>
      ))}
    </>
  );
}

function Metropolis() {
  return (
    <>
      <Sides seed={31} zs={ZS} fn={(x, z, i, r) => <Tower x={x} z={z} w={2 + r() * 1.8} h={10 + r() * 18} color={r() < 0.5 ? '#8fb7e6' : '#dfeaf6'} lit="#bfe3ff" glow="#6aa6e0" />} />
      <Tree x={-3.5} z={1} s={0.9} /><Tree x={3.6} z={-2} s={1} /><Tree x={-3.6} z={-7} s={1.1} />
      {[[-7, 14, -22], [6, 17, -26], [0, 13, -30]].map(([x, y, z], i) => (
        <group key={i} position={[x, y, z]}>{[0, 1.6, -1.6].map((o) => <mesh key={o} position={[o, o * 0.1, 0]}><sphereGeometry args={[2.2, 10, 8]} />{M('#ffffff', E('#ffffff', 0.4))}</mesh>)}</group>
      ))}
    </>
  );
}

function Ice() {
  return (
    <>
      <Sides seed={41} zs={ZS} x0={3.4} fn={(x, z, i, r) => (
        <group position={[x, 0, z]} rotation={[0, r() * 3, 0]}>
          <mesh position={[0, 1.6 + r() * 2.4, 0]} scale={[1, 1.5 + r() * 1.2, 1]}><octahedronGeometry args={[1.1 + r() * 0.8, 0]} />
            <meshStandardMaterial color="#bfeaff" transparent opacity={0.82} roughness={0.15} metalness={0.2} flatShading emissive="#7fd2ff" emissiveIntensity={0.25} />
          </mesh>
        </group>
      )} />
      {[[-9, -24, 6], [3, -28, 8], [11, -22, 5]].map(([x, z, h], i) => (
        <mesh key={i} position={[x, h / 2, z]}><coneGeometry args={[h * 0.7, h, 6]} />{M('#eef8ff')}</mesh>
      ))}
    </>
  );
}

function NYC() {
  const bricks = ['#8a4a3a', '#a65a45', '#6a5a60', '#9b6a4a'];
  return (
    <>
      <Sides seed={51} zs={ZS} fn={(x, z, i, r) => <Tower x={x} z={z} w={2.4 + r() * 1.6} h={6 + r() * 9} color={bricks[Math.floor(r() * 4)]} lit="#ffd28a" glow="#ffd28a" />} />
      {[[-5.5, 12, -9], [6, 10, -15]].map(([x, h, z], i) => (
        <group key={i} position={[x, h, z]}>
          <mesh position={[0, 1.4, 0]}><cylinderGeometry args={[0.9, 0.9, 1.6, 10]} />{M('#7a5236')}</mesh>
          <mesh position={[0, 2.5, 0]}><coneGeometry args={[1, 0.8, 10]} />{M('#5a3a26')}</mesh>
          {[-0.6, 0.6].map((o) => <mesh key={o} position={[o, 0.3, 0]}><cylinderGeometry args={[0.06, 0.06, 1.2, 5]} />{M('#444')}</mesh>)}
        </group>
      ))}
      <mesh position={[0, 3, -34]}><sphereGeometry args={[5, 16, 12]} />{M('#ffb070', E('#ff8a3a', 1.4))}</mesh>
    </>
  );
}

function Tech() {
  return (
    <>
      <Sides seed={61} zs={ZS} fn={(x, z, i, r) => {
        const h = 6 + r() * 10;
        return (
          <group position={[x, 0, z]}>
            <mesh position={[0, h / 2, 0]}><boxGeometry args={[1.6, h, 1.6]} />{M('#18232b', { metalness: 0.5, roughness: 0.4 })}</mesh>
            {[-0.82, 0.82].map((o) => <mesh key={o} position={[o, h / 2, 0]}><boxGeometry args={[0.06, h * 0.92, 0.3]} />{M('#8fefff', E('#4fe3ff', 2))}</mesh>)}
            {i % 2 === 0 && <mesh position={[0, 2 + r() * 3, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[1.5, 0.05, 6, 28]} />{M('#8fefff', E('#4fe3ff', 2.2))}</mesh>}
          </group>
        );
      }} />
      {[[-3, -18], [3, -22], [0, -26]].map(([x, z], i) => (
        <mesh key={i} position={[x, 8, z]}><cylinderGeometry args={[0.5, 0.5, 16, 10]} />
          <meshBasicMaterial color="#6fe9ff" transparent opacity={0.28} depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}

function Canyon() {
  return (
    <>
      <Sides seed={71} zs={ZS} x0={4} fn={(x, z, i, r) => {
        const h = 4 + r() * 8;
        return <mesh position={[x, h / 2, z]}><cylinderGeometry args={[1.3 + r(), 2.2 + r() * 1.4, h, 7]} />{M(r() < 0.5 ? '#c8703c' : '#b05a30', { flatShading: true })}</mesh>;
      }} />
      {[[-3.4, -1], [3.5, -5], [-3.5, -9], [3.4, -12]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.7, 0]}><cylinderGeometry args={[0.16, 0.18, 1.4, 6]} />{M('#4f8a3c')}</mesh>
          <mesh position={[0.3, 0.9, 0]}><cylinderGeometry args={[0.1, 0.1, 0.6, 6]} />{M('#4f8a3c')}</mesh>
        </group>
      ))}
    </>
  );
}

function Speed() {
  return (
    <>
      <Sides seed={81} zs={ZS} fn={(x, z, i, r) => <Tower x={x} z={z} w={1.8 + r() * 1.4} h={6 + r() * 10} color="#3a2a54" lit="#ffb347" glow="#ffb347" />} />
      {/* éclairs et lignes de vitesse */}
      <Sides seed={83} zs={[-2, -6, -10, -14, -19]} x0={3.2} x1={6} fn={(x, z, i, r) => (
        <group position={[x, 4 + r() * 4, z]}>
          {[[0, 1.4, 0.45], [0.35, 0, -0.45], [0, -1.4, 0.45]].map(([a, b, rot], k) => (
            <mesh key={k} position={[a, b, 0]} rotation={[0, 0, rot]}><boxGeometry args={[0.25, 1.7, 0.25]} />{M('#ffe14a', E('#ffd21a', 2.4))}</mesh>
          ))}
        </group>
      )} />
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={i} position={[(i % 2 ? 1 : -1) * (3.4 + (i * 0.37) % 3), 1 + ((i * 1.7) % 7), -3 - i * 1.4]}>
          <boxGeometry args={[0.05, 0.05, 3.5]} />{M('#ffcf70', E('#ffb347', 2))}
        </mesh>
      ))}
    </>
  );
}

function Greek() {
  const stone = '#f4efe2';
  const Column = ({ x, z, h = 4.2 }) => (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.12, 0]}><boxGeometry args={[0.8, 0.24, 0.8]} />{M(stone)}</mesh>
      <mesh position={[0, h / 2 + 0.2, 0]}><cylinderGeometry args={[0.26, 0.32, h, 12]} />{M(stone)}</mesh>
      <mesh position={[0, h + 0.3, 0]}><boxGeometry args={[0.85, 0.22, 0.85]} />{M(stone)}</mesh>
    </group>
  );
  return (
    <>
      {[1, -2, -5, -8, -11, -14].flatMap((z) => [-3.5, 3.5].map((x) => <Column key={`${z}${x}`} x={x} z={z} />))}
      {/* temple au fond */}
      <group position={[0, 0, -22]}>
        <mesh position={[0, 0.3, 0]}><boxGeometry args={[14, 0.6, 5]} />{M(stone)}</mesh>
        {[-5.5, -3.3, -1.1, 1.1, 3.3, 5.5].map((x) => <Column key={x} x={x} z={0} h={5.5} />)}
        <mesh position={[0, 6.8, 0]}><boxGeometry args={[14, 0.5, 5]} />{M(stone)}</mesh>
        <mesh position={[0, 8, 0]} rotation={[Math.PI / 2, 0, 0]}><coneGeometry args={[5, 2, 3]} />{M('#efe7d4')}</mesh>
      </group>
      <Tree x={-6.5} z={-4} s={1.1} /><Tree x={6.8} z={-9} s={1.2} /><Tree x={-7} z={-15} />
    </>
  );
}

function Neon() {
  const cols = ['#ff4fa3', '#4fe3ff', '#ffd23f', '#a06bff'];
  return (
    <>
      <Sides seed={91} zs={ZS} fn={(x, z, i, r) => (
        <group position={[x, 0, z]}>
          <Tower x={0} z={0} w={2 + r() * 1.4} h={7 + r() * 11} color="#2a2040" lit="#ff8be0" glow="#ff8be0" />
          <mesh position={[(x > 0 ? -1.2 : 1.2), 3 + r() * 5, 0.8]}><boxGeometry args={[0.15, 1.6, 1.2]} />{M(cols[i % 4], E(cols[i % 4], 2.4))}</mesh>
        </group>
      )} />
      {[[-3.2, 4, -6], [3.2, 5, -12]].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[1.3, 0.07, 8, 30]} />{M(cols[i], E(cols[i], 2.4))}</mesh>
      ))}
    </>
  );
}

const COMPONENTS = { gotham: () => <Gotham />, gothamPurple: () => <Gotham purple />, metropolis: Metropolis, ice: Ice, nyc: NYC, tech: Tech, canyon: Canyon, speed: Speed, greek: Greek, neon: Neon };

function Stage({ id }) {
  const C = COMPONENTS[id] ?? Metropolis;
  return <C />;
}

export default memo(Stage);
