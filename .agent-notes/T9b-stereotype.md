# T9b — Stereotype + MessageNumber

## Observation: no pre-existing `Stereotype` value object anywhere in this
port — `class-stereotype.ts` is a differently-shaped, narrower thing

- **Context**: task brief required checking for an existing representation
  before creating `Stereotype.ts`.
- **Finding**: `src/diagrams/class/class-stereotype.ts` models a
  classifier's stereotype as a raw `string` field (`Classifier.stereotype`)
  plus free functions (`splitStereotypeLabels`, `parseCircledCharDecoration`,
  `stripCircledCharDecoration`, `resolveVisibleStereotypeLabels`, ...)
  scoped ONLY to class-diagram HEADER LAYOUT. It has no general value
  object any diagram type's `Display` element list could hold, no
  `CharSequence`-style discriminability, and no `getSprite`/`getRadius`/
  `getPackageStyle`/domain-tag predicates. Upstream's `Stereotype`
  (`stereo/Stereotype.java`) is a general `CharSequence`-typed element used
  across diagram types via `Display`'s element list — a different
  architectural role, not a duplicate of the class-diagram-only helpers.
  `class-stereotype.ts`'s own algorithms (`splitStereotypeTokens`'s
  circled-char/sprite parsing, `<<<...>>>`-invisible handling) are
  independently-derived reimplementations of the SAME upstream algorithm
  `StereotypeDecoration.java` encodes — confirmed while porting
  `StereotypeDecoration.ts`: its `<<(?, red)>>`/3-bracket-drop test cases
  reproduce exactly the same jar-verified behavior `class-stereotype.ts`'s
  doc comments already independently derived.
- **Decision**: ADDED `Stereotype.ts`/`StereotypeDecoration.ts` as new
  files — not a parallel representation of what already exists (different
  shape, different scope, different consumer). Did NOT touch
  `class-stereotype.ts` or rewire any of its callers (ADR-8 batch's "pure
  addition, nothing routes through your code" constraint forbids it, and
  the class/description ratchets + SVG goldens are the proof: all
  unmoved, see Gate results). A future task may want to consolidate the
  two once `Display`/T9c lands and a real caller exists on the class-diagram
  side — flagged, not attempted here.
- **Confidence**: High — read both files in full before deciding.

## `StereotypeDecoration.ts` — an extra sibling file, flagged (T8 precedent)

`Stereotype.java`'s private constructor takes a `StereotypeDecoration`, and
every public method on `Stereotype` reads through it. Ported it as
`src/core/stereo/StereotypeDecoration.ts` (198 Java lines), same directory,
single caller in the Java (grep-verified: only `stereo/Stereotype.java`
constructs one) — mirrors T8's own `Sea`/`Position` precedent for
`SheetBlock1`'s required siblings.

## Dependency adaptations (all forced by prior, already-established
architecture decisions in this codebase — none newly decided here)

1. **`HColor htmlColor` -> `ResolvedColor | undefined`**
   (`klimt/color/HColorSet.ts#ResolvedColor`). This port never built an
   `HColor` value type; every color-bearing port here resolves to
   `ResolvedColor`/a raw hex string instead (`HColorSet.ts`'s own "stored
   verbatim, interpreted late" doc). `StereotypeDecoration` resolves
   EAGERLY at construction in the Java itself, so eager `ResolvedColor`
   resolution is the faithful adaptation, not a new design choice.
2. **`HColorSet htmlColorSet` param -> a plain resolver function**
   `(name: string) => ResolvedColor | undefined`, matching
   `parseSimpleColor`'s own signature. Argument position preserved.
3. **`throws NoSuchColorException` not propagated.** This port's only
   color resolver never throws (returns `undefined` for an unresolvable
   name) — matches `HColorSet.ts`'s established never-throw convention.
   Verified: `HColors.BLACK`'s fallback in `buildComplex`'s
   circle-SPRITE branch applies EVEN WHEN no COLOR was specified at all
   (Java's own `col == null ? BLACK : col` runs unconditionally) — ported
   faithfully, test-covered
   (`StereotypeDecoration.test.ts` "circled sprite with NO color spec still
   falls back to black"). The circle-CHAR branch has NO such fallback in
   the Java (`htmlColor = colName == null ? null : ...`) — also ported
   faithfully, test-covered, and NOT the same as the sprite branch (easy
   to conflate; documented at the site).
4. **`net.sourceforge.plantuml.regex.*` DSL -> native JS `RegExp`**, one
   literal translation per upstream pattern (named capture groups replace
   `RegexResult.get(name, occurrence)`). This is this port's ESTABLISHED
   convention (`class-stereotype.ts`, `creole-atoms.ts`, `sprite-commands.ts`
   all do the same); porting `net.sourceforge.plantuml.regex` itself would
   be an unrelated, large, cross-cutting subsystem, out of scope.
5. **`klimt.creole.Parser#getScale`** (one 10-line static method on an
   otherwise unrelated ~90-line legacy-parser class) — ported as a local
   function cited to its own Java lines, not the whole `Parser` class.
6. **`SpriteUtils.SPRITE_NAME`** (one constant) — inlined into the sprite
   regex rather than porting `SpriteUtils` for it.
7. **`Guillemet#manageGuillemetStrict`** has no port anywhere in this
   codebase (`core/text/Guillemet.ts` only ports `manageGuillemet`).
   Ported as a local, self-contained function in `StereotypeDecoration.ts`
   (not added to `Guillemet.ts`, outside this task's write-set).
8. **`UFont circledFont` -> `{family, size}`** — the SAME scope reduction
   `klimt/font/StringBounder.ts` already established for this exact
   upstream class (that file's own doc comment). Nothing inside
   `Stereotype.java` reads `circledFont`'s own fields.

## `Stereotype#getSprite(SpriteContainer): TextBlock` — adapted to a
lookup-only result, not dropped

`klimt/sprite/Sprite.ts`'s own doc comment (a PRIOR, unrelated mission,
si5b-stdlib T4) already records that this port deliberately never ported
`Sprite#asTextBlock` — no AWT-style `UGraphic`-drawable abstraction exists
in this browser-safe, pure-SVG renderer; the port's actual equivalent
capability is `sprite-raster.ts#spriteToPngDataUri` (PNG/tint pipeline,
render-time only). Rather than invent a new `SpriteContainer` type, reused
this port's REAL per-diagram registry, `core/sprite-commands.ts`'s
`SpriteRegistry`/`getSprite` — it already fills upstream's identical
name-lookup role. `Stereotype#getSprite` therefore ports the LOOKUP half
faithfully (both `spriteName == null` and `container == null` early-return
guards, preserved exactly) and returns this port's own `Sprite` value
(`{width, height}`) rather than a `TextBlock`/PNG. Test-covered for all
four branches (resolved, no decoration, no registry, unregistered name).

## Nothing dropped

Every field/method on `Stereotype.java`/`StereotypeDecoration.java` has a
TS counterpart EXCEPT `Stereotype#getStyles(StyleBuilder): List<Style>`
(java:185-193), which is genuinely blocked on `Style`/`StyleBuilder`/
`PName`/`SName` — confirmed absent anywhere in `src/` (`grep -rn
"^export interface Style\b\|^export class Style\b"` — zero hits). This is
the SAME gap `SheetBlock1.ts` (T8, dropped-item #3) and
`ClockwiseTopRightBottomLeft.ts` (T7) already independently hit and
documented in this exact mission batch — echoed here as precedent, not
re-decided. Per the task's own instruction ("port them if small and
clearly in-scope, or STOP and report if they are large"): a full
style-resolution subsystem is not small. `getStyleNames()` — the
dependency-light half of the same upstream method pair, no `Style`/
`StyleBuilder` needed — IS fully ported.

`isMachineOrSpecification`'s bare (bracket-less) `"M"` comparison is
ported VERBATIM despite looking like an asymmetry against its sibling
predicates (all of which compare bracketed forms) — per this project's
"preserve behavior; diverge only deliberately," a bug worth fixing is a
named divergence for the maintainer, not a quiet inline correction. Note:
this branch is provably unreachable through `Stereotype.build`'s public
API (every label is `checkLabel`-validated to be `<<...>>`-wrapped before
`decoration.label` is ever set) — but that is equally true of the Java
itself (`checkLabel` is identical there), so it is upstream's own dead
branch, faithfully preserved, not a defect introduced here.

## Dispatch discriminability (for T9c)

Both `Stereotype` and `MessageNumber` are real TS classes, so
`instanceof Stereotype` / `instanceof MessageNumber` already work. Both
ALSO carry an explicit `readonly kind: 'Stereotype' | 'MessageNumber'`
discriminant field, plus exported `isStereotype`/`isMessageNumber` type
guards — needed because `Display`'s element list will also hold plain
`string` (which has no `instanceof`). Recommended shape for T9c:
`type DisplayElement = string | Stereotype | MessageNumber` (extend as
more `CharSequence` element kinds are ported), discriminate with the
guards or a `typeof x === 'string'` check first, then `x.kind`.

## Gate results (see full report for exact commands + numbers)

`npm test`: 424 files / 10727 tests, 0 failed (baseline 417/10621; T9a
added files concurrently — judged pass/fail only per the mission's
sibling-agent caveat). `npm run typecheck`, `npm run lint`, `npm run
build`: all clean. Ratchets: description-size 317/351 (0 widened),
dot-sync 262/90/708 EQUAL, class-size 219/708 (0 widened) — all EXACTLY
unmoved. SVG golden ratchets (class/object/description/skin/state +
description diff-baseline): 472/472 tests pass, unmoved. `git status`
confirms zero tracked files modified — pure addition, as required.
