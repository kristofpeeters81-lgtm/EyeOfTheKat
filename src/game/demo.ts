import type { MoveEvent } from '../vision/moves';
import { BridgeSprint } from './stages/bridgeSprint';
import { FrogLeap } from './stages/frogLeap';
import { LogRoll } from './stages/logRoll';
import { StoneHop } from './stages/stoneHop';
import { TimedObstacleStage } from './stages/timed';
import { idleState } from './testing';
import type { GameInput, Stage } from './types';

/**
 * Demomodus: een "bot" speelt een etappe zonder camera. Handig om de etappes te bekijken (ook
 * zonder ruimte om te bewegen) en voor screenshots in de tests. Gebruikt dezelfde invoer als de
 * camera (GameInput), dus de etappe zelf weet niet dat het een demo is.
 */
export class DemoBot {
  private t = 0;
  private lane: -1 | 0 | 1 = 0;
  private lastLeap = 0;
  private jumpUntil = -1;

  input(stage: Stage, dt: number): GameInput {
    this.t += dt;
    const events: MoveEvent[] = [];
    const state = idleState();
    let power = 15 + 10 * Math.sin(this.t / 700);
    let legPower = 10;

    if (stage instanceof BridgeSprint) {
      legPower = 62 + 15 * Math.sin(this.t / 900);
      power = legPower - 5;
    } else if (stage instanceof TimedObstacleStage && stage.isActive) {
      const next = stage.obstacles.find((o) => o.result === 'pending');
      const until = next ? next.at - stage.setClock : Infinity;
      if (stage instanceof LogRoll) {
        if (until < 260 && until > 0 && this.t > this.jumpUntil) {
          events.push({ type: 'jump', t: this.t });
          this.jumpUntil = this.t + 500;
        }
        state.airborne = this.t < this.jumpUntil;
      } else {
        state.low = until < 450 && until > -250;
      }
      power = 55;
    } else if (stage instanceof FrogLeap && stage.isActiveSet) {
      const cycle = (this.t - this.lastLeap) % 2200;
      state.low = cycle > 900 && cycle < 1700;
      if (this.t - this.lastLeap > 2200 && stage.leapProgress === null) {
        events.push({ type: 'frogleap', t: this.t });
        this.lastLeap = this.t;
      }
      power = 60;
    } else if (stage instanceof StoneHop && stage.isActiveSet) {
      if (!stage.waiting && this.lane !== stage.target && Math.floor(this.t / 600) % 2 === 0) {
        this.lane = stage.target;
        events.push({ type: 'lane', t: this.t, lane: this.lane });
      }
      state.lane = this.lane;
      power = 58;
    }
    const zone = power >= 70 ? 3 : power >= 45 ? 2 : power >= 20 ? 1 : 0;
    return { t: this.t, dt, events, state, power, zone, legPower, presence: 'ok', pose: null, markerMode: false };
  }
}
