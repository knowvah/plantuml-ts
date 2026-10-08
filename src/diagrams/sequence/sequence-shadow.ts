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
import { fmt } from '../../core/svg-format.js';
import type { Theme } from '../../core/theme.js';
import type { EventGeo, FrameGeo, SequenceGeometry } from './ast.js';

/** The pre-seed id; `svg-defs-seeded.ts#applySeededDefIds` renames it. */
const SEQUENCE_SHADOW_FILTER_ID = 'sequenceShadow';

/** `SvgGraphics`'s alpha-only colour matrix for the blurred copy. */
const SHADOW_COLOR_MATRIX_VALUES = '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .4 0';

/** `format(2)` and `format(4)` (`SvgGraphics.java:1081,1084`): `format`
 *  applies the document scale (`:466-473`), so a `scale 0.5` diagram's
 *  filter blurs by 1 and offsets by 2 (`gepuce-64-pivu656`). */
const SHADOW_BLUR = 2;
const SHADOW_OFFSET = 4;

/** The shadow `<filter>` def at document scale `k`.
 *  @see SvgGraphics.java:1070-1090 */
export function sequenceShadowFilterDef(k = 1): string {
  return (
    `<filter${attrs([
      ['id', SEQUENCE_SHADOW_FILTER_ID],
      ['x', -1],
      ['y', -1],
      ['width', '300%'],
      ['height', '300%'],
    ])}>` +
    `<feGaussianBlur${attrs([
      ['result', 'blurOut'],
      ['stdDeviation', fmt(SHADOW_BLUR * k)],
    ])}/>` +
    `<feColorMatrix${attrs([
      ['type', 'matrix'],
      ['in', 'blurOut'],
      ['result', 'blurOut2'],
      ['values', SHADOW_COLOR_MATRIX_VALUES],
    ])}/>` +
    `<feOffset${attrs([
      ['result', 'blurOut3'],
      ['in', 'blurOut2'],
      ['dx', fmt(SHADOW_OFFSET * k)],
      ['dy', fmt(SHADOW_OFFSET * k)],
    ])}/>` +
    `<feBlend${attrs([
      ['in', 'SourceGraphic'],
      ['in2', 'blurOut3'],
      ['mode', 'normal'],
    ])}/>` +
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
  const shadowing = theme.colors.graph.sequenceShadowing;
  return (frame.frameType === 'ref' ? shadowing?.reference : shadowing?.group) ?? 0;
}

/** Whether one event draws a shadowed shape. */
function eventShadowed(e: EventGeo, theme: Theme): boolean {
  if (e.kind === 'frame') return frameShadowDelta(e, theme) > 0;
  if (e.kind === 'activation') return e.height > 0 && activationShadowFilter(theme).filter !== undefined;
  if (e.kind === 'divider') return (theme.colors.graph.sequenceShadowing?.divider ?? 0) > 0;
  return e.kind === 'note' && (e.shadow ?? 0) > 0;
}

/**
 * The page's `<defs>` contribution: `manageShadow` (`SvgGraphics.java:
 * 1070-1090`) appends the filter the first time a shadowed shape is drawn,
 * so a page with no shadowed frame, head or note gets none.
 */
export function sequenceShadowDefs(
  geo: Pick<SequenceGeometry, 'events' | 'participants'>,
  theme: Theme & { readonly scaleK: number },
): string {
  const shadowed = geo.participants.some((p) => (p.shadow ?? 0) > 0) || geo.events.some((e) => eventShadowed(e, theme));
  return shadowed ? sequenceShadowFilterDef(theme.scaleK) : '';
}

/**
 * A note's shape with its body shadowed: the polygon (`ComponentRoseNote
 * .java:119`) or rectangle (`ComponentRoseNoteBox.java:101`) is the FIRST
 * element drawn, and the folded corner after it carries no shadow (`:123`).
 */
export function withNoteShadow(shape: string, deltaShadow: number): string {
  const { filter } = sequenceShadowFilter(deltaShadow);
  if (filter === undefined) return shape;
  const end = shape.indexOf('/>');
  return shape.slice(0, end) + attrs([['filter', filter]]) + shape.slice(end);
}

/**
 * `ComponentRoseActiveLine#drawInternalU`: `if (symbolContext.isShadowing())
 * rect.setDeltaShadow(1)` (`ComponentRoseActiveLine.java:82-83`) -- the
 * activation style's shadow only gates a fixed delta, and it adds no
 * geometry. The box draws nothing at height 0 (`:76-77`).
 */
export function activationShadowFilter(theme: Theme): { readonly filter?: string } {
  return sequenceShadowFilter(theme.colors.graph.sequenceShadowing?.activation ?? 0);
}
