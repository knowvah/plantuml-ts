/**
 * Shared types for the note-on-entity layout module family
 * (`note-layout.ts` + siblings). Split out as a dependency-free leaf so
 * `note-layout-measure.ts`, `note-layout-groups.ts`, and `note-layout-tip.ts`
 * can each import the shapes they need without creating an import cycle.
 */
import type { UrlInfo, NotePosition } from './ast.js';
import type { OpalePoint, OpaleDirection } from './note-opale.js';
import type { EnhancedBodyGeo } from './class-body-enhanced-layout.js';
import type { MemberRenderAtom } from './class-member-creole.js';

/**
 * Upstream's leaf type for a class-diagram note — the two `LeafType` values
 * `GeneralImageBuilder#createEntityImageBlock` dispatches to DIFFERENT image
 * classes: `LeafType.NOTE -> new EntityImageNote(leaf)` (`:118-119`) and
 * `LeafType.TIPS -> new EntityImageTips(leaf, bibliotekon)` (`:219-220`).
 *  - `'NOTE'` — created by `CommandFactoryNote` (freestanding, `:197`) or
 *    `CommandFactoryNoteOnEntity` (`note <pos> [of X]`, `:329`): the folded-
 *    corner box, plain OR opalisable (`EntityImageNote#drawU`'s `opaleLine`
 *    branch is a DRAW-time choice inside the same leaf type, so a `NoteGeo`
 *    with `opale` set is still `'NOTE'`).
 *  - `'TIPS'` — created by `CommandFactoryTipOnEntity` (`note <left|right>
 *    of Class::member`, `:218-220`): ONE leaf per (host, side), each
 *    `::member` line a tip INSIDE it (`tips.putTip(member, display)`); draws
 *    unwrapped via the zigzag notch (`EntityImageTips#drawU`), and a tip
 *    whose `::member` matches no row is `dropped` by that same draw path.
 * Mission `note-leaf-model` D2: the two stay distinct on the way into the
 * single leaf collection — this field is what carries the distinction.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/abel/LeafType.java:49
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GeneralImageBuilder.java:118-119,219-220
 */
export type NoteLeafType = 'NOTE' | 'TIPS';

export interface NoteGeo {
  id: string;
  /**
   * Which upstream image class draws this note — see {@link NoteLeafType}.
   * Set by EVERY producer to the leaf type upstream's COMMAND created:
   * `note-layout-tip.ts#tipNoteGeo` -> `'TIPS'` (a `::member` note in a
   * member-tip group, `CommandFactoryTipOnEntity`), `plainNoteGeo` and
   * `note-opale.ts#buildOpaleNoteGeo` -> `'NOTE'` (opalisable-or-not is a
   * draw-time branch inside `EntityImageNote#drawU`, same leaf). The two
   * draw passes dispatch on it exactly as `GeneralImageBuilder` does; a
   * `'TIPS'` leaf whose host is not a drawn classifier draws nothing
   * (`EntityImageTips#drawU`'s "Error1"/"Error2" return, `note-tips-
   * resolve.ts`) -- before mission `note-leaf-model` D3 this port instead
   * fell through to an opalised plain box for that case (0 corpus fixtures,
   * jar-verified 2026-08-15 that upstream draws no tip there).
   */
  leafType: NoteLeafType;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Note body split into render lines. */
  lines: string[];
  /** G2/N21: each line's OWN measured text width (unrounded -- T8 removed
   *  the pre-emission `javaRound4` rounding this used to carry; rounding
   *  now happens once, at SVG emission, ADR-1), parallel to `lines` --
   *  `renderer-note.ts#renderNoteText`'s per-row `textLength` attribute
   *  must use the line's real width, not the note box's shared (max-line-
   *  driven) width; jar-verified against `sisolu-74-minu975`'s 3-line note
   *  (line 1 == box max width, lines 2-3 strictly narrower, each with its
   *  own distinct `textLength`).
   */
  lineWidths: number[];
  /**
   * G2 N55: each line's flat `MemberRenderAtom[]` run sequence, parallel to
   * `lines`/`lineWidths` -- routes note body text through the SAME shared
   * creole atom engine `class-member-creole.ts` already wires for classifier
   * member rows (G2 N22), so a note line carrying `**bold**`/`//italic//`/
   * `<color:...>`/etc. markup draws as its jar-real per-RUN `<text>` sequence
   * instead of one plain `<text>` of the literal (unrendered) source markup
   * -- jar-verified against `tenobo-24-liga464`'s `Yet **another**` note line
   * (jar: two `<text>` runs, "Yet" plain + "another" `font-weight="700"`, x
   * split at the FIRST run's own measured width). ALWAYS populated by
   * `measureNote` (production geo builders never omit it, mirroring
   * `ClassifierGeo.rows[].atoms`'s own "always set at layout time" contract,
   * `class-member-rows.ts`) -- optional ONLY so a hand-built `NoteGeo`
   * literal (test fixtures that construct one directly, bypassing
   * `note-layout.ts`) can omit it and fall back to the pre-cutover plain-line
   * rendering path (`renderer-note.ts#renderNoteText`'s own fallback
   * branch), matching `ClassifierGeo.rows[].atoms`'s identical optional-
   * with-fallback precedent (`renderer-classifier-box.ts#renderRowText`).
   */
  lineAtoms?: readonly (readonly MemberRenderAtom[])[];
  /**
   * G2 N56: each line's own drawn height (`Math.max(atom.font.size, 10)`
   * across every 'text' atom on that line, jar's real `AtomText.
   * calculateDimensionSlow`'s per-atom floor) -- parallel to `lines`/
   * `lineAtoms`. Jar's `Sea`/`Position`/`SheetBlock1#initMap` stack stripes
   * by each stripe's OWN height (`y += sea.getHeight()`), not a flat
   * `NOTE_FONT_SIZE` -- a `<size:18>` run on an otherwise-13pt line makes
   * THAT line 18pt tall and shifts every line below it (jar-verified
   * `fogexa-30-zupo141`/`vicuro-37-tese143`: box height 54 = 18+13+13+2*5,
   * this port's pre-N56 formula emitted 49 = 3*13+10). ALWAYS populated by
   * `measureNote` (mirrors `lineAtoms`'s own "always set at layout time,
   * optional only for a hand-built test literal" contract) -- `undefined`
   * falls back to the note's flat resolved `fontSize` per line, matching
   * the pre-N56 formula exactly (see `renderer-note.ts#renderNoteText`).
   */
  lineHeights?: readonly number[];
  /** Routed connector points from the note to its host classifier. Empty
   *  for a `'TIPS'` leaf (G2/N13 — the connector is a notch merged into the
   *  note's own outline instead, resolved at draw time from `tipRequest`
   *  below) and for a resolved opalisable `'NOTE'` (`opale` below). */
  connector: Array<{ x: number; y: number }>;
  /**
   * `ClassNote.target` copied verbatim -- the `of <Entity>` host id (a
   * classifier OR a package/namespace id; NOT the `::member` suffix, which
   * is `tipRequest.member`). `undefined` for a freestanding note. Two
   * draw-side consumers, neither resolved here (mission `note-leaf-model`
   * D3 -- the geo build no longer looks the host up in the classifier
   * collection at all): `renderer.ts` draws a note whose target IS a drawn
   * classifier immediately after that host in document order (G2 N52 --
   * jar draws every classifier/note as a graph NODE in real creation order,
   * then every edge; jar-verified `dozugo-00-jado141`/`refeku-65-gapu585`/
   * `janeba-15-duja043`/`cajicu-52-cego765`, each showing the note's `<g>`
   * between its host and the NEXT classifier), a note whose target is not
   * (package target, freestanding) keeps the trailing position; and
   * `note-tips-resolve.ts` looks a `'TIPS'` leaf's host up by this id.
   */
  target?: string;
  /**
   * Present iff `leafType === 'TIPS'`: the INPUTS `EntityImageTips#drawU`
   * resolves against the host at DRAW time -- `member` (`ClassNote
   * .targetPort`, the `::member` text `nodeOther.getBestMatch(member)` fuzzy-
   * matches), `position` (`getPosition()`, the declared side whose
   * `reverseDirection()` seeds the notch direction) and the two font metrics
   * `memberPosition.getCenterY()` needs to turn a host row's text baseline
   * (`ClassifierGeo.rows[].y`) into the row's centre (`baselineOffset =
   * fontSize - descent`, `rowHeight = fontSize` -- baked here at layout time
   * exactly as `lineHeights`/`lineWidths` are, so the draw passes stay
   * measurer-free). The RESULT (direction, `pp1`/`pp2`, or dropped) is
   * produced by `note-tips-resolve.ts#resolveTips` from `(notes,
   * classifiers)` inside both draw passes -- `class-ink-box.ts#buildInkBox`
   * (this port's `LimitFinder`) and `renderer.ts` -- never stored on the geo
   * (mission `note-leaf-model` D3: upstream has no layout-time member-tip
   * resolution, `GeneralImageBuilder` hands `EntityImageTips` the
   * `bibliotekon` and it resolves in `drawU`).
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/image/EntityImageTips.java#drawU
   */
  tipRequest?: TipRequest;
  /**
   * G2/N14: present only for a RESOLVED general "opalisable" note (a
   * single-link `note <pos> of X`, NOT a member-tip — `EntityImageNote
   * .java`'s `opaleLine` branch). Same zigzag-notch mechanism as `tip`
   * above, but ALL FOUR directions are reachable (`getOpaleStrategy`,
   * geometry-driven, not derived from the note's own declared position
   * keyword) and `pp1`/`pp2` come from the routed DOT connector spline
   * instead of a fixed member-row anchor.
   */
  opale?: { direction: OpaleDirection; pp1: OpalePoint; pp2: OpalePoint };
  /**
   * G2 N15: copied from `ClassNote.creationIndex` (that field's own doc
   * comment covers the phantom-GMN-slot derivation) — `undefined` for a
   * member-tip note (unchanged fallback numbering).
   */
  creationIndex?: number;
  /** G2 N15: copied from `ClassNote.phantomSlot` — see that field's doc
   *  comment (`renderer-uid.ts#assignExact` consumes it). */
  phantomSlot?: true;
  /** G2 N34: copied from `ClassNote.color` — see that field's doc comment
   *  (`renderer-note.ts#resolveNoteBackground` consumes it). */
  color?: string;
  /** G2 N37: copied from `ClassNote.stereotype` — see that field's doc
   *  comment (`renderer-note.ts#resolveNoteBackground` consumes it for the
   *  `.tagname` `<style>` cascade). */
  stereotype?: string;
  /** G2 N70: copied from `ClassNote.url` — `renderer.ts` wraps the note's
   *  rendered inner SVG in a single `<a xlink:href>` via `svg.ts#linkWrap`
   *  when set. Absent for a note with no `[[url]]`. */
  url?: UrlInfo;
  /**
   * G2 N53: copied from `ClassNote.tipGroupPhantomIndex` -- see that
   * field's doc comment (ast.ts) and `renderer-uid.ts#assignExact` (which
   * consumes it as TWO phantom ranks). `undefined` for every note except a
   * member-tip group's leader.
   */
  tipGroupPhantomIndex?: number;
}

/**
 * A `'TIPS'` leaf's draw-time resolution inputs -- see
 * {@link NoteGeo.tipRequest}. `position` keeps the full `NotePosition`
 * (upstream's `CommandFactoryTipOnEntity` regex admits only `right|left`;
 * this port's `NOTE_TARGET` grammar also reaches here for `top|bottom` --
 * `.agent-notes/note-leaf-model-b1.md`), and the direction seed treats
 * anything but `'left'` as `Position.RIGHT.reverseDirection()`, unchanged
 * from the pre-D3 `resolveTipDirection`.
 */
export interface TipRequest {
  member: string;
  position: NotePosition;
  baselineOffset: number;
  rowHeight: number;
}

/**
 * Minimal classifier-position + row-text view `note-tips-resolve.ts` needs
 * to resolve a `'TIPS'` leaf against its host — a structural subset of
 * `class-geo-types.ts#ClassifierGeo` (every `ClassifierGeo` satisfies it),
 * kept as its own leaf type so a test can hand-build a host without a full
 * `ClassifierGeo` literal and so this module stays import-cycle-free.
 */
export interface ClassifierAnchor {
  id: string;
  x: number;
  y: number;
  /**
   * G2 N34: `indent` (`ClassifierGeo.rows[].indent`'s own doc comment --
   * "this row's real left-edge offset from `geo.x`") is REQUIRED, not
   * derived from a flat margin constant -- `tipAnchor` below reads it for
   * the row's TEXT-run right edge (`rowMaxX`, a visibility-icon row's own
   * text starts `ICON_WIDTH`, 14px, past the plain text margin -- jar-
   * verified `rubuxe-58-peba652`). The row's LEFT edge (`rowMinX`) stays a
   * flat margin regardless of `indent` (see `tipAnchor`'s own doc comment
   * for why the two ends of one row aren't symmetric upstream).
   */
  rows: ReadonlyArray<{ text: string; y: number; width?: number; indent: number }>;
  /**
   * G2 N47: copied unchanged from `ClassifierGeo.enhancedBody` when present
   * -- `class-layout-helpers.ts`'s enhanced-body branch leaves `rows` at
   * JUST `[...stereoRows, headerRow]` (member content lives entirely in
   * `enhancedBody.parts` instead, `renderer-body-enhanced.ts`'s own draw
   * path), so a member-tip note's `::member` target has nothing to match
   * against `rows.slice(1)` for an enhanced-body host -- every such note
   * was silently dropped (jar-verified `fopose-13-kase592`: `note right of
   * A::attr` on a class whose body triggers `isBodyEnhanced` via a bare
   * `..` separator line -- jar draws the note, this port dropped it).
   * `memberAnchorRows` below reads this to fall back to `enhancedBody`'s
   * OWN row list (already `ClassifierGeo['rows']`-shaped, N42-verified
   * byte-exact for the render path) when the classic `rows` array carries
   * no member content.
   */
  enhancedBody?: EnhancedBodyGeo;
}
