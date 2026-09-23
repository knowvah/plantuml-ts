/**
 * `Theme.colors` field shape — split out of theme.ts (cdd-T30) to keep that
 * file under the project's 500-line file-size cap. A pure move: every field
 * below, doc comments included, is unchanged from the pre-split `Theme`
 * interface's own `colors: { ... }` inline shape. See theme.ts's own doc
 * comment for the full module map (it already split `ThemeGraphColors` out
 * the same way, to theme-graph-colors.ts).
 */

import type { ElementColors, ThemeGraphColors } from './theme-graph-colors.js';

export interface ThemeColorFields {
  background: string;
  /** Default fill for action/node shapes (separate from canvas background). */
  nodeBackground: string;
  /**
   * Default fill of every sequence participant head — `participant,
   * actor, boundary, control, entity, queue, database, collections`.
   *
   * Each kind's style signature is `root, element, sequenceDiagram,
   * <kind>` (`sequencediagram/ParticipantType.java:55-80`), and
   * `plantuml.skin:197-201` sets `BackgroundColor: var(--grey-blue)` for
   * all eight, with `--grey-blue: #e2e2f0` at `plantuml.skin:4`.
   * `skin/rose/Rose.java:138-150` builds `ComponentRoseParticipant` from
   * those styles; the component takes `biColor.getBackColor()`
   * (`ComponentRoseParticipant.java:82`). A flat field like
   * {@link nodeBackground}, not a `colors.elements` bucket, because the
   * skin rule is scoped to `sequenceDiagram { }` while the buckets are
   * diagram-agnostic (`actor`/`database` are description kinds too). A
   * per-kind `elements[<kind>].background` bucket (skinparam, `<style>`)
   * and an inline `participant X #color` both still win over it; a
   * theme's or `<style>`'s bare `root { BackgroundColor }` overrides it
   * (declaration-order merge, `StyleStorage#computeMergedStyle:102-114`).
   */
  participantBackground: string;
  border: string;
  text: string;
  arrow: string;
  note: string;
  // NOTE: upstream default is '#FBFB77' (HColors.COL_FBFB77 in ColorParam.java).
  // This value intentionally diverges. Tracked in plans/skinparam/decision-journal.md.
  noteBackground: string;
  lifeline: string;
  activation: string;
  frame: string;
  divider: string;
  error: string;
  /** Per-element (SName) color buckets — decision D4. Populated by skinparam
   *  (T4) and element-scoped style blocks (T5); read via
   *  {@link resolveElementPaint}, which cascades element-specific → root
   *  default. This is where gradient (Paint) colors live — the flat fields
   *  below stay `string` (widening them ripples into ~20 not-yet-Paint-aware
   *  renderers with no gradient need; see decision-journal.md T3). */
  elements?: Partial<Record<string, ElementColors>>;
  /** G2 N37: the SAME `.tagname` stereotype-name style-cascade
   *  sub-selector as `graph.classTagCascade` above, applied to the NOTE
   *  bucket (`note { .faint { BackgroundColor red } } }`,
   *  `xokipa-29-rafu481`/`fabuje-68-gona310`/`neruke-07-ruce381`) --
   *  keyed by the SAME cleaned tag name; `renderer-note.ts
   *  #resolveNoteBackground` reads `.background` between a note's own
   *  explicit `#color` override and the bare `elements.note` bucket. */
  noteTagCascade?: Readonly<Record<string, ElementColors>>;
  /** `PName.ShowStereotype` per `.tagname` -- see
   *  `style-map-element.ts#computeShowStereotypeByTag`. An ABSENT entry
   *  means show, mirroring upstream's `ValueNull` branch
   *  (`Display.java:131-133`); only an explicit `false` lands here. */
  showStereotypeByTag?: Readonly<Record<string, boolean>>;
  graph: ThemeGraphColors;
}
