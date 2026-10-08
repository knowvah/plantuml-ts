/**
 * sequence-shadow.ts -- the drop-shadow `<filter>` a shadowed sequence frame
 * references (unwind2-S9).
 *
 * `URectangle#setDeltaShadow` (`ComponentRoseGroupingHeader.java:131`,
 * `ComponentRoseReference.java:94`) reaches `SvgGraphics#manageShadow`, which
 * appends ONE fixed filter per document -- `stdDeviation="2"`, `dx="4"`,
 * `dy="4"` whatever the delta (`SvgGraphics.java:1070-1090`) -- and gives
 * the shape `filter="url(#...)"`. The delta only gates WHETHER the shape is
 * shadowed. Jar-verified: `tests/fixtures/unwind2-S9/style-group.svg`
 * (`Shadowing 3`) and `style-root.svg` (`Shadowing 4`) carry the same
 * filter.
 *
 * The same string as `class/class-shadow.ts` and `state/state-shadow.ts`,
 * duplicated per engine as those two already are (see `class-shadow.ts`'s
 * head comment). The def reaches the document's `<defs>` through the
 * fragment's `extraDefs` (`renderer.ts`), as class and state hand theirs
 * over, and `svg-defs-seeded.ts` renames it to the jar's seeded `f<seed>`
 * id.
 */

import { attrs } from '../../core/svg.js';
import type { Theme } from '../../core/theme.js';
import type { EventGeo, FrameGeo } from './ast.js';

/** The pre-seed id; `svg-defs-seeded.ts#applySeededDefIds` renames it. */
const SEQUENCE_SHADOW_FILTER_ID = 'sequenceShadow';

/** `SvgGraphics`'s alpha-only colour matrix for the blurred copy. */
const SHADOW_COLOR_MATRIX_VALUES = '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .4 0';

/** The shadow `<filter>` def. @see SvgGraphics.java:1070-1090 */
export function sequenceShadowFilterDef(): string {
  return (
    `<filter${attrs([
      ['id', SEQUENCE_SHADOW_FILTER_ID],
      ['x', -1],
      ['y', -1],
      ['width', '300%'],
      ['height', '300%'],
    ])}>` +
    `<feGaussianBlur result="blurOut" stdDeviation="2"/>` +
    `<feColorMatrix${attrs([
      ['type', 'matrix'],
      ['in', 'blurOut'],
      ['result', 'blurOut2'],
      ['values', SHADOW_COLOR_MATRIX_VALUES],
    ])}/>` +
    `<feOffset result="blurOut3" in="blurOut2" dx="4" dy="4"/>` +
    `<feBlend in="SourceGraphic" in2="blurOut3" mode="normal"/>` +
    `</filter>`
  );
}

/**
 * `addFilterShadowId` (`SvgGraphics.java:889-893`): a shape with
 * `deltaShadow > 0` references the document's shadow filter; any other gets
 * no `filter` attribute.
 */
export function sequenceShadowFilter(deltaShadow: number): { readonly filter?: string } {
  return deltaShadow > 0 ? { filter: `url(#${SEQUENCE_SHADOW_FILTER_ID})` } : {};
}

/**
 * The delta a frame's shadowed rect carries: a grouping frame's background
 * rect reads the `group` style (`ComponentRoseGroupingHeader.java:131`), a
 * `ref`'s body rect the `reference` style (`ComponentRoseReference.java:94`).
 */
export function frameShadowDelta(frame: Pick<FrameGeo, 'frameType'>, theme: Theme): number {
  const shadowing = theme.colors.graph.sequenceFrameShadowing;
  return (frame.frameType === 'ref' ? shadowing?.reference : shadowing?.group) ?? 0;
}

/**
 * The page's `<defs>` contribution: `manageShadow` (`SvgGraphics.java:
 * 1070-1090`) appends the filter the first time a shadowed shape is drawn,
 * so a page with no shadowed frame gets none.
 */
export function sequenceShadowDefs(events: readonly EventGeo[], theme: Theme): string {
  const shadowed = events.some((e) => e.kind === 'frame' && frameShadowDelta(e, theme) > 0);
  return shadowed ? sequenceShadowFilterDef() : '';
}
