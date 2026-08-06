/**
 * Class-diagram Relationship AST types. Split out of `ast.ts` (line cap);
 * re-exported from `ast.ts` for existing import sites.
 */



export type RelationshipType =
  | 'extension'      // <|--
  | 'implementation' // <|..
  | 'composition'    // *--
  | 'aggregation'    // o--
  | 'dependency'     // ..>
  | 'association'    // -->
  | 'usage';         // ..

/**
 * The decoration drawn at one end of a link, mirroring upstream's LinkDecor:
 * each arrow end is decorated independently of the semantic {@link
 * RelationshipType}. `none` is a plain (undecorated) end — a plain `--`
 * association has `none` at both ends, unlike a directed `-->` (`open` at the
 * target). Parsed per-end from the arrow token (source/target assigned by the
 * arrow's direction).
 *
 * G2 N28: `square`/`plus`/`parenthesis`/`crowfoot`/`circleCrowfoot`/
 * `circleLine`/`doubleLine`/`lineCrowfoot` — the D6-deferred glyph
 * decorations (`#`, `+`, `)`/`(`, `}`/`{`, `}o`/`o{`, `|o`/`o|`, `||`,
 * `}|`/`|{`) `class-arrow-grammar.ts#headToDecor` previously collapsed to
 * `'none'` (D6's own scope note: "DOT parity only, not SVG rendering").
 * Each maps 1:1 onto an already-built `core/svek/extremity
 * /link-decor.ts#LinkDecorName` (SQUARE/PLUS/PARENTHESIS/CROWFOOT/
 * CIRCLE_CROWFOOT/CIRCLE_LINE/DOUBLE_LINE/LINE_CROWFOOT) — the shape
 * geometry was built for description's edge renderer and is reused
 * unchanged, only the class-side glyph→name wiring was missing.
 * NOT added: `CIRCLE_CONNECT` (`0)`/`(0`) — that is a genuinely different,
 * MID-LINK decoration (upstream's `LinkType#withMiddleCircle*`, parsed via
 * `CommandLinkClass`'s separate `INSIDE` regex group, drawn at the edge's
 * midpoint rather than at an extremity) — surveyed and deferred, see
 * `plans/g2-class-svg/ledger.md` N28.
 *
 * G2 N47: `notNavigable` (`x`, `LinkDecor.NOT_NAVIGABLE`) ADDED — the
 * `core/svek/extremity/link-decor.ts` machinery (`ExtremityFactoryNotNavigable`,
 * the `not_navigable` `data-link-type` row) was already fully built for
 * description's edge renderer; only the class-side glyph→name wiring
 * (`class-arrow-grammar.ts#headToDecor`) was missing, previously left
 * `'none'` on an N28 "zero corpus reach" survey that a later fixture
 * (`rekazo-16-jola519`, `bob x--> alice`) disproved.
 */
export type LinkDecor =
  | 'triangle'
  | 'open'
  | 'diamond'
  | 'filledDiamond'
  | 'square'
  | 'plus'
  | 'parenthesis'
  | 'crowfoot'
  | 'circleCrowfoot'
  | 'circleLine'
  | 'doubleLine'
  | 'lineCrowfoot'
  | 'notNavigable'
  | 'none';

export interface Relationship {
  from: string;
  to: string;
  type: RelationshipType;
  /**
   * Decoration at the source/target end, parsed independently from the arrow
   * token's two heads (D6). Drives the rendered edge markers; does NOT affect
   * the DOT graph (which uses {@link RelationshipType} + `length`). Absent for
   * relationships not built from an arrow token — layout then falls back to a
   * type-derived default.
   */
  sourceDecor?: LinkDecor;
  targetDecor?: LinkDecor;
  /**
   * Body dash-style override, independent of {@link RelationshipType}'s own
   * `EDGE_DECORATION_MAP` default -- G2 N8, `class-assoc-couple.ts`'s
   * `(A,B)` couple mechanism: the couple's class-link edge keeps its own
   * arrow token's dashed-ness (`Association#createNew`'s `linkType` param;
   * upstream `decoration/LinkType.java`'s `linkStyle`, carried unchanged
   * through `getPart1()`/`getPart2()`) rather than the couple's own
   * hardcoded `'association'` {@link RelationshipType} (kept undisturbed --
   * see `sourceDecor`/`targetDecor` above -- to avoid perturbing the
   * DOT-graph `HIERARCHICAL` swap, which keys off `RelationshipType` alone).
   * Absent for every other relationship kind, which continues to derive
   * dashing purely from `type` (`EDGE_DECORATION_MAP[type].dashed`).
   */
  dashed?: boolean;
  fromMultiplicity?: string;
  toMultiplicity?: string;
  /**
   * Role name from `"role"/roleName` (or reversed) association-end syntax
   * (CommandLinkClass FIRST_ROLE/SECOND_ROLE). Falls back to the taillabel/
   * headlabel dot attribute in place of the cardinality when no multiplicity
   * was given on that end (SvekEdge.java:447-466).
   */
  fromRole?: string;
  toRole?: string;
  label?: string;
  /**
   * Port/member name from `Class::member` endpoint syntax (PlantUML reuses
   * the legacy UML `::` namespace separator to target a specific member of
   * a classifier). The edge itself still connects the two classifiers;
   * the port name is metadata for a later shield/port-node rendering pass.
   */
  fromPort?: string;
  toPort?: string;
  /**
   * Qualifier text from qualified-association syntax (`class1 [Qualifier] <--
   * class2`), sided like the multiplicities: the qualifier attaches to whichever
   * endpoint bears the `[...]`. The qualifier-bearing classifier renders as a
   * shielded `shape=plaintext` node in svek.
   */
  fromQualifier?: string;
  toQualifier?: string;
  /**
   * Arrow length: the count of body chars (`-`/`.`/`=`) in the arrow, mirroring
   * upstream `CommandLinkClass.getQueueLength`. Drives the dot `minlen`
   * (`length - 1`): `->` (1) → 0, `-->` (2) → 1, `--->` (3) → 2. Absent ⇒ the
   * default association length of 2 (minlen 1).
   */
  length?: number;
  /**
   * Emit as `style=invis` — an invisible layout constraint edge, not a drawn
   * relationship. Used to tie together the two association-class circles that
   * share an (A,B) pair (`R1..(A,B)` + `(A,B)..R2`).
   */
  invis?: boolean;
  /**
   * Graphviz edge `weight` (rank-assignment tie-breaker; higher pulls the
   * edge straighter/shorter) — from the optional `@N.N` header prefix upstream
   * commands accept (`CommandLinkClass`/`CommandLinkLollipop`'s HEADER group,
   * `Link#setWeight`). Passed straight through to the dot layout engine
   * (graph-layout.ts); not shown in the emitted comparator DOT (matches
   * upstream, where it also only affects internal rank assignment).
   */
  weight?: number;
  /**
   * `note on link: text` attached to this relationship after it was parsed
   * (`CommandFactoryNoteOnLink` → `Link#addNote`, a note carried BY the
   * link, distinct from `label`). Only meaningful while the relationship is
   * still live in `ast.relationships` — an association-class couple
   * (`(A,B) .. C`) that subsumes this link moves the text onto the new
   * circle edge(s), splitting it across both when the couple's own length
   * flips (`Association.createNew`'s `NoteLinkStrategy.HALF_PRINTED_FULL`/
   * `HALF_NOT_PRINTED`; class-assoc-couple.ts).
   */
  linkNote?: string;
  /**
   * Marked by `constraint on links : text` (CommandConstraintOnLinks →
   * `Link#setLinkConstraint`, applied to the two most-recent non-note links).
   * svek emits a fixed 10x10 `label` spot on a constrained edge with no
   * note/label text (SvekEdge.java:430-444, CONSTRAINT_SPOT at :122); the
   * constraint's text itself is drawn post-layout, never in the DOT.
   */
  linkConstraint?: boolean;
  /**
   * G2 N2 (mechanism 3): parse-time creation order -- see
   * {@link Classifier.creationIndex}'s doc comment (same shared counter,
   * same exact/fallback gate). Stamped only at the primary relationship-
   * dispatch site (`class-commands.ts`'s `REL_DISPATCH_RE` handler) --
   * absent for relationships built via `class-map-commands.ts`/`class-
   * declaration-parser.ts`/`class-lollipop.ts`/`class-assoc-couple.ts`
   * (named remainder, `plans/g2-class-svg/ledger.md` N2).
   */
  creationIndex?: number;
  /**
   * G2 N9: Java's `Link#getEntity1()`/`getEntity2()` (cl1/cl2) -- the bare
   * (unqualified, `::port`-stripped) declaration-order entity names the
   * `<path id="...">` attribute is built from (`Link#idCommentForSvg()`,
   * Link.java:106-114). DISTINCT from `from`/`to` above: those are swapped
   * by `swapDirection` (arrowhead-direction, for DOT layout); these are
   * swapped ONLY by `ArrowInfo.upOrLeft` (the explicit `-left-`/`-up-`
   * direction word, `Link#getInv()`) -- the one swap Java's cl1/cl2
   * actually undergo. `class1 [Qualifier] <-- class2` and `MainWindow <|--
   * Gtk::Window` (baneru-00-kuro607, bicabi-42-coto932 -- the two samples
   * that contradicted a naive `sourceDecor`/`targetDecor`-based reading)
   * both resolve correctly under THIS pair: `idEntity1`="class1"/
   * "MainWindow" (cl1, unswapped -- no direction word), `idEntity1Decor`=
   * 'open'/'triangle' (the arrowhead sits at ENT1, decor-at-cl1 nonzero
   * while decor-at-cl2 is 'none' -> `looksLikeRevertedForSvg` -> "backto").
   * Absent for relationships built outside the arrow-token grammar
   * (couples/lollipop/map rows) -- `renderer.ts` falls back to
   * `from`/`to` + `sourceDecor`/`targetDecor` for those (documented
   * best-effort, out of this iteration's arrow-matrix scope).
   * @see ~/git/plantuml/.../classdiagram/command/CommandLinkClass.java:490-497
   * @see ~/git/plantuml/.../abel/Link.java:106-114,145-156
   * @see ~/git/plantuml/.../decoration/LinkType.java:55-68
   */
  idEntity1?: string;
  idEntity2?: string;
  /** Decoration AT `idEntity1`'s end (Java: the value attached to cl1's
   *  end via `LinkType.decor2`, which is always adjacent to `getEntity1()`
   *  -- see this field's sibling doc comment above for the derivation). */
  idEntity1Decor?: LinkDecor;
  /** Decoration AT `idEntity2`'s end (Java: `LinkType.decor1`, adjacent to
   *  `getEntity2()`). */
  idEntity2Decor?: LinkDecor;
  /**
   * G2 N30: the FULL (namespace-qualified, un-leaf-stripped) DOT-node id
   * `idEntity1`/`idEntity2` were leaf-stripped FROM (`left.id`/`right.id`
   * picked via the same `upOrLeft` swap, before `idLeaf()`) -- distinct
   * from `idEntity1`/`idEntity2` (display-name use, the `<path id>`
   * string) and from `from`/`to` (DOT-layout use, swapped by
   * `swapDirection` instead). Consumed ONLY by `class-geo-builders.ts
   * #buildEdgeGeos`'s path-direction normalization, jar's `SvekEdge.java
   * #solveLine:637-654`: after layout, if the raw dot-returned spline's
   * start point sits closer to `idEntity2FullId`'s node center than
   * `idEntity1FullId`'s (and its end point correspondingly closer to
   * `idEntity1FullId`'s), the WHOLE point list is reversed so the drawn
   * `<path d>` always runs `idEntity1FullId` -> `idEntity2FullId` --
   * independent of any DOT-ranking swap applied for hierarchical
   * (extension/implementation) edges. Absent under the same conditions as
   * `idEntity1`/`idEntity2` (couples/lollipop/map rows) -- those edges
   * fall back to the pre-existing `swappedEdges`-index reversal.
   * @see ~/git/plantuml/.../svek/SvekEdge.java:637-654
   */
  idEntity1FullId?: string;
  idEntity2FullId?: string;
  /**
   * G2 N9: 0-indexed source line (jar's `<path codeLine="...">`, `Link
   * #getCodeLine()` -> `location.getPosition()`), stamped from `ParseState
   * .currentLine` at the same dispatch site as `creationIndex` above.
   * Absent under the same conditions as `idEntity1`/`idEntity2`, PLUS
   * whenever the block's `UmlSource` carries no `linePositions` (e.g. a
   * hand-built literal fixture in a unit test).
   */
  sourceLine?: number;
  /**
   * G2 N19: true when this relationship's `creationIndex` was preceded by a
   * discarded phantom counter slot -- mirrors `Classifier.phantomSlot`'s
   * doc comment exactly, but for the SYNTHETIC DEFAULT link jar's couple
   * machinery constructs purely to supply default type/length values
   * (`Association#createNew`/`createInSecond`: `existingLink = foundLink
   * (entity1, entity2); if (existingLink == null) existingLink = new Link
   * (..., LinkDecor.NONE, LinkDecor.NONE, ...);` -- a REAL `Link` ctor call,
   * burning a real cpt1 slot, but never `addLink`ed, so it never manifests
   * as an `EdgeGeo` of its own). Set on the FIRST edge
   * (`class-assoc-couple.ts`'s `aEdge`) synthesised immediately after this
   * burn, when the couple's own A-B pair had NO subsumed explicit
   * association to reuse (`buvake-41-vulu531`'s `(A,B) .. C` with no prior
   * `A--B` line, jar-verified: the couple's edges numbered one higher than
   * a same-shaped fixture WITH a subsumed link, e.g. `bosiki-11-xaza958`).
   */
  phantomSlot?: true;
  /**
   * G2 N26: `WithLinkType.applyStyle`/`applyOneStyle`'s bracket-modifier
   * `dashed`/`dotted`/`bold` keyword (`decoration/WithLinkType.java:126-
   * 166`) -- the SAME method `Link extends WithLinkType` (`abel/Link.java:
   * 65`) and description's `DescriptiveLink` bracket grammar both go
   * through (`CommandLinkClass.java:368`'s `link.applyStyle(arg.getLazzy(
   * "ARROW_STYLE", 0))` call). Overrides the type-derived
   * `EDGE_DECORATION_MAP[type].dashed` default (`class-geo-builders.ts
   * #buildEdgeGeos`) via the shared `core/svek/svek-edge-stroke.ts
   * #strokeForStyle` formula (`LinkStyle#getStroke3()`, the exact upstream
   * dash/thickness recipe description's own edge renderer already uses).
   * Parsed by `class-arrow-grammar.ts#parseArrowStyleOverrides`; ported
   * class-side rather than importing description's `link-grammar.ts`
   * directly, to avoid a cross-diagram-type dependency (same upstream
   * method, independently faithful port).
   */
  lineStyleOverride?: 'solid' | 'dashed' | 'dotted' | 'bold';
  /**
   * `WithLinkType.goThickness` (bracket `thickness=N` token) -- same
   * field/semantics as description's `DescriptiveLink.thicknessOverride`,
   * ported class-side. `LinkStyle.getStroke3()`'s BOLD-ignores-thickness
   * quirk is preserved in `strokeForStyle` (svek-edge-stroke.ts), not
   * re-implemented here.
   */
  thicknessOverride?: number;
  /**
   * `WithLinkType.applyOneStyle`'s color-token else-branch
   * (`HColorSet.getColorOrWhite(s)`) -- same field/semantics as
   * description's `DescriptiveLink.colorOverride`. Leading `#` already
   * stripped by the parser (grammar-mandatory, matches the established
   * inline-color-override convention). Resolved through
   * `klimt/color/HColorSet.ts#resolveColorToSvgHex` at render time
   * (`renderer.ts#renderEdge`) -- unlike description's own `colorOverride`
   * (I2-ledgered gap, named colors pass through unresolved there), class
   * already resolves every other fill/stroke through that table
   * (`renderer.ts`'s own doc comment), so this field gets the same
   * treatment for free.
   */
  colorOverride?: string;
  /**
   * SI1/T11: the `single` ARROW_STYLE token (`WithLinkType.goSingle`/
   * `isSingle`, `decoration/WithLinkType.java:110-116`) -- a link-ADD-time
   * dedup flag, not a render style: `net.atmp.CucaDiagram#addLink:896-901`
   * silently drops a `single` link when the diagram already holds ANY other
   * link connecting the same two entities (`Link.sameConnections`,
   * `abel/Link.java:462-470` -- endpoint identity, either direction).
   * Parsed by `class-arrow-grammar.ts#parseArrowStyleOverrides`; consumed
   * by the relationship-push site (`class-command-relationships.ts`) via
   * the shared dedup hook (`src/core/cucadiagram/linkDedup.ts`, ADR-3).
   * Same field/semantics as description's `DescriptiveLink.single`.
   */
  single?: true;
  /**
   * G2 N59: `ArrowInfo.swapDirection` ("the left operand is semantically
   * `to`", `class-arrow-grammar.ts`'s own doc comment) -- `true` only when
   * the arrowhead/`LinkType` swapped `from`/`to` relative to pure
   * left-to-right SOURCE TEXT order (`class-relationship-parser.ts#pickDirectional`).
   * DISTINCT from `idEntity1FullId`/`idEntity2FullId`'s own swap (`upOrLeft`
   * -- the explicit `-left-`/`-up-` direction word ONLY): jar's REAL
   * classifier auto-creation order (`CommandLinkClass.executeArg`'s
   * `ent1String`/`ent2String` -> `quarkInContextSafe` -> `reallyCreateLeaf`)
   * is ALWAYS strict left-to-right text order, entirely independent of
   * BOTH swaps -- `link.getInv()` only reassigns the already-built `Link`'s
   * own endpoint pointers, after both entities already exist. Consumed
   * ONLY by `class-commands.ts`'s `REL_DISPATCH_RE` handler to call
   * `ensureClassifier` in jar's real creation order for a relationship
   * whose endpoint(s) are being auto-created for the first time
   * (`bicabi-42-coto932`: `MainWindow <|-- Gtk::Window` creates "MainWindow"
   * BEFORE "Gtk" in the jar golden, but this port's `from`/`to` order
   * -- `Gtk`/`MainWindow`, swapped for extension's DOT-ranking need --
   * created "Gtk" first without this field, a `creationIndex`/uid-order
   * mismatch cascading into hundreds of diffs). Absent (`undefined`) means
   * "not swapped" (`from` is textually first), matching every other
   * optional field's default-omitted convention.
   * @see ~/git/plantuml/.../classdiagram/command/CommandLinkClass.java:295-333
   */
  swapDirection?: boolean;
}
