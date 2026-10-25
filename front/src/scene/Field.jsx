import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CIRCLE, game } from '../game.js';
import { gravelTexture } from '../textures.js';

const Board = ({ pos, size }) => (
  <mesh position={pos}>
    <boxGeometry args={size} />
    <meshStandardMaterial color="#a67c52" roughness={0.9} />
  </mesh>
);

export default function Field() {
  const gravel = useMemo(gravelTexture, []);
  const ground = useRef();
  const gravelMat = useRef();
  useFrame(() => {
    ground.current.color.setRGB(...game.env.ground);
    gravelMat.current.color.setRGB(...game.env.tint);
  });
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.004, 0]}>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial ref={ground} color="#9ccb78" roughness={1} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, -2.3]}>
        <planeGeometry args={[4.6, 9.4]} />
        <meshStandardMaterial ref={gravelMat} map={gravel} roughness={1} />
      </mesh>

      <mesh rotation-x={-Math.PI / 2} position={[CIRCLE.x, 0.012, CIRCLE.z]}>
        <ringGeometry args={[0.42, 0.46, 32]} />
        <meshBasicMaterial color="#f4f1e8" />
      </mesh>

    </>
  );
}
