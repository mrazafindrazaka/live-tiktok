import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, Object3D } from 'three';
import { game } from '../game.js';

const MAX = 900;
const WAVES = 4;

export default function Fx() {
  const spheres = useRef();
  const boxes = useRef();
  const rings = useRef([]);
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);

  useFrame(() => {
    const parts = game.fx.parts;
    let ns = 0;
    let nb = 0;
    for (const p of parts) {
      const k = p.life / p.max;
      const scale = p.size * (p.grow ? 1 + (1 - k) * p.grow : Math.min(1, k * 2.5 + 0.2));
      dummy.position.set(p.x, p.y, p.z);
      dummy.scale.setScalar(scale);
      dummy.rotation.set(p.rot, p.rot * 0.7, 0);
      dummy.updateMatrix();
      const mesh = p.shape === 'box' ? boxes.current : spheres.current;
      const i = p.shape === 'box' ? nb++ : ns++;
      mesh.setMatrixAt(i, dummy.matrix);
      mesh.setColorAt(i, color.setRGB(p.col[0], p.col[1], p.col[2]));
    }
    for (const [mesh, n] of [[spheres.current, ns], [boxes.current, nb]]) {
      mesh.count = n;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    rings.current.forEach((ring, i) => {
      const w = game.fx.waves[i];
      ring.visible = !!w;
      if (!w) return;
      const k = w.t / w.max;
      ring.position.set(w.x, w.y, w.z);
      ring.scale.setScalar(0.2 + k * 4);
      ring.material.opacity = (1 - k) * 0.7;
    });
  });

  return (
    <>
      <instancedMesh ref={spheres} args={[undefined, undefined, MAX]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={boxes} args={[undefined, undefined, 160]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {Array.from({ length: WAVES }, (_, i) => (
        <mesh key={i} ref={(el) => (rings.current[i] = el)} rotation-x={-Math.PI / 2} visible={false}>
          <ringGeometry args={[0.9, 1, 40]} />
          <meshBasicMaterial color="#fff6d8" transparent depthWrite={false} />
        </mesh>
      ))}
    </>
  );
}
