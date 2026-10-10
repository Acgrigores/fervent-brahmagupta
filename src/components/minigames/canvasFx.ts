// Shared pixel-art canvas helpers for the animal mini-games

export function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Small seeded random generator so scenery always draws the same way
export function seeded(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function makeLayer(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  draw(ctx);
  return canvas;
}

// Smooth wave that repeats exactly every `period` pixels (whole-number frequencies)
export function wave(x: number, period: number, parts: [number, number, number][]) {
  return parts.reduce((sum, [amp, freq, phase]) => sum + amp * Math.sin((x / period) * Math.PI * 2 * freq + phase), 0);
}

// Fills a rolling ridge in 2px columns and returns the top y of each column
export function ridge(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  base: number,
  parts: [number, number, number][],
  color: string,
  edge?: string
) {
  const tops: number[] = [];
  for (let x = 0; x < w; x += 2) {
    const top = Math.round((base + wave(x, w, parts)) / 2) * 2;
    tops[x] = top;
    ctx.fillStyle = color;
    ctx.fillRect(x, top, 2, h - top);
    if (edge) {
      ctx.fillStyle = edge;
      ctx.fillRect(x, top, 2, 2);
    }
  }
  return tops;
}

export function mix(a: string, b: string, t: number) {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')})`;
}

// Draws a tiling layer twice so it scrolls seamlessly
export function drawTiled(ctx: CanvasRenderingContext2D, layer: HTMLCanvasElement, scroll: number) {
  const offset = Math.floor(scroll % layer.width);
  ctx.drawImage(layer, -offset, 0);
  ctx.drawImage(layer, layer.width - offset, 0);
}

// Adds a 1px outline around every opaque pixel of a small art canvas
export function outlineArt(ctx: CanvasRenderingContext2D, w: number, h: number, color: string) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const opaque = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0;
  const edge: [number, number][] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!opaque(x, y) && (opaque(x + 1, y) || opaque(x - 1, y) || opaque(x, y + 1) || opaque(x, y - 1))) edge.push([x, y]);
    }
  }
  ctx.fillStyle = color;
  edge.forEach(([x, y]) => ctx.fillRect(x, y, 1, 1));
}

export function circleHitsRect(cx: number, cy: number, r: number, rx: number, ry: number, rw: number, rh: number) {
  const nx = Math.max(rx, Math.min(cx, rx + rw));
  const ny = Math.max(ry, Math.min(cy, ry + rh));
  return (cx - nx) ** 2 + (cy - ny) ** 2 < r * r;
}

// 7x6 pixel heart
const HEART_ROWS = ['.XX.XX.', 'XXXXXXX', 'XXXXXXX', '.XXXXX.', '..XXX..', '...X...'];
export function drawPixelHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) {
  ctx.fillStyle = color;
  HEART_ROWS.forEach((row, ry) =>
    row.split('').forEach((c, rx) => {
      if (c === 'X') ctx.fillRect(Math.round(x + rx * size), Math.round(y + ry * size), size, size);
    })
  );
}

// Screen shake for the first moments after a hit. Call inside ctx.save()/restore().
export function applyHurtShake(ctx: CanvasRenderingContext2D, sinceHurt: number) {
  if (sinceHurt >= 0.4) return;
  const power = 7 * (1 - sinceHurt / 0.4);
  ctx.translate(Math.round((Math.random() - 0.5) * power * 2), Math.round((Math.random() - 0.5) * power * 2));
}

/** Red flash, a "-1" heart falling away from the player, and an "OUCH! -1 HEART" banner. */
export function drawHurtFeedback(
  ctx: CanvasRenderingContext2D,
  opts: { w: number; h: number; sinceHurt: number; x: number; y: number; livesLeft: number; showBanner: boolean; noun?: string }
) {
  const { w, h, sinceHurt, x, y, livesLeft, showBanner, noun = 'HEART' } = opts;
  if (sinceHurt < 0.5) {
    ctx.fillStyle = `rgba(220, 38, 38, ${0.45 * (1 - sinceHurt / 0.5)})`;
    ctx.fillRect(0, 0, w, h);
  }
  if (sinceHurt < 1.2) {
    ctx.globalAlpha = Math.max(0, 1 - sinceHurt / 1.2);
    const hy = y - 34 + sinceHurt * 70;
    drawPixelHeart(ctx, x + 14, hy + 2, 3, '#450a0a');
    drawPixelHeart(ctx, x + 12, hy, 3, '#dc2626');
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillStyle = '#7f1d1d';
    ctx.fillText('-1', x + 38, hy + 16);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('-1', x + 36, hy + 14);
    ctx.globalAlpha = 1;
  }
  if (showBanner && sinceHurt < 1.1) {
    ctx.fillStyle = 'rgba(46, 16, 5, 0.85)';
    ctx.fillRect(w / 2 - 150, 60, 300, 60);
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(w / 2 - 150, 60, 300, 4);
    ctx.fillRect(w / 2 - 150, 116, 300, 4);
    ctx.textAlign = 'center';
    ctx.font = '16px "Press Start 2P", monospace';
    ctx.fillStyle = '#fca5a5';
    ctx.fillText(`OUCH! -1 ${noun}`, w / 2, 90);
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.fillStyle = '#fde68a';
    ctx.fillText(`${livesLeft} ${noun}${livesLeft === 1 ? '' : 'S'} LEFT`, w / 2, 110);
    ctx.textAlign = 'left';
  }
}
