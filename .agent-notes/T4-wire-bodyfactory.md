# T4 — Wire `desc` through `BodyFactory.create3`

## Observation: `StripeAtom = CreoleAtom | Atom` is a live runtime mismatch,
  not just a documented risk
- **Context**: Building the first real, non-stub `AtomOps` bundle
  (`EntityImageDescriptionDelegates.ts#descAtomOps`) for `desc`'s new
  `BodyFactory.create3`/`Sea`/`SheetBlock1` pipeline.
- **Finding**: `DisplayCreole.ts#getCreole`'s `as unknown as Sheet<CreoleAtom>`
  cast is a real type-level lie: a `CreoleParser`-built `Sheet` genuinely
  mixes plain `CreoleAtom` data records with composite `Atom`-interface
  instances (`StripeCode`/`StripeTable`/`StripeTree`/`CreoleHorizontalLine`/
  `EmbeddedDiagram`) the moment a `desc` label contains a `<code>` block,
  table, tree, or embedded diagram. An `AtomOps` written to assume
  `CreoleAtom` only crashes (`Cannot read properties of undefined (reading
  'kind')`) the instant one of those composite atoms reaches it — reproduced
  via `oracle/goldens/description/gafico-37-cuma657` (a `<code>`-block
  fixture), which was silently rendering the ERROR FALLBACK SVG (not
  throwing all the way to the test) until diagnosed.
- **Fix**: `isCreoleAtomData(x): x is CreoleAtom` duck-types on `'kind' in x`
  (only `CreoleAtom` union members carry it); the `else` branch delegates to
  the composite `Atom`'s OWN `calculateDimension`/`getStartingAltitude`/
  `drawU` methods directly, rather than reimplementing them.
- **Impact**: any future `AtomOps` implementation (batch 5's widened
  routing, or a `create2`/`BodyEnhanced1` port in SI1) must do the same
  dispatch, not just handle `CreoleAtom`'s three kinds.
- **Confidence**: High — reproduced via a real corpus fixture, root-caused
  via stack trace, fixed, and re-verified (`measure-description-size-deltas`
  went from 3 `widened` to 0).

## Observation: `Display.getWithNewlines` is the WRONG constructor for an
  already-split-by-`\n` string
- **Context**: Building `desc`'s `rawBody: Display` from
  `EntityImageDescriptionLabels.displayText` (a plain string with real
  `\n` line breaks, this port's adaptation-seam convention for
  `entity.getDisplay()`).
- **Finding**: `Display.getWithNewlines`/`DisplayNewlines.ts#parseWithNewlines`
  scan for the LITERAL two-character `\n` escape sequence (as typed by a
  PlantUML author, e.g. `queue "a\nb" as x`), not a real embedded newline
  character. Feeding it an already-multi-line string glues everything back
  into ONE `Display` element (real newlines pass through untouched), which
  silently defeats `BodyEnhanced2#collectBlocks`'s separator-splitting
  entirely (a single mega-element never matches `isBlockSeparator`). The
  right constructor for an already-split array is `Display.create(...)`
  (a raw one-element-per-line pass-through, matching how upstream's REAL
  `entity.getDisplay()` is built during parsing).
- **Impact**: any future caller building a `Display` from this port's
  `\n`-joined string convention must use `Display.create(text.split('\n'))`,
  never `getWithNewlines`.
- **Confidence**: High — root-caused via a failing separator test showing
  literal embedded-newline text in one `<text>` element, fixed, re-verified.

## Observation: two `entity-image-description-separator.test.ts` pins had a
  MISMATCHED jar oracle (SEQUENCE diagram, not component/description)
- **Context**: Diagnosing why wiring `desc` through the real
  `BodyEnhancedAbstract.isBlockSeparator` (java:67-82) turned "--Header--"
  and "-----" into titled block separators, contradicting two pre-existing
  test pins.
- **Finding**: `isBlockSeparator` matches ANY line starting+ending with
  "--"/"=="/".."/"__' (2+ chars), REGARDLESS of captured content — verified
  directly against `~/git/plantuml/.../BodyEnhancedAbstract.java:67-82`.
  Both `"--Header--"` and `"-----"` (starts+ends with "--") match. The OLD
  "5 dashes" test's own "jar-verified 2026-07-15" comment recorded a
  DIFFERENT jar run: `queue "queue1\n-----\ntoto" as queue3` WITHOUT a
  `component`/`database` keyword resolves to a SEQUENCE diagram
  (`data-diagram-type="SEQUENCE"`, confirmed via a direct jar probe) — a
  DIFFERENT upstream drawing class than `svek/image/EntityImageDescription
  .java`, which this port's `EntityImageDescription.ts` actually models.
  Re-probing with `component component1` present (matching the corpus
  fixture's own shape, `component/butebe-90-dozo380`) produces a REAL
  component-diagram jar output that matches this port's NEW output
  byte-for-byte (two flanking `<line>`s + a title `<text>`, same x/y/
  textLength numbers once rebased to the entity's own box origin).
- **Impact**: any future jar probe for a `queue`/`participant`-keyword
  fixture must include a `component`/`database`/other description keyword
  to force component-diagram (not sequence-diagram) dispatch, or it will
  silently probe the wrong upstream drawing class.
- **Confidence**: High — direct jar runs, both the mismatched (sequence)
  and corrected (component) probes, diffed against this port's own output.

## Observation: `tests/unit/description/leaf-sizing-body.test.ts`'s
  "`____` sizes as normal text" pin is ALSO stale, jar-confirmed, left
  UNFIXED (file outside T4's write-set — see task report for batch 5)
- **Context**: `npm test` regression after wiring `desc` through
  `BodyFactory.create3` (ADR-1: sizer and renderer share
  `calculateDimensionSlow`, so this ripple is expected).
- **Finding**: `isBlockSeparator("____")` (starts+ends with "__") is ALSO
  `true` — a bare 4-underscore body is a title-less block separator, not
  normal text. Jar-confirmed directly: `queue "queue1\n____\ntoto"`'s box
  height (46) is SHORTER than `queue "queue1\nWXYZ\ntoto"`'s (52) in a
  real component-diagram jar run — the OLD pin's assumption (equal height)
  is provably wrong.
  This file is co-located with `src/diagrams/description/leaf-sizing.ts`,
  named in T4's OWN "deliberately NOT in scope (batch 5)" list — NOT
  edited here per the write-set boundary. Flagged for batch 5 (or whoever
  owns that file next) to update the assertion.
- **Confidence**: High — direct jar probe, same methodology as above.

## Prerequisites confirmed (T2b-1's plan)
- `BodyFactory.create3(rawBody, config, styleValues, atomOps)` — used as
  documented, no signature surprises.
- `ISkinSimple.sheet(...)`/`AtomOps` had ZERO production implementations
  anywhere before this task (grep-verified) — both built here, scoped to
  exactly what `desc`'s real call path reads (`guillemet()`/`getPragma()`/
  `getPadding()`), every other `ISkinSimple` member given upstream's own
  traced `SkinParam.java` default rather than a guess.
