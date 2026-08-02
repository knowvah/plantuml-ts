# T3 — Author the fixtures this path has never had, and measure the gap

## Context

See [ADR-4](../decisions.md#adr-4-authored-fixtures-measure-the-gap-they-do-not-claim-conformance).
**Read it before writing anything** — it governs what this task is allowed to
claim.

T1 and T2 changed how class-diagram `usecase`/`actor` leaves are sized. ZERO
of the 310 class goldens exercise that path. This task closes that hole.

## Task

1. **Author fixtures** under `oracle/goldens/svg-class/<slug>/in.puml`
   covering, at minimum:
   - `allowmixing` + a `usecase` alongside a real `class`
   - a bare `actor` in a class diagram (reachable WITHOUT `allowmixing`)
   - a usecase whose display carries a `<$sprite>` — the case scope item 3
     (sprite threading) newly affects, and the one nothing else covers
   Use descriptive slugs (this is authored work, not a hashed corpus import);
   say so in each fixture's own comment or the README note.
   **A `usecase` in a class diagram WITHOUT `allowmixing` does NOT reach the
   class engine** — it routes to the description engine. Verify each fixture
   actually reaches the class engine before pinning it; a fixture that
   silently tests the wrong engine is worse than none.
2. **Capture the jar oracle** for each with the pinned jar:
   `java -DPLANTUML_DETERMINISTIC_TEXT=true -jar oracle/dist/plantuml-oracle.jar -tsvg -o <dir> <puml>`
   Commit it as `golden.svg` beside `in.puml`, matching the layout in
   `oracle/goldens/svg-class/README.md`.
3. **MEASURE the delta** for each fixture via `compareSvg(ours, golden,
   'deterministic')`, rendering through `renderFixtureClass` with
   `DeterministicMeasurer` (NOT production `renderSync` — see that README's
   "Why a deterministic measurer"). Record every number in the decision
   journal.
4. **Write the guard** — `tests/oracle/svg-conformance/class-usecase-actor.test.ts`:
   - If a fixture measures **zero-diff**: assert exactly that, and note in the
     test's doc comment that it is ratchet-INELIGIBLE for the
     `parity-class.json` registration reason in ADR-4 — so a later reader does
     not think someone forgot to add it.
   - If a fixture does **NOT** measure zero-diff: assert the CURRENT diff
     characteristics so any change is caught, and label the test
     unambiguously as a characterisation guard against a KNOWN gap, with the
     measured delta in the comment. **Do not pin our SVG as `golden.svg`** —
     `golden.svg` is the jar's output and only ever the jar's output.
5. Do NOT add anything to `ratchet.json` — these fixtures cannot satisfy its
   eligibility rule (ADR-4). Adding them anyway is stop condition 12.

## Write-set — write NOTHING outside these

- `oracle/goldens/svg-class/<new-slugs>/in.puml` (create)
- `oracle/goldens/svg-class/<new-slugs>/golden.svg` (create — jar output, verbatim)
- `tests/oracle/svg-conformance/class-usecase-actor.test.ts` (create)

**Do not modify any EXISTING fixture directory**, `ratchet.json`,
`parity-class.json`, `size-backlog.json`, `diff-baseline.json`, or any `src/`
file. If T1's or T2's code looks wrong from what you measure, STOP and report
the mechanism — do not fix it here.

## Read-set

- `oracle/goldens/svg-class/README.md` — layout, the deterministic-measurer
  rationale, and the add rule (note its `npx tsx` reference is stale; use
  `jiti`)
- `tests/oracle/svg-conformance/class.golden.ratchet.test.ts` — how an
  existing class fixture is rendered and compared
- `tests/oracle/svg-conformance/render-fixture-class.ts` — `renderFixtureClass`
- `tests/oracle/svg-conformance/compare.ts` — `compareSvg`
- An existing fixture dir, e.g. `oracle/goldens/svg-class/bajula-59-puxi485/`
- [`../decisions.md`](../decisions.md) ADR-4

## Acceptance criteria

1. Given each authored fixture, when rendered through `renderFixtureClass`
   with `DeterministicMeasurer`, then its diff against the committed jar
   `golden.svg` is measured and the number recorded in the journal.
2. Given each fixture, then it demonstrably reaches the CLASS engine — state
   how you verified this per fixture.
3. Given the sprite-bearing fixture, then it exercises the `sprites`
   threading T2 added.
4. Given the guard test, then perturbing our renderer's output makes it FAIL.
   Verify this by temporarily perturbing something and watching it go red;
   report that you did.
5. Given `ratchet.json`, then it is UNCHANGED.
6. Given the 395 existing goldens, then they are byte-identical.

## Quality bar

`npm run typecheck`, `npm run lint`, `npm test` clean. Use `jiti`, never `npx
tsx`. Capture a failing command's stderr before theorising.

Offline: the jar runs locally; no test may require network egress.

## Observability

**This task IS the mission's regression signal.** A guard that cannot fail is
the failure mode it exists to prevent — hence acceptance criterion 4.

## Rollback

**Reversible** — revert the commit. Additive: new fixtures and one new test.

## Boundaries

**Always:** treat `golden.svg` as the jar's output and only the jar's.

**Ask first (STOP and report):** a fixture that will not reach the class
engine; a measurement that suggests T1/T2 are wrong; needing any file outside
the write-set.

**Never:** add to `ratchet.json`; edit an existing `golden.svg` or fixture;
re-pin `size-backlog.json`/`diff-baseline.json`; present our output as an
oracle; require network egress; run ANY git mutation — the orchestrator
commits.

## Method rules

1. **Verify the fixture reaches the intended engine** before pinning anything
   to it.
2. **Capture a failing command's stderr** before theorising.

## Commit

`test(T3): author class usecase/actor fixtures and measure the jar gap`
