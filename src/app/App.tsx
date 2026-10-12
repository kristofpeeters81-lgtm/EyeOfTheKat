import { useEffect, useState } from 'react';
import { audio } from '../audio/director';
import type { StageId } from '../game/types';
import { DEFAULT_LOOK } from '../render/theme';
import { BandSetup } from './BandSetup';
import { Calibrate } from './Calibrate';
import { CameraCheck } from './CameraCheck';
import { DebugBar } from './DebugBar';
import { StagePicker } from './StagePicker';
import { StageScreen } from './StageScreen';
import { StylePreview } from './StylePreview';
import { SoundSettings } from './SoundSettings';
import { loadSoundPrefs } from './storage';
import { Testlab } from './Testlab';
import { sayHigh } from './useStageAudio';
import type { BodyCalibration } from '../vision/types';

type Screen =
  | { name: 'home' }
  | { name: 'camera' }
  | { name: 'calibrate'; then: 'home' | 'lab' | 'stages' }
  | { name: 'lab' }
  | { name: 'bands' }
  | { name: 'style' }
  | { name: 'stages' }
  | { name: 'stage'; id: StageId };

/** Testen: ?snel=1 in de link maakt alle etappes 4× korter. */
const QUICK_DEFAULT = new URLSearchParams(window.location.search).has('snel');

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [calibration, setCalibration] = useState<BodyCalibration | null>(null);
  const [age, setAge] = useState(10);
  const [quick, setQuick] = useState(QUICK_DEFAULT);
  const home = () => setScreen({ name: 'home' });

  // Geluid mag pas na een tik van de gebruiker (browserregel): bij de eerste tik ontgrendelen.
  useEffect(() => {
    const prefs = loadSoundPrefs();
    audio.setSound(prefs.sound);
    audio.setVoice(prefs.voice);
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

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
            <button className="btn" onClick={() => setScreen(calibration ? { name: 'stages' } : { name: 'calibrate', then: 'stages' })}>
              Spelen
            </button>
            <button className="btn secondary" onClick={() => setScreen(calibration ? { name: 'lab' } : { name: 'calibrate', then: 'lab' })}>
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
          <SoundSettings />
          {calibration && <p className="muted">✓ Gekalibreerd: lichaam {calibration.height} px hoog.</p>}
        </div>
      )}
      {screen.name === 'camera' && <CameraCheck onBack={home} />}
      {screen.name === 'calibrate' && (
        <Calibrate
          say={sayHigh}
          onBack={home}
          onDone={(c) => {
            setCalibration(c);
            setScreen(screen.then === 'lab' ? { name: 'lab' } : screen.then === 'stages' ? { name: 'stages' } : { name: 'home' });
          }}
        />
      )}
      {screen.name === 'lab' && (
        <Testlab onBack={home} onRecalibrate={() => setScreen({ name: 'calibrate', then: 'lab' })} onBands={() => setScreen({ name: 'bands' })} />
      )}
      {screen.name === 'style' && <StylePreview onBack={home} />}
      {screen.name === 'bands' && <BandSetup say={sayHigh} onBack={() => setScreen({ name: 'lab' })} onDone={() => setScreen({ name: 'lab' })} />}
      {screen.name === 'stages' && (
        <StagePicker age={age} quick={quick} onAge={setAge} onQuick={setQuick} onBack={home} onPlay={(id) => setScreen({ name: 'stage', id })} />
      )}
      {screen.name === 'stage' && (
        <StageScreen stageId={screen.id} age={age} look={DEFAULT_LOOK} durationScale={quick ? 0.25 : 1} onExit={() => setScreen({ name: 'stages' })} />
      )}
      <DebugBar />
    </>
  );
}
