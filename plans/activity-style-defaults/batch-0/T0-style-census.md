# T0 — Pin the pre-change activity style census

**Agent:** orchestrator (baseline JSON — see batch overview)
**Depends on:** —

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical spec. This mission wires the activity
engine to per-element style resolution. Read
[`../README.md`](../README.md) and [`../decisions.md`](../decisions.md)
first — every decision there is locked.

Before any source changes, pin what the activity engine emits today, at an
attribute granularity `diff-baseline.json` cannot express.

## Read-set

- `oracle/goldens/svg-activity/diff-baseline.json` — the existing pin shape
- `oracle/goldens/svg-activity/diff-census.json` — the path weights this
  mission targets
- `tests/oracle/svg-conformance/activity.diff-baseline.ratchet.test.ts` —
  the sibling gate; mirror its structure, its three-way
  `baseline`/`error`/`jar-error` status handling, and its
  no-`describe.skipIf` rule
- `tests/oracle/svg-conformance/render-fixture-activity.ts` — the render helper
- `plans/activity-element-granularity/batch-0/T0-element-census.md` — the
  direct precedent for this task

## Write-set

- `oracle/goldens/svg-activity/style-baseline.json` (create)
- `tests/oracle/svg-conformance/activity.style-baseline.test.ts` (create)
- `.agent-notes/asd-T0.md` (create)

## Task

For every fixture in `test-results/dot-cache/activity/`, render through
`renderFixtureActivity` with a `DeterministicMeasurer` and record, for OURS
and for the JAR golden:

1. histogram of `font-size` values on `<text>`
2. histogram of `stroke-width` values on `<line>`
3. histogram of `rx` values on `<rect>`
4. `<svg>` `@width` and `@height`
5. count of `<text>` elements (so a line-height change is separable from a
   font-size change)

Carry the same `status` discrimination the sibling gate uses: a fixture our
parser refuses is `error` with a reason and no numbers; a fixture whose
GOLDEN is the jar's own `PSystemError` page is `jar-error` with no numbers.
Detect `jar-error` from the golden's own content via the needle
`refusal-coverage.test.ts` already uses — never from a slug list.

## Acceptance criteria

- Given the committed corpus, when the census runs, then
  `style-baseline.json` records all 373 fixtures partitioned into
  `baseline` / `error` / `jar-error`, and the partition sizes are stated in
  `.agent-notes/asd-T0.md`
- Given the pinned file, when `activity.style-baseline.test.ts` runs on an
  unchanged tree, then it passes
- Given a fabricated histogram that differs from the pin, when the gate's
  comparison function is called directly, then it fails and names the
  fixture and the differing attribute
- Given the census output, when read, then the corpus-wide font-size
  histogram for OURS and for the JAR are both reported in
  `.agent-notes/asd-T0.md`

## Quality bar

All four gates green before the commit: `npm test`, `npm run typecheck`,
`npm run lint`, `npm run build`. Run the FULL suite — not `vitest run
tests/unit`, which is narrower and misses catalog drift. Check the vitest
`Test Files` count against the expected total: `coverage/.tmp` contention
can make the run skip files and still exit 0 with a clean summary.

## Commit

`test(asd-T0): pin the pre-change activity style census`
