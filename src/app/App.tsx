import { useState } from 'react';
import { BandSetup } from './BandSetup';
import { Calibrate } from './Calibrate';
import { CameraCheck } from './CameraCheck';
import { DebugBar } from './DebugBar';
import { StylePreview } from './StylePreview';
import { Testlab } from './Testlab';
import type { BodyCalibration } from '../vision/types';

type Screen = { name: 'home' } | { name: 'camera' } | { name: 'calibrate'; then: 'home' | 'lab' } | { name: 'lab' } | { name: 'bands' } | { name: 'style' };

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [calibration, setCalibration] = useState<BodyCalibration | null>(null);
  const home = () => setScreen({ name: 'home' });

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
          <div className="row center">
            <button className="btn" onClick={() => setScreen(calibration ? { name: 'lab' } : { name: 'calibrate', then: 'lab' })}>
              Testlab
            </button>
            <button className="btn secondary" onClick={() => setScreen({ name: 'calibrate', then: 'home' })}>
              Kalibreren
            </button>
            <button className="btn secondary" onClick={() => setScreen({ name: 'camera' })}>
              Cameratest
            </button>
            <button className="btn secondary" onClick={() => setScreen({ name: 'style' })}>
              Stijl
            </button>
          </div>
          {calibration && <p className="muted">✓ Gekalibreerd: lichaam {calibration.height} px hoog.</p>}
        </div>
      )}
      {screen.name === 'camera' && <CameraCheck onBack={home} />}
      {screen.name === 'calibrate' && (
        <Calibrate
          onBack={home}
          onDone={(c) => {
            setCalibration(c);
            setScreen(screen.then === 'lab' ? { name: 'lab' } : { name: 'home' });
          }}
        />
      )}
      {screen.name === 'lab' && (
        <Testlab onBack={home} onRecalibrate={() => setScreen({ name: 'calibrate', then: 'lab' })} onBands={() => setScreen({ name: 'bands' })} />
      )}
      {screen.name === 'style' && <StylePreview onBack={home} />}
      {screen.name === 'bands' && <BandSetup onBack={() => setScreen({ name: 'lab' })} onDone={() => setScreen({ name: 'lab' })} />}
      <DebugBar />
    </>
  );
}
