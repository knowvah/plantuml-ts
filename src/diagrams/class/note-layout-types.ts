/**
 * Shared types for the note-on-entity layout module family
 * (`note-layout.ts` + siblings). Split out as a dependency-free leaf so
 * `note-layout-measure.ts`, `note-layout-groups.ts`, and `note-layout-tip.ts`
 * can each import the shapes they need without creating an import cycle.
 */
import type { UrlInfo } from './ast.js';
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
   * Set by EVERY producer (`note-layout-tip.ts`'s tip/dropped/plain
   * builders and `note-opale.ts#buildOpaleNoteGeo`) to the value
   * `GeneralImageBuilder` would dispatch on for the shape actually drawn:
   * `'TIPS'` iff the note went through `EntityImageTips`'s path (`tip` set,
   * or `dropped`), `'NOTE'` otherwise. Parse-side the same split is
   * `ClassNote.targetPort !== undefined` (`CommandFactoryTipOnEntity`);
   * the two agree everywhere the corpus reaches (probed 2026-08-15: 33
   * TIPS = 31 resolved + 2 dropped, 144 NOTE, 0 `::member` notes falling
   * through to the plain path). The one case they could disagree — a
   * `::member` note whose host never resolves to a drawn classifier
   * (`resolveGroupTipContext` returns `undefined`) — is a note upstream
   * never creates at all (`CommandFactoryTipOnEntity:208-209`, "Nothing to
   * note to"); this port draws it as a plain box, so it is stamped by what
   * is drawn.
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
   *  for a member-tip note (G2/N13 — the connector is a notch merged into
   *  the note's own outline instead, see `tip` below). */
  connector: Array<{ x: number; y: number }>;
  /**
   * G2/N13: true when a member-tip note's `::member` target could not be
   * resolved against any row of its host — `EntityImageTips#drawU`'s
   * `bestMatch == null` early return, which draws NOTHING for this note (no
   * box, no notch, no text). The renderer skips it entirely; ink-extent
   * walkers must too (jar's canvas excludes a dropped tip's space).
   */
  dropped?: boolean;
  /**
   * G2/N13: present only for a RESOLVED member-tip note — the zigzag notch
   * replaces the plain folded-corner box + separate dashed connector every
   * other note kind draws. `pp1`/`pp2` are LOCAL to this note's own
   * (0,0)-at-top-left frame (`note-opale.ts#OpaleConnector`).
   */
  tip?: { direction: 'left' | 'right'; pp1: OpalePoint; pp2: OpalePoint };
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
   * member-tip note (unchanged fallback numbering) or a dropped note.
   */
  creationIndex?: number;
  /** G2 N15: copied from `ClassNote.phantomSlot` — see that field's doc
   *  comment (`renderer-uid.ts#assignExact` consumes it). */
  phantomSlot?: true;
  /** G2 N34: copied from `ClassNote.color` — see that field's doc comment
   *  (`renderer-note.ts#resolveNoteBackground` consumes it). Absent for a
   *  dropped note (no box is drawn, so no fill to resolve). */
  color?: string;
  /** G2 N37: copied from `ClassNote.stereotype` — see that field's doc
   *  comment (`renderer-note.ts#resolveNoteBackground` consumes it for the
   *  `.tagname` `<style>` cascade). Absent for a dropped note. */
  stereotype?: string;
  /** G2 N70: copied from `ClassNote.url` — `renderer.ts` wraps the note's
   *  rendered inner SVG in a single `<a xlink:href>` via `svg.ts#linkWrap`
   *  when set. Absent for a note with no `[[url]]`. */
  url?: UrlInfo;
  /**
   * G2 N52: the host classifier's `Classifier.id` this note is attached to
   * (`ClassNote.target`, copied verbatim -- NOT the `::member` port suffix,
   * which stays in `ClassNote.targetPort` and has no renderer-side use here).
   * `undefined` for a freestanding note (no `of <Entity>` clause) or a note
   * whose `of`-target didn't resolve to an actual drawn classifier.
   * `renderer.ts` uses this to draw a note immediately after its host in
   * document order (jar draws every classifier/note as a graph NODE in real
   * creation order, then every edge -- `renderer.ts`'s own fixed classifier-
   * then-edges-then-notes phase order previously pushed EVERY note to the
   * very end regardless of source position; jar-verified via `dozugo-00-
   * jado141`/`refeku-65-gapu585`/`janeba-15-duja043`/`cajicu-52-cego765`,
   * each showing the note's `<g>` sitting between its host and the NEXT
   * classifier in jar's own output, not trailing after every classifier and
   * edge). A note with no resolved host keeps the old trailing position.
   */
  hostId?: string;
  /**
   * G2 N53: copied from `ClassNote.tipGroupPhantomIndex` -- see that
   * field's doc comment (ast.ts) and `renderer-uid.ts#assignExact` (which
   * consumes it as TWO phantom ranks). `undefined` for every note except a
   * member-tip group's leader.
   */
  tipGroupPhantomIndex?: number;
}

/**
 * Minimal classifier-position + row-text view `mapNoteGeos` needs to resolve
 * a member-tip note's connector — a local subset of `layout.ts#ClassifierGeo`
 * (importing that type directly would cycle: `layout.ts` imports
 * `mapNoteGeos` from this module).
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
