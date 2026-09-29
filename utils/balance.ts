import { icon } from './dom';
import type { Level } from './matcher';

// The balance under the cartouche, in the result menu and the popup: the site's pan
// on the left, the feather's on the right.

// The balance tilts with the verdict: a hidden site sinks, a pinned one rises
// against the feather. Angles in degrees; negative drops the site's (left) pan.
const TILT: Record<Level, number> = { hide: -13, lower: -6, normal: 0, raise: 6, pin: 13 };
const ARM = 52;

export function balanceSvg(): SVGSVGElement {
  return icon(`<svg xmlns="http://www.w3.org/2000/svg" class="balance" viewBox="0 0 132 40" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round">
    <path d="M66 7v28M56 37h20"/>
    <circle cx="66" cy="5" r="1.6" fill="currentColor" stroke="none"/>
    <g class="beam" style="transform-origin: 66px 9px; transform-box: view-box"><path d="M14 9h104"/></g>
    <g class="pan left">
      <path d="M14 9 7 24M14 9l7 15"/><path d="M4 24h20a10 5 0 0 1-20 0z" fill="currentColor" fill-opacity=".14"/>
      <path d="M14 21.5c-1.8-1.6-3.2-2.6-3.2-4a1.7 1.7 0 0 1 3.2-.8 1.7 1.7 0 0 1 3.2.8c0 1.4-1.4 2.4-3.2 4z" fill="currentColor" stroke="none"/>
    </g>
    <g class="pan right">
      <path d="M118 9l-7 15M118 9l7 15"/><path d="M108 24h20a10 5 0 0 1-20 0z" fill="currentColor" fill-opacity=".14"/>
      <path d="M115 22.5c1.5-3.5 3.5-5.8 6-7-.3 3.2-2.4 5.6-6 7zM116.4 20.6l2.4-.4"/>
    </g>
  </svg>`) as SVGSVGElement;
}

export function setBalance(svg: Element, level: Level): void {
  const deg = TILT[level];
  const rad = (deg * Math.PI) / 180;
  const dy = ARM * Math.sin(rad);
  const dx = ARM * (1 - Math.cos(rad));
  svg.querySelector<SVGGElement>('.beam')?.style.setProperty('transform', `rotate(${deg}deg)`);
  svg.querySelector<SVGGElement>('.pan.left')?.style.setProperty('transform', `translate(${dx}px, ${-dy}px)`);
  svg.querySelector<SVGGElement>('.pan.right')?.style.setProperty('transform', `translate(${-dx}px, ${dy}px)`);
}
