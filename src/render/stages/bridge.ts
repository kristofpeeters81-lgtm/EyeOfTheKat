import type { BridgeSprint } from '../../game/stages/bridgeSprint';
import { PALETTE } from '../theme';
import { drawGround } from '../world';
import type { SceneLayout } from './layout';

/**
 * Bridge Sprint tekenen: een hangbrug over een kloof. Planken achter de instorting vallen naar
 * beneden en vervagen. Tijdens de rust loopt de held over vaste rots.
 */

const PLANK_M = 0.55;

export function drawBridge(ctx: CanvasRenderingContext2D, L: SceneLayout, stage: BridgeSprint, t: number): void {
  const { w, h, groundY, heroX, ppm } = L;
  const scroll = stage.distance * ppm;
  if (!stage.onBridge) {
    drawGround(ctx, w, h, groundY, scroll, 'stone');
    return;
  }
  // Kloof
  const g = ctx.createLinearGradient(0, groundY, 0, h);
  g.addColorStop(0, '#0a0d24');
  g.addColorStop(1, '#020309');
  ctx.fillStyle = g;
  ctx.fillRect(0, groundY, w, h - groundY);
  // Mist in de kloof
  ctx.fillStyle = 'rgba(155, 231, 255, 0.05)';
  for (let i = 0; i < 3; i++) {
    const y = groundY + (h - groundY) * (0.35 + i * 0.2);
    ctx.beginPath();
    ctx.ellipse((((t * 30 * (i + 1)) % (w + 400)) - 200), y, 260, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const worldToX = (m: number) => heroX + (m - stage.distance) * ppm;
  const firstPlank = Math.floor((stage.distance - heroX / ppm) / PLANK_M) - 1;
  const lastPlank = Math.ceil((stage.distance + (w - heroX) / ppm) / PLANK_M) + 1;
  const plankW = PLANK_M * ppm * 0.86;
  const plankH = Math.max(6, ppm * 0.16);

  // Touwen (bovenleuning) als doorhangende lijn.
  ctx.strokeStyle = PALETTE.woodDark;
  ctx.lineWidth = Math.max(2, ppm * 0.04);
  const ropeY = groundY - L.heroSize * 0.45;
  ctx.beginPath();
  const collapseX = worldToX(stage.collapse);
  for (let x = Math.max(0, collapseX); x <= w; x += 8) {
    const sag = Math.sin(((x + scroll) / (ppm * 6)) * Math.PI) * ppm * 0.12;
    if (x === Math.max(0, collapseX)) ctx.moveTo(x, ropeY + Math.abs(sag));
    else ctx.lineTo(x, ropeY + Math.abs(sag));
  }
  ctx.stroke();

  for (let i = firstPlank; i <= lastPlank; i++) {
    const m = i * PLANK_M;
    const x = worldToX(m);
    const behind = stage.collapse - m;
    let y = groundY;
    let rot = 0;
    let alpha = 1;
    if (behind > 0) {
      // Gevallen plank: valt verder naarmate de instorting verder is.
      const fall = Math.min(4, behind) / 4;
      y = groundY + fall * fall * (h - groundY) * 1.3;
      rot = fall * (i % 2 ? 1.2 : -0.9);
      alpha = 1 - fall;
      if (alpha <= 0.02) continue;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x + plankW / 2, y + plankH / 2);
    ctx.rotate(rot);
    ctx.fillStyle = i % 3 === 0 ? PALETTE.woodDark : PALETTE.wood;
    ctx.fillRect(-plankW / 2, -plankH / 2, plankW, plankH);
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(-plankW / 2, -plankH / 2, plankW, plankH * 0.25);
    ctx.restore();
    // Staander met touw naar de leuning, om de 4 planken.
    if (i % 4 === 0 && behind <= 0) {
      ctx.strokeStyle = PALETTE.woodDark;
      ctx.lineWidth = Math.max(2, ppm * 0.035);
      ctx.beginPath();
      ctx.moveTo(x, groundY);
      ctx.lineTo(x, ropeY);
      ctx.stroke();
    }
  }

  // Stof en gruis aan de instortingsrand.
  if (collapseX > -50 && collapseX < w) {
    for (let k = 0; k < 10; k++) {
      const px = collapseX + Math.sin(t * 7 + k * 1.7) * ppm * 0.3;
      const py = groundY + ((t * 220 + k * 37) % (h - groundY));
      ctx.fillStyle = `rgba(200, 170, 140, ${0.5 - (py - groundY) / (h - groundY) / 2})`;
      ctx.fillRect(px, py, 3, 3);
    }
    // Waarschuwingsgloed als de instorting dichtbij is.
    const gap = stage.distance - stage.collapse;
    if (gap < 3) {
      const a = (1 - gap / 3) * 0.35;
      const grad = ctx.createLinearGradient(0, 0, w * 0.4, 0);
      grad.addColorStop(0, `rgba(255, 77, 109, ${a})`);
      grad.addColorStop(1, 'rgba(255, 77, 109, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w * 0.4, h);
    }
  }
}
