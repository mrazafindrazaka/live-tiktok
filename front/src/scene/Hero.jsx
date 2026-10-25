import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, Vector3 } from 'three';
import { game } from '../game.js';
import { HEROES } from '../heroes.js';
import { DANCES } from '../dances.js';
import { R } from '../physics.js';
import { blobTexture, webTexture } from '../textures.js';

const L = 0.46; // longueur cuisse / tibia
const FOOT = 0.07;
const SEG = 12;
const ARMS_UP = 3.05;
const lerp = (a, b, k) => a + (b - a) * k;

const M = (color, extra) => <meshStandardMaterial color={color} roughness={0.75} {...extra} />;
const GLOW = (c) => ({ emissive: c, emissiveIntensity: 1.6 });

function Leg({ x, thigh, shin, spec, b }) {
  return (
    <group ref={thigh} position={[x, 0, 0]}>
      <mesh position={[0, -L / 2, 0]}>
        <cylinderGeometry args={[0.125 * b, 0.1 * b, L, SEG]} />
        {M(spec.legs)}
      </mesh>
      <group ref={shin} position={[0, -L, 0]}>
        <mesh position={[0, -L / 2, 0]}>
          <cylinderGeometry args={[0.1 * b, 0.08 * b, L, SEG]} />
          {M(spec.legs)}
        </mesh>
        <mesh position={[0, -L + 0.14, 0]}>
          <cylinderGeometry args={[0.108 * b, 0.096 * b, 0.28, SEG]} />
          {M(spec.boots)}
        </mesh>
        <mesh position={[0, -L - FOOT / 2 + 0.01, -0.06]}>
          <boxGeometry args={[0.17 * b, FOOT, 0.32]} />
          {M(spec.boots)}
        </mesh>
      </group>
    </group>
  );
}

const LongHair = ({ color }) => (
  <>
    <mesh position={[0, -0.14, 0.14]} scale={[1.02, 1.55, 0.5]}>
      <sphereGeometry args={[0.2, 12, 10]} />
      {M(color)}
    </mesh>
    {[-1, 1].map((s) => (
      <mesh key={s} position={[s * 0.19, -0.1, -0.03]} scale={[0.4, 1.5, 0.55]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        {M(color)}
      </mesh>
    ))}
  </>
);

function Head({ spec }) {
  const skull = (c) => (
    <mesh scale={[0.92, 1, 1.02]}>
      <sphereGeometry args={[0.215, 16, 14]} />
      {M(c)}
    </mesh>
  );
  const eyes = (c, w = 0.075, h = 0.04, y = 0.03, z = -0.195, extra) =>
    [-1, 1].map((s) => (
      <mesh key={s} position={[s * w, y, z]} rotation={[0, 0, s * 0.12]} scale={[1, h / 0.04, 0.4]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        {M(c, extra)}
      </mesh>
    ));
  switch (spec.head) {
    case 'cowl':
      return (
        <>
          {skull(spec.cowl)}
          <mesh position={[0, -0.085, -0.075]} scale={[0.95, 0.7, 0.95]}>
            <sphereGeometry args={[0.165, 12, 10]} />
            {M(spec.skin)}
          </mesh>
          {eyes('#ffffff', 0.075, 0.03, 0.04, -0.2)}
          {spec.hair && <LongHair color={spec.hair} />}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.115, 0.23, 0.01]} rotation={[0, 0, -s * 0.12]}>
              <coneGeometry args={[0.05, 0.19, 6]} />
              {M(spec.cowl)}
            </mesh>
          ))}
        </>
      );
    case 'cat':
      return (
        <>
          {skull(spec.cowl)}
          <mesh position={[0, -0.085, -0.075]} scale={[0.95, 0.7, 0.95]}>
            <sphereGeometry args={[0.165, 12, 10]} />
            {M(spec.skin)}
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 0.13, 0.23, 0.0]} rotation={[0, 0, -s * 0.3]}>
                <coneGeometry args={[0.055, 0.2, 6]} />
                {M(spec.cowl)}
              </mesh>
              <mesh position={[s * 0.085, 0.13, -0.175]} rotation={[Math.PI / 2 - 0.3, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.035, 12]} />
                {M('#d9f6ff', GLOW('#8fe9ff'))}
              </mesh>
            </group>
          ))}
          {eyes('#ffffff', 0.075, 0.025, 0.035, -0.2)}
        </>
      );
    case 'hair':
      return (
        <>
          {skull(spec.skin)}
          <mesh position={[0, 0.045, 0.03]} rotation={[-0.15, 0, 0]}>
            <sphereGeometry args={[0.226, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
            {M(spec.hair)}
          </mesh>
          <mesh position={[0.05, 0.19, -0.14]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            {M(spec.hair)}
          </mesh>
          {spec.hairStyle === 'long' && <LongHair color={spec.hair} />}
          {spec.tiara && (
            <group position={[0, 0.15, -0.185]} rotation={[0.45, 0, 0]}>
              <mesh>
                <boxGeometry args={[0.22, 0.035, 0.02]} />
                {M('#f2c230', { metalness: 0.5, roughness: 0.3 })}
              </mesh>
              <mesh position={[0, 0.03, 0]}>
                <coneGeometry args={[0.03, 0.05, 4]} />
                {M('#c4262e')}
              </mesh>
            </group>
          )}
          {eyes('#2a2a2a', 0.075, 0.025, 0.02, -0.2)}
          <mesh position={[0, -0.09, -0.2]} scale={[1.6, 0.5, 0.4]}>
            <sphereGeometry args={[0.03, 8, 6]} />
            {M('#b9645c')}
          </mesh>
        </>
      );
    case 'full':
      return (
        <>
          {skull(spec.torso)}
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 0.085, 0.035, -0.19]} rotation={[0, 0, s * 0.35]}>
              <mesh scale={[1.25, 1.55, 0.4]}>
                <sphereGeometry args={[0.05, 10, 8]} />
                {M('#101010')}
              </mesh>
              <mesh position={[0, 0, -0.012]} scale={[1.05, 1.35, 0.4]}>
                <sphereGeometry args={[0.05, 10, 8]} />
                {M('#ffffff')}
              </mesh>
            </group>
          ))}
        </>
      );
    case 'iron':
      return (
        <>
          {skull(spec.torso)}
          <mesh position={[0, -0.025, -0.12]} scale={[0.88, 1, 0.55]}>
            <sphereGeometry args={[0.2, 14, 12]} />
            {M('#e5b23a', { metalness: 0.4, roughness: 0.4 })}
          </mesh>
          {eyes('#d9fbff', 0.07, 0.022, 0.035, -0.205, GLOW('#8ff3ff'))}
        </>
      );
    case 'hulk':
      return (
        <>
          {skull(spec.skin)}
          <mesh position={[0, 0.06, 0.035]} rotation={[-0.2, 0, 0]}>
            <sphereGeometry args={[0.225, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.42]} />
            {M('#1e1e1e')}
          </mesh>
          <mesh position={[0, -0.1, -0.1]} scale={[1.1, 0.7, 0.8]}>
            <sphereGeometry args={[0.15, 10, 8]} />
            {M(spec.skin)}
          </mesh>
          {eyes('#ffffff', 0.075, 0.03, 0.02, -0.2)}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.075, 0.075, -0.2]} rotation={[0, 0, s * 0.5]}>
              <boxGeometry args={[0.1, 0.025, 0.03]} />
              {M('#1e1e1e')}
            </mesh>
          ))}
        </>
      );
    case 'flash':
      return (
        <>
          {skull(spec.torso)}
          <mesh position={[0, -0.085, -0.07]} scale={[0.95, 0.7, 0.95]}>
            <sphereGeometry args={[0.165, 12, 10]} />
            {M(spec.skin)}
          </mesh>
          {eyes('#ffffff', 0.08, 0.03, 0.045, -0.2)}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.22, 0.06, 0.0]} rotation={[0, 0, -s * Math.PI / 2 + s * 0.2]}>
              <coneGeometry args={[0.04, 0.17, 6]} />
              {M(spec.gloves)}
            </mesh>
          ))}
        </>
      );
    default:
      return skull(spec.skin);
  }
}

function Emblem({ spec }) {
  const pos = [0, 0.43, -0.2];
  switch (spec.emblem) {
    case 'bat':
      return (
        <group position={pos}>
          <mesh scale={[1.5, 1, 0.25]}>
            <sphereGeometry args={[0.07, 12, 8]} />
            {M('#e8b923')}
          </mesh>
          <mesh position={[0, 0, -0.012]} scale={[2.1, 0.75, 0.2]}>
            <sphereGeometry args={[0.04, 8, 6]} />
            {M('#15171d')}
          </mesh>
        </group>
      );
    case 'diamond':
      return (
        <group position={pos} rotation={[0, 0, Math.PI / 4]}>
          <mesh>
            <boxGeometry args={[0.15, 0.15, 0.02]} />
            {M('#e8b923')}
          </mesh>
          <mesh position={[0, 0, -0.012]}>
            <boxGeometry args={[0.1, 0.1, 0.02]} />
            {M('#c8262e')}
          </mesh>
        </group>
      );
    case 'spider':
      return (
        <group position={pos}>
          <mesh scale={[1, 1.3, 0.3]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            {M('#111111')}
          </mesh>
          {[-1, 1].map((s) =>
            [-0.5, 0, 0.5].map((a) => (
              <mesh key={`${s}${a}`} position={[s * 0.06, a * 0.07, 0]} rotation={[0, 0, s * (0.5 + a)]}>
                <boxGeometry args={[0.1, 0.012, 0.012]} />
                {M('#111111')}
              </mesh>
            )),
          )}
        </group>
      );
    case 'arc':
      return (
        <mesh position={pos} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.065, 0.065, 0.03, 18]} />
          {M('#8ff3ff', GLOW('#8ff3ff'))}
        </mesh>
      );
    case 'crest':
      return (
        <group position={pos}>
          <mesh scale={[1.6, 1, 0.3]}>
            <sphereGeometry args={[0.06, 10, 8]} />
            {M('#f2c230', { metalness: 0.5, roughness: 0.3 })}
          </mesh>
          <mesh position={[0, 0, -0.012]} scale={[3.2, 0.5, 0.3]}>
            <sphereGeometry args={[0.025, 8, 6]} />
            {M('#c4262e')}
          </mesh>
        </group>
      );
    case 'bolt':
      return (
        <group position={pos}>
          {[[-0.03, 0.06, 0.5], [0.02, 0.0, -0.5], [-0.02, -0.06, 0.5]].map(([x, y, r], i) => (
            <mesh key={i} position={[x, y, 0]} rotation={[0, 0, r]}>
              <boxGeometry args={[0.1, 0.03, 0.015]} />
              {M('#f2c230')}
            </mesh>
          ))}
        </group>
      );
    default:
      return null;
  }
}

export default function Hero({ slot, heroId, rig: rigProp }) {
  const spec = HEROES[heroId];
  const b = spec.big ? 1.25 : 1;
  const fw = spec.female ? 0.88 : 1; // silhouette plus fine
  const shoulder = 0.4 * b * fw;
  const root = useRef();
  const flipG = useRef();
  const hips = useRef();
  const upper = useRef();
  const armR = useRef();
  const elbowR = useRef();
  const armL = useRef();
  const elbowL = useRef();
  const thighL = useRef();
  const thighR = useRef();
  const shinL = useRef();
  const shinR = useRef();
  const head = useRef();
  const cape = useRef();
  const hand = useRef();
  const held = useRef();
  const aura = useRef();
  const shadow = useRef();
  const tmp = useMemo(() => new Vector3(), []);
  const blob = useMemo(blobTexture, []);
  const web = useMemo(() => (spec.web ? webTexture(spec.torso, '#5a0f14') : null), [spec]);
  const off = useMemo(() => Math.random() * 6, []);
  const rig = rigProp ?? game.rig[slot];
  const suit = (c) => M(c, web ? { map: web } : undefined);

  useFrame((state) => {
    const t = state.clock.elapsedTime + off;
    const D = rig.dance ? DANCES[rig.dance.id]?.(rig.dance.t) : null; // écarts de pose de la danse d'entrée
    const flying = !rigProp && rig.flyY > 0.25 && game.state === 'ko';
    const walk = Math.min(1, rig.speed / 1.2);
    const ph = rig.walkPhase;
    const sw = Math.sin(ph) * 0.55 * walk;
    const crouch = flying ? 0 : D?.crouch ?? rig.crouch;
    const th = 0.62 * crouch;
    const sh = -1.25 * crouch;

    root.current.visible = rig.visible;
    root.current.scale.setScalar(rig.scale);
    root.current.position.set(rig.x, rig.flyY + rig.hop + (D?.hop ?? 0), rig.z);
    root.current.rotation.y = rig.face + (D?.spin ?? 0);
    flipG.current.rotation.x = D?.flip ?? 0;

    hips.current.position.set(
      0,
      L * Math.cos(th) + L * Math.cos(th + sh) + FOOT + Math.sin(t * 1.8) * 0.008,
      L * (Math.sin(th) + Math.sin(th + sh)),
    );
    thighL.current.rotation.x = th + sw;
    thighR.current.rotation.x = th - sw + (D?.kickR ?? 0);
    shinL.current.rotation.x = sh - Math.max(0, Math.sin(ph + 1.2)) * 0.6 * walk;
    shinR.current.rotation.x = sh - Math.max(0, -Math.sin(ph + 1.2)) * 0.6 * walk;

    const lean = rig.lean + (D?.lean ?? 0);
    upper.current.rotation.set(-lean + rig.slump * 0.35, rig.twist + (D?.twist ?? 0), 0);
    head.current.rotation.set(-0.05 + crouch * 0.1 + rig.slump * 0.6 + (D?.head?.[0] ?? 0), Math.sin(t * 0.8) * 0.06 + (D?.head?.[1] ?? 0), 0);

    const up = rig.armsUp;
    const aR = D?.armR;
    const aL = D?.armL;
    armR.current.rotation.set(aR ? aR[0] : lerp(rig.arm, ARMS_UP, up), 0, aR ? aR[1] : up * 0.25);
    elbowR.current.rotation.x = D?.elbowR ?? lerp(rig.elbow, 0.15, up);
    armL.current.rotation.set(
      aL ? aL[0] : lerp(Math.sin(t * 1.5) * 0.04 - rig.lean * 0.3 - sw * 0.9, ARMS_UP, up),
      0,
      aL ? aL[1] : lerp(-(0.08 + crouch * 0.5), -0.25, up),
    );
    elbowL.current.rotation.x = D?.elbowL ?? lerp(0.12, 0.15, up);

    if (cape.current) {
      const flare = Math.min(1, Math.abs(rig.spinSpeed + (D ? 4 : 0)) * 0.12);
      cape.current.rotation.set(0.1 + flare * 0.7 + walk * 0.15 + Math.sin(t * 2) * 0.03 - (flying ? 0.2 : 0), 0, Math.sin(t * 1.3) * 0.03);
    }

    hand.current.getWorldPosition(tmp);
    rig.hand = [tmp.x, tmp.y, tmp.z];
    held.current.visible = rig.holding;
    const glow = Math.max(rig.glow, D?.glow ?? 0);
    aura.current.visible = glow > 0.02;
    aura.current.material.opacity = glow * (0.28 + Math.sin(t * 14) * 0.06);
    aura.current.scale.setScalar(1 + glow * 0.1 + Math.sin(t * 10) * 0.02);
    shadow.current.visible = rig.visible;
    shadow.current.position.set(rig.x, 0.013, rig.z);
    shadow.current.scale.set(1.5 * rig.scale / (1 + rig.flyY * 0.15), 1.1 * rig.scale / (1 + rig.flyY * 0.15), 1);
  });

  const arm = (side) => (
    <>
      <mesh position={[0, -0.19, 0]}>
        <cylinderGeometry args={[0.085 * b, 0.075 * b, 0.38, 10]} />
        {suit(spec.arms)}
      </mesh>
      <group ref={side === 'R' ? elbowR : elbowL} position={[0, -0.38, 0]}>
        <mesh position={[0, -0.17, 0]}>
          <cylinderGeometry args={[0.072 * b, 0.062 * b, 0.34, 10]} />
          {suit(spec.arms)}
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.078 * b, 0.07 * b, 0.14, 10]} />
          {M(spec.gloves)}
        </mesh>
        <group ref={side === 'R' ? hand : undefined} position={[0, -0.42, 0]}>
          <mesh>
            <sphereGeometry args={[0.082 * b, 10, 10]} />
            {M(spec.gloves)}
          </mesh>
          {side === 'R' && (
            <mesh ref={held} position={[0, -0.1, 0]}>
              <sphereGeometry args={[R, 14, 14]} />
              <meshStandardMaterial color={spec.boule.body} metalness={0.3} roughness={0.4} />
            </mesh>
          )}
        </group>
      </group>
    </>
  );

  return (
    <>
      <mesh ref={shadow} rotation-x={-Math.PI / 2}>
        <planeGeometry />
        <meshBasicMaterial map={blob} transparent depthWrite={false} />
      </mesh>
      <group ref={root}>
       <group ref={flipG} position={[0, 1, 0]}>
        <group position={[0, -1, 0]}>
        <group ref={hips}>
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.25 * b, 0.27 * b, 0.26, 14]} />
            {M(spec.trunks ?? spec.legs)}
          </mesh>
          {spec.skirt && (
            <mesh position={[0, -0.1, 0]}>
              <cylinderGeometry args={[0.27, 0.42, 0.3, 18, 1, true]} />
              <meshStandardMaterial color={spec.skirt} side={DoubleSide} roughness={0.85} />
            </mesh>
          )}
          {spec.belt && (
            <mesh position={[0, 0.17, 0]}>
              <cylinderGeometry args={[0.265 * b, 0.265 * b, 0.05, 14]} />
              {M(spec.belt)}
            </mesh>
          )}
          <Leg x={-0.15 * b} thigh={thighL} shin={shinL} spec={spec} b={b} />
          <Leg x={0.15 * b} thigh={thighR} shin={shinR} spec={spec} b={b} />

          <group ref={upper} position={[0, 0.12, 0]}>
            <mesh position={[0, 0.34, 0]} scale={[1.05 * b * fw, 1, 0.64 * (b > 1 ? 1.15 : 1)]}>
              <cylinderGeometry args={[0.34, 0.27, 0.66, 16]} />
              {suit(spec.torso)}
            </mesh>
            <Emblem spec={spec} />
            <mesh position={[0, 0.7, 0]}>
              <cylinderGeometry args={[0.1, 0.12, 0.1, 10]} />
              {M(spec.skin)}
            </mesh>
            <group ref={head} position={[0, 0.92, 0]}>
              <Head spec={spec} />
            </group>

            {spec.cape && (
              <group ref={cape} position={[0, 0.66, 0.17]}>
                <mesh position={[0, -0.52, 0]}>
                  <planeGeometry args={[0.72, 1.1, 1, 1]} />
                  <meshStandardMaterial color={spec.cape} side={DoubleSide} roughness={0.9} />
                </mesh>
              </group>
            )}

            <group ref={armR} position={[shoulder, 0.6, 0]}>{arm('R')}</group>
            <group ref={armL} position={[-shoulder, 0.6, 0]}>{arm('L')}</group>
          </group>
        </group>
        </group>
       </group>
        {/* halo d'énergie pendant la charge du K.O. */}
        <mesh ref={aura} position={[0, 1.05, 0]} scale={1}>
          <sphereGeometry args={[1.1, 16, 12]} />
          <meshBasicMaterial color={spec.color} transparent opacity={0.3} depthWrite={false} />
        </mesh>
      </group>
    </>
  );
}
