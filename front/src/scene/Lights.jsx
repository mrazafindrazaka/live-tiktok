import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { game } from '../game.js';

// Lumière du monde en cours (elle fond doucement d'un monde à l'autre).
export default function Lights() {
  const hemi = useRef();
  const sun = useRef();
  useFrame(() => {
    const e = game.env;
    hemi.current.color.setRGB(...e.hemiSky);
    hemi.current.groundColor.setRGB(...e.hemiGround);
    hemi.current.intensity = e.hemiI[0];
    sun.current.color.setRGB(...e.sun);
    sun.current.intensity = e.sunI[0];
  });
  return (
    <>
      <hemisphereLight ref={hemi} args={['#ffffff', '#8a7a5a', 1.05]} />
      <directionalLight ref={sun} position={[4, 9, 6]} intensity={1.5} />
    </>
  );
}
