/**
 * `RelationshipType`/`LinkDecor` — split out of class-relationship-ast.ts
 * (pure move, no behavior change) to keep that file under the repo's
 * 500-line-per-file cap; re-exported from there for existing import sites.
 */

export type RelationshipType =
  | 'extension' // <|--
  | 'implementation' // <|..
  | 'composition' // *--
  | 'aggregation' // o--
  | 'dependency' // ..>
  | 'association' // -->
  | 'usage'; // ..

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
 * `plans/g2-class-svg/ledger.md` N28. T5/M6 confirms the deferral still
 * holds as a HEAD decor (`class-arrow-decor-map.ts`'s own doc comment); the
 * mid-link form is now built as `Relationship.middleDecor`
 * (`class-arrow-middle-decor.ts#MiddleDecor`, a distinct type — the two are
 * separate Java enums, `LinkDecor` vs `LinkMiddleDecor`).
 *
 * G2 N47: `notNavigable` (`x`, `LinkDecor.NOT_NAVIGABLE`) ADDED — the
 * `core/svek/extremity/link-decor.ts` machinery (`ExtremityFactoryNotNavigable`,
 * the `not_navigable` `data-link-type` row) was already fully built for
 * description's edge renderer; only the class-side glyph→name wiring
 * (`class-arrow-grammar.ts#headToDecor`) was missing, previously left
 * `'none'` on an N28 "zero corpus reach" survey that a later fixture
 * (`rekazo-16-jola519`, `bob x--> alice`) disproved.
 *
 * T5/M6: `redefines`/`definedBy` ADDED (`LinkDecor.REDEFINES`/`.DEFINEDBY`,
 * glyphs `<||`/`||>` and `<|:`/`:|>` — both `isExtendsLike()` upstream like
 * plain EXTENDS, but each a DISTINCT enum member with its own extremity
 * shape, `core/svek/extremity/link-decor.ts`'s `ExtremityFactoryExtendsLike`
 * built for both already). `arrowTriangle`/`circleFill`/`circleConnect`/
 * `halfArrowUp`/`halfArrowDown` (`LinkDecor.ARROW_TRIANGLE`/`.CIRCLE_FILL`/
 * `.CIRCLE_CONNECT`/`.HALF_ARROW_UP`/`.HALF_ARROW_DOWN`) are NOT added: none
 * of their glyphs (`<<`/`>>`, `@`, head-position `0)`/`(0`, `\\`/`//`) is
 * reachable through this port's current `HEAD1_SAFE`/`HEAD2_CHARS` arrow
 * grammar (`class-relationship-parser.ts`) — see `class-arrow-decor-map.ts`'s
 * own doc comment for the full reasoning.
 * @see ~/git/plantuml/.../decoration/LinkDecor.java:70-104
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
  | 'redefines'
  | 'definedBy'
  | 'none';
