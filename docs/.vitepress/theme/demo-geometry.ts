import type { Level } from './demo-icons';

const TILT: Record<Level, number> = { hide: -13, lower: -6, normal: 0, raise: 6, pin: 13 };
const ARM = 52;

export function balancePosition(level: Level) {
  const tilt = TILT[level];
  const rad = tilt * Math.PI / 180;
  return { tilt, dx: ARM * (1 - Math.cos(rad)), dy: ARM * Math.sin(rad) };
}

/** Where the result menu goes in a demo's stage: over its button, its arrow pointing down at it, or under it where there's no room above (position() in ui.ts). */
export interface MenuPlace {
  left: number;
  width: number;
  arrow: number;
  below: boolean;
  /** From the stage's top when below the button, else its bottom from the stage's bottom. */
  edge: number;
}
export function placeMenu(stage: HTMLElement, button: HTMLElement, height = 215): MenuPlace {
  const b = stage.getBoundingClientRect();
  const w = button.getBoundingClientRect();
  const width = Math.min(340, b.width - 16);
  const centre = w.left - b.left + w.width / 2;
  const left = Math.max(8, Math.min(centre - 22, b.width - width - 8));
  const below = w.top - b.top - 12 - height < 8;
  return { left, width, arrow: centre - left, below, edge: below ? w.bottom - b.top + 12 : b.bottom - w.top + 12 };
}
