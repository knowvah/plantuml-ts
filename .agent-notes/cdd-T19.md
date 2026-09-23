# cdd-T19 — rows, fonts and icon colours

## Observation: T18's landed extractor fields have no consumer for `line`/`lineStyle`, and only T19 wired `text`

- **Context**: the brief's "Interface in" section states `text?: string`
  reaches `renderer-classifier-rows.ts` from T18's extractor work; before
  editing, instrumented whether that was already true.
- **Finding**: `class-declaration-parser.ts#parseClassifierDecl` (NOT in
  T19's or T20's write-set) destructures only `{ rest, stereotype, color,
  tags, url }` from `extractDecorations` — `line`/`text`/`lineStyle` are
  computed by the extractor but discarded at the very next line. The
  ACTUAL plumbing that reaches the renderer is `ClassifierGeo.color` — a
  RAW, undecomposed `#part:color;...` string, already carried end-to-end
  since before T18. `renderer-classifier-colors.ts#classifierFill` already
  calls `resolveBareOrBackColor(geo.color)` for its own half; T19 imports
  the SAME already-exported `parseDeclarationColors` (T18's extractor
  export) and calls it directly on `geo.color` inside
  `renderer-classifier-rows.ts`, needing no new field and no edit to
  `class-declaration-parser.ts`/`class-classifier-ast.ts`/`layout.ts`.
- **Impact**: T20's M1 border/dash half can use the identical pattern
  (`parseDeclarationColors(geo.color).line`/`.lineStyle` inside
  `renderer-classifier-colors.ts`) — no shared-file edit needed between
  T19 and T20 despite both reading the same extractor output.
- **Confidence**: High (read the caller, not just the extractor's return
  type).

## Observation: A3 M2's `classFontColor`/`AttributeFontColor` precedence, jar-verified directly

- **Context**: the diagnosis's fix shape named which theme fields to
  write but not their exact header-vs-member precedence; instrumented
  against the pinned oracle jar (not just the corpus fixture, which
  bundles unrelated skinparams).
- **Finding**: `classFontColor` (bare OR `skinparam class{FontColor}`
  block form — both key as `classfontcolor` after
  `preprocessor.ts#cleanSkinKey`) tints the HEADER/name row ONLY.
  `classAttributeFontColor` (block-only; the bare form does not exist
  upstream) tints EVERY member row, AND ALSO the header when no
  `classFontColor`/`<style>`-cascade header override exists (jar-probed:
  `skinparam class{AttributeFontColor gold}` alone renders `Foo` AND
  `field1` both `#FFD700`). Matches `FromSkinparamToStyle.java:187,192`'s
  signatures (`{element,class_,header}` vs `{element,class_}`, subset-
  match against the header query includes both).
- **Impact**: implemented by feeding the accumulator into the EXISTING
  `classCascadeHeaderFontColor`/`classCascadeFontColor` theme fields
  (`skinparam-theme-builder.ts`, mirroring the pre-existing
  `classCascadeRoundCorner` bare-skinparam-reuses-a-cascade-field
  precedent) rather than inventing new dedicated fields — the header's
  existing `classCascadeHeaderFontColor ?? classCascadeFontColor`
  fallback chain reproduces the jar's "AttributeFontColor alone also
  tints the header" behavior for free, with zero extra branching.
- **Confidence**: High (4 jar-probed `.puml` sources, exact fills
  compared byte-for-byte against `-DPLANTUML_DETERMINISTIC_TEXT=true`
  output).

## Observation: A3 M5 (icon colours bypass hex) was already fully landed by T18

- **Context**: step 4 of the brief.
- **Finding**: `class-visibility-icon.ts#renderVisibilityIcon` already
  routes `colorsFor()`'s `line`/`background` through `resolvePaint`
  (T18's `.agent-notes/cdd-T18.md` names this explicitly: "tagofo-84-
  nuti362 36 -> 0 CONFORMANT"). `tagofo-84-nuti362` renders 0/0 on the
  unmodified T19 base — confirmed before touching anything.
- **Impact**: no code change for M5; AC "all 36 icon fill/stroke values
  are hex" already holds.
- **Confidence**: High (render-diff run before any T19 edit).

## Observation: M7's stated mechanism (`<w>` wave needs a filter) is wrong — the real gap is `<back:color>`

- **Context**: step 8 said to read `SvgGraphics.java`'s wave/filter
  emission before porting; did so, then rendered `beruje-75-jimu270`
  through both the port and the pinned oracle jar directly.
- **Finding**: `SvgGraphics.java` has NO wave-specific filter at all —
  `<w>`/wavy-underline is a plain `text-decoration="wavy underline"` SVG
  attribute, and this port's `memberAtomDecoration` (`renderer-
  classifier-rows.ts:209-215`) ALREADY emits it, byte-identical to the
  jar (confirmed both raw SVGs side by side). Beruje's actual 2
  structural diffs (`defs[childCount]`, `text[3]/@filter`) belong to
  `<back:#FFF000>string nouvelAttributi</back>` — a completely different
  creole command (extended-colour BACKCOLOR), whose filter-emission gap
  is pre-existing and ALREADY self-documented in `CommandCreoleStyle.ts`'s
  own doc comment ("captured color VALUE is consumed but not yet
  applied... deliberately deferred").
- **Impact**: filed as a NEW next-missions entry citing the correct
  mechanism (`FontConfiguration` needs an `extendedColor` field, core/
  creole-engine-wide, not class-specific) rather than silently
  re-filing the brief's wrong M7 framing.
- **Confidence**: High (both SVGs read directly, doc comment cited).

## Stop-1: icon-selector mechanism, two independent causes, both outside T19's write-set

1. **`class-body-enhanced-layout.ts:199`** computes `visibilityIsField:
   m.params === undefined` inline instead of calling the ALREADY-CORRECT
   `class-member-rows.ts#isMethodMember` (which additionally checks
   `forcedBucket`/`rawDisplay`, added later for `pasova-33-toze386`) —
   explains `fijali-69-pina030`'s full 11/11 (Java-style `+void
   destroy()` falls to `rawDisplayFallback`, `isMethodMember` would say
   "method", the duplicate says "field") and part of `tuguku-78-zega630`/
   `filoxo-23-fafi328` (`{method}`-tagged rows with no parens, same
   duplicate ignoring `forcedBucket` too). Not in T19's or T20's
   write-set (T20 owns `class-member-rows.ts`, not `class-body-enhanced-
   layout.ts`).
2. **No `<style> visibilityIcon { protected {...} } }` cascade exists** —
   `colorsFor()`'s own doc comment says so explicitly ("no `<style>`-
   cascade tier exists ... in the reachable corpus"), which tuguku/filoxo
   disprove. Needs a new StyleSignature (`style-cascade-class.ts`/
   `-snames.ts`) + new `ThemeGraphColors` fields
   (`theme-graph-colors-a/b.ts`) — none in T19's write-set.

Both filed to `planning/next-missions.md` §5 with full mechanisms.

## Stop-1: M8a/M8b — both require the shared creole engine, not a class-diagram file

- M8a (`defaultMonospacedFontName`): `CommandCreoleMonospaced.ts`'s own
  doc comment already says the port "has no skinparam thread into the
  creole engine" and cites `Command.ts`'s own anticipation of this
  ("a future L2 command that genuinely needs skin-param state... can add
  it back without touching this shape"). Threading a theme/skinparam
  value into `Command.executeAndAdvance` is an engine-wide interface
  change (`src/core/klimt/creole/command/Command.ts` + every diagram
  kind's `StripeBuilder` caller), not a `class-member-creole.ts`-local
  fix. Outside T19's write-set; not filed as a NEW entry (self-documented
  already at the two cited files — re-filing would duplicate an existing,
  accurate in-source note rather than surface new information).
- M8b (title/name creole monospace): instrumented per the brief's own
  instruction. NOT `class-declaration-extractors.ts` (the brief's guess)
  — the classifier NAME already routes through the SAME creole atom
  engine member rows use (`class-layout-header-creole.ts#buildHeaderLine`
  calls `resolveMemberAtoms`, identical to member rows). The atoms
  (including monospace font-family) ARE correctly built, but
  `buildHeaderLineMetrics` (same file, `:105-121`) DISCARDS them —
  returns only `width`/`displayText` (flattened plain text)/`height`,
  never `atoms`. `class-layout-header-geo.ts:119` consumes only that
  triple, so the header row's `ClassifierGeo['rows']` entry never gets a
  `row.atoms` field, and `renderRowText`'s plain-text path (one
  `fontFamily` for the whole row) draws it — losing monospace (and
  potentially bold/italic) creole formatting on any classifier NAME.
  Neither `class-layout-header-creole.ts` nor `class-layout-header-
  geo.ts` is in any batch-6 task's write-set. Filed as a NEW next-
  missions candidate is warranted but was time-boxed out of this task —
  left here for the next agent that opens `class-layout-header-creole.ts`.
