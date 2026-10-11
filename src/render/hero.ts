import type { HeroLook } from './theme';

/**
 * De ninja-held (#24): een eenvoudig skelet (11 punten) met poses, getekend als donker silhouet met
 * een lichtrand in de accentkleur. Vier helden delen dezelfde poses (#24); enkel hoofd/haar verschilt.
 *
 * Coördinaten: eenheid = lengte van de held (voeten → kruin = 1), oorsprong tussen de voeten,
 * y naar boven negatief (zoals het canvas). Zijaanzicht kijkt naar rechts.
 */

export type P = [number, number];

export interface Skeleton {
  head: P;
  neck: P;
  hip: P;
  elbowB: P;
  handB: P;
  elbowF: P;
  handF: P;
  kneeB: P;
  footB: P;
  kneeF: P;
  footF: P;
}

export type View = 'front' | 'side';

export type HeroAction =
  | 'idle'
  | 'ready'
  | 'run'
  | 'jump'
  | 'duck'
  | 'frogCrouch'
  | 'frogLeap'
  | 'hopLeft'
  | 'hopRight'
  | 'strikeLeft'
  | 'strikeRight'
  | 'strikeUp'
  | 'reachLeft'
  | 'reachRight'
  | 'star'
  | 'squat'
  | 'armsUp'
  | 'cheer'
  | 'stumble';

const KEYS: (keyof Skeleton)[] = ['head', 'neck', 'hip', 'elbowB', 'handB', 'elbowF', 'handF', 'kneeB', 'footB', 'kneeF', 'footF'];

function sk(head: P, neck: P, hip: P, elbowB: P, handB: P, elbowF: P, handF: P, kneeB: P, footB: P, kneeF: P, footF: P): Skeleton {
  return { head, neck, hip, elbowB, handB, elbowF, handF, kneeB, footB, kneeF, footF };
}

/** Vooraanzicht: B = linkerkant van het scherm, F = rechterkant. */
const FRONT: Partial<Record<HeroAction, Skeleton>> = {
  idle: sk([0, -0.89], [0, -0.77], [0, -0.45], [-0.17, -0.6], [-0.18, -0.46], [0.17, -0.6], [0.18, -0.46], [-0.07, -0.22], [-0.08, 0], [0.07, -0.22], [0.08, 0]),
  ready: sk([0, -0.85], [0, -0.73], [0, -0.42], [-0.2, -0.6], [-0.1, -0.7], [0.2, -0.6], [0.1, -0.7], [-0.11, -0.2], [-0.12, 0], [0.11, -0.2], [0.12, 0]),
  squat: sk([0, -0.66], [0, -0.55], [0, -0.27], [-0.16, -0.45], [-0.1, -0.52], [0.16, -0.45], [0.1, -0.52], [-0.17, -0.17], [-0.12, 0], [0.17, -0.17], [0.12, 0]),
  star: sk([0, -0.89], [0, -0.77], [0, -0.45], [-0.26, -0.84], [-0.38, -0.94], [0.26, -0.84], [0.38, -0.94], [-0.14, -0.22], [-0.24, 0], [0.14, -0.22], [0.24, 0]),
  armsUp: sk([0, -0.89], [0, -0.77], [0, -0.45], [-0.12, -0.96], [-0.08, -1.12], [0.12, -0.96], [0.08, -1.12], [-0.07, -0.22], [-0.08, 0], [0.07, -0.22], [0.08, 0]),
  cheer: sk([0, -0.9], [0, -0.78], [0, -0.46], [-0.22, -0.92], [-0.3, -1.08], [0.22, -0.92], [0.3, -1.08], [-0.08, -0.23], [-0.1, 0], [0.08, -0.23], [0.1, 0]),
  strikeLeft: sk([-0.03, -0.86], [-0.02, -0.74], [0, -0.43], [-0.3, -0.72], [-0.48, -0.72], [0.15, -0.62], [0.07, -0.7], [-0.11, -0.21], [-0.14, 0], [0.1, -0.21], [0.12, 0]),
  strikeRight: sk([0.03, -0.86], [0.02, -0.74], [0, -0.43], [-0.15, -0.62], [-0.07, -0.7], [0.3, -0.72], [0.48, -0.72], [-0.1, -0.21], [-0.12, 0], [0.11, -0.21], [0.14, 0]),
  strikeUp: sk([0, -0.88], [0, -0.76], [0, -0.44], [-0.16, -0.62], [-0.08, -0.7], [0.1, -0.98], [0.08, -1.16], [-0.09, -0.21], [-0.1, 0], [0.09, -0.21], [0.1, 0]),
  reachLeft: sk([0, -0.89], [0, -0.77], [0, -0.45], [-0.12, -0.96], [-0.1, -1.12], [0.17, -0.66], [0.2, -0.78], [-0.07, -0.22], [-0.08, 0], [0.1, -0.36], [0.08, -0.2]),
  reachRight: sk([0, -0.89], [0, -0.77], [0, -0.45], [-0.17, -0.66], [-0.2, -0.78], [0.12, -0.96], [0.1, -1.12], [-0.1, -0.36], [-0.08, -0.2], [0.07, -0.22], [0.08, 0]),
  hopLeft: sk([-0.04, -0.88], [-0.03, -0.76], [0, -0.45], [-0.26, -0.78], [-0.34, -0.9], [0.2, -0.6], [0.28, -0.52], [-0.08, -0.28], [-0.1, -0.08], [0.1, -0.26], [0.13, -0.08]),
  hopRight: sk([0.04, -0.88], [0.03, -0.76], [0, -0.45], [-0.2, -0.6], [-0.28, -0.52], [0.26, -0.78], [0.34, -0.9], [-0.1, -0.26], [-0.13, -0.08], [0.08, -0.28], [0.1, -0.08]),
  stumble: sk([0.08, -0.8], [0.06, -0.69], [0, -0.4], [-0.2, -0.72], [-0.3, -0.84], [0.24, -0.66], [0.34, -0.78], [-0.1, -0.2], [-0.16, 0], [0.12, -0.18], [0.1, 0]),
};

/** Zijaanzicht (kijkt naar rechts): B = arm/been achter het lichaam, F = ervoor. */
const SIDE: Partial<Record<HeroAction, Skeleton>> = {
  idle: sk([0.02, -0.89], [0, -0.77], [0, -0.45], [-0.04, -0.6], [0.02, -0.47], [0.04, -0.6], [0.08, -0.47], [0.02, -0.22], [-0.03, 0], [0.05, -0.22], [0.04, 0]),
  ready: sk([0.06, -0.85], [0.03, -0.74], [0, -0.43], [-0.06, -0.6], [0.06, -0.62], [0.09, -0.58], [0.18, -0.66], [0.06, -0.21], [-0.06, 0], [0.1, -0.21], [0.1, 0]),
  jump: sk([0.06, -0.94], [0.03, -0.82], [0, -0.5], [-0.12, -0.84], [-0.18, -0.98], [0.14, -0.84], [0.22, -0.98], [0.14, -0.42], [0.02, -0.3], [0.18, -0.4], [0.08, -0.26]),
  duck: sk([0.22, -0.46], [0.14, -0.42], [-0.04, -0.3], [0.04, -0.32], [0.16, -0.28], [0.12, -0.3], [0.26, -0.26], [0.1, -0.15], [-0.14, 0], [0.16, -0.12], [0.18, 0]),
  frogCrouch: sk([0.12, -0.6], [0.08, -0.5], [-0.04, -0.25], [0.02, -0.22], [0.12, -0.04], [0.1, -0.24], [0.2, -0.04], [0.12, -0.2], [-0.04, 0], [0.18, -0.18], [0.08, 0]),
  frogLeap: sk([0.18, -1.0], [0.12, -0.88], [0, -0.58], [0.18, -1.0], [0.24, -1.14], [0.24, -0.98], [0.32, -1.1], [-0.06, -0.34], [-0.16, -0.14], [0.02, -0.32], [-0.08, -0.12]),
  stumble: sk([0.16, -0.78], [0.1, -0.68], [0, -0.4], [-0.12, -0.7], [-0.2, -0.82], [0.2, -0.7], [0.3, -0.8], [0.04, -0.2], [-0.1, 0], [0.12, -0.18], [0.18, 0]),
  cheer: sk([0.02, -0.9], [0, -0.78], [0, -0.46], [-0.06, -0.94], [-0.06, -1.1], [0.08, -0.94], [0.1, -1.1], [0.02, -0.23], [-0.03, 0], [0.05, -0.23], [0.04, 0]),
};

/** Loopcyclus (zijaanzicht), fase 0..1. Armen en benen bewegen in tegenfase. */
function runPose(phase: number, intensity: number): Skeleton {
  const a = phase * Math.PI * 2;
  const s = Math.sin(a);
  const c = Math.cos(a);
  const k = 0.5 + 0.5 * intensity;
  const lean = 0.06 * intensity;
  const bob = -Math.abs(c) * 0.03 * intensity;
  const leg = (sign: number): [P, P] => {
    const sw = s * sign;
    const lift = Math.max(0, -Math.cos(a + (sign > 0 ? 0 : Math.PI))) * 0.16 * k;
    const knee: P = [0.02 + sw * 0.12 * k + lift * 0.4, -0.22 - lift * 0.8 + bob];
    const foot: P = [sw * 0.2 * k - lift * 0.3, -lift * 0.9 + bob * 0.2];
    return [knee, foot];
  };
  const arm = (sign: number): [P, P] => {
    const sw = -s * sign;
    return [
      [lean + sw * 0.1 * k - 0.02, -0.6 + bob],
      [lean + sw * 0.18 * k + 0.06, -0.52 + bob - Math.max(0, sw) * 0.1],
    ];
  };
  const [kneeF, footF] = leg(1);
  const [kneeB, footB] = leg(-1);
  const [elbowF, handF] = arm(1);
  const [elbowB, handB] = arm(-1);
  return { head: [lean + 0.04, -0.89 + bob], neck: [lean + 0.02, -0.77 + bob], hip: [0, -0.45 + bob], elbowB, handB, elbowF, handF, kneeB, footB, kneeF, footF };
}

export function lerpSkeleton(a: Skeleton, b: Skeleton, f: number): Skeleton {
  const out = {} as Skeleton;
  for (const k of KEYS) out[k] = [a[k][0] + (b[k][0] - a[k][0]) * f, a[k][1] + (b[k][1] - a[k][1]) * f];
  return out;
}

export function targetPose(action: HeroAction, view: View, t: number, runIntensity = 1): Skeleton {
  if (action === 'run') return view === 'side' ? runPose((t * (1.2 + 1.4 * runIntensity)) % 1, runIntensity) : FRONT.ready!;
  const table = view === 'side' ? SIDE : FRONT;
  const pose = table[action] ?? (view === 'side' ? SIDE.idle! : FRONT[action] ?? FRONT.idle!);
  if (action === 'idle') {
    // Ademhalen.
    const b = Math.sin(t * 2.4) * 0.008;
    return lerpSkeleton(pose, { ...pose, head: [pose.head[0], pose.head[1] + b], neck: [pose.neck[0], pose.neck[1] + b] }, 1);
  }
  return pose;
}

/**
 * Laat de held vloeiend van pose naar pose gaan (geen schokken als de detectie wisselt).
 */
export class HeroAnimator {
  pose: Skeleton;
  action: HeroAction = 'idle';
  private t = 0;

  constructor(
    public view: View,
    private readonly speed = 14,
  ) {
    this.pose = targetPose('idle', view, 0);
  }

  update(action: HeroAction, dtMs: number, runIntensity = 1): Skeleton {
    this.action = action;
    this.t += dtMs / 1000;
    const target = targetPose(action, this.view, this.t, runIntensity);
    const f = action === 'run' ? 1 : 1 - Math.exp((-this.speed * dtMs) / 1000);
    this.pose = lerpSkeleton(this.pose, target, f);
    return this.pose;
  }

  get time(): number {
    return this.t;
  }
}

function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return `rgb(${r},${g},${b})`;
}

/**
 * Tekent de held. `x, y` = punt tussen de voeten in pixels, `size` = lengte in pixels.
 */
export function drawHero(ctx: CanvasRenderingContext2D, pose: Skeleton, look: HeroLook, x: number, y: number, size: number, view: View, time: number, facing: 1 | -1 = 1): void {
  const S = size;
  const pt = (p: P): P => [x + p[0] * S * facing, y + p[1] * S];
  const suit = look.suit;
  const back = shade(suit, 0.7);
  const accent = look.accent;
  const legW = 0.085 * S;
  const armW = 0.065 * S;
  const isFront = view === 'front';
  const shoulderOff = isFront ? 0.11 : 0;
  const hipOff = isFront ? 0.055 : 0;
  const neck = pose.neck;
  const shoulderB: P = [neck[0] - shoulderOff, neck[1] + 0.03];
  const shoulderF: P = [neck[0] + shoulderOff, neck[1] + 0.03];
  const hipB: P = [pose.hip[0] - hipOff, pose.hip[1]];
  const hipF: P = [pose.hip[0] + hipOff, pose.hip[1]];

  const limb = (a: P, b: P, c: P, width: number, color: string) => {
    const [ax, ay] = pt(a);
    const [bx, by] = pt(b);
    const [cx, cy] = pt(c);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  };

  const torso = (color: string, grow: number) => {
    const [n1x, n1y] = pt([shoulderB[0] - (isFront ? 0.03 : 0.05), shoulderB[1]]);
    const [n2x, n2y] = pt([shoulderF[0] + (isFront ? 0.03 : 0.05), shoulderF[1]]);
    const [h1x, h1y] = pt([hipB[0] - (isFront ? 0.02 : 0.055), hipB[1] + 0.02]);
    const [h2x, h2y] = pt([hipF[0] + (isFront ? 0.02 : 0.055), hipF[1] + 0.02]);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = grow;
    ctx.beginPath();
    ctx.moveTo(n1x, n1y);
    ctx.lineTo(n2x, n2y);
    ctx.lineTo(h2x, h2y);
    ctx.lineTo(h1x, h1y);
    ctx.closePath();
    ctx.fill();
    if (grow > 0) ctx.stroke();
  };

  const headR = 0.1 * S;
  const [hx, hy] = pt(pose.head);

  const headShape = (color: string, grow: number) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(hx, hy, headR + grow, 0, Math.PI * 2);
    ctx.fill();
    // Kap/oren/haar per held.
    ctx.beginPath();
    if (look.id === 'kage') {
      ctx.moveTo(hx - headR * 0.9 * facing - grow, hy - headR * 0.3);
      ctx.quadraticCurveTo(hx - headR * 1.6 * facing, hy - headR * 1.3 - grow, hx - headR * 0.2 * facing, hy - headR * 1.05 - grow);
      ctx.lineTo(hx + headR * 0.3 * facing, hy - headR * 0.6);
    } else if (look.id === 'neko') {
      for (const s of [-1, 1]) {
        ctx.moveTo(hx + s * headR * 0.85 - s * grow * 0.3, hy - headR * 0.4);
        ctx.lineTo(hx + s * headR * 0.75, hy - headR * 1.55 - grow * 1.5);
        ctx.lineTo(hx + s * headR * 0.15, hy - headR * 0.85);
      }
    } else if (look.id === 'riku') {
      for (let i = -2; i <= 2; i++) {
        const bx = hx + i * headR * 0.38 - facing * headR * 0.2;
        ctx.moveTo(bx - headR * 0.25, hy - headR * 0.7);
        ctx.lineTo(bx - facing * headR * 0.35, hy - headR * (1.35 + (i % 2 === 0 ? 0.15 : 0)) - grow);
        ctx.lineTo(bx + headR * 0.25, hy - headR * 0.75);
      }
    } else if (look.id === 'mei') {
      const sway = Math.sin(time * 5) * headR * 0.15;
      ctx.moveTo(hx - facing * headR * 0.7, hy - headR * 0.5);
      ctx.arc(hx - facing * headR * 1.15, hy - headR * 0.55 + sway, headR * 0.42 + grow, 0, Math.PI * 2);
      ctx.moveTo(hx - facing * headR * 1.3, hy - headR * 0.2);
      ctx.quadraticCurveTo(hx - facing * headR * 1.9, hy + headR * 0.4 + sway, hx - facing * headR * 1.5, hy + headR * 1.1 + sway);
      ctx.quadraticCurveTo(hx - facing * headR * 1.2, hy + headR * 0.4, hx - facing * headR * 0.9, hy - headR * 0.1);
    }
    ctx.fill();
  };

  const body = (color: string, backColor: string, grow: number) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    limb(shoulderB, pose.elbowB, pose.handB, armW + grow * 2, backColor);
    limb(hipB, pose.kneeB, pose.footB, legW + grow * 2, backColor);
    torso(color, grow * 2);
    limb(hipF, pose.kneeF, pose.footF, legW + grow * 2, color);
    limb(shoulderF, pose.elbowF, pose.handF, armW + grow * 2, color);
    headShape(color, grow);
  };

  ctx.save();
  // 1. Lichtrand (gloed in de accentkleur).
  ctx.shadowColor = accent;
  ctx.shadowBlur = S * 0.08;
  body(accent, accent, S * 0.012);
  ctx.restore();
  ctx.save();
  // 2. Het pak.
  body(suit, back, 0);

  // 3. Gordel.
  const [b1x, b1y] = pt([hipB[0] - 0.06, pose.hip[1] - 0.01]);
  const [b2x, b2y] = pt([hipF[0] + 0.06, pose.hip[1] - 0.01]);
  ctx.strokeStyle = accent;
  ctx.lineWidth = S * 0.03;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(b1x, b1y);
  ctx.lineTo(b2x, b2y);
  ctx.stroke();

  // 4. Hoofdband met wapperende linten (naar achter).
  const bandY = hy - headR * 0.35;
  ctx.lineWidth = S * 0.028;
  ctx.beginPath();
  ctx.moveTo(hx - headR * 0.98, bandY);
  ctx.lineTo(hx + headR * 0.98, bandY);
  ctx.stroke();
  const tailX = isFront ? hx + headR * 0.9 : hx - facing * headR * 0.95;
  const dir = isFront ? 1 : -facing;
  for (const [len, ph] of [
    [1.0, 0],
    [0.8, 1.3],
  ] as const) {
    const w1 = Math.sin(time * 9 + ph) * headR * 0.35;
    const w2 = Math.sin(time * 9 + ph + 1.4) * headR * 0.5;
    ctx.lineWidth = S * 0.022;
    ctx.beginPath();
    ctx.moveTo(tailX, bandY);
    ctx.bezierCurveTo(tailX + dir * headR * 1.0 * len, bandY + w1, tailX + dir * headR * 1.7 * len, bandY + headR * 0.4 + w2, tailX + dir * headR * 2.4 * len, bandY + headR * 0.2 + w2);
    ctx.stroke();
  }

  // 5. Oogspleet met ogen.
  const eyeX = isFront ? hx : hx + facing * headR * 0.35;
  const slitW = isFront ? headR * 1.3 : headR * 0.9;
  ctx.fillStyle = '#f2c9a5';
  ctx.beginPath();
  ctx.roundRect(eyeX - slitW / 2, hy - headR * 0.18, slitW, headR * 0.42, headR * 0.2);
  ctx.fill();
  ctx.fillStyle = '#0b1026';
  const blink = Math.sin(time * 0.9) > 0.985 ? 0.2 : 1;
  const eyes = isFront ? [-0.32, 0.32] : [0.15];
  for (const e of eyes) {
    ctx.beginPath();
    ctx.ellipse(eyeX + e * headR * (isFront ? 1 : facing), hy + headR * 0.03, headR * 0.1, headR * 0.13 * blink, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  if (look.id === 'neko') {
    // Binnenkant van de oortjes in de accentkleur.
    ctx.fillStyle = accent;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(hx + s * headR * 0.7, hy - headR * 0.6);
      ctx.lineTo(hx + s * headR * 0.68, hy - headR * 1.3);
      ctx.lineTo(hx + s * headR * 0.32, hy - headR * 0.85);
      ctx.fill();
    }
  }
  ctx.restore();
}
