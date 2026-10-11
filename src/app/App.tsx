import { useState } from 'react';
import { CameraCheck } from './CameraCheck';
import { DebugBar } from './DebugBar';

type Screen = { name: 'home' } | { name: 'camera' };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });

  return (
    <>
      {screen.name === 'home' && (
        <div className="screen col center" style={{ gap: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(28px, 7vw, 56px)', fontWeight: 900 }}>
            THE EYE
            <br />
            <span style={{ color: 'var(--eye)' }}>OF THE KAT</span>
          </h1>
          <p className="muted">Ninja-parcours met je lichaam als controller. Zonder AI, niets verlaat dit toestel.</p>
          <button className="btn" onClick={() => setScreen({ name: 'camera' })}>
            Cameratest
          </button>
        </div>
      )}
      {screen.name === 'camera' && <CameraCheck onBack={() => setScreen({ name: 'home' })} />}
      <DebugBar />
    </>
  );
}
