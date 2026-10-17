import type { Level } from './matcher';

// The dial on each result (desktop): a scale drawn as the left half of a ring around the
// site's icon, read from 9 o'clock, with a watch crown on its left that opens the result
// menu. Raise fills the ring upwards and Lower downwards, as far as the site moves; Pin
// fills all of it, and Hide leaves it empty. Sizes are in CSS pixels, with the icon's
// centre at 0,0.

/** Space between the icon's edge and the ring. */
const GAP = 6;
/** The ring's line, the guards', and the fill: one weight everywhere. */
export const LINE = 2;
/** The crown: a knob on a short stem whose end meets the ring's outer edge. */
const STEM = 6;
const KNOB_W = 10;
const KNOB_H = 17;
/** The guards sit on a wider circle, clear of the knob above and below it. */
const GUARD_OUT = 8;
const GUARD_CLEAR = 3.5;
const GUARD_SPAN = 16;
/** Room for the crown's press area to the left of the knob. */
const HIT_PAD = 4;

export interface DialGeometry {
  /** The ring's radius. */
  r: number;
  /** The guards' radius. */
  guard: number;
  /** The drawing's box: from `left` to `right` and `top` to `bottom`, around the icon's centre. */
  left: number;
  right: number;
  top: number;
  bottom: number;
  /** A quarter of the ring: the most a raise or a lower can fill. */
  quarter: number;
}

/** The dial for an icon `size` pixels across. */
export function dialGeometry(size: number): DialGeometry {
  const d = Math.min(40, Math.max(12, size || 0));
  const r = d / 2 + GAP;
  const guard = r + GUARD_OUT;
  return {
    r,
    guard,
    left: -(r + STEM + KNOB_W + HIT_PAD + 2),
    right: 2,
    top: -(guard + LINE + 1),
    bottom: guard + LINE + 1,
    quarter: (Math.PI * r) / 2,
  };
}

/** How far the ring fills for a ranking: 0 to 1 of a quarter, up for a raise and down for a lower. */
export function dialReading(level: Level, score = 0): { up: number; down: number; full: boolean } {
  if (level === 'pin') return { up: 0, down: 0, full: true };
  if (level !== 'raise' && level !== 'lower') return { up: 0, down: 0, full: false };
  // A site moved 5 places (one Raise of your own) fills half; further moves fill less and less more.
  const amount = score ? 1 - Math.exp((-Math.abs(score) * Math.LN2) / 5) : 0.5;
  const f = Math.min(1, Math.max(0.12, amount));
  return level === 'raise' ? { up: f, down: 0, full: false } : { up: 0, down: f, full: false };
}

const n = (x: number) => Math.round(x * 100) / 100;

/**
 * The dial's drawing. Its parts carry classes the stylesheet colours and the reading moves.
 * `blank` draws a plain disc where the site's icon would be, for results that show none.
 */
export function dialSvg(g: DialGeometry, blank = false): string {
  const { r, guard } = g;
  const a0 = Math.asin(Math.min(0.95, (KNOB_H / 2 + GUARD_CLEAR) / guard));
  const a1 = a0 + (GUARD_SPAN * Math.PI) / 180;
  const gx = (a: number) => n(-guard * Math.cos(a));
  const gy = (a: number) => n(guard * Math.sin(a));
  const guards = `M${gx(a0)} ${-gy(a0)}A${guard} ${guard} 0 0 1 ${gx(a1)} ${-gy(a1)}M${gx(a0)} ${gy(a0)}A${guard} ${guard} 0 0 0 ${gx(a1)} ${gy(a1)}`;
  const half = `M0 ${-r}A${r} ${r} 0 0 0 0 ${r}`;
  const knobRight = -(r + LINE / 2 + STEM);
  const knobLeft = knobRight - KNOB_W;
  const grips = [-4.2, 0, 4.2].map((y) => `M${n(knobLeft + 2.4)} ${y}H${n(knobRight - 2.4)}`).join('');
  const q = n(g.quarter);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="dial" viewBox="${n(g.left)} ${n(g.top)} ${n(g.right - g.left)} ${n(g.bottom - g.top)}" width="${n(g.right - g.left)}" height="${n(g.bottom - g.top)}" aria-hidden="true" focusable="false" fill="none" stroke-linecap="round" stroke-linejoin="round">
    ${blank ? `<circle class="blank" r="${n(g.r - GAP)}"/>` : ''}
    <g class="crown"><rect class="knob" x="${n(knobRight)}" y="-2" width="${n(STEM + 0.4)}" height="4" rx="0.8"/><rect class="knob" x="${n(knobLeft)}" y="${-KNOB_H / 2}" width="${KNOB_W}" height="${KNOB_H}" rx="3"/><path class="grips" d="${grips}"/></g>
    <path class="guards" d="${guards}" stroke-width="${LINE}"/>
    <path class="track" d="${half}" stroke-width="${LINE}"/>
    <path class="fill pin" d="${half}" stroke-width="${LINE}"/>
    <path class="fill up" d="M${-r} 0A${r} ${r} 0 0 1 0 ${-r}" stroke-width="${LINE}" stroke-dasharray="${q} ${q}" stroke-dashoffset="${q}"/>
    <path class="fill down" d="M${-r} 0A${r} ${r} 0 0 0 0 ${r}" stroke-width="${LINE}" stroke-dasharray="${q} ${q}" stroke-dashoffset="${q}"/>
  </svg>`;
}

/** Turn a drawn dial to a ranking: the fill's length moves, and the stylesheet animates it. */
export function setDial(svg: Element, g: DialGeometry, level: Level, score = 0): void {
  const { up, down, full } = dialReading(level, score);
  const set = (sel: string, f: number) => {
    const el = svg.querySelector<SVGPathElement>(sel);
    if (!el) return;
    el.style.setProperty('stroke-dashoffset', String(n(g.quarter * (1 - f))));
    el.style.setProperty('opacity', f > 0 ? '1' : '0');
  };
  set('.fill.up', up);
  set('.fill.down', down);
  svg.querySelector<SVGPathElement>('.fill.pin')?.style.setProperty('opacity', full ? '1' : '0');
}

// The gauge on an image or video card: the same crown and scale, upright on a small pill in
// the picture's top-right corner, where it reads on any picture. Zero is the middle; Raise
// fills up from it and Lower down, Pin all of it, and Hide leaves it empty.

/** Half the gauge's scale: the most a raise or a lower can fill. */
const GAUGE_HALF = 12;

export const GAUGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" class="gauge" viewBox="0 0 24 36" width="24" height="36" aria-hidden="true" focusable="false" fill="none" stroke-linecap="round">
  <g class="crown"><rect class="knob" x="9" y="16.6" width="7" height="2.8" rx="0.6"/><rect class="knob" x="3.2" y="12" width="6" height="12" rx="2"/><path class="grips" d="M4.8 15h2.8M4.8 18h2.8M4.8 21h2.8"/></g>
  <path class="track" d="M17 6V30" stroke-width="${LINE}"/>
  <path class="fill pin" d="M17 6V30" stroke-width="${LINE}"/>
  <path class="fill up" d="M17 18V6" stroke-width="${LINE}" stroke-dasharray="${GAUGE_HALF} ${GAUGE_HALF}" stroke-dashoffset="${GAUGE_HALF}"/>
  <path class="fill down" d="M17 18V30" stroke-width="${LINE}" stroke-dasharray="${GAUGE_HALF} ${GAUGE_HALF}" stroke-dashoffset="${GAUGE_HALF}"/>
</svg>`;

/** The gauge's reading: as the dial's, over half its scale. */
export function setGauge(svg: Element, level: Level, score = 0): void {
  setDial(svg, { quarter: GAUGE_HALF } as DialGeometry, level, score);
}
