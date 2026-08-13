# A4 Phase L — two-pass state parser + global name resolution (2026-07-11)

## Observation: StateDiagram requires a genuine 2-pass (upstream 3-pass) parse
- **Context**: Porting `CucaDiagram#quarkInContextSafe`'s global by-name
  reuse into `state-parse-state.ts`'s `declareState`/`ensureState`.
- **Finding**: A single-pass port (global registry consulted inline, same
  linear walk as before) regressed two already-EQUAL ratchet goldens
  (`bajelo-54-dixe684`, `tuvugi-94-gapi519`) when measured against the
  oracle. Root cause: upstream's `StateDiagram#getRequiredPass()` = `ONE,
  TWO, THREE`; `CommandCreateState`/`CommandCreatePackageState#isEligibleFor`
  accept ALL three passes (create every declaration, in its true nested
  scope, across the WHOLE document during pass ONE);
  `CommandLinkStateCommon#isEligibleFor` returns true ONLY for pass TWO.
  So a transition never resolves an endpoint before every declaration in
  the document already exists — "forward reference" is resolved relative
  to the SOURCE, not to a single top-to-bottom scan. Fixed by restructuring
  `parser.ts` into two literal passes (upstream's TWO+THREE merged into
  one — no fixture in the corpus needs the stronger THREE-strictly-after-
  ALL-of-TWO ordering).
- **Impact**: Any future upstream-`ParserPass`-gated mechanism (class/
  object/description engines likely have the same `getRequiredPass()`
  pattern) needs the SAME check before assuming a single-pass port is
  safe — verify `isEligibleFor` per command in the Java before porting.
- **Confidence**: High — verified via `-DPLANTUML_DUMP_DOT` against the
  real `plantuml.jar`, and by measuring the ratchet before/after.

## Observation: rebuilding a fresh scope tree per pass silently drops
  pass-ONE-only entities
- **Context**: First attempt at the two-pass restructure rebuilt a brand
  new `Scope` tree on each pass (`runPass` created a fresh `topScope`
  every call), discarding pass ONE's tree and keeping only pass TWO's.
- **Finding**: Any state created ONLY during pass ONE and never touched
  again on pass TWO (e.g. an implicit create from a standalone `CODE :
  text` line — `CommandAddField` is `ParserPass.ONE`-only upstream)
  silently disappeared from the final `ast.states`, since pass TWO's
  fresh tree never saw it. Fix: ONE persistent scope tree
  (`ParseState.scopeByOwner: Map<State, Scope>`), reopened (not rebuilt)
  on each pass — mirrors upstream's actual model (one entity/group tree,
  visited 3x, not rebuilt 3x). `declareState`'s "existing" branch must
  NOT re-register into the current scope under this model (would
  duplicate); only genuinely-new creations register.
- **Impact**: Concurrent regions need a `regionCursor` (not "always push a
  new region on `--`") for the same reason — replaying the SAME `--` line
  on pass TWO must ADVANCE to the region pass ONE already allocated, not
  push a duplicate empty one.
- **Confidence**: High — caught by `state-description-lines.test.ts`'s
  pre-existing "CODE : text auto-creates the state" test failing after
  the fresh-tree draft; fixed and re-verified.

## Observation: the self-loop short-circuit must exclude dotted ids
- **Context**: `CommandLinkStateCommon#getEntity`'s
  `getCurrentGroup().getName().equals(code)` self-check.
- **Finding**: Upstream compares against the quark's LOCAL (unqualified)
  segment name, not the full qualified code. For a dotted id (`state S.I
  { S.I --> S.I }`), upstream splits "S.I" hierarchically into a "S" quark
  containing an "I" quark — `getCurrentGroup().getName()` inside that
  scope is "I", never equal to the full code "S.I", so the self-loop never
  fires. This port keeps dotted ids as one flat, unsplit string (the
  hierarchical-split branch is out of scope), so `owner.id` IS the full
  dotted string and would wrongly self-match `id` — regressed
  `tuvugi-94-gapi519` until excluded via `!id.includes('.')`.
- **Impact**: Any future porting of upstream's `getName()`-based checks
  onto this flat id model needs the same "does the comparison assume
  local-vs-qualified granularity" scrutiny.
- **Confidence**: High — verified via the Java source and the ratchet.

## Observation: `set separator none` (bemena-23-zebu249) doesn't actually
  change global-reuse outcomes for undotted ids
- **Context**: Prior iteration's diagnosis assumed state diagrams default
  `namespaceSeparator` to `null`; this is WRONG —
  `StateDiagram.java:62` sets it to `"."`, same as class diagrams. Only
  `set separator none` (present on bemena's fixture) forces it to `null`.
- **Finding**: For state diagrams, `reuseExistingChild` is `true` at
  EVERY call site (verified via grep across `StateDiagram.java` and all
  `statediagram/command/*.java`). Under that constraint, `sep=="."`'s
  `countByName(id)==1` gate and `sep==null`'s "any match" gate are
  functionally IDENTICAL for undotted ids, because a name's count can
  never organically exceed 1 (every creation path immediately absorbs
  into the sole existing entity when one exists). The separator setting
  only matters for the DOTTED-id hierarchical-split branch (out of
  scope this iteration).
- **Impact**: Implementing `set separator none` parsing was deliberately
  SKIPPED this iteration — it has zero observable effect until the
  dotted-id branch lands, and adding unconsumed config surface would
  violate the no-speculative-fields rule. The two belong together in a
  future iteration.
- **Confidence**: High — derived from exhaustive grep of upstream call
  sites, not assumed.

## Observation: two composites declaring the SAME name merge into ONE
  entity — verified against the real jar, not guessed
- **Context**: `state A { state X } state B { state X }` — does the
  second declaration create its own local `X`, or reuse the first?
- **Finding**: Reuses. Verified via `-DPLANTUML_DUMP_DOT` +
  rendered SVG text content against `~/git/plantuml/build/libs/
  plantuml-1.2026.7beta3.jar`: only the labels 'A', 'X', 'B' appear — B
  renders as an EMPTY composite. `X`'s structural parent is fixed by
  whichever composite's declaration happened FIRST (source order,
  post-pass-ONE); the second declaration just reopens/updates the SAME
  entity, in its ORIGINAL location.
- **Impact**: Any test/fixture assuming "same-named children in sibling
  composites stay separate" is wrong for state diagrams — this is a real,
  surprising upstream behavior, not a bug to fix.
- **Confidence**: High — jar-verified, not inferred from the Java source
  alone.

## Next-mechanism candidates (from survivor drilldown, NOT attempted)
- **Cross-composite-boundary crossing-link rendering ("zaent" marker)**:
  `bemena-23-zebu249` and `darime-88-moda428` both now correctly detect
  the crossing link (pass count matches oracle, non-autonom composite
  correctly identified as a cluster) but are missing an oracle-emitted
  `zaent`-shaped placeholder node — a border/entry-point marker for a
  link whose target is a NESTED DESCENDANT of a sibling composite (not a
  direct child). This is a SVEK/DOT emission gap, not a parser gap —
  `bemena`'s graph #0 (Configuring's own pass) is already fully
  structurally EQUAL; only the outer pass differs.
- **`note on link` is emitted as an actual edge LABEL upstream, not a
  separate mechanism**: `fotigo-12-gufu949` — oracle's edges carry
  `label=<<TABLE...>` populated from the `note on link` text; our
  candidate emits no label at all (`labelOk` fails: oracle `[2,0,0,0]`
  vs candidate `[0,0,0,0]`). `applyNoteOnLink` currently sets
  `Transition.linkNote` but the DOT/layout emission stage
  (`state-dot-graph.ts` or similar) apparently never feeds it into the
  edge's `label`. Unrelated to name resolution — a rendering-pipeline gap.
