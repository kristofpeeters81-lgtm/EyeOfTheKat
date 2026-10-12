import { StageBase } from '../stageBase';
import type { GameInput, HeroState, HudInfo, StageSettings } from '../types';

/**
 * Opwarming (#26, #47): ±60 s, bij de eerste etappe van een beurt. Rustig ter plaatse lopen (20 s),
 * armen zwaaien (15 s) en 3 rustige hurken (max. 25 s). Er zijn geen sterren of punten: het doel is
 * de spieren klaarmaken en meteen nagaan of de detectie werkt.
 */
export const WARM_UP = { jogMs: 20000, armsMs: 15000, squats: 3, squatMaxMs: 25000 } as const;

type Part = 'jog' | 'arms' | 'squat';

export class WarmUp extends StageBase {
  readonly id = 'warm-up' as const;
  readonly kind = 'continuous' as const;
  readonly title = 'Opwarming';
  private part: Part = 'jog';
  private partStart = 0;
  private squats = 0;
  private low = false;
  private legPower = 0;
  private readonly k: number;

  constructor(settings: StageSettings) {
    super(settings);
    this.k = settings.durationScale ?? 1;
  }

  protected introText(): string {
    return 'Eerst opwarmen, ninja! Rustig lopen, armen zwaaien en drie keer hurken.';
  }

  protected taskTotal(): null {
    return null;
  }

  protected onStart(): void {
    this.part = 'jog';
    this.partStart = this.clock;
    this.say('Loop rustig ter plaatse.', true);
  }

  private next(part: Part, text: string): void {
    this.part = part;
    this.partStart = this.clock;
    this.say(text, true);
    this.sfx('success');
  }

  protected step(input: GameInput): void {
    const t = this.clock - this.partStart;
    this.low = input.state.low;
    this.legPower = input.legPower;
    if (this.part === 'jog' && t >= WARM_UP.jogMs * this.k) this.next('arms', 'Zwaai nu met je armen, grote cirkels!');
    else if (this.part === 'arms' && t >= WARM_UP.armsMs * this.k) this.next('squat', 'En nu drie keer rustig hurken.');
    else if (this.part === 'squat') {
      if (input.events.some((e) => e.type === 'squat')) {
        this.squats++;
        this.sfx('hit');
      }
      if (this.squats >= WARM_UP.squats || t >= WARM_UP.squatMaxMs * this.k) {
        this.say('Opgewarmd! Klaar voor het echte werk.', true);
        this.finish();
      }
    }
  }

  hud(): HudInfo {
    const t = this.clock - this.partStart;
    const total = (WARM_UP.jogMs + WARM_UP.armsMs) * this.k;
    const done = this.part === 'jog' ? t : this.part === 'arms' ? WARM_UP.jogMs * this.k + t : total;
    const instruction = this.part === 'jog' ? 'Rustig ter plaatse lopen' : this.part === 'arms' ? 'Armen zwaaien' : `Rustig hurken (${this.squats}/${WARM_UP.squats})`;
    const left = this.part === 'jog' ? WARM_UP.jogMs * this.k - t : this.part === 'arms' ? WARM_UP.armsMs * this.k - t : null;
    const progress = this.finished ? 1 : this.part === 'squat' ? 0.8 + (this.squats / WARM_UP.squats) * 0.2 : (done / total) * 0.8;
    return this.baseHud(this.title, instruction, progress, 'Opwarmen', left === null ? null : Math.max(0, Math.ceil(left / 1000)));
  }

  hero(): HeroState {
    if (this.currentPhase === 'finished') return { action: 'cheer', runIntensity: 0, offsetX: 0, lift: 0 };
    if (this.currentPhase !== 'active') return { action: 'idle', runIntensity: 0, offsetX: 0, lift: 0 };
    if (this.part === 'jog') return { action: 'run', runIntensity: Math.min(0.45, Math.max(0.2, this.legPower / 70)), offsetX: 0, lift: 0 };
    if (this.part === 'arms') return { action: Math.floor(this.clock / 700) % 2 ? 'armsUp' : 'cheer', runIntensity: 0, offsetX: 0, lift: 0 };
    return { action: this.low ? 'duck' : 'idle', runIntensity: 0, offsetX: 0, lift: 0 };
  }
}
