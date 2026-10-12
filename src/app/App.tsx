import { useEffect, useState } from 'react';
import { audio } from '../audio/director';
import { STAGES, stageInfo } from '../game/catalog';
import type { Profile } from '../game/profiles';
import type { StageId, StageResult } from '../game/types';
import { DEFAULT_LOOK } from '../render/theme';
import type { BodyCalibration } from '../vision/types';
import { BandSetup } from './BandSetup';
import { Calibrate } from './Calibrate';
import { CameraCheck } from './CameraCheck';
import { DebugBar } from './DebugBar';
import { ProfileEditor } from './ProfileEditor';
import { ProfileSelect } from './ProfileSelect';
import { getProfiles } from './profileStore';
import { RestScreen } from './RestScreen';
import { SoundSettings } from './SoundSettings';
import { StagePicker } from './StagePicker';
import { StageScreen } from './StageScreen';
import { loadSoundPrefs } from './storage';
import { StylePreview } from './StylePreview';
import { Testlab } from './Testlab';
import { sayHigh } from './useStageAudio';
import { WorldMap } from './WorldMap';

/**
 * Spelverloop (blok 10):
 *   start → "Wie speelt?" (profielen, #19) → kalibreren (#30) → wereldkaart (#42)
 *   → opwarming bij de eerste etappe van een beurt (#47) → etappe → resultaat → rust (#47) → kaart.
 * "Andere ninja" = beurt wisselen: opnieuw lichaam kalibreren en opnieuw opwarmen.
 * Begeleidersschermen (Testlab, kalibreren, cameratest, stijl, losse etappes) blijven op het startscherm.
 */

type Screen =
  | { name: 'home' }
  | { name: 'camera' }
  | { name: 'calibrate'; then: 'home' | 'lab' | 'stages' | 'map' }
  | { name: 'lab' }
  | { name: 'bands' }
  | { name: 'style' }
  | { name: 'stages' }
  | { name: 'profiles' }
  | { name: 'editor'; profileId: string | null; back: 'profiles' | 'map' }
  | { name: 'map' }
  | { name: 'stage'; id: StageId; from: 'map' | 'picker' }
  | { name: 'warmup'; next: StageId }
  | { name: 'rest'; ms: number; next: string | null };

const params = new URLSearchParams(window.location.search);
/** Testen: ?snel=1 maakt alle etappes (en rustpauzes) 4× korter. */
const QUICK_DEFAULT = params.has('snel');
/** ?demo=1: de etappes worden gespeeld door een bot, zonder camera (#52). */
const DEMO_DEFAULT = params.has('demo');

export function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'home' });
  const [calibration, setCalibration] = useState<BodyCalibration | null>(null);
  /** Voor wie is de huidige lichaamskalibratie? (andere ninja = opnieuw) */
  const [calibratedFor, setCalibratedFor] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [warmedUp, setWarmedUp] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [age, setAge] = useState(10);
  const [quick, setQuick] = useState(QUICK_DEFAULT);
  const [demo, setDemo] = useState(DEMO_DEFAULT);
  const [, setVersion] = useState(0);
  const home = () => setScreen({ name: 'home' });
  const scale = quick ? 0.25 : 1;
  const profile: Profile | null = profileId ? getProfiles().get(profileId) : null;

  // Geluid mag pas na een tik van de gebruiker (browserregel): bij de eerste tik ontgrendelen.
  useEffect(() => {
    const prefs = loadSoundPrefs();
    audio.setSound(prefs.sound);
    audio.setVoice(prefs.voice);
    const unlock = () => audio.unlock();
    window.addEventListener('pointerdown', unlock);
    return () => window.removeEventListener('pointerdown', unlock);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(id);
  }, [notice]);

  /** Een ninja kiezen = nieuwe beurt: kalibreren (tenzij demo) en opnieuw opwarmen. */
  const pick = (p: Profile) => {
    setProfileId(p.id);
    setWarmedUp(false);
    if (demo || calibratedFor === p.id) setScreen({ name: 'map' });
    else setScreen({ name: 'calibrate', then: 'map' });
  };

  const play = (id: StageId) => {
    if (!warmedUp) setScreen({ name: 'warmup', next: id });
    else setScreen({ name: 'stage', id, from: 'map' });
  };

  const record = (r: StageResult) => {
    if (!profileId || demo) return;
    const res = getProfiles().record(profileId, r);
    const parts: string[] = [];
    if (res.unlockedStage) parts.push(`Nieuwe etappe open: ${stageInfo(res.unlockedStage).name}!`);
    if (res.unlockedColors > 0) parts.push('Nieuwe kleur voor je ninja vrijgespeeld!');
    if (parts.length) setNotice(parts.join(' '));
    setVersion((v) => v + 1);
  };

  return (
    <>
      {screen.name === 'home' && (
        <div className="screen col center" style={{ gap: 22, textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(28px, 7vw, 56px)', fontWeight: 900 }}>
            THE EYE
            <br />
            <span style={{ color: 'var(--eye)' }}>OF THE KAT</span>
          </h1>
          <p className="muted">Ninja-parcours met je lichaam als controller. Zonder AI, niets verlaat dit toestel.</p>
          <button className="btn" style={{ minHeight: 64, fontSize: '1.15rem', padding: '0 2.4em' }} onClick={() => setScreen({ name: 'profiles' })}>
            Spelen
          </button>
          <SoundSettings />
          <details className="guide-menu">
            <summary>Voor begeleiders</summary>
            <div className="row center">
              <button className="btn secondary small" onClick={() => setScreen(calibration ? { name: 'lab' } : { name: 'calibrate', then: 'lab' })}>
                Testlab
              </button>
              <button className="btn secondary small" onClick={() => setScreen({ name: 'calibrate', then: 'home' })}>
                Kalibreren
              </button>
              <button className="btn secondary small" onClick={() => setScreen({ name: 'camera' })}>
                Cameratest
              </button>
              <button className="btn secondary small" onClick={() => setScreen({ name: 'style' })}>
                Stijl
              </button>
              <button className="btn secondary small" onClick={() => setScreen(calibration || demo ? { name: 'stages' } : { name: 'calibrate', then: 'stages' })}>
                Losse etappes
              </button>
            </div>
            <label className="row center" style={{ gap: 6 }}>
              <input type="checkbox" checked={quick} onChange={(e) => setQuick(e.target.checked)} /> korte etappes en rust (test)
            </label>
            <label className="row center" style={{ gap: 6 }}>
              <input type="checkbox" checked={demo} onChange={(e) => setDemo(e.target.checked)} /> demo: een bot speelt (zonder camera)
            </label>
          </details>
          {calibration && <p className="muted small-text">✓ Gekalibreerd: lichaam {calibration.height} px hoog.</p>}
        </div>
      )}
      {screen.name === 'camera' && <CameraCheck onBack={home} />}
      {screen.name === 'calibrate' && (
        <Calibrate
          say={sayHigh}
          bodyOnly={screen.then === 'map'}
          onBack={() => setScreen(screen.then === 'map' ? { name: 'profiles' } : { name: 'home' })}
          onDone={(c) => {
            setCalibration(c);
            setCalibratedFor(screen.then === 'map' ? profileId : null);
            setScreen(screen.then === 'lab' ? { name: 'lab' } : screen.then === 'stages' ? { name: 'stages' } : screen.then === 'map' ? { name: 'map' } : { name: 'home' });
          }}
        />
      )}
      {screen.name === 'lab' && (
        <Testlab onBack={home} onRecalibrate={() => setScreen({ name: 'calibrate', then: 'lab' })} onBands={() => setScreen({ name: 'bands' })} />
      )}
      {screen.name === 'style' && <StylePreview onBack={home} />}
      {screen.name === 'bands' && <BandSetup say={sayHigh} onBack={() => setScreen({ name: 'lab' })} onDone={() => setScreen({ name: 'lab' })} />}
      {screen.name === 'stages' && (
        <StagePicker age={age} quick={quick} demo={demo} onDemo={setDemo} onAge={setAge} onQuick={setQuick} onBack={home} onPlay={(id) => setScreen({ name: 'stage', id, from: 'picker' })} />
      )}
      {screen.name === 'profiles' && (
        <ProfileSelect
          onBack={home}
          onPick={pick}
          onNew={() => setScreen({ name: 'editor', profileId: null, back: 'profiles' })}
          onEdit={(p) => setScreen({ name: 'editor', profileId: p.id, back: 'profiles' })}
        />
      )}
      {screen.name === 'editor' && (
        <ProfileEditor
          profile={screen.profileId ? getProfiles().get(screen.profileId) : null}
          onCancel={() => setScreen(screen.back === 'map' && profile ? { name: 'map' } : { name: 'profiles' })}
          onSave={(p) => (screen.back === 'map' ? setScreen({ name: 'map' }) : pick(p))}
        />
      )}
      {screen.name === 'map' && profile && (
        <>
          <WorldMap
            profile={profile}
            onPlay={play}
            onSwitch={() => setScreen({ name: 'profiles' })}
            onEdit={() => setScreen({ name: 'editor', profileId: profile.id, back: 'map' })}
            onCalibrate={() => setScreen({ name: 'calibrate', then: 'map' })}
            onHome={home}
          />
          {notice && <div className="map-notice panel">🎉 {notice}</div>}
        </>
      )}
      {screen.name === 'warmup' && (
        <StageScreen
          stageId="warm-up"
          age={profile?.age ?? age}
          look={profile?.look ?? DEFAULT_LOOK}
          durationScale={scale}
          demo={demo}
          skipResult
          onExit={(r) => {
            if (r) {
              setWarmedUp(true);
              setScreen({ name: 'stage', id: screen.next, from: 'map' });
            } else setScreen({ name: 'map' });
          }}
        />
      )}
      {screen.name === 'stage' && (
        <StageScreen
          stageId={screen.id}
          age={screen.from === 'map' && profile ? profile.age : age}
          look={screen.from === 'map' && profile ? profile.look : DEFAULT_LOOK}
          durationScale={scale}
          demo={demo}
          onResult={screen.from === 'map' ? record : undefined}
          onExit={(r) => {
            if (screen.from === 'picker') return setScreen({ name: 'stages' });
            if (!r) return setScreen({ name: 'map' });
            const i = STAGES.findIndex((s) => s.id === screen.id);
            const next = STAGES[i + 1]?.name ?? null;
            setScreen({ name: 'rest', ms: stageInfo(screen.id).restAfterMs * scale, next });
          }}
        />
      )}
      {screen.name === 'rest' && <RestScreen ms={screen.ms} next={screen.next} onDone={() => setScreen({ name: 'map' })} />}
      <DebugBar />
    </>
  );
}
