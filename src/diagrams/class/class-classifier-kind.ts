/**
 * `Classifier.kind`'s union, moved out of `class-classifier-ast.ts` (cdd7
 * T2b) when `Classifier.stereotypeSprite` pushed that file past the 500-line
 * hook cap -- a pure move, re-exported from there so no import path changed.
 */

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
   * `protocol Foo` — a native class-factory keyword (upstream
   * `CommandCreateClassMultilines` / `CommandCreateClass`'s TYPE
   * alternation, `LeafType.PROTOCOL`). T14 (dispatch-by-parse-attempt):
   * ported to close gutute-00-gaki684 (`protocol X as "INOUT" { ... }`,
   * newly refused once unrecognised lines stopped being silently dropped).
   * Renders as a plain rect, like `class`/`entity` -- `PROTOCOL` appears in
   * NO svek shape switch, only `EntityImageClassHeader`'s badge-letter/
   * spot-style-name switch (`getCircledChar`/`spotStyleSignature`), so the
   * only observable difference from a bare `class` is the badge glyph ('P',
   * `class-badge.ts#badgeLetter`). No `spotProtocol` default color exists in
   * upstream's own `rose.skin` (unlike `spotClass`/`spotInterface`/…), so
   * this port's badge fill falls to `badgeFill`'s existing "default/
   * unsurveyed kind" branch, matching every other un-surveyed kind already
   * on that path (`entity`, `circle`, `object`, …) -- not a new gap.
   * struct/exception/metaclass/stereotype/dataclass/record share the same
   * TYPE alternation upstream but are NOT ported here: none is exercised by
   * this engine's refusal-coverage bucket, and each needs its own captured
   * badge-glyph outline (`class-badge.ts#BADGE_GLYPH_D` has no S/X/D/R
   * entry) that no fixture in scope can verify.
   * @see ~/git/plantuml/.../classdiagram/command/CommandCreateClassMultilines.java:103
   * @see ~/git/plantuml/.../classdiagram/command/CommandCreateClass.java:87
   * @see ~/git/plantuml/.../abel/LeafType.java:48
   * @see ~/git/plantuml/.../svek/image/EntityImageClassHeader.java:211,243
   */
  | 'protocol'
  /**
   * T3 (unknown-bucket-routing-repair): six more native class-factory
   * keywords from the SAME upstream TYPE alternation `protocol` above cites
   * (`CommandCreateClassMultilines.java:103`), all `LeafType.isLikeClass()`
   * members (`abel/LeafType.java:88-91`) — same `EntityImageClass`
   * rendering as `class`/`entity`/`protocol`. T14 deliberately left these
   * unported ("needs its own captured badge-glyph outline"); reopened here
   * since `badgeFill`/`badgeLetter`'s existing default/unsurveyed-kind
   * fallback (`class-badge.ts`, same as `entity`/`circle`/`object`) already
   * renders them — not a new gap. D12 supersedes T14's size deferral.
   * @see ~/git/plantuml/.../abel/LeafType.java:48,88-91
   */
  | 'struct'
  | 'exception'
  | 'metaclass'
  | 'stereotype'
  | 'dataclass'
  | 'record'
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
