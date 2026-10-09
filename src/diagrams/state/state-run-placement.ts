import { driverTextPlacement } from '../../core/svg-text-font.js';

/** What {@link placeToken} adds to a run: only the fields that differ from the
 *  plain advance. */
export interface RunPlacement {
  readonly drawDx?: number;
  readonly drawWidth?: number;
}

/**
 * `DriverTextSvg#draw`'s preamble for one token (`DriverTextSvg.java:114-126`),
 * via the shared {@link driverTextPlacement}: each leading space becomes an `x`
 * shift (`drawDx`) and `textLength` is the TRIMMED text's width (`drawWidth`),
 * while the layout advance stays the untrimmed `width` (`AtomText.java:
 * 222-231`). `measure` is the run's own font.
 */
export function placeToken(text: string, width: number, measure: (s: string) => number): RunPlacement {
  if (text === '') return {};
  const placed = driverTextPlacement(text, measure(' '));
  const drawWidth = placed.text === text ? width : measure(placed.text);
  return {
    ...(placed.dx > 0 ? { drawDx: placed.dx } : {}),
    ...(drawWidth !== width ? { drawWidth } : {}),
  };
}
