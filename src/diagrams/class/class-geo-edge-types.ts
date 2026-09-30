/**
 * `EdgeGeo`, moved out of `class-geo-types.ts` (cdd7 T2b) when
 * `ClassifierGeo.stereotypeSprite` pushed that file past the 500-line hook
 * cap -- a pure move (same precedent as `NamespaceGeo`/`ClassGeometry`/
 * `JsonBodyItem`), re-exported from there so no import path changed.
 */
import type { LinkDecor, UrlInfo } from './ast.js';
import type { MiddleDecor } from './class-arrow-middle-decor.js';
import type {
  EdgeConstraintGeo,
  EdgeKalBoxes,
  EdgeNoteBoxGeo,
  QuantifierLinesGeo,
  RoleLinesGeo,
  SametailGeo,
  VisibilityIconGeo,
} from './class-geo-edge-extras.js';

export interface EdgeGeo {
  id: string;
  points: Array<{ x: number; y: number }>;
  /** G2 N62: `x`/`y` is the left/baseline anchor jar's own `<text>` emits
   *  (`class-geo-builders.ts#attachEdgeLabel`'s `portLabelAnchor` reuse --
   *  same conversion `tailLabel`/`headLabel` already apply), `width` the
   *  `textLength` value. Positioned from @knowvah/dot-engine's own native edge
   *  `label=` placement (`core/graph-layout.ts#toEdgeEntry`'s `ge.label`,
   *  already computed by `getLayout()` -- no SVG-scan extraction needed,
   *  unlike `tailLabel`/`headLabel`'s xlabel mechanism), NOT a hand-rolled
   *  geometric-midpoint guess (the pre-N62 formula, never jar-verified --
   *  see `ledger.md` N62). Still subject to the SAME @knowvah/dot-engine-vs-real-
   *  graphviz label-placement residual N25 already named (gvts-genuine,
   *  out of scope) -- this field is structurally correct (real engine
   *  placement, real jar text-styling formula) but not guaranteed
   *  byte-exact for that reason. */
  label?: {
    text: string;
    x: number;
    y: number;
    width: number;
    /** cdd-T25: a magic-arrow label's leading `<size:N>` tag resolves to a
     *  font-size override for the TEXT run only (the arrow glyph stays at
     *  the base `arrow` style size) -- `class-edge-label-attach.ts
     *  #attachMagicArrow`'s doc comment has the jar-verified derivation
     *  (`xamule-03-jeda376`). `undefined` for every label with no such
     *  tag (the overwhelming majority), which renders at the SAME base
     *  `labelFontAttrs.fontSize` as before this field existed. */
    fontSize?: number;
    /** T2d (rimeca-17-gice904, `<U>agregation</U>`): the raw label carried
     *  an inline `<u>...</u>` creole tag -- a real creole TextBlock RENDERS
     *  it as underline formatting rather than literal glyphs
     *  (`SvekEdge.java:298-299`'s `create0(..., CreoleMode.SIMPLE_LINE,
     *  ...)`), matching {@link labelLines}' own `bold` precedent for the
     *  SAME "creole formatting the render side must still apply" gap.
     *  `undefined` (the overwhelming majority) renders with no
     *  `text-decoration`, unchanged. */
    underline?: boolean;
  };
  /** T2d (kexaba-26-kobu577): present INSTEAD OF {@link label} when the
   *  relationship's text is ENTIRELY one `<$sprite>` inline atom
   *  (`class-edge-label-measure.ts#resolveLoneSpriteLabel`'s own doc
   *  comment) -- draws as the resolved PNG `<image>` a member row's inline
   *  `<$name>` already produces, positioned at its own box's TOP-LEFT
   *  corner (an atom's `getStartingAltitude() === 0`, never a text
   *  baseline) rather than `label`'s baseline anchor. Mutually exclusive
   *  with `label` and `labelLines` (`attachEdgeLabel` sets at most one). */
  labelImage?: { href: string; x: number; y: number; width: number; height: number };
  /** G2 item 43: present INSTEAD OF {@link label} when the relationship's
   *  text carried a `\n`/`\l`/`\r` line-break escape sequence
   *  (`class-layout-helpers.ts#splitEdgeLabelLines`) -- one entry per line,
   *  in top-to-bottom order, each already positioned/aligned by
   *  `class-edge-label-anchor.ts#multiLineLabelAnchor`. Mutually exclusive
   *  with `label` (`attachEdgeLabel` sets exactly one of the two).
   *  SI25 D1: `glyph` is present iff the label `hasSeveralGuideLines` AND
   *  that line carried a `< `/`> `/` <`/` >` token -- one magic-arrow
   *  triangle per line (`StringWithArrow#addSeveralMagicArrows`,
   *  `descdiagram/command/StringWithArrow.java:115-127`), 3 points in the
   *  same tip-then-two-back-corners order as {@link arrowGlyph}. */
  labelLines?: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    glyph?: { points: Array<{ x: number; y: number }> };
    /** S-8 (cdd2-T7): this line's raw creole carried a `<b>...</b>` wrap
     *  (or, T1b, a `**...**` shorthand wrap) -- see `class-edge-label-
     *  anchor.ts#multiLineLabelAnchor`'s own doc comment. Consumed by
     *  `renderer-edge-label.ts#renderEdgeMainLabel` as a per-line
     *  `font-weight="700"` override (base `labelFontAttrs` is shared
     *  across every line otherwise). */
    bold?: boolean;
    /** T1b (xuloxo-85-vibu502): this line's raw creole carried a `//...//`
     *  shorthand wrap (`class-edge-label-anchor.ts#multiLineLabelAnchor`'s
     *  own doc comment, `stripCreoleShorthand`). Consumed by
     *  `renderer-edge-label.ts#renderEdgeMainLabel` as a per-line
     *  `font-style="italic"` override. */
    italic?: boolean;
  }>;
  /** G2 item 44: the magic-arrow glyph (`class-magic-arrow.ts`) -- a small
   *  filled triangle drawn ALONGSIDE `label` (present together when the
   *  arrow token carried remaining text, e.g. `"foo >"`) or ALONE (a bare
   *  `"<"`/`">"` label, `label` stays `undefined`). Exactly 3 points, in
   *  jar's own tip-then-two-back-corners order
   *  (`class-magic-arrow.ts#magicArrowGlyphPoints`'s doc comment). */
  arrowGlyph?: { points: Array<{ x: number; y: number }> };
  /** G2/N25: `Relationship.fromMultiplicity`/`.toMultiplicity` (or the
   *  `fromRole`/`toRole` fallback -- SvekEdge.java:447-466), positioned by
   *  @knowvah/dot-engine's own external-label placement (`core/graph-layout.ts
   *  #extractPortLabelPositions`) -- the SAME `xladjust` search real
   *  graphviz runs, since upstream never sets `labelangle`/`labeldistance`
   *  on a class-diagram edge (dead `LinkArg` fields, see `DotInputEdge
   *  .attributes.tailLabel`'s own doc comment). `x`/`y` is the CENTER of
   *  the label box in this geometry's coordinate frame -- `renderer.ts`
   *  converts to the left/baseline anchor jar's own `<text>` emits. */
  tailLabel?: { text: string; x: number; y: number; width: number };
  headLabel?: { text: string; x: number; y: number; width: number };
  /** cdd-T6 (A2a/M10): the SAME two quantifiers, `\n`-split into one anchor
   *  per physical line — see {@link QuantifierLinesGeo}. Present whenever
   *  either end carries a placed quantifier; `tailLabel`/`headLabel` stay
   *  set alongside it (the single-line, unsplit form) until T7 switches the
   *  renderer over. */
  quantifierLines?: QuantifierLinesGeo;
  /** cdd-T17 (M8): the ADDITIVE role label, present only when an end
   *  carries BOTH a quantifier and a role — see {@link RoleLinesGeo}. The
   *  role-as-fallback case (no quantifier) reuses {@link quantifierLines}
   *  instead (`class-layout-edge-labels.ts#computeMultiplicityAttrs`). */
  roleLines?: RoleLinesGeo;
  /** cdd-T6 (A2a/M2): the link label's visibility-modifier icon block —
   *  see {@link VisibilityIconGeo} and `class-edge-visibility.ts`. Present
   *  only when the label's first line began with a visibility character
   *  AND `classAttributeIconSize > 0`; the character is then absent from
   *  `label`/`labelLines[0]`, matching `Display.java:415-416`. */
  visibilityIcon?: VisibilityIconGeo;
  /** cdd-T6 (A2a/M5): the `note on link` operand of the merged label block
   *  — see {@link EdgeNoteBoxGeo}. Absent unless the relationship carried
   *  `linkNote` and the layout placed its label box. */
  noteBox?: EdgeNoteBoxGeo;
  /** cdd-T6 (A2a/M9): `constraint on links` — see {@link EdgeConstraintGeo}.
   *  Present on the SECOND link of a constrained pair only. */
  constraint?: EdgeConstraintGeo;
  /** cdd-T15 (A2a/M1, D6): the qualified-association box(es) —
   *  see {@link EdgeKalBoxes}. */
  kalBox?: EdgeKalBoxes;
  /** Arrow decoration at the target end (from the arrow's target-side head). */
  targetDecor: LinkDecor;
  /** Arrow decoration at the source end (from the arrow's source-side head). */
  sourceDecor: LinkDecor;
  /**
   * cdd3-T33 (C-11): the id of the classifier whose rect is closest to
   * `points[0]` (`SvekEdge.java:644-645`'s `svekNode1`, i.e.
   * `link.getEntity1()`) — the tail/source contact node
   * `getExtremitySimplier`'s `side` lookup (`SvekEdge.java:544-546`)
   * resolves against. Same id `class-edge-geo.ts#normalizeEdgePoints`'s
   * `matchesFromTo` already tracks for `sourceDecor` (`startId`), carried
   * here so the renderer can resolve it to a rect without re-deriving
   * `matchesFromTo` at draw time. Optional (unlike `from`/`to`) so every
   * hand-built `EdgeGeo` test literal across this engine's other test
   * files stays valid unchanged — absent means "no contact resolved",
   * the same as upstream's `nodeContact == null` (`side` stays `null`).
   */
  sourceContactId?: string;
  /** Head/target counterpart of {@link sourceContactId} — `svekNode2`
   *  (`link.getEntity2()`), the id nearest `points[points.length - 1]`. */
  targetContactId?: string;
  dashed: boolean;
  /**
   * T3c (D8, `smetana-pragma-ignored`): `true` iff the diagram carried
   * `!pragma layout smetana` (`ClassDiagramAST.layoutEngine`, `ast.ts`'s
   * doc comment) -- `renderer-edge.ts#renderEdge` reads this to mirror
   * `SmetanaEdge#drawU`'s STRUCTURAL draw shape (extremities before the
   * connecting path, no `id`/`codeLine` on the path, a narrower url wrap)
   * instead of `SvekEdge#drawU`'s. Pure carry-only channel, same precedent
   * as {@link hidden}/{@link url} above (`renderClass(geo, theme)` has no
   * AST access) -- populating it is a ONE-LINE addition in
   * `class-edge-geo.ts#buildEdgeGeos`'s `edgeGeo` literal (that function
   * already receives `ast: ClassDiagramAST` as its first parameter, same
   * spot as the `hidden`/`url` carry-only copies), outside this file's
   * write-set; named remainder, T3c's own report. Absent = the pre-existing
   * SvekEdge draw shape, unchanged.
   * @see ~/git/plantuml/.../sdot/SmetanaEdge.java:106-253
   */
  smetana?: true;
  /** G2 N2 (mechanism 3): copied from `Relationship.creationIndex`. */
  creationIndex?: number;
  /** G2 N2 (mechanism 3): the relationship's raw AST endpoints, for the
   *  `<g class="link" data-entity-1="..." data-entity-2="...">` wrapper
   *  and `<!--link X to Y-->` comment — `renderer-uid.ts` resolves these
   *  through the classifier/namespace uid maps. */
  from: string;
  to: string;
  /** G2 N9: copied from `Relationship.idEntity1`/`.idEntity2`/
   *  `.idEntity1Decor`/`.idEntity2Decor`/`.sourceLine` -- the `<path
   *  id="..." codeLine="...">` attributes (`renderer.ts#linkIdForSvg`).
   *  See `ast.ts#Relationship.idEntity1`'s doc comment. */
  idEntity1?: string;
  idEntity2?: string;
  idEntity1Decor?: LinkDecor;
  idEntity2Decor?: LinkDecor;
  sourceLine?: number;
  /**
   * G2/N16 Kind B: true when this edge's OWN connector was consumed by a
   * freestanding note's Opale zigzag notch (`note-freestanding.ts`) --
   * jar draws NO separate `<g class="link">` for it at all
   * (`SvekEdge#drawU`'s `if (opale) return;`), but the edge is kept in
   * `ClassGeometry.edges` (not filtered out) so `renderer-uid.ts`'s
   * dense-renumbering merge still counts its `creationIndex` slot -- jar's
   * real counter increments for EVERY parsed relationship regardless of
   * whether it ends up drawn, the same "consumed slot must still occupy a
   * rank" principle N15's own `phantomSlot` already established for notes.
   * Consulted by `renderer.ts`'s edge-render loop and
   * `layout-ink-extent.ts#buildInkBox` to skip drawing/ink-counting it.
   */
  consumedByOpaleNote?: true;
  /** G2 N19: copied unchanged from `Relationship.phantomSlot` (`ast.ts`'s
   *  doc comment) — feeds `renderer-uid.ts#buildClassUidPlan`'s
   *  synthetic-default-link phantom-rank bookkeeping. */
  phantomSlot?: true;
  /**
   * G2 N26: computed once (`class-geo-builders.ts#buildEdgeGeos`) via the
   * shared `core/svek/svek-edge-stroke.ts#strokeForStyle` formula from
   * `Relationship.lineStyleOverride`/`.thicknessOverride` — present ONLY
   * when the relationship carried a bracket-modifier override; absent
   * edges keep the pre-existing `dashed`-boolean-driven default below
   * (`renderer.ts#renderEdge`'s own fallback), zero behavior change for
   * the ~700 fixtures with no `-[...]->` bracket.
   */
  strokeWidth?: number;
  /** Paired with `strokeWidth` above — `UStroke#getDasharraySvg()`'s
   *  `[dashVisible, dashSpace]` tuple, `undefined` for a solid override. */
  strokeDasharray?: readonly [number, number];
  /** G2 N26: copied unchanged from `Relationship.colorOverride` (`ast.ts`'s
   *  doc comment) — raw, `#`-stripped color token, resolved through
   *  `HColorSet.ts#resolveColorToSvgHex` at render time. */
  colorOverride?: string;
  /** cdd3-T10 (S-4t): copied unchanged from `Relationship.labelTextColor`
   *  -- the muted label font colour (`SvekEdge.java:260-262`). */
  labelTextColor?: string;
  /** B7/M8: copied unchanged from `Relationship.stereotypeTags` — the link's
   *  own `<<tag>>` style-class label(s). `renderer-edge.ts` looks each up in
   *  `theme.colors.graph.arrowTagCascade`. Absent for every link with no
   *  `<<...>>`. */
  stereotypeTags?: readonly string[];
  /** cdd-T7 (flagged extension, `.agent-notes/cdd-T7.md`): carry-only
   *  copies of `Relationship.url`/`.hidden`/`.middleDecor` -- the ONLY
   *  channel, since `renderClass(geo, theme)` has no AST access. */
  url?: UrlInfo;
  hidden?: true;
  middleDecor?: MiddleDecor;
  sametail?: SametailGeo; // cdd-T16 (M7/E11): see SametailGeo's own doc comment.
  leafContacts?: readonly SametailGeo[]; // cdd-T16b (allButSametails): see SametailGeo.
}
