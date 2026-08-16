/**
 * Class-diagram Classifier AST types. Split out of `ast.ts` to keep it
 * under the module line cap; re-exported from `ast.ts` so existing
 * `import type { Classifier, ClassifierKind } from './ast.js'` sites work.
 */

import type { Member } from './class-member-ast.js';
import type { JsonNode } from './class-json-ast.js';
import type { UrlInfo } from './class-url.js';
import type { MapRow } from './ast.js';


export type ClassifierKind =
  | 'class'
  | 'abstract'
  | 'interface'
  | 'enum'
  | 'annotation'
  /**
   * `object Foo` — upstream has NO separate object-diagram engine;
   * `ClassDiagramFactory` registers `CommandCreateEntityObject` directly
   * alongside the class commands, so an object declaration is just another
   * classifier kind in this engine. Renders as a plain rect leaf
   * (`LeafType.OBJECT`), the same DOT shape as `class`.
   *
   * Members are untyped `field = value` display lines (set only by the
   * multi-line body form, `object Foo { field = value }` —
   * `CommandCreateEntityObjectMultilines`, a separate command from the
   * single-line one this file's `kind` value covers): reuses the existing
   * {@link Member} shape with `name` = field, `type` = the raw value string,
   * `visibility` fixed to `'+'` (object fields carry no visibility marker
   * upstream) — mirrors the pre-existing object-diagram parser's
   * `parseField` (`src/diagrams/object/parser.ts`).
   * @see ~/git/plantuml/.../objectdiagram/command/CommandCreateEntityObject.java
   * @see ~/git/plantuml/.../abel/LeafType.java (OBJECT)
   */
  | 'object'
  /**
   * `map Name { key => value ... }` (upstream `CommandCreateMap`,
   * `LeafType.MAP`) — a table-shaped leaf, always multi-line (upstream has
   * no single-line map command). Body rows live in {@link Classifier.rows}
   * (`MapRow[]`), NOT `members` — a map row is a key/value table entry, not
   * a typed class member, and reuses none of {@link Member}'s shape.
   * @see ~/git/plantuml/.../objectdiagram/command/CommandCreateMap.java
   * @see ~/git/plantuml/.../cucadiagram/BodierMap.java
   */
  | 'map'
  /**
   * `json Name { ... }` / `json Name value` (upstream `CommandCreateJson` /
   * `CommandCreateJsonSingleLine`, `LeafType.JSON`) — a table-shaped leaf
   * like `map`, rendering the parsed JSON tree in {@link Classifier.jsonValue}
   * (NOT `members`/`rows` — neither a typed member nor a flat row table).
   * @see ~/git/plantuml/.../objectdiagram/command/CommandCreateJson.java
   * @see ~/git/plantuml/.../objectdiagram/command/CommandCreateJsonSingleLine.java
   * @see ~/git/plantuml/.../cucadiagram/BodierJSon.java
   */
  | 'json'
  /**
   * `entity Foo` — a native class-factory keyword (upstream
   * `CommandCreateEntityObjectMultilines` / `CommandCreateClass`'s TYPE
   * alternation). Renders as a plain rect, like a class.
   */
  | 'entity'
  /**
   * `circle Foo` — a native class-factory keyword (upstream `CommandCreateClass`
   * TYPE alternation). Rendered as the small circle table (svek `shape=plaintext`),
   * the same node shape as a `()` interface lollipop.
   */
  | 'circle'
  /**
   * A descriptive element used as a *leaf* under `allowmixing` (upstream
   * `CommandCreateElementFull2` — `database`, `node`, `component`, `cloud`, …).
   * All render as a plain rect at the DOT level; the specific USymbol icon is a
   * rendering detail. The keyword is preserved in {@link Classifier.usymbol}.
   */
  | 'descriptive'
  /**
   * `usecase Foo` (LeafType.USECASE) — the only descriptive leaf whose svek node
   * shape is not rect: it renders as `shape=ellipse`.
   */
  | 'usecase'
  /** `state Foo` (LeafType.STATE) — classdiagram-only ALL_TYPES addition, not in descdiagram's `ALL_TYPES`; renders `shape=rect,style=rounded`. @see CommandCreateElementFull2.java:84,239-241 */
  | 'state'
  /**
   * An association node declared with `<> name` (upstream
   * CommandDiamondAssociation → LeafType.ASSOCIATION): a small diamond-shaped
   * n-ary/association-class connector, rendered as `shape=diamond`.
   */
  | 'association'
  /**
   * The tiny `shape=circle` connector node synthesised for an association-class
   * couple `(A,B) .. C`: it sits on the A–B association and the association
   * class C attaches to it. Not user-declared — created by the parser.
   */
  | 'assoc-circle'
  /**
   * The interface-lollipop leaf synthesised by the `Name ()-- Existing` /
   * `Existing --() Name` shorthand (upstream `CommandLinkLollipop`) — a
   * DIFFERENT command from both the general relationship arrow's single `(`/`)`
   * decor glyph (class-relationship-parser.ts, `CommandLinkClass`, which only
   * decorates an edge between two already-declared classifiers) and the
   * standalone `() "name"` declaration (class-commands.ts, shape=plaintext,
   * `CommandCreateElementParenthesis`). Renders as `shape=circle` (fixed 10x10
   * size, not text-measured) — see {@link Classifier.lollipopKind} for the
   * required/provided distinction. Not user-declared directly — created by
   * class-lollipop.ts.
   */
  | 'lollipop';

export interface Classifier {
  /** Unique identifier — alias if declared, otherwise display name. */
  id: string;
  display: string;
  kind: ClassifierKind;
  /** Generic type parameters, e.g. ['T', 'U']. */
  typeParams: string[];
  /**
   * G2 N49: the VERBATIM source text captured between `<`/`>` for a
   * `typeParams`-carrying declaration (e.g. "K,V", no re-split/rejoin) --
   * upstream never decomposes the generic clause at all
   * (`CommandCreateClass.java:139`'s `generic` is a single raw regex-
   * captured group, `entity.setGeneric(generic)` stores it unchanged), so a
   * source clause with no space after a comma (`<K,V>`) renders literally
   * "K,V", not the "K, V" `typeParams.join(', ')` alone would produce
   * (jar-verified `camuna-58-veca254`: `<Long,Customer>` -> tag text
   * "Long,Customer"). Present whenever `typeParams.length > 0` for a
   * real-parsed classifier; absent only for hand-built AST literals (unit
   * tests) that construct `typeParams` directly without going through
   * `class-declaration-parser.ts` -- `class-stereotype.ts#measureGenericTagDim`/
   * `buildGenericTagGeo` fall back to `typeParams.join(', ')` in that case.
   */
  typeParamsRawText?: string;
  members: Member[];
  stereotype?: string;
  /**
   * G2 N24: the classifier's stereotype, split into individual labels and
   * filtered through `hide|show [<<pattern>>] stereotype(s)` directives
   * (`class-directives.ts#applyStereotypeHideShow`) -- populated for EVERY
   * classifier with a `stereotype`, even when no directive hides anything
   * (in which case it equals the full unfiltered split). Absent when
   * `stereotype` is undefined, or for AST literals built by hand (unit
   * tests) that bypass the post-parse directive pass --
   * `class-layout-helpers.ts#measureGenericClassifier` falls back to
   * `splitStereotypeLabels(stereotype)` unfiltered in that case.
   */
  visibleStereotypeLabels?: string[];
  /**
   * G2 N31: the trailing background/border-color spec off a classifier
   * declaration (`class-declaration-parser.ts#extractDecorations`'s own doc
   * comment for the full grammar -- bare `#colorname`, compound
   * `#part:color;...`, or a `##[style]colorname` LINECOLOR, space-joined
   * when both are present). Consumed by `class-geo-builders.ts` ->
   * `layout.ts#ClassifierGeo.color` -> `renderer-classifier-box.ts
   * #classifierFill`'s bare/`back:`-component background override; the
   * LINECOLOR (`##...`) and non-`back` compound parts (`text:`/`line:`/
   * `shadowing`) are parsed here but not yet consumed by any render-side
   * field -- named remainder, not this iteration's scope.
   * @see ~/git/plantuml/.../klimt/color/ColorParser.java:43-46 (simpleColor(BACK))
   */
  color?: string;
  namespace?: string;
  /**
   * G2 N15 (README item #7): the classifier's own `[[url]]` link -- either
   * from an inline `class Foo [[url]]` declaration suffix, or a later
   * standalone `url [of|for] Foo [is] [[url]]` statement (last-writer-wins,
   * a single field -- mirrors upstream `Entity#addUrl`'s plain `this.url =
   * url` assignment, NOT an accumulating list). Member-line `[[[url]]]`
   * urls are a separate, not-yet-built mechanism (see `class-url.ts`'s
   * module doc comment) and do not populate this field.
   * @see ~/git/plantuml/.../abel/Entity.java:262-281 getUrl99/addUrl
   */
  url?: UrlInfo;
  /**
   * `$tag` names attached via a classifier declaration (`class Foo $a $b`) —
   * upstream `Entity#stereotags()` (`Set<Stereotag>`). Consulted by
   * `remove`/`restore $tag` directives (class-directives.ts#computeRemovedIds).
   * @see ~/git/plantuml/.../stereo/Stereotag.java
   * @see ~/git/plantuml/.../classdiagram/command/CommandCreateClassMultilines.java#addTags
   */
  tags?: string[];
  /** Set to true by hide/show post-processing when the circle badge should be suppressed. */
  hideCircle?: boolean;
  /**
   * G3/O4: `hide <entity|TYPE_KEYWORD> stereotype(s)` -- the GENDER/PORTION
   * form (`EntityPortion.STEREOTYPE`, `CucaDiagram#showPortion`), distinct
   * from the LABEL-pattern `hide|show [<<pattern>>] stereotype(s)` command
   * ({@link HideStereotypeDirective}/`isStereotypeLabelHidden`) -- jar-
   * verified `kocupi-02-ripa662` (`hide object stereotypes`). Consumed ONLY
   * by object/map/json's own `measureStereo`/`headerRows`
   * (`class-object-map-sizing.ts`) -- class/interface/enum/etc read
   * `visibleStereotypeLabels` (the label-pattern mechanism) exclusively and
   * never consult this flag, matching upstream: `EntityImageClassHeader`
   * has no `showPortion(STEREOTYPE, ...)` call at all, only `EntityImage
   * Object`/`Map`/`Json` do.
   */
  hideStereotype?: boolean;
  /**
   * G2 N26: entity-qualified `hide <entity> members|fields|attributes|
   * methods` (`CommandHideShowByGender`'s GENDER=entity-id form, applied
   * post-parse by `class-directives.ts#applyHideShowEntityDirectives`) --
   * reuses the SAME per-compartment suppression `preMeasureClassifiers`
   * (layout.ts) already computes for the diagram-global `hide empty
   * fields`/`hide empty methods`/`hide members` directives (N10), just
   * scoped to ONE classifier instead of every classifier. `members` sets
   * BOTH flags (jar-verified: an entity-scoped `hide X members` fully
   * collapses the box exactly like `hide fields` + `hide methods`
   * together, `nirija-04-veti140`).
   */
  suppressFields?: boolean;
  suppressMethods?: boolean;
  /**
   * For `kind: 'descriptive'`, the source keyword (`database`, `node`, …) — the
   * upstream USymbol. Preserved for rendering; does not affect DOT structure.
   */
  usymbol?: string;
  /**
   * Set (to `true`) ONLY by `class-namespace.ts#collapseEmptyNamespace`: this
   * classifier IS an empty `package`/`namespace`/descriptive container muted
   * to a leaf — upstream's `g.muteToType(LeafType.EMPTY_PACKAGE)`
   * (`svek/GraphvizImageBuilder.java:408-422`). It stays a GROUP for
   * document/draw order (`class-leaf-order.ts#collapsedGroupRankMap`: it
   * prints at its slot among its parent's child groups, never among the
   * parent's leaves). Needed because `kind`/`usymbol` alone cannot tell a
   * collapsed `package X <<Database>> {}` (usymbol stamped from the
   * stereotype, `class-container.ts#closeContainer`) from a declared
   * `database X` leaf (`class-declaration-parser.ts` TYPE_MAP) — jar
   * fixture `daxeno-00-kasu166`. Never set by any declaration path.
   */
  collapsedGroup?: true;
  /**
   * For `kind: 'lollipop'` only — `'half'` (required interface / socket, a
   * half-circle notch) vs `'full'` (provided interface, a full circle), from
   * whether the two paren glyphs matched (`((`/`))`) or differed (`()`)
   * (`CommandLinkLollipop#getType`). SVG-rendering-only: the DOT node shape is
   * `circle` either way, so this does not affect layout/DOT parity.
   */
  lollipopKind?: 'full' | 'half';
  /**
   * For `kind: 'map'` only — the table rows collected from the body
   * (`key => value` / `key *-> dest`), in source order. Absent (not `[]`)
   * for a map with no parseable body rows, matching every other optional
   * AST field's absent-vs-empty convention in this file.
   * @see {@link MapRow}
   */
  rows?: MapRow[];
  /**
   * For `kind: 'json'` only — the parsed JSON value. Absent when the JSON
   * failed to parse: upstream creates the leaf entity FIRST (`executeArg0`)
   * then errors on invalid data WITHOUT calling `BodierJSon#setJson` — this
   * parser has no error-diagram machinery (see {@link MapRow}'s duplicate-
   * name doc for the same no-error-channel posture), so the leaf is kept and
   * measured as an empty json object instead (class-json-sizing.ts's
   * empty-node fallback).
   * @see {@link JsonNode}
   */
  jsonValue?: JsonNode;
  /**
   * G2 N2 (mechanism 3, entity/cluster/link `<g>` wrapping + uid assignment):
   * parse-time creation order, mirroring upstream `CucaDiagram#cpt1`'s
   * shared `AtomicInteger` (`getUniqueSequenceValue()`) -- stamped once, at
   * the single classifier-creation chokepoint (`parser.ts#ensureClassifier`),
   * for BOTH an explicit declaration (`class Foo`) and an auto-created
   * relationship-endpoint reference. Absent for a classifier built by hand
   * (most unit tests) or reached via a relationship-creation code path this
   * iteration did not wire (`class-map-commands.ts`/`class-declaration-
   * parser.ts`/`class-lollipop.ts`/`class-assoc-couple.ts` -- see
   * `class/renderer-uid.ts`'s doc comment for the exact/fallback gate this
   * feeds and `plans/g2-class-svg/ledger.md` N2 for the named remainder).
   */
  creationIndex?: number;
  /**
   * G2 N39: source-order count of `<style>` blocks that had ALREADY been
   * dispatched (`ParseState.currentLine` strictly AFTER the block's own
   * `stylePositions` entry) at the moment THIS classifier was created --
   * mirrors upstream `Entity#currentStyleBuilder`, a snapshot of the live
   * `StyleBuilder` captured at `CucaDiagram#createLeaf`/`#createGroup`
   * (`net/atmp/CucaDiagram.java:808-819`), NOT re-resolved against later
   * `<style>` block mutations. Stamped at the SAME chokepoint as
   * {@link creationIndex}
   * (`parser.ts#ensureClassifier`), unconditionally -- like `creationIndex`,
   * absent only for a classifier built by hand (most unit tests construct
   * `Classifier` literals directly, bypassing `ensureClassifier`). Computes
   * to `0` for every classifier when the source carries 0 or 1 `<style>`
   * blocks (the overwhelming majority) -- harmless, since `theme.ts
   * #classTagCascadeGenerations` is itself only ever populated for a
   * source with MORE than one block, so this value is never consulted in
   * that case. See `preprocessor.ts#PreprocessorResult.stylePositions`'s
   * doc comment for the full jar derivation.
   */
  styleGeneration?: number;
  /**
   * G2 N19: for `kind: 'assoc-circle'`/`kind: 'lollipop'` only -- the jar
   * `Entity.getName()` value used for the `<path id="...">` edge-id
   * attribute (`Link#idCommentForSvg()`), DISTINCT from `Classifier.id`
   * (this port's own internal AST key, `__assocN`/`__lolN`) and
   * `Classifier.display` (the rendered label, e.g. a lollipop's own name).
   * `"apoint" + N` for assoc-circle (`AbstractClassOrObjectDiagram
   * .Association`'s ctor, `getUniqueSequence("apoint")`); `"<existingRaw
   * Name>lol" + N` for lollipop (`CommandLinkLollipop`'s `suffix`,
   * `getUniqueSequence("lol")`). `N` is the RAW shared jar creation-counter
   * value at the phantom slot immediately preceding this classifier's own
   * `creationIndex` (see {@link phantomSlot}) -- NOT a dense rank, since
   * this string is directly OBSERVABLE in rendered SVG output (unlike
   * `ent%04d`/`lnkN` uids, which `renderer-uid.ts` deliberately dense-
   * renumbers). Absent for every other classifier kind, and for the
   * `(A,B) arrow (C,D)` double-couple (`associationClass`'s 4-entity
   * overload, module-level `insertPointBetween`) sub-case -- it burns cpt1
   * in a DIFFERENT relative order than the single-coupling `Association`
   * class this field's derivation matches exactly; named remainder,
   * `plans/g2-class-svg/ledger.md` N19. G2 N20: repeat-coupling
   * (`Association#createSecondAssociation`/`createInSecond`) DOES use this
   * SAME ctor-burn shape for its own SECOND circle (`new Association(...)`
   * inside `createSecondAssociation` runs the identical constructor) --
   * landed, see {@link invertedClassEdgeOldCreationIndex}/
   * {@link repeatCoupleInvisLinkCreationIndex} for the two ADDITIONAL
   * repeat-coupling-only burns this field alone doesn't cover.
   * @see ~/git/plantuml/.../objectdiagram/AbstractClassOrObjectDiagram.java:120-121,226,237-248,303-341
   * @see ~/git/plantuml/.../classdiagram/command/CommandLinkLollipop.java:180
   * @see ~/git/plantuml/.../abel/Link.java:106-114 idCommentForSvg
   */
  syntheticIdName?: string;
  /**
   * G2 N19: true when this classifier's `creationIndex` was preceded by a
   * discarded phantom counter slot -- mirrors `ClassNote.phantomSlot`'s
   * doc comment (G2 N15) exactly: jar's shared `cpt1` counter burns TWO
   * consecutive slots per single-coupled assoc-circle/lollipop entity (one
   * for {@link syntheticIdName}'s embedded value, one for the entity's own
   * uid), with no other creation event in between. `renderer-uid.ts` folds
   * the discarded slot into the SAME dense-renumbering merge as a note's
   * `phantomSlot` (a `type: 'phantom'` `Ranked` entry at `creationIndex -
   * 1`, consuming a rank without writing any uid map).
   */
  phantomSlot?: true;
  /**
   * G2 N19: for `kind: 'assoc-circle'` only -- true when this classifier's
   * OWN `creationIndex` slot must ALSO consume a numbering rank without
   * ever writing a `classifierUid` map entry, because
   * `EntityImageAssociationPoint#drawU` never wraps its `<ellipse>` in a
   * `<g id="...">` at all (a bare shape, no group/comment/uid -- unlike
   * `EntityImageLollipopInterface#drawU`, which DOES emit `<g class=
   * "entity" id="ent%04d">` via `UGroupType.DATA_UID`). Distinct from
   * {@link phantomSlot} (the PRECEDING name-slot burn, which ALSO never
   * writes a uid): both consume a rank, this flag names which of the
   * classifier's own two burns is the invisible one. Absent (falsy) for
   * `kind: 'lollipop'`, which gets a normal, rendered `classifierUid`
   * entry at `creationIndex`.
   */
  noUidSlot?: true;
  /**
   * G2 N19: for `kind: 'assoc-circle'` only -- the `creationIndex` of an
   * explicit A-B association this circle SUBSUMED and removed
   * (`class-assoc-couple.ts#subsumeExplicitAssociation`). Jar's shared
   * counter already advanced past that relationship's OWN real `Link()`
   * construction when it was first parsed (e.g. an earlier `A -- B` line) --
   * `Association#createNew`'s `removeLink(existingLink)` branch (no NEW
   * `Link()` call) does not un-burn that slot. `renderer-uid.ts` injects a
   * phantom Ranked entry at this value so dense re-numbering doesn't
   * silently collapse the gap (see `SubsumedLink.creationIndex`'s doc
   * comment, class-assoc-couple.ts, for the jar-verified fixture). Absent
   * when the couple's A-B pair had no explicit association to subsume.
   */
  subsumedLinkCreationIndex?: number;
  /**
   * G2 N20: for `kind: 'assoc-circle'` only, on the OLDER (PRIOR) circle of
   * a repeat-coupled pair -- the class-edge's own creationIndex value
   * BEFORE `Association#createInSecond`'s conditional inversion
   * (`other.pointToAssocied = other.pointToAssocied.getInv()`,
   * `AbstractClassOrObjectDiagram.java:326-330`, fires only when the prior
   * circle's class edge currently points circle->C, i.e. a "leading"-form
   * first coupling). `getInv()` constructs a BRAND NEW `Link` object (a
   * fresh `getUniqueSequence("lnk")` burn) -- the edge's rendered `<g
   * class="link" id="lnkN">` uid must reflect that NEW, later burn (already
   * overwritten onto the SAME `Relationship.creationIndex` in place by
   * `class-assoc-couple.ts#invertPriorClassEdge`), while this field
   * preserves the ORPHANED old rank so `renderer-uid.ts` still consumes it
   * as a phantom (the gap it left in jar's real counter must not be
   * silently collapsed by dense re-numbering -- same principle as {@link
   * subsumedLinkCreationIndex}, just for an edge's own re-burn rather than
   * a removed link). Absent when the inversion never fires (a "trailing"-
   * form first coupling already points C->circle, matching createInSecond's
   * own always-circle-to-C target -- no swap needed, no extra burn).
   */
  invertedClassEdgeOldCreationIndex?: number;
  /**
   * G2 N20: for `kind: 'assoc-circle'` only, on the NEWER (SECOND) circle
   * of a repeat-coupled pair -- `Association#createInSecond`'s FINAL burn,
   * an invisible sibling link connecting the prior circle to this one
   * (`AbstractClassOrObjectDiagram.java:335-339`, `new Link(...,
   * NONE/NONE, ...); lnode.setInvis(true); addLink(lnode);`). The
   * corresponding `Relationship` (pushed with `invis: true`,
   * `class-assoc-couple.ts#makeCoupleCircle`) is filtered OUT of
   * `geo.edges` entirely at layout time (`buildEdgeGeos`'s `if (rel.invis)
   * continue` -- a load-bearing invariant `note-freestanding.ts` also
   * depends on, so it cannot carry its own `creationIndex` through the
   * normal edge-numbering path) -- this classifier-level field is the ONLY
   * way its real jar rank reaches `renderer-uid.ts`'s dense re-numbering,
   * the SAME "standalone phantom rank on a classifier" shape {@link
   * subsumedLinkCreationIndex} already established. Absent for a
   * single (non-repeat) coupling, which never emits this sibling link.
   */
  repeatCoupleInvisLinkCreationIndex?: number;
  /**
   * G2 N42: the classifier's raw, UNPARSED multi-line body source, one
   * entry per physical source line INSIDE the `{ ... }` body, in
   * declaration order -- populated alongside (not instead of) {@link
   * members} at the same 3 member-body call sites (`parser.ts
   * #handlePendingBodyLine`, `class-commands.ts`'s post-hoc `X : text`
   * rule, `class-declaration-parser.ts#applyClassifierDecl`'s inline-member
   * loop). Mirrors upstream `BodierAbstract#rawBody` (`List<CharSequence>`,
   * `BodierLikeClassOrObject#addFieldOrMethod`'s unconditional `rawBody.add
   * (s)`) -- upstream defers the fields/methods-vs-"enhanced body" decision
   * to RENDER time by re-scanning this raw list
   * (`BodierLikeClassOrObject#isBodyEnhanced`), rather than deciding it
   * eagerly at parse time, so this port keeps the SAME raw text available
   * alongside the eagerly-`parseMemberLine`'d {@link members} array instead
   * of replacing it -- a `--`/`==`/`..`/`__` block-separator or `|_`
   * tree-list line still gets pushed onto `members` via the existing
   * per-line parse (harmless, backward-compatible dead data): `class-body-
   * enhanced.ts#isEnhancedBody`'s detection over THIS field is what decides
   * whether `measureGenericClassifier`/`measureObjectClassifier` uses the
   * classic fields/methods (or field-only, for object) split ({@link
   * members}) or the new block-based layout (this field), never both.
   * G3/O4 (correction): ALSO captured for `kind: 'object'` -- upstream's
   * OBJECT body ALWAYS routes through the SAME `BodyEnhanced1` renderer
   * class does only when a separator is present (`BodierLikeClassOrObject
   * #getBody`'s own doc citation below), jar-verified `linazi-45-gevo553`.
   * Still absent for `kind: 'map'`/`'json'` (their own, separate body
   * grammars, zero corpus reach for a separator inside either) and for a
   * classifier built by hand (unit tests bypassing the parser).
   * @see ~/git/plantuml/.../cucadiagram/BodierAbstract.java#rawBody
   * @see ~/git/plantuml/.../cucadiagram/BodierLikeClassOrObject.java#isBodyEnhanced
   */
  rawBodyLines?: string[];
  /**
   * B2 (SI17): `Entity#portShortNames`'s own persistent registry
   * (`abel/Entity.java:112` `private final Collection<String> portShortNames
   * = new HashSet<>()`, `abel/Entity.java:538` `addPortShortName`) — outlives
   * the removal of the `Class::member` link that first named it
   * (`Link#setPortMembers`, `abel/Link.java:515-522`, invoked once at that
   * link's own creation, independent of the link's later lifecycle). An
   * association-class couple `(A,B) arrow C` that subsumes an explicit
   * `Foo::method --> Bar` association (`class-assoc-couple.ts
   * #makeCoupleCircle`) still shields `Foo` even though the couple's own
   * replacement edges (`entity1ToPoint`/`pointToEntity2`,
   * `AbstractClassOrObjectDiagram.java:264-273`) are built from a fresh
   * `LinkArg` that names no port of its own — this field is that surviving
   * record. Read by `class-port-rows.ts#classPortShortNamesById` ALONGSIDE
   * (not instead of) its live `ast.relationships` scan, so an ordinary
   * still-connected `Class::member` edge keeps registering the same way it
   * always did. Absent for every classifier with no subsumed-port history.
   */
  portShortNames?: Set<string>;
}
