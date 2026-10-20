/**
 * sequence-shadow.ts -- the drop-shadow `<filter>` a shadowed sequence shape
 * references (unwind2-S9, S9b), and which elements need it (sdd1 T3b).
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
 * Each element's delta is its OWN merged style's `getShadowing()`
 * (`Style.java:108-115`), resolved from the builder its command captured
 * (sdd1 D2) and carried on the geo node's `paint` -- so a `skinparam
 * shadowing true` or `<style>` reaches only the elements after it.
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
import type { ActivationGeo, DividerGeo, EventGeo, FrameGeo, SequenceGeometry } from './ast.js';
import type { SequencePaint } from './sequence-skin-param.js';

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
  const blur = attrs([
    ['result', 'blurOut'],
    ['stdDeviation', fmt(SHADOW_BLUR * k)],
  ]);
  const offset = attrs([
    ['result', 'blurOut3'],
    ['in', 'blurOut2'],
    ['dx', fmt(SHADOW_OFFSET * k)],
    ['dy', fmt(SHADOW_OFFSET * k)],
  ]);
  return (
    '<filter' +
    FILTER_HEAD +
    '><feGaussianBlur' +
    blur +
    '/>' +
    COLOR_MATRIX +
    '<feOffset' +
    offset +
    '/>' +
    BLEND +
    '</filter>'
  );
}

/** The filter's fixed parts (`SvgGraphics.java:1074-1085`). */
const FILTER_HEAD = attrs([
  ['id', SEQUENCE_SHADOW_FILTER_ID],
  ['x', -1],
  ['y', -1],
  ['width', '300%'],
  ['height', '300%'],
]);
const COLOR_MATRIX =
  '<feColorMatrix' +
  attrs([
    ['type', 'matrix'],
    ['in', 'blurOut'],
    ['result', 'blurOut2'],
    ['values', SHADOW_COLOR_MATRIX_VALUES],
  ]) +
  '/>';
const BLEND =
  '<feBlend' +
  attrs([
    ['in', 'SourceGraphic'],
    ['in2', 'blurOut3'],
    ['mode', 'normal'],
  ]) +
  '/>';

/**
 * `addFilterShadowId` (`SvgGraphics.java:889-893`): a shape with
 * `deltaShadow > 0` references the document's shadow filter; any other gets
 * no `filter` attribute.
 */
export function sequenceShadowFilter(deltaShadow: number): { readonly filter?: string } {
  return deltaShadow > 0 ? { filter: `url(#${SEQUENCE_SHADOW_FILTER_ID})` } : {};
}

/**
 * The delta a frame's shadowed rect carries: the BODY style's symbol context
 * for a grouping frame's background rect (`ComponentRoseGroupingHeader
 * .java:81,126-131`) and for a `ref`'s body rect (`ComponentRoseReference
 * .java:73,89-94`), i.e. the frame's own `paint`. Layout paints every frame
 * (`sequence-layout-frame.ts`, `sequence-layout-ref.ts`), so an unpainted one
 * throws, as {@link paintOf} does for an activation or a divider.
 *
 * `_theme` is unread: `renderer-frame-header.ts` (sdd1 T3f's file) still
 * passes it, and drops it when it next changes.
 */
export function frameShadowDelta(frame: Pick<FrameGeo, 'frameType' | 'paint'>): number {
  if (frame.paint === undefined) throw new Error(`${frame.frameType} frame carries no paint`);
  return frame.paint.shadowing;
}

/** The paint layout resolved for a geo its renderer draws from paint alone
 *  (`renderer-lifeline.ts`, `renderer-divider.ts` throw the same way). */
function paintOf(geo: ActivationGeo | DividerGeo): SequencePaint {
  if (geo.paint !== undefined) return geo.paint;
  const what = geo.kind === 'divider' ? `divider "${geo.text}"` : `activation of ${geo.participantId}`;
  throw new Error(`${what} carries no paint`);
}

/** Whether one event draws a shadowed shape, read where its renderer reads
 *  it: the activation box (`renderer-lifeline.ts`), the divider band
 *  (`renderer-divider.ts`, `ComponentRoseDivider.java:74,115`), the note body
 *  (`NoteGeo.shadow`, set from the note's paint) and the frame. */
function eventShadowed(e: EventGeo): boolean {
  switch (e.kind) {
    case 'frame':
      return frameShadowDelta(e) > 0;
    case 'activation':
      return e.height > 0 && activationShadowFilter(paintOf(e)).filter !== undefined;
    case 'divider':
      return sequenceShadowFilter(paintOf(e).shadowing).filter !== undefined;
    case 'note':
      return (e.shadow ?? 0) > 0;
    default:
      return false;
  }
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
  const shadowed = geo.participants.some((p) => (p.shadow ?? 0) > 0) || geo.events.some(eventShadowed);
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
export function activationShadowFilter(paint: Pick<SequencePaint, 'shadowing'>): { readonly filter?: string } {
  return sequenceShadowFilter(paint.shadowing > 0 ? 1 : 0);
}
