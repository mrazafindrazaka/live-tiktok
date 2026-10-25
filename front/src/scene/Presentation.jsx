import { useMemo, useRef, useState } from 'react';
import { createPortal, useFrame } from '@react-three/fiber';
import { CanvasTexture, DoubleSide, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderTarget } from 'three';
import Hero from './Hero.jsx';
import { HEROES } from '../heroes.js';
import { STAGES } from '../stages.js';
import { DANCE_TIME } from '../dances.js';

// L'écran géant derrière le terrain présente chaque personnage à tour de rôle : une petite scène 3D (le personnage
// fait sa danse devant le décor de son monde), dessinée dans une cible de rendu puis affichée sur l'écran.
const W = 640;
const H = 250;
const SLOT = 4.6; // secondes par personnage
const ORDER = Object.keys(HEROES);

const TAGLINES = {
  batman: 'MAÎTRE DE LA NUIT', superman: "L'HOMME D'ACIER", spiderman: 'TON AMI DU QUARTIER', ironman: 'GÉNIE EN ARMURE', hulk: 'FORCE BRUTE',
  flash: 'PLUS VITE QUE LA LUMIÈRE', wonderwoman: "GUERRIÈRE D'AMAZONIE", supergirl: "FILLE DE L'ACIER", batgirl: 'GARDIENNE DE LA NUIT', catwoman: 'VOLEUSE DE NUIT',
};

const miniRig = () => ({
  x: 0, z: 0, speed: 0, walkPhase: 0, crouch: 0, arm: 0.05, elbow: 0.1, lean: 0, twist: 0, face: Math.PI, spinSpeed: 0, hop: 0,
  armsUp: 0, slump: 0, glow: 0, flyY: 0, scale: 1, visible: true, holding: false, hand: [0, 1, 0], dance: null,
});

function canvasTex(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const tex = new CanvasTexture(c);
  tex.colorSpace = SRGBColorSpace;
  return { c, g: c.getContext('2d'), tex };
}

// Décor 2D du monde du personnage (ciel, silhouettes) : dessiné une fois à chaque changement de personnage.
function paintBackdrop(g, w, h, id) {
  const S = STAGES[id];
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, S.sky[0]);
  sky.addColorStop(1, S.sky[1]);
  g.fillStyle = sky;
  g.fillRect(0, 0, w, h);
  let seed = id.length * 97;
  const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const ground = h * 0.7;
  const skyline = (color, min, max, lit) => {
    for (let x = 0; x < w; x += 30 + r() * 40) {
      const bw = 40 + r() * 60;
      const bh = min + r() * (max - min);
      g.fillStyle = color;
      g.fillRect(x, ground - bh, bw, bh);
      if (lit) for (let yy = ground - bh + 10; yy < ground - 8; yy += 14) for (let xx = x + 6; xx < x + bw - 8; xx += 12) {
        if (r() < 0.45) { g.fillStyle = lit; g.fillRect(xx, yy, 6, 7); }
      }
    }
  };
  const glow = (x, y, rad, col) => {
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, col);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  };
  switch (id) {
    case 'gotham': case 'gothamPurple':
      glow(w * 0.78, h * 0.25, 90, 'rgba(255,246,216,0.9)');
      g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(w * 0.78, h * 0.25, 28, 0, 7); g.fill();
      skyline(id === 'gotham' ? '#161c30' : '#22183a', 60, 190, id === 'gotham' ? '#ffd47a' : '#ff9be8');
      break;
    case 'metropolis':
      for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(r() * w, 40 + r() * 80, 70, 22, 0, 0, 7); g.fill(); }
      skyline('#7fb0e0', 80, 210, '#dff2ff');
      break;
    case 'ice':
      for (let i = 0; i < 5; i++) { g.fillStyle = '#eaf6ff'; g.beginPath(); const x = i * w / 4; g.moveTo(x - 120, ground); g.lineTo(x, ground - 120 - r() * 70); g.lineTo(x + 120, ground); g.fill(); }
      for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(160,230,255,0.85)'; g.beginPath(); const x = r() * w; g.moveTo(x - 18, ground); g.lineTo(x, ground - 60 - r() * 60); g.lineTo(x + 18, ground); g.fill(); }
      break;
    case 'nyc':
      glow(w * 0.3, ground - 10, 160, 'rgba(255,170,90,0.9)');
      skyline('#7a4638', 70, 200, '#ffd28a');
      break;
    case 'tech':
      g.strokeStyle = 'rgba(111,233,255,0.55)'; g.lineWidth = 2;
      for (let i = 0; i < 4; i++) { g.beginPath(); g.ellipse(w * 0.5, h * 0.4, 70 + i * 55, 28 + i * 14, 0, 0, 7); g.stroke(); }
      skyline('#15222b', 60, 170, '#6fe9ff');
      break;
    case 'canyon':
      glow(w * 0.7, h * 0.3, 130, 'rgba(255,230,160,0.9)');
      for (let i = 0; i < 5; i++) { g.fillStyle = i % 2 ? '#b05a30' : '#c8703c'; const x = i * w / 4 - 30; g.fillRect(x, ground - 80 - r() * 90, 150, 200); }
      break;
    case 'speed':
      for (let i = 0; i < 26; i++) { g.strokeStyle = `rgba(255,${180 + r() * 60 | 0},80,${0.3 + r() * 0.5})`; g.lineWidth = 2 + r() * 3; g.beginPath(); const y = r() * h; g.moveTo(r() * w * 0.4, y); g.lineTo(w * 0.4 + r() * w * 0.6, y); g.stroke(); }
      g.strokeStyle = '#ffe14a'; g.lineWidth = 6;
      for (const x of [w * 0.12, w * 0.88]) { g.beginPath(); g.moveTo(x, 20); g.lineTo(x - 22, 110); g.lineTo(x + 10, 110); g.lineTo(x - 18, 210); g.stroke(); }
      break;
    case 'greek':
      glow(w * 0.5, h * 0.2, 150, 'rgba(255,240,200,0.7)');
      g.fillStyle = '#f4efe2';
      for (let i = 0; i < 7; i++) g.fillRect(w * 0.18 + i * 80, ground - 150, 22, 150);
      g.fillRect(w * 0.18 - 20, ground - 170, 7 * 80 + 40, 20);
      g.beginPath(); g.moveTo(w * 0.18 - 20, ground - 170); g.lineTo(w * 0.5, ground - 235); g.lineTo(w * 0.82 + 20, ground - 170); g.fill();
      break;
    case 'neon':
      skyline('#1b1626', 70, 190, '#ff8be0');
      for (const [x, y, c] of [[0.2, 0.3, '#ff4fa3'], [0.55, 0.2, '#4fe3ff'], [0.8, 0.35, '#ffd23f']]) { g.fillStyle = c; g.shadowColor = c; g.shadowBlur = 24; g.fillRect(w * x, h * y, 90, 18); g.shadowBlur = 0; }
      break;
    default: break;
  }
}

function paintTitle(g, w, h, id) {
  const hero = HEROES[id];
  g.clearRect(0, 0, w, h);
  g.fillStyle = 'rgba(8,10,20,0.62)';
  g.beginPath(); g.moveTo(0, h * 0.64); g.lineTo(w * 0.62, h * 0.64); g.lineTo(w * 0.56, h); g.lineTo(0, h); g.fill();
  g.fillStyle = hero.color;
  g.fillRect(0, h * 0.64, w * 0.02, h * 0.36);
  g.font = "700 74px 'Barlow Condensed', 'Arial Narrow', sans-serif";
  g.textBaseline = 'alphabetic';
  g.lineWidth = 6; g.strokeStyle = 'rgba(8,10,20,0.9)'; g.strokeText(hero.name, 28, h * 0.84);
  g.fillStyle = '#fff'; g.fillText(hero.name, 28, h * 0.84);
  g.font = "500 28px 'Barlow Condensed', 'Arial Narrow', sans-serif";
  g.fillStyle = hero.color;
  g.fillText(TAGLINES[id] ?? '', 30, h * 0.95);
}

function MiniScene({ id }) {
  const backdrop = useMemo(() => {
    const t = canvasTex(1024, 400);
    paintBackdrop(t.g, 1024, 400, HEROES[id].stage);
    t.tex.needsUpdate = true;
    return t.tex;
  }, [id]);
  const title = useMemo(() => {
    const t = canvasTex(W, H);
    paintTitle(t.g, W, H, id);
    t.tex.needsUpdate = true;
    return t.tex;
  }, [id]);
  const ground = STAGES[HEROES[id].stage].ground;
  const titleRef = useRef();
  const born = useMemo(() => performance.now(), [id]);
  useFrame(() => {
    // le bandeau de titre glisse depuis la gauche à chaque nouveau personnage
    if (!titleRef.current) return;
    const k = Math.min(1, (performance.now() - born) / 450);
    titleRef.current.position.x = -4.6 * (1 - k) * (1 - k);
  });
  return (
    <>
      <mesh position={[0, 1.6, -4]}>
        <planeGeometry args={[17, 6.6]} />
        <meshBasicMaterial map={backdrop} toneMapped={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]}>
        <planeGeometry args={[18, 9]} />
        <meshStandardMaterial color={ground} roughness={1} />
      </mesh>
      <mesh ref={titleRef} position={[-4.6, 1.25, 2.4]} renderOrder={10}>
        <planeGeometry args={[4.4, 1.72]} />
        <meshBasicMaterial map={title} transparent depthTest={false} side={DoubleSide} toneMapped={false} />
      </mesh>
    </>
  );
}

export default function Presentation() {
  const [idx, setIdx] = useState(0);
  const id = ORDER[idx];
  const rig = useMemo(miniRig, []);
  const clock = useRef({ t: 0, acc: 1 });
  const { scene, cam, target } = useMemo(() => {
    const cam = new PerspectiveCamera(32, W / H, 0.1, 60);
    cam.position.set(0, 1.25, 5.6);
    cam.lookAt(0, 1.1, 0);
    return { scene: new Scene(), cam, target: new WebGLRenderTarget(W, H) };
  }, []);

  useFrame(({ gl, clock: c }, dt) => {
    const k = clock.current;
    k.t += Math.min(dt, 0.1);
    if (k.t >= SLOT) {
      k.t = 0;
      setIdx((i) => (i + 1) % ORDER.length);
    }
    rig.dance = k.t < DANCE_TIME ? { id: ORDER[idx], t: k.t } : null;
    rig.armsUp = k.t >= DANCE_TIME ? 0.0 : 0;
    k.acc += dt;
    if (k.acc < 1 / 20) return;
    k.acc = 0;
    const prev = gl.getRenderTarget();
    gl.setRenderTarget(target);
    gl.render(scene, cam);
    gl.setRenderTarget(prev);
  });

  return (
    <>
      {createPortal(
        <>
          <hemisphereLight args={['#ffffff', '#6a6a7a', 1.1]} />
          <directionalLight position={[3, 6, 5]} intensity={1.6} />
          <MiniScene key={`scene-${id}`} id={id} />
          <Hero key={`hero-${id}`} slot="A" heroId={id} rig={rig} />
        </>,
        scene,
      )}
      {/* écran réduit : il tient entre les deux colonnes de dons, donc rien n'est caché */}
      <group position={[0, 2.3, -7.9]}>
        <mesh position={[0, 0, -0.1]}>
          <boxGeometry args={[5.9, 2.5, 0.16]} />
          <meshStandardMaterial color="#10121a" roughness={0.5} metalness={0.5} />
        </mesh>
        <mesh>
          <planeGeometry args={[5.6, 2.19]} />
          <meshBasicMaterial map={target.texture} toneMapped={false} fog={false} />
        </mesh>
        {[-2.4, 2.4].map((x) => (
          <mesh key={x} position={[x, -1.7, -0.1]}>
            <boxGeometry args={[0.18, 1.3, 0.18]} />
            <meshStandardMaterial color="#10121a" />
          </mesh>
        ))}
      </group>
    </>
  );
}
