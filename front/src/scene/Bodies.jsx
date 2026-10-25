import { useMemo, useRef, useSyncExternalStore } from 'react';
import { useFrame } from '@react-three/fiber';
import { game } from '../game.js';
import { blobTexture } from '../textures.js';

const JACK_STYLE = { body: '#ffcf40', ring: null };

function Body({ id }) {
  const group = useRef();
  const shadow = useRef();
  const blob = useMemo(blobTexture, []);
  const b0 = game.world.bodies.get(id);
  const style = b0.style ?? JACK_STYLE;
  const r = b0.r;

  useFrame(() => {
    const b = game.world.bodies.get(id);
    if (!b) return;
    const s = 1 - b.fade;
    group.current.position.set(b.pos[0], b.pos[1], b.pos[2]);
    group.current.scale.setScalar(s);
    group.current.rotation.set(b.rotX, 0, b.rotZ);
    const h = Math.max(0, b.pos[1] - r);
    shadow.current.position.set(b.pos[0], 0.014, b.pos[2]);
    shadow.current.scale.setScalar(r * 3.4 * s * (1 + h * 0.25));
    shadow.current.material.opacity = 1 / (1 + h * 0.8);
  });

  return (
    <>
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[r, 16, 16]} />
          <meshStandardMaterial color={style.body} metalness={0.3} roughness={0.4} />
        </mesh>
        {style.ring && (
          <mesh>
            <torusGeometry args={[r * 0.99, 0.011, 6, 24]} />
            <meshStandardMaterial color={style.ring} roughness={0.5} />
          </mesh>
        )}
      </group>
      <mesh ref={shadow} rotation-x={-Math.PI / 2}>
        <planeGeometry />
        <meshBasicMaterial map={blob} transparent depthWrite={false} />
      </mesh>
    </>
  );
}

export default function Bodies() {
  useSyncExternalStore(game.world.subscribe, game.world.getVersion);
  return [...game.world.bodies.keys()].map((id) => <Body key={id} id={id} />);
}
