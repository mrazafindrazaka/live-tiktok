import { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Field from './scene/Field.jsx';
import Heroes from './scene/Heroes.jsx';
import Bodies from './scene/Bodies.jsx';
import Fx from './scene/Fx.jsx';
import Rig from './scene/Rig.jsx';
import Lights from './scene/Lights.jsx';
import Stage from './scene/Stage.jsx';
import Boards from './scene/Boards.jsx';
import Presentation from './scene/Presentation.jsx';
import { useSyncExternalStore } from 'react';
import Overlay from './Overlay.jsx';
import { game } from './game.js';
import { connectLive } from './live.js';
import { TIERS } from './gifts.js';
import { audio } from './audio.js';

export default function App() {
  useSyncExternalStore(game.subscribe, game.getVersion);
  useEffect(() => {
    if (import.meta.env.DEV) Object.assign(window, { __game: game, __audio: audio }); // pratique pour inspecter l'état depuis la console
    const close = connectLive();
    audio.start();
    // Raccourcis de test : 1 2 3 4 = dons du personnage de gauche (paliers 1/10/100/1000), 7 8 9 0 = personnage de droite, K = fin de partie.
    const onKey = (e) => {
      const left = '1234'.indexOf(e.key);
      const right = '7890'.indexOf(e.key);
      if (left >= 0) game.addGift('A', TIERS[left], 'Test');
      if (right >= 0) game.addGift('B', TIERS[right], 'Test');
      if (e.key.toLowerCase() === 'k') game.debugKO();
      if (e.key.toLowerCase() === 'm') audio.toggleMute();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      close();
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    // Le "stage" garde toujours le ratio 9:16, centré dans la fenêtre : dans OBS, une source navigateur 1080x1920 le remplit exactement.
    <div className="stage">
      <div className="stars" />
      <Canvas dpr={[1, 1.5]} camera={{ fov: 58, near: 0.1, far: 300, position: [0, 7.4, 10.4] }} gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}>
        <fog attach="fog" args={['#d6ecff', 24, 64]} />
        <Lights />
        <Rig />
        <Field />
        <Stage key={game.stageId} id={game.stageId} />
        <Heroes />
        <Boards />
        <Presentation />
        <Bodies />
        <Fx />
      </Canvas>
      <Overlay />
      <div className="flash-screen" />
    </div>
  );
}
